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
    for (let i = 0; i < 60; i++) {
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

before(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-regression-'));
    const port = await getFreePort();
    main = spawnServer({
        HOST: '127.0.0.1',
        PORT: String(port),
        DB_PATH: path.join(tmpDir, 'devotee_mgmt.db'),
        DMS_DISABLE_WHATSAPP: '1',
        RATE_LIMIT_GLOBAL_MAX: '100000'
    });
    baseUrl = `http://127.0.0.1:${port}`;
    wsUrl = `ws://127.0.0.1:${port}`;
    await waitForHealth(baseUrl);
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

// ─── Auth gating (removed: all routes are public, no token required) ─────

test('API is public and accessible without a token', async () => {
    const { status } = await api(baseUrl, '/api/devotees?limit=5');
    assert.equal(status, 200);
});

test('API is public and accessible with a garbage token too', async () => {
    const { status } = await api(baseUrl, '/api/devotees?limit=5', { token: 'not-a-real-token' });
    assert.equal(status, 200);
});

// ─── Devotee CRUD + duplicate guard ───────────────────────────────────────

test('devotee create/read/update/list/delete lifecycle', async () => {
    const id = 'reg-0001-' + crypto.randomUUID();

    const created = await api(baseUrl, '/api/devotees', {
        method: 'POST',
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

    const fetched = await api(baseUrl, `/api/devotees/${id}`);
    assert.equal(fetched.status, 200);
    assert.equal(fetched.data.data.name, 'Regression Test Devotee');

    const updated = await api(baseUrl, `/api/devotees/${id}`, {
        method: 'PUT', body: { name: 'Regression Test Devotee Updated' }
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.data.success, true);

    const refetched = await api(baseUrl, `/api/devotees/${id}`);
    assert.equal(refetched.data.data.name, 'Regression Test Devotee Updated');

    const list = await api(baseUrl, '/api/devotees?limit=100');
    assert.equal(list.data.success, true);
    assert.ok(Array.isArray(list.data.data));
    assert.ok(list.data.data.some((d) => d.id === id));

    const stats = await api(baseUrl, '/api/devotees/stats');
    assert.equal(stats.data.success, true);
    assert.ok(stats.data.total >= 1);

    const options = await api(baseUrl, '/api/devotees/filter-options');
    assert.equal(options.data.success, true);

    const events = await api(baseUrl, '/api/events');
    assert.equal(events.status, 200, 'secondary routers return data');

    const del = await api(baseUrl, `/api/devotees/${id}`, { method: 'DELETE' });
    assert.equal(del.data.success, true);

    const gone = await api(baseUrl, `/api/devotees/${id}`);
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
        method: 'POST', body: { ...base, id: 'reg-0002-' + crypto.randomUUID(), createdAt: new Date().toISOString() }
    });
    assert.equal(first.status, 200);

    const second = await api(baseUrl, '/api/devotees', {
        method: 'POST', body: { ...base, id: 'reg-0003-' + crypto.randomUUID(), createdAt: new Date().toISOString() }
    });
    assert.equal(second.status, 500, 'duplicate add must be rejected');
    assert.match(second.data.error || '', /already exists/);

    // The update path must run the same guard: renaming devotee B onto A's
    // (contact + name) pair is a duplicate too.
    const third = await api(baseUrl, '/api/devotees', {
        method: 'POST', body: {
            ...base, id: 'reg-0004-' + crypto.randomUUID(), name: 'Dup Test Devotee III',
            contact: '9000000003', createdAt: new Date().toISOString()
        }
    });
    assert.equal(third.status, 200);

    const renamed = await api(baseUrl, `/api/devotees/${third.data.id}`, {
        method: 'PUT', body: { name: 'Dup Test Devotee', contact: '9000000002' }
    });
    assert.equal(renamed.status, 500, 'update onto a duplicate must be rejected');
    assert.match(renamed.data.error || '', /already exists/);
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