// Backend regression suite for the Devotee Management API.
//
// The real server (whatsapp-bot/server.mjs) is spawned as an isolated child
// process for each server instance under test:
//   - an ephemeral TCP port (never 3001, so it won't clash with a running app)
//   - a throwaway SQLite database via DB_PATH (production data is never touched)
//   - DMS_DISABLE_WHATSAPP=1 (no headless-browser/QR session needed)
//
// Run from the project root:
//   npm run test:regression
//
// Coverage: boot/health, public API access, devotee CRUD, duplicate guard,
// and WebSocket origin enforcement + rate limits.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import WebSocket from 'ws';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_DIR = path.resolve(__dirname, '..');

// ─── Helpers ──────────────────────────────────────────────────────────────

const getFreePort = () => new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
        const port = srv.address().port;
        srv.close(() => resolve(port));
    });
    srv.on('error', reject);
});

const waitForHealth = async (baseUrl) => {
    // Boot can take 15-45s: schema heal + prod-DB merge + credential linking.
    for (let i = 0; i < 180; i++) {
        try {
            const res = await fetch(`${baseUrl}/api/system/health`);
            if (res.ok) return;
        } catch { /* server not up yet */ }
        await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error(`Server did not become healthy at ${baseUrl}`);
};

const spawnServer = (env) => {
    const child = spawn(process.execPath, ['server.mjs'], {
        cwd: SERVER_DIR,
        env: { ...process.env, ...env },
        stdio: ['ignore', 'pipe', 'pipe']
    });
    const chunks = [];
    const sink = (buf) => {
        chunks.push(buf.toString());
        if (chunks.join('').length > 100000) chunks.shift();
    };
    child.stdout.on('data', sink);
    child.stderr.on('data', sink);
    child.getLogs = () => chunks.join('').slice(-20000);
    return child;
};

const stopServer = async (child) => {
    if (!child || child.killed) return;
    child.kill('SIGTERM');
    await new Promise((r) => setTimeout(r, 300));
    if (!child.killed) child.kill('SIGKILL');
};

const api = async (baseUrl, pathname, { method = 'GET', token, body } = {}) => {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const res = await fetch(baseUrl + pathname, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined
    });
    let data = null;
    try { data = await res.json(); } catch { /* non-JSON body */ }
    return { status: res.status, data };
};

// Opens a WebSocket against the origin policies; resolves true if it opens,
// false if the handshake is rejected (disallowed origin / connection error).
const wsOpens = (url, origin) => new Promise((resolve) => {
    const ws = origin
        ? new WebSocket(url, { origin })
        : new WebSocket(url);
    let settled = false;
    const done = (result) => { if (!settled) { settled = true; ws.terminate(); resolve(result); } };
    ws.on('open', () => done(true));
    ws.on('error', () => done(false));
    ws.on('unexpected-response', () => done(false));
    setTimeout(() => done(false), 5000);
});

const wsFirstMessage = (url, origin) => new Promise((resolve, reject) => {
    const ws = origin
        ? new WebSocket(url, { origin })
        : new WebSocket(url);
    const timer = setTimeout(() => { ws.terminate(); reject(new Error('WebSocket message timeout')); }, 5000);
    ws.on('message', (data) => {
        clearTimeout(timer);
        ws.close();
        resolve(JSON.parse(data.toString()));
    });
    ws.on('error', (err) => { clearTimeout(timer); reject(err); });
    ws.on('unexpected-response', (_req, res) => {
        clearTimeout(timer);
        reject(new Error(`WebSocket handshake rejected (HTTP ${res.statusCode})`));
    });
});

// ─── Server under test ────────────────────────────────────────────────────

let tmpDir;
let main;
let baseUrl;
let wsUrl;
let token;

const ADMIN_USER = 'admin';
const ADMIN_PASS = 'regression-pass-123';

