// One-off data migration: whatsapp-bot/devotee_mgmt.db (SQLite) -> Vercel Postgres.
//
// Usage:
//   SET DATABASE_URL / POSTGRES_URL
//   node api/scripts/migrate.mjs  [path-to-sqlite-db]
//
// Defaults: source DB is whatsapp-bot/devotee_mgmt.db. The target Postgres is
// the same one used by the serverless backend (reads POSTGRES_URL).
//
// Behaviour:
//   - Runs initDb() first (creates all tables + indexes + default settings).
//   - Wipes each target table, then copies every source table row-for-row.
//   - Preserves original integer ids by inserting with OVERRIDING SYSTEM VALUE
//     for identity columns, then resets each identity sequence.
//   - All writes happen inside a single transaction.
//
// The sqlite3 package lives inside whatsapp-bot/; we locate it via require
// resolution paths so this script also works without a root-level install.

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..', '..', '..');

import { INIT_DDL, SETTINGS_SEEDS } from '../schema.mjs';
import pg from 'pg';
const { Pool } = pg;

// ─── Locate the sqlite3 driver ───────────────────────────────────────────────
const require = createRequire(import.meta.url);
let sqlite3 = null;
const candidatePaths = [join(rootDir, 'whatsapp-bot'), __dirname, rootDir];
for (const base of candidatePaths) {
    try {
        sqlite3 = require(require.resolve('sqlite3', { paths: [base] }));
        break;
    } catch { /* try next */ }
}
if (!sqlite3 || !sqlite3.Database) {
    console.error('sqlite3 package not found. Install it (npm i sqlite3) or run from the repo root.');
    process.exit(1);
}
const Database = sqlite3.Database;

const sourceDb = process.argv[2] || join(rootDir, 'whatsapp-bot', 'devotee_mgmt.db');

// ─── Helpers ─────────────────────────────────────────────────────────────────
const sqliteAll = (db, sql, params = []) => new Promise((res, rej) =>
    db.all(sql, params, (err, rows) => err ? rej(err) : res(rows)));
const sqliteGet = (db, sql, params = []) => new Promise((res, rej) =>
    db.get(sql, params, (err, row) => err ? rej(err) : res(row)));

// All PG tables that use SERIAL (GENERATED ALWAYS AS IDENTITY) `id`.
const IDENTITY_TABLES = new Set([
    'system_logs', 'attendance', 'events', 'counseling_sessions',
    'seva_assignments', 'seva_shifts', 'seva_shift_assignments',
    'donations', 'expenses', 'budgets', 'courses', 'course_enrollments',
    'course_attendance', 'course_payments', 'tours', 'tour_enrollments',
    'tour_payments', 'inventory_categories', 'inventory_items',
    'inventory_transactions', 'users', 'audit_logs'
]);

const quote = (name) => `"${name.replace(/"/g, '""')}"`;
const quoteList = (cols) => cols.map(quote).join(', ');

const NON_TEXT_TYPES = new Set([
    'integer', 'bigint', 'smallint', 'numeric', 'decimal', 'real',
    'double precision', 'boolean'
]);

const bindings = (row, cols, nonTextCols) => cols.map(c => {
    let v = row[c];
    if (typeof v === 'bigint') v = Number(v);
    if (v === '' && nonTextCols.has(c)) v = null;
    return v;
});

const resetSequence = async (client, table) => {
    if (!IDENTITY_TABLES.has(table)) return;
    await client.query(
        `SELECT setval(pg_get_serial_sequence('${table}', 'id'), GREATEST((SELECT COALESCE(MAX(id), 0) FROM ${quote(table)}), 1))`
    );
};

const escapeIdent = (s) => s.replace(/[^a-zA-Z0-9_]/g, '');

async function copyTable(client, table, rows, pgRowCount) {
    if (pgRowCount > 0) {
        await client.query(`DELETE FROM ${quote(table)}`);
    }
    if (rows.length === 0) {
        console.log(`  ${table}: (empty)`);
        return;
    }

    const cols = Object.keys(rows[0]);
    // The target schema stores identifiers lowercase; match the sqlite source
    // columns onto them.
    const pgCols = cols.map(c => c.toLowerCase());
    const typeRes = await client.query(
        `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1`,
        [table.toLowerCase()]
    );
    const nonTextCols = new Set(
        typeRes.rows
            .filter(r => NON_TEXT_TYPES.has(r.data_type))
            .map(r => r.column_name)
    );
    const override = IDENTITY_TABLES.has(table) ? ' OVERRIDING SYSTEM VALUE' : '';

    const CHUNK = 100;
    for (let i = 0; i < rows.length; i += CHUNK) {
        const chunk = rows.slice(i, i + CHUNK);
        const valueRows = chunk.map((_, r) => {
            const base = r * cols.length;
            const ph = pgCols.map((_, c) => `$${base + c + 1}`).join(', ');
            return `(${ph})`;
        });
        const flatParams = chunk.flatMap(row => bindings(row, cols, nonTextCols));
        await client.query(
            `INSERT INTO ${quote(table)} (${quoteList(pgCols)}) ${override} VALUES ${valueRows.join(', ')}`,
            flatParams
        );
    }

    await resetSequence(client, table);
    console.log(`  ${table}: ${rows.length} rows`);
}

async function createSchema(pool) {
    for (const ddl of INIT_DDL) {
        await pool.query(ddl);
    }
    for (const [key, value] of SETTINGS_SEEDS) {
        await pool.query(
            'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING',
            [key, value]
        );
    }
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('POSTGRES_URL (or DATABASE_URL) is required for the target database.');
        process.exit(1);
    }

    const ssl = process.env.POSTGRES_SSL === '1'
        ? { rejectUnauthorized: false }
        : undefined;
    const pool = new Pool({ connectionString, ssl, max: 5 });

    console.log(`[1/3] Creating schema on target database...`);
    await createSchema(pool);
    console.log(`[2/3] Reading source: ${sourceDb}`);

    const db = new Database(sourceDb, (err) => {
        if (err) { console.error('Failed to open source DB:', err.message); process.exit(1); }
    });

    const tables = await sqliteAll(db, `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`);

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const { name: table } of tables) {
            const safeName = escapeIdent(table);
            const rows = await sqliteAll(db, `SELECT * FROM ${quote(table)}`);
            const target = await pool.query(
                `SELECT COUNT(*)::int AS c FROM information_schema.tables WHERE table_name = $1`,
                [safeName.toLowerCase()]
            );
            const pgRowCount = target.rows[0].c;
            if (!pgRowCount) {
                console.log(`  ${safeName}: TABLE NOT PRESENT IN TARGET — skipping`);
                continue;
            }
            await copyTable(client, safeName, rows, pgRowCount);
        }
        await client.query('COMMIT');
        console.log(`[3/3] Migration complete.`);
    } catch (err) {
        try { await client.query('ROLLBACK'); } catch { /* ignore */ }
        console.error('Migration failed, transaction rolled back:', err.message);
        process.exitCode = 1;
    } finally {
        client.release();
        db.close();
    }
}

main();