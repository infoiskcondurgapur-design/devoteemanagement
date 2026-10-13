// One-off repair/sync: Neon (Postgres, web deployment) -> whatsapp-bot/devotee_mgmt.db (SQLite).
//
// Why this exists: the local SQLite DB can fall behind the web DB (e.g. local file
// restored/older copy). This pulls missing devotee rows down WITHOUT touching rows
// that already exist locally (never overwrites, never wipes).
//
// Usage:
//   node scripts/import-from-neon.mjs           # dry run (prints plan, changes nothing)
//   node scripts/import-from-neon.mjs --apply   # performs the import
//
// DATABASE_URL is read from the environment or from ./.env.local.
// A backup of the local DB is always written to whatsapp-bot/backups/ before --apply.

import { readFileSync, copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const APPLY = process.argv.includes('--apply');

const require = createRequire(import.meta.url);
const sqlite3 = require(require.resolve('sqlite3', { paths: [join(rootDir, 'whatsapp-bot'), rootDir] }));
const pg = (await import('pg')).default;

// ─── Connection strings ───────────────────────────────────────────────────────
const quote = String.fromCharCode(34);
let pgUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!pgUrl && existsSync(join(rootDir, '.env.local'))) {
    const line = readFileSync(join(rootDir, '.env.local'), 'utf8')
        .split(/\r?\n/)
        .find(l => l.indexOf('DATABASE_URL=' + quote) === 0 || l.indexOf('POSTGRES_URL=' + quote) === 0);
    if (line) pgUrl = line.slice(line.indexOf('=') + 1).split(quote)[1];
}
if (!pgUrl) {
    console.error('DATABASE_URL / POSTGRES_URL not found (env or .env.local).');
    process.exit(1);
}

const sqlitePath = join(rootDir, 'whatsapp-bot', 'devotee_mgmt.db');
if (!existsSync(sqlitePath)) { console.error('Local DB not found:', sqlitePath); process.exit(1); }

const dbAll = (sql, params = []) => new Promise((res, rej) => db.all(sql, params, (e, r) => e ? rej(e) : res(r)));
const dbRun = (sql, params = []) => new Promise((res, rej) => db.run(sql, params, function (e) { e ? rej(e) : res(this); }));

const db = new sqlite3.Database(sqlitePath);
const client = new pg.Client({ connectionString: pgUrl });
await client.connect();

try {
    // ─── Schema mapping: neon columns are the sqlite column names lowercased ────
    const pragma = await dbAll('PRAGMA table_info(devotees)');
    const sqliteCols = pragma.map(c => c.name);
    const neonColsRes = await client.query(
        'SELECT column_name FROM information_schema.columns WHERE table_name = $1', ['devotees']);
    const neonCols = neonColsRes.rows.map(r => r.column_name);

    const selectNeonCols = [];
    const mapping = []; // [{ sqliteCol, neonCol }]
    for (const col of sqliteCols) {
        const lower = col.toLowerCase();
        if (neonCols.includes(lower)) { selectNeonCols.push('"' + lower + '"'); mapping.push({ sqliteCol: col, neonCol: lower }); }
    }
    const skipped = sqliteCols.filter(c => !mapping.some(m => m.sqliteCol === c));
    console.log('[1/4] Column mapping ready (' + mapping.length + ' columns; no Neon counterpart: ' + (skipped.join(', ') || 'none') + ')');

    // ─── Existing local ids ────────────────────────────────────────────────────
    const existing = new Set((await dbAll('SELECT id FROM devotees')).map(r => r.id));
    console.log('[2/4] Local rows: ' + existing.size);

    // ─── Pull all Neon rows, insert only the missing ids ───────────────────────
    const neonRes = await client.query('SELECT ' + selectNeonCols.join(', ') + ' FROM devotees ORDER BY createdat');
    const missing = neonRes.rows.filter(r => !existing.has(r.id));
    console.log('[3/4] Neon rows: ' + neonRes.rows.length + ' -> to insert: ' + missing.length);

    if (missing.length === 0) {
        console.log('Nothing to do — local is already in sync.');
    } else if (!APPLY) {
        console.log('DRY RUN — re-run with --apply to insert these ' + missing.length + ' rows.');
    } else {
        const backupDir = join(rootDir, 'whatsapp-bot', 'backups');
        mkdirSync(backupDir, { recursive: true });
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backup = join(backupDir, 'devotee_mgmt_' + stamp + '.db');
        copyFileSync(sqlitePath, backup);
        console.log('      backup -> ' + backup);

        await dbRun('BEGIN');
        const placeholders = sqliteCols.map(() => '?').join(', ');
        const stmt = 'INSERT OR IGNORE INTO devotees (' + sqliteCols.map(c => '"' + c + '"').join(', ') + ') VALUES (' + placeholders + ')';
        let inserted = 0;
        for (const row of missing) {
            const values = mapping.map(({ sqliteCol, neonCol }) => {
                let v = row[neonCol];
                if (v instanceof Date) v = v.toISOString();
                return v === undefined ? null : v;
            });
            const r = await dbRun(stmt, values);
            inserted += r.changes;
        }
        await dbRun('COMMIT');
        console.log('[4/4] Inserted ' + inserted + ' rows.');
    }

    const total = (await dbAll('SELECT COUNT(*) AS c FROM devotees'))[0].c;
    const status = await dbAll("SELECT COALESCE(status, 'NULL') AS s, COUNT(*) AS c FROM devotees GROUP BY status");
    console.log('Local total now: ' + total + ' | by status: ' + JSON.stringify(status));
} catch (e) {
    try { await dbRun('ROLLBACK'); } catch { /* no transaction open */ }
    console.error('FAILED:', e.message);
    process.exitCode = 1;
} finally {
    await client.end().catch(() => {});
    db.close();
}