before(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-regression-'));
    const port = await getFreePort();
    main = spawnServer({
        HOST: '127.0.0.1',
        PORT: String(port),
        DB_PATH: path.join(tmpDir, 'devotee_mgmt.db'),
        DMS_DISABLE_WHATSAPP: '1',
        DMS_AUTH_BYPASS: '0',
        RATE_LIMIT_GLOBAL_MAX: '100000',
        RATE_LIMIT_PUBLIC_MAX: '1000',
        ADMIN_USERNAME: ADMIN_USER,
        ADMIN_EMAIL: 'admin@iskcon.org',
        ADMIN_PASSWORD: ADMIN_PASS,
        AUTH_SECRET: 'regression-test-secret'
    });
    baseUrl = `http://127.0.0.1:${port}`;
    wsUrl = `ws://127.0.0.1:${port}`;
    await waitForHealth(baseUrl);
    const login = await api(baseUrl, '/api/auth/login', {
        method: 'POST', body: { username: ADMIN_USER, password: ADMIN_PASS }
    });
    assert.equal(login.status, 200, 'seeded admin login in before()');
    token = login.data.token;
});

after(async () => {
    await stopServer(main);
    if (tmpDir) {
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* non-fatal */ }
    }
});

// ─── Boot ─────────────────────────────────────────────────────────────────

test('GET /api/system/health is public and reports healthy', async () => {
    const { status, data } = await api(baseUrl, '/api/system/health');
    assert.equal(status, 200);
    assert.equal(data.success, true);
    assert.equal(data.status, 'healthy');
});

// ─── Auth gating ──────────────────────────────────────────────────────────

test('protected API returns 401 without a token', async () => {
    const { status } = await api(baseUrl, '/api/devotees?limit=5');
    assert.equal(status, 401);
});

test('protected API returns 401 with a garbage token', async () => {
    const { status } = await api(baseUrl, '/api/devotees?limit=5', { token: 'not-a-real-token' });
    assert.equal(status, 401);
});

test('login rejects a wrong password', async () => {
    const { status } = await api(baseUrl, '/api/auth/login', {
        method: 'POST', body: { username: ADMIN_USER, password: 'wrong-password-123' }
    });
    assert.equal(status, 401);
});

test('login accepts the seeded admin and issues a token', async () => {
    const { status, data } = await api(baseUrl, '/api/auth/login', {
        method: 'POST', body: { username: ADMIN_USER, password: ADMIN_PASS }
    });
    assert.equal(status, 200);
    assert.ok(data.token && typeof data.token === 'string');
    assert.equal(data.user.username, ADMIN_USER);
    assert.equal(data.user.role, 'admin');
    assert.equal(data.user.passwordHash, undefined, 'never leak passwordHash');
});

test('session reports the authenticated user for a valid token', async () => {
    const { status, data } = await api(baseUrl, '/api/auth/session', { token });
    assert.equal(status, 200);
    assert.equal(data.success, true);
    assert.equal(data.user.username, ADMIN_USER);
});

test('verify-password accepts the correct password for the user', async () => {
    const { status, data } = await api(baseUrl, '/api/auth/verify-password', {
        method: 'POST', token, body: { password: ADMIN_PASS }
    });
    assert.equal(status, 200);
    assert.equal(data.success, true);
});

// ─── Devotee CRUD + duplicate guard ───────────────────────────────────────

