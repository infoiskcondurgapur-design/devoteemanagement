/**
 * Real-Time WebSocket Client
 * Connects to the DMS backend WebSocket server and dispatches real-time
 * mutation notifications to the application.
 */

class RealtimeSyncClient {
    constructor() {
        this.ws = null;
        this.reconnectTimer = null;
        this.listeners = new Set();
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectDelay = 15000;
    }

    /**
     * Determines the appropriate WebSocket URL based on current environment
     */
    getWsUrl() {
        if (typeof window === 'undefined') return null;

        // Explicit VITE_API_URL or VITE_WS_URL override
        const wsOverride = import.meta.env.VITE_WS_URL;
        if (wsOverride) return wsOverride;

        const apiBase = import.meta.env.VITE_API_URL || '';
        if (apiBase.startsWith('http://') || apiBase.startsWith('https://')) {
            try {
                const url = new URL(apiBase);
                const proto = url.protocol === 'https:' ? 'wss:' : 'ws:';
                return `${proto}//${url.host}`;
            } catch {
                // fallback below
            }
        }

        // Local development / Electron default
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1' || window.location.protocol.startsWith('file')) {
            return 'ws://localhost:3001';
        }

        // Vercel serverless functions do not host a WebSocket server unless explicitly configured via VITE_WS_URL
        if (hostname.endsWith('vercel.app')) {
            return null;
        }

        // Deployed web origin (custom domain with reverse proxy/standalone node server)
        const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${proto}//${window.location.host}`;
    }

    /**
     * Establish connection to the WebSocket server
     */
    connect() {
        if (typeof window === 'undefined') return;
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            return;
        }

        const url = this.getWsUrl();
        if (!url) return;

        try {
            this.ws = new WebSocket(url);

            this.ws.onopen = () => {
                this.isConnected = true;
                this.reconnectAttempts = 0;
                if (this.reconnectTimer) {
                    clearTimeout(this.reconnectTimer);
                    this.reconnectTimer = null;
                }
                this.notify('connection', { connected: true });
                window.dispatchEvent(new CustomEvent('dms:ws-status', { detail: { connected: true } }));
            };

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if (message && message.type) {
                        this.notify(message.type, message.data);
                        window.dispatchEvent(new CustomEvent('dms:sync', { detail: message }));
                    }
                } catch {
                    // Ignore non-JSON frames
                }
            };

            this.ws.onclose = () => {
                this.isConnected = false;
                this.ws = null;
                window.dispatchEvent(new CustomEvent('dms:ws-status', { detail: { connected: false } }));
                this.scheduleReconnect();
            };

            this.ws.onerror = () => {
                // Handled gracefully via onclose
                this.isConnected = false;
            };
        } catch {
            this.scheduleReconnect();
        }
    }

    /**
     * Schedules a reconnect attempt with exponential backoff
     */
    scheduleReconnect() {
        if (this.reconnectTimer) return;
        this.reconnectAttempts++;
        const delay = Math.min(2000 * Math.pow(1.5, this.reconnectAttempts - 1), this.maxReconnectDelay);
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
        }, delay);
    }

    /**
     * Subscribe a callback to receive all incoming typed events
     * @param {function} callback - Receives (type, data)
     * @returns {function} Unsubscribe function
     */
    subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    /**
     * Notify registered subscribers
     */
    notify(type, data) {
        this.listeners.forEach((cb) => {
            try {
                cb(type, data);
            } catch (err) {
                console.warn('[WS Client] Listener error:', err);
            }
        });
    }

    /**
     * Terminate the connection cleanly
     */
    disconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.ws) {
            try {
                this.ws.close();
            } catch {
                // ignore
            }
            this.ws = null;
        }
        this.isConnected = false;
    }
}

export const wsClient = new RealtimeSyncClient();
export default wsClient;
