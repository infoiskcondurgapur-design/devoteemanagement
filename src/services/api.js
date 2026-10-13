// Centralized API Service for consistent fetching and error handling
const TOKEN_KEY = 'auth_token';

const getToken = () => {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};

const setToken = (token) => {
    try {
        if (token) localStorage.setItem(TOKEN_KEY, token);
        else localStorage.removeItem(TOKEN_KEY);
    } catch { /* ignore */ }
    // Let contexts (Devotee/ReferenceData) start or stop their polling when the
    // session appears (login) or disappears (logout/expiry).
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new Event('auth:changed'));
    }
};

const buildHeaders = (extra) => {
    const base = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) base['Authorization'] = `Bearer ${token}`;
    return { ...base, ...extra };
};

const handleResponse = async (response) => {
    if (!response.ok) {
        // Dispatch app:unauthorized for non-login 401s (listens via AuthContext).
        // Anonymous visitors (public pages) get 401s by design — those are not
        // session losses and must not trigger the auto-logout redirect.
        if (response.status === 401 && getToken()) {
            const path = (response.url || '').toLowerCase();
            if (!path.includes('/auth/login')) {
                window.dispatchEvent(new Event('app:unauthorized'));
            }
        }
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.error || `Server error: ${response.status}`;
        throw new Error(message);
    }
    return response.json();
};

const getInitialBaseUrl = () => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
        const h = window.location.hostname;
        if (h !== 'localhost' && h !== '127.0.0.1' && !window.location.protocol.startsWith('file')) {
            return '';
        }
    }
    return 'http://localhost:3001';
};

const BASE_URL = getInitialBaseUrl();

const getApiUrl = (url) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

const apiService = {
    baseURL: BASE_URL,

    async get(url) {
        const response = await fetch(getApiUrl(url), { headers: buildHeaders() });
        return await handleResponse(response);
    },

    async post(url, data) {
        const response = await fetch(getApiUrl(url), {
            method: 'POST',
            headers: buildHeaders(),
            body: JSON.stringify(data)
        });
        return await handleResponse(response);
    },

    async put(url, data) {
        const response = await fetch(getApiUrl(url), {
            method: 'PUT',
            headers: buildHeaders(),
            body: JSON.stringify(data)
        });
        return await handleResponse(response);
    },

    async delete(url) {
        const response = await fetch(getApiUrl(url), {
            method: 'DELETE',
            headers: buildHeaders()
        });
        return await handleResponse(response);
    },

    async uploadImage(base64) {
        return this.post('/api/upload', { image: base64 });
    },

    // ─── Auth helpers ───────────────────────────────────────────────
    authSetToken(token) { setToken(token); },
    authClearToken() { setToken(null); },
    authGetToken() { return getToken(); },

    async authLogin(username, password) {
        const res = await fetch(getApiUrl('/api/auth/login'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (res.ok && data.token) {
            setToken(data.token);
        }
        return data;
    },

    async authBypassStatus() {
        try {
            const res = await fetch(getApiUrl('/api/auth/bypass'));
            const data = await res.json();
            return !!data.enabled;
        } catch {
            return false;
        }
    },

    async authBypass() {
        const res = await fetch(getApiUrl('/api/auth/bypass'), { method: 'POST' });
        const data = await res.json();
        if (res.ok && data.token) {
            setToken(data.token);
        }
        return data;
    },

    async authLogout() {
        try {
            await fetch(getApiUrl('/api/auth/logout'), {
                method: 'POST',
                headers: buildHeaders()
            });
        } catch { /* best-effort */ }
        setToken(null);
    },

    async validateSession() {
        if (!getToken()) {
            return { success: false };
        }
        const res = await fetch(getApiUrl('/api/auth/session'), { headers: buildHeaders() });
        const data = await res.json();
        if (!res.ok || !data.success) {
            setToken(null);
            return { success: false };
        }
        return data;
    },

    // ─── WhatsApp Bot Helpers ─────────────────────────────────────────
    async getWhatsAppStatus() {
        return this.get('/api/whatsapp/status');
    },

    async getWhatsAppQR() {
        return this.get('/api/whatsapp/qr');
    },

    async restartWhatsApp() {
        return this.post('/api/whatsapp/restart', {});
    },

    async logoutWhatsApp() {
        return this.post('/api/whatsapp/logout', {});
    }
};

export default apiService;
