import { createPool } from '@vercel/postgres';
import { CAMEL_CASE_KEYS, NUMERIC_COLUMNS } from './schema.mjs';

// @vercel/postgres remains the default for Neon/Vercel Postgres. Set
// POSTGRES_DRIVER=pg and SUPABASE_DATABASE_URL to use node-postgres with
// Supabase (use its transaction pooler URL for serverless deployments).
// Pools are created lazily so API modules can be imported without credentials.
const sanitizeConnectionString = (raw) => {
    if (!raw) return raw;
    try {
        new URL(raw);
        return raw;
    } catch {
        const match = raw.match(/^(postgres(?:ql)?:\/\/)([^:]+):(.*)@([^@/:]+)(?::(\d+))?(\/.*)?$/);
        if (match) {
            const [_, proto, user, pass, host, port, rest] = match;
            return proto + user + ':' + encodeURIComponent(decodeURIComponent(pass)) + '@' + host + (port ? ':' + port : '') + (rest || '');
        }
        return raw;
    }
};

let _pool = null;
export const getPool = async () => {
    if (_pool) return _pool;
    if (process.env.POSTGRES_DRIVER === 'pg' || process.env.POSTGRES_DRIVER === 'local') {
        const { default: pg } = await import('pg');
        const rawConnectionString = process.env.SUPABASE_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.STORAGE_URL;
        if (!rawConnectionString) {
            throw new Error('Database connection failed: set SUPABASE_DATABASE_URL (or POSTGRES_URL / DATABASE_URL).');
        }
        const connectionString = sanitizeConnectionString(rawConnectionString);
        _pool = new pg.Pool({
            connectionString,
            // Keep the per-serverless-instance pool small; Supabase's pooler
            // handles the aggregate connection count across function instances.
            max: 1,
            ssl: process.env.POSTGRES_SSL === '0' ? undefined : { rejectUnauthorized: false }
        });
    } else {
        const connStr = process.env.POSTGRES_URL || process.env.STORAGE_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING;
        if (!connStr) {
            throw new Error('Database connection failed: POSTGRES_URL is missing. Please attach a Vercel Postgres database to your project in Vercel Storage.');
        }
        _pool = createPool({ connectionString: connStr });
    }
    return _pool;
};

// Map of lowercase -> camelCase for every mixed-case column, derived from the
// schema. Postgres folds unquoted identifiers to lowercase, so a SELECT
// referencing `spiritualName` yields the key `spiritualname`; we restore the
// casing the frontend expects.
const CASING = {};
CAMEL_CASE_KEYS.forEach(k => { CASING[k.toLowerCase()] = k; });

// Aggregate aliases (COUNT/SUM) that are not columns in the schema but must
// still reach the frontend as numbers (SQLite returned numbers; the pg
// drivers return these as strings). Lowercased keys.
const AGGREGATE_KEYS = new Set([
    'count', 'total', 'initiated', 'sheltered', 'aspiring',
    'birthdaystoday', 'anniversariestoday',
    'currentmonthregistrations', 'lastmonthregistrations',
    'totalattendance', 'attendeeCount', 'volunteercount',
    'totalall', 'totalthismonth', 'totalcount', 'attendedsessions',
    'totalrefunded', 'totalreceived',
    'income', 'expense', 'budgetamount', 'actualamount', 'utilization'
].map(k => k.toLowerCase()));

const toNumber = (value) => {
    if (typeof value !== 'string' || value === '') return value;
    const n = Number(value);
    return Number.isNaN(n) ? value : n;
};

const camelizeRow = (row) => {
    if (!row) return row;
    const out = {};
    for (const [key, value] of Object.entries(row)) {
        const v = (NUMERIC_COLUMNS.has(key) || AGGREGATE_KEYS.has(key)) ? toNumber(value) : value;
        out[CASING[key] || key] = v;
    }
    return out;
};

const camelizeRows = (rows) => (rows || []).map(camelizeRow);

// Convert SQLite-style `?` placeholders to pg `$1, $2, ...` numerically.
// The source queries never embed a literal `?` inside string literals, so a
// positional scan is safe here.
const toPg = (qs) => {
    let i = 0;
    return qs.replace(/\?/g, () => `$${++i}`);
};

// Mirrors the old sqlite `db.run()` result shape: { lastID, changes }
export const runAsync = async (sqlText, params = []) => {
    const result = await (await getPool()).query(toPg(sqlText), params);
    const maybeId = result.rows && result.rows[0] && result.rows[0].id;
    return {
        lastID: maybeId !== undefined ? toNumber(maybeId) : null,
        changes: result.rowCount
    };
};

// Mirrors `db.all()`: array of rows (camelCase keys restored)
export const allAsync = async (sqlText, params = []) => {
    const result = await (await getPool()).query(toPg(sqlText), params);
    return camelizeRows(result.rows);
};

// Mirrors `db.get()`: first row or null (camelCase keys restored)
export const getAsync = async (sqlText, params = []) => {
    const result = await (await getPool()).query(toPg(sqlText), params);
    return camelizeRow(result.rows && result.rows[0] ? result.rows[0] : null);
};

// Serializable-style transaction helper. `fn` receives a scoped client with
// `query(text, params)`, `run(text, params)` and `get(text, params)` bound to
// the transaction. Replaces sqlite `db.serialize()` + BEGIN/COMMIT/ROLLBACK.
export const withTransaction = async (fn) => {
    const client = await (await getPool()).connect();
    try {
        await client.query('BEGIN');
        const scoped = {
            query: (t, p = []) => client.query(toPg(t), p),
            run: async (t, p = []) => {
                const r = await client.query(toPg(t), p);
                const maybeId = r.rows && r.rows[0] && r.rows[0].id;
                return {
                    lastID: maybeId !== undefined ? toNumber(maybeId) : null,
                    changes: r.rowCount
                };
            },
            get: async (t, p = []) => {
                const r = await client.query(toPg(t), p);
                return camelizeRow(r.rows && r.rows[0] ? r.rows[0] : null);
            }
        };
        const result = await fn(scoped);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        try { await client.query('ROLLBACK'); } catch { /* ignore */ }
        throw error;
    } finally {
        client.release();
    }
};