test('devotee create/read/update/list/delete lifecycle', async () => {
    const id = 'reg-0001-' + crypto.randomUUID();

    const created = await api(baseUrl, '/api/devotees', {
        method: 'POST', token,
        body: {
            id,
            name: 'Regression Test Devotee',
            contact: '9000000001',
            gender: 'Male',
            spiritualStatus: 'Aspiring',
            status: 'Active',
            createdAt: new Date().toISOString()
        }
    });
    assert.equal(created.status, 200);
    assert.equal(created.data.success, true);

    const fetched = await api(baseUrl, `/api/devotees/${id}`, { token });
    assert.equal(fetched.status, 200);
    assert.equal(fetched.data.data.name, 'Regression Test Devotee');

    const updated = await api(baseUrl, `/api/devotees/${id}`, {
        method: 'PUT', token, body: { name: 'Regression Test Devotee Updated' }
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.data.success, true);

    const refetched = await api(baseUrl, `/api/devotees/${id}`, { token });
    assert.equal(refetched.data.data.name, 'Regression Test Devotee Updated');

    const list = await api(baseUrl, '/api/devotees?limit=100', { token });
    assert.equal(list.data.success, true);
    assert.ok(Array.isArray(list.data.data));
    assert.ok(list.data.data.some((d) => d.id === id));

    const stats = await api(baseUrl, '/api/devotees/stats', { token });
    assert.equal(stats.data.success, true);
    assert.ok(stats.data.total >= 1);

    const options = await api(baseUrl, '/api/devotees/filter-options', { token });
    assert.equal(options.data.success, true);

    const events = await api(baseUrl, '/api/events', { token });
    assert.equal(events.status, 200, 'secondary routers return data');

    const del = await api(baseUrl, `/api/devotees/${id}`, { method: 'DELETE', token });
    assert.equal(del.data.success, true);

    const gone = await api(baseUrl, `/api/devotees/${id}`, { token });
    assert.equal(gone.status, 404);
});

test('duplicate guard rejects a second devotee with same contact + name', async () => {
    const base = {
        name: 'Dup Test Devotee',
        contact: '9000000002',
        gender: 'Female',
        spiritualStatus: 'Aspiring'
    };
    const first = await api(baseUrl, '/api/devotees', {
        method: 'POST', token, body: { ...base, id: 'reg-0002-' + crypto.randomUUID(), createdAt: new Date().toISOString() }
    });
    assert.equal(first.status, 200);

    const second = await api(baseUrl, '/api/devotees', {
        method: 'POST', token, body: { ...base, id: 'reg-0003-' + crypto.randomUUID(), createdAt: new Date().toISOString() }
    });
    assert.equal(second.status, 500, 'duplicate add must be rejected');
    assert.match(second.data.error || '', /already exists/);

    // The update path must run the same guard: renaming devotee B onto A's
    // (contact + name) pair is a duplicate too.
    const third = await api(baseUrl, '/api/devotees', {
        method: 'POST', token, body: {
            ...base, id: 'reg-0004-' + crypto.randomUUID(), name: 'Dup Test Devotee III',
            contact: '9000000003', createdAt: new Date().toISOString()
        }
    });
    assert.equal(third.status, 200);

    const renamed = await api(baseUrl, `/api/devotees/${third.data.id}`, {
        method: 'PUT', token, body: { name: 'Dup Test Devotee', contact: '9000000002' }
    });
    assert.equal(renamed.status, 500, 'update onto a duplicate must be rejected');
    assert.match(renamed.data.error || '', /already exists/);
});

test('logout invalidates the issued token', async () => {
    const { status } = await api(baseUrl, '/api/auth/logout', { method: 'POST', token });
    assert.equal(status, 200);
    const { status: afterStatus } = await api(baseUrl, '/api/devotees?limit=5', { token });
    assert.equal(afterStatus, 401, 'token must be invalid after logout');
});

// ─── WebSocket origin enforcement ─────────────────────────────────────────

test('websocket accepts loopback clients (no Origin header)', async () => {
    const msg = await wsFirstMessage(wsUrl);
    assert.equal(msg.type, 'CONNECTED');
});

test('websocket accepts allowlisted browser origins', async () => {
    const opened = await wsOpens(wsUrl, 'http://localhost:3001');
    assert.equal(opened, true);
});

test('websocket rejects cross-site (evil) origins', async () => {
    const opened = await wsOpens(wsUrl, 'http://evil.example.com');
    assert.equal(opened, false);
});

// ─── Public self-registration (#/register shareable form) ──────────────────

const publicRegister = (body) => api(baseUrl, '/api/public/register', { method: 'POST', body });

const validPublicPayload = (overrides = {}) => ({
    name: 'Public Test Devotee',
    gender: 'Male',
    relationType: 'Father',
    contact: '9111111111',
    maritalStatus: 'Single',
    spiritualStatus: 'Aspiring',
    ...overrides
});

// The earlier logout test invalidated the admin token — re-login for the
// assertions that need to read the stored records.
let publicTestToken;
const loginForPublicTests = async () => {
    if (publicTestToken) return publicTestToken;
    const login = await api(baseUrl, '/api/auth/login', {
        method: 'POST', body: { username: ADMIN_USER, password: ADMIN_PASS }
    });
    assert.equal(login.status, 200);
    publicTestToken = login.data.token;
    return publicTestToken;
};

test('public register accepts an anonymous submission as Pending', async () => {
    const { status, data } = await publicRegister(validPublicPayload());
    assert.equal(status, 200, 'endpoint must be reachable without a token');
    assert.equal(data.success, true);
    assert.equal(data.status, 'Pending');
    assert.ok(data.id, 'server assigns the id');

    const token = await loginForPublicTests();
    const fetched = await api(baseUrl, `/api/devotees/${data.id}`, { token });
    assert.equal(fetched.status, 200);
    assert.equal(fetched.data.data.status, 'Pending', 'stored with Pending status');
    assert.equal(fetched.data.data.source, 'Public Form', 'source tag for admin triage');
    assert.equal(fetched.data.data.name, 'Public Test Devotee');
});

test('public register forces server-owned fields (client cannot self-activate)', async () => {
    const { data } = await publicRegister(validPublicPayload({
        name: 'Public Test Devotee II',
        contact: '9111111112',
        id: 'attacker-chosen-id',
        status: 'Active',
        source: 'Spoofed',
        createdAt: '2000-01-01T00:00:00.000Z'
    }));

    const token = await loginForPublicTests();
    const fetched = await api(baseUrl, `/api/devotees/${data.id}`, { token });
    assert.equal(fetched.status, 200);
    assert.notEqual(fetched.data.data.id, 'attacker-chosen-id', 'id is server-generated');
    assert.equal(fetched.data.data.status, 'Pending', 'status cannot be forced to Active');
    assert.equal(fetched.data.data.source, 'Public Form', 'source cannot be spoofed');
});

test('public register validates required fields', async () => {
    const missingName = await publicRegister(validPublicPayload({ name: '' }));
    assert.equal(missingName.status, 400);

    const badContact = await publicRegister(validPublicPayload({ contact: '12345' }));
    assert.equal(badContact.status, 400);

    const badGender = await publicRegister(validPublicPayload({ gender: 'Robot' }));
    assert.equal(badGender.status, 400);
});

test('public register honeypot swallows bot submissions silently', async () => {
    const { status, data } = await publicRegister(validPublicPayload({
        name: 'Bot Submission',
        contact: '9111111113',
        website: 'http://spam.example.com'
    }));
    assert.equal(status, 200, 'bots must not learn they were filtered');
    assert.equal(data.success, true);

    const token = await loginForPublicTests();
    const fetched = await api(baseUrl, `/api/devotees/${data.id}`, { token });
    assert.equal(fetched.status, 404, 'honeypot submissions must not be stored');
});

test('public register duplicate returns a generic 409 without leaking data', async () => {
    const first = await publicRegister(validPublicPayload({
        name: 'Public Dup Devotee', contact: '9111111114'
    }));
    assert.equal(first.status, 200);

    const second = await publicRegister(validPublicPayload({
        name: 'Public Dup Devotee', contact: '9111111114'
    }));
    assert.equal(second.status, 409, 'duplicate must be rejected');
    assert.match(second.data.error || '', /already exists/);
    assert.ok(!(second.data.error || '').includes('Public Dup Devotee'),
        'the response must not reveal the existing devotee\'s name');
});

test('pending registrations are excluded from dashboard stats', async () => {
    const token = await loginForPublicTests();
    const before = await api(baseUrl, '/api/devotees/stats', { token });
    assert.equal(before.data.success, true);

    const created = await publicRegister(validPublicPayload({
        name: 'Public Stats Devotee', contact: '9111111115'
    }));
    assert.equal(created.status, 200);

    const after = await api(baseUrl, '/api/devotees/stats', { token });
    assert.equal(after.data.success, true);
    assert.equal(after.data.total, before.data.total, 'Pending rows must not inflate total');
    assert.equal(after.data.currentMonthRegistrations, before.data.currentMonthRegistrations,
        'Pending rows must not inflate monthly registrations');
});

// ─── Dev bypass login (DMS_AUTH_BYPASS unset in the test env) ─────────────

test('bypass status reports disabled when DMS_AUTH_BYPASS is unset', async () => {
    const { status, data } = await api(baseUrl, '/api/auth/bypass');
    assert.equal(status, 200);
    assert.equal(data.success, true);
    assert.equal(data.enabled, false, 'bypass must be off by default');
});

test('bypass login is rejected with 403 when the flag is off', async () => {
    const { status, data } = await api(baseUrl, '/api/auth/bypass', { method: 'POST' });
    assert.equal(status, 403, 'bypass must never issue tokens without the env flag');
    assert.equal(data.success, false);
});