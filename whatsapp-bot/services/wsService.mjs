import { WebSocketServer, WebSocket } from 'ws';

let wss = null;
const clients = new Set();

// Cross-site WebSocket hijacking protection: browsers do NOT enforce same-origin on
// WebSocket, so we must check the Origin header ourselves. Allow the local app
// (loopback dev server / Electron file:// renderer), header-less non-browser clients,
// and any web origins configured via ALLOWED_ORIGINS (mirrors the HTTP CORS allowlist).
const LOCAL_WS_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'file://',
    'null' // file:// and sandboxed contexts report Origin: null
];
const deployedWsOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
    : [];
const ALLOWED_WS_ORIGINS = [...new Set([...LOCAL_WS_ORIGINS, ...deployedWsOrigins])];

const isAllowedOrigin = (origin) => {
    if (!origin) return true; // non-browser clients (curl, tests) send no Origin
    return ALLOWED_WS_ORIGINS.includes(String(origin).trim());
};

/**
 * Initialize the WebSocket Server on top of the existing HTTP/HTTPS server
 * @param {object} server - Node.js HTTP/HTTPS server instance
 */
export const initializeWs = (server) => {
    wss = new WebSocketServer({
        server,
        verifyClient: (info) => {
            const origin = info.origin;
            if (!isAllowedOrigin(origin)) {
                console.warn(`[WebSocket] Rejected connection from disallowed origin: ${origin}`);
                return false;
            }
            return true;
        }
    });
    console.log('[WebSocket] Server initialized and listening');

    wss.on('connection', (ws) => {
        clients.add(ws);
        console.log(`[WebSocket] Client connected (Total: ${clients.size})`);

        // Set up ping-pong to detect broken connections
        ws.isAlive = true;
        ws.on('pong', () => {
            ws.isAlive = true;
        });

        ws.on('message', (message) => {
            try {
                const parsed = JSON.parse(message);
                console.log('[WebSocket] Received message from client:', parsed);
                // Handle client events if needed in the future
            } catch (e) {
                console.warn('[WebSocket] Received non-JSON message:', message.toString());
            }
        });

        ws.on('close', () => {
            clients.delete(ws);
            console.log(`[WebSocket] Client disconnected (Total: ${clients.size})`);
        });

        ws.on('error', (err) => {
            console.error('[WebSocket] Client error:', err);
            clients.delete(ws);
        });

        // Send confirmation welcome message
        ws.send(JSON.stringify({ type: 'CONNECTED', message: 'Real-Time Sync active' }));
    });

    // Check for stale connections every 30 seconds
    const interval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (ws.isAlive === false) {
                console.log('[WebSocket] Terminating stale client connection');
                clients.delete(ws);
                return ws.terminate();
            }
            ws.isAlive = false;
            ws.ping();
        });
    }, 30000);

    wss.on('close', () => {
        clearInterval(interval);
    });
};

/**
 * Broadcast an event to all active WebSocket clients
 * @param {string} type - Event identifier (e.g., 'DEVOTEE_CREATED')
 * @param {any} data - Event payload
 */
export const broadcast = (type, data = null) => {
    if (!wss) {
        console.warn('[WebSocket] Cannot broadcast: Server not initialized yet');
        return;
    }

    const payload = JSON.stringify({ type, data });
    let activeConnections = 0;

    clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
            activeConnections++;
        }
    });

    if (activeConnections > 0) {
        console.log(`[WebSocket] Broadcasted: ${type} to ${activeConnections} clients`);
    }
};
