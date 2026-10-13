// Safe one-time copy of the current hosted Postgres (Neon) data to Supabase.
// Dry run by default. Target tables must be empty; existing Supabase rows are
// never deleted or overwritten.
//
// Required environment:
//   SOURCE_DATABASE_URL   Current Neon connection string (or use POSTGRES_URL / DATABASE_URL)
//   SUPABASE_DATABASE_URL Supabase Postgres connection string
// Run: node api/_src/scripts/migrate-neon-to-supabase.mjs [--apply]

import pg from 'pg';
import { TABLES, INIT_DDL, SETTINGS_SEEDS } from '../schema.mjs';

const { Pool } = pg;
const apply = process.argv.includes('--apply');
const tableNames = Object.keys(TABLES);
const quote = (name) => `"${name.replace(/"/g, '""')}"`;

const sourceUrl = process.env.SOURCE_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL;
const targetUrl = process.env.SUPABASE_DATABASE_URL;
if (!sourceUrl || !targetUrl) {
    console.error('Set SUPABASE_DATABASE_URL and a Neon source URL (SOURCE_DATABASE_URL, POSTGRES_URL, or DATABASE_URL).');
    process.exit(1);
}
let sourceHost;
let targetHost;
try {
    sourceHost = new URL(sourceUrl).host;
    targetHost = new URL(targetUrl).host;
} catch {
    console.error('A database URL is invalid. URL-encode reserved characters in passwords (for example, # as %23); credentials are omitted.');
    process.exit(1);
}
if (sourceHost === targetHost) {
    console.error('Source and Supabase target appear to use the same host; refusing to continue.');
    process.exit(1);
}

const poolOptions = (connectionString, max) => ({
    connectionString,
    max,
    ssl: { rejectUnauthorized: false }
});
const source = new Pool(poolOptions(sourceUrl, 1));
const target = new Pool(poolOptions(targetUrl, 1));
const sourceClient = await source.connect();
const identityTables = new Set([
    'system_logs', 'attendance', 'events', 'counseling_sessions',
    'seva_assignments', 'seva_shifts', 'seva_shift_assignments',
    'donations', 'expenses', 'budgets', 'courses', 'course_enrollments',
    'course_attendance', 'course_payments', 'tours', 'tour_enrollments',
    'tour_payments', 'inventory_categories', 'inventory_items',
    'inventory_transactions', 'users', 'audit_logs'
]);

try {
    // Use a stable read-only source snapshot for both the count report and copy.
    await sourceClient.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');

    // Create missing target tables without seeding settings yet, then refuse
    // a non-empty target before any data is written.
    for (const ddl of INIT_DDL) await target.query(ddl);

    const counts = [];
    for (const table of tableNames) {
        const src = await sourceClient.query(`SELECT COUNT(*)::bigint AS count FROM ${quote(table)}`);
        const dst = await target.query(`SELECT COUNT(*)::bigint AS count FROM ${quote(table)}`);
        counts.push({ table, sourceCount: Number(src.rows[0].count), targetCount: Number(dst.rows[0].count) });
    }
    console.log(`Mode: ${apply ? 'APPLY' : 'DRY RUN'}; source tables: ${counts.length}`);
    for (const item of counts) {
        console.log(`${item.table}: source=${item.sourceCount}, target=${item.targetCount}`);
    }

    const occupied = counts.filter(item => item.targetCount > 0);
    if (occupied.length) {
        throw new Error(`Supabase target is not empty (${occupied.map(x => x.table).join(', ')}). No rows copied.`);
    }
    if (!apply) {
        console.log('Dry run only. Review counts, then rerun with --apply to copy data.');
    } else {
        const client = await target.connect();
        try {
            await client.query('BEGIN');
            for (const table of tableNames) {
                const result = await sourceClient.query(`SELECT * FROM ${quote(table)}`);
                const rows = result.rows;
                if (!rows.length) continue;
                const columns = Object.keys(rows[0]);
                const overriding = identityTables.has(table) ? ' OVERRIDING SYSTEM VALUE' : '';
                const chunkSize = Math.max(1, Math.floor(60000 / columns.length));
                for (let offset = 0; offset < rows.length; offset += chunkSize) {
                    const chunk = rows.slice(offset, offset + chunkSize);
                    const values = [];
                    const tuples = chunk.map((row) => {
                        const start = values.length;
                        values.push(...columns.map(column => row[column] ?? null));
                        return `(${columns.map((_, colIndex) => `$${start + colIndex + 1}`).join(', ')})`;
                    });
                    await client.query(
                        `INSERT INTO ${quote(table)} (${columns.map(quote).join(', ')})${overriding} VALUES ${tuples.join(', ')}`,
                        values
                    );
                }
                console.log(`Copied ${table}: ${rows.length} rows`);
            }

            for (const table of identityTables) {
                if (!tableNames.includes(table)) continue;
                await client.query(
                    `SELECT setval(pg_get_serial_sequence($1, 'id'), GREATEST((SELECT COALESCE(MAX(id), 0) FROM ${quote(table)}), 1))`,
                    [table]
                );
            }
            for (const [key, value] of SETTINGS_SEEDS) {
                await client.query(
                    'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING',
                    [key, value]
                );
            }
            await client.query('COMMIT');
            console.log('Migration committed successfully.');
        } catch (error) {
            await client.query('ROLLBACK').catch(() => {});
            throw error;
        } finally {
            client.release();
        }
    }
    await sourceClient.query('COMMIT');
} catch (error) {
    await sourceClient.query('ROLLBACK').catch(() => {});
    const safeMessage = String(error.message || 'Unknown error')
        .replaceAll(sourceUrl, '[source database URL]')
        .replaceAll(targetUrl, '[Supabase database URL]');
    console.error('Migration stopped:', safeMessage);
    process.exitCode = 1;
} finally {
    sourceClient.release();
    await Promise.all([source.end(), target.end()]);
}
