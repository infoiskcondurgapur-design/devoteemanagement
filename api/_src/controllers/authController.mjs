import oauthSheetsService from '../oauth-sheets-service.mjs';
import {
    verifyPassword as checkPassword,
    signToken,
    toPublicUser,
    revokeRequestToken
} from '../services/authService.mjs';
import { getUserByIdentity } from '../database.mjs';

// Simple in-memory login throttling (best-effort on serverless; each cold
// instance keeps its own counter). 20 attempts / 15 min per identity+IP.
const loginAttempts = new Map();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 20;

const pruneLoginAttempts = () => {
    const now = Date.now();
    for (const [key, entries] of loginAttempts) {
        loginAttempts.set(key, entries.filter(t => now - t < LOGIN_WINDOW_MS));
        if (loginAttempts.get(key).length === 0) loginAttempts.delete(key);
    }
};

const isLoginLimited = (ip, identity) => {
    pruneLoginAttempts();
    const key = `${ip}|${String(identity || '').toLowerCase()}`;
    const hits = loginAttempts.get(key) || [];
    return { limited: hits.length >= LOGIN_MAX_ATTEMPTS, key, hits };
};

const recordLoginAttempt = (key) => {
    const hits = loginAttempts.get(key) || [];
    hits.push(Date.now());
    loginAttempts.set(key, hits);
};

const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export const getGoogleUrl = async (req, res) => {
    try {
        await oauthSheetsService.ensureInitialized();
        const url = oauthSheetsService.getAuthUrl();
        res.json({ success: true, url, authUrl: url });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

export const googleCallback = async (req, res) => {
    try {
        const { code } = req.query;
        if (!code) {
            return res.status(400).send('<h1>Authentication Failed</h1><p>No code provided by Google.</p>');
        }

        await oauthSheetsService.ensureInitialized();
        await oauthSheetsService.getTokensFromCode(code);

        res.send(`
            <html>
                <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 90vh;">
                    <div style="text-align: center; background: #f0fdf4; padding: 2rem; border-radius: 1rem; border: 1px solid #bbf7d0;">
                        <h1 style="color: #166534; margin-bottom: 0.5rem;">Authentication Successful!</h1>
                        <p style="color: #15803d;">You can now close this window and continue using the app.</p>
                        <button onclick="window.close()" style="background: #166534; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-weight: bold; margin-top: 1rem;">Close Window</button>
                    </div>
                    <script>
                        setTimeout(() => {
                            if (window.opener) {
                                window.opener.postMessage('google-auth-success', '*');
                            }
                            window.close();
                        }, 2000);
                    </script>
                </body>
            </html>
        `);
    } catch (err) {
        console.error('[Google Auth] Redirect Callback Error:', err.message);
        const safeMessage = escapeHtml(err.message);
        res.status(500).send(`
            <h1 style="color: #ef4444; font-family: sans-serif;">Authentication Error</h1>
            <p style="color: #374151; font-family: sans-serif;"><strong>Google Error:</strong> ${safeMessage}</p>
            <hr style="margin: 1.5rem 0; border: 0; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-family: sans-serif; font-size: 0.875rem;">
                <strong>Possible solutions:</strong><br>
                1. Check that your <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> are correct in Vercel env vars.<br>
                2. Ensure the redirect URI configured matches your <code>GOOGLE_REDIRECT_URI</code> env var.<br>
                3. If the project is in "Testing" mode, add your email to the "Test Users" list.
            </p>
            <button onclick="window.close()" style="margin-top: 1rem; cursor: pointer;">Close Window</button>
        `);
    }
};

export const getGoogleStatus = async (req, res) => {
    try {
        await oauthSheetsService.ensureInitialized();
        const authenticated = oauthSheetsService.isAuthenticated();
        res.json({
            success: true,
            authenticated,
            lastSync: oauthSheetsService.lastSyncTime
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// ─── Username/password login ────────────────────────────────────────────
export const login = async (req, res) => {
    try {
        const { username, password } = req.body || {};
        if (!username || !password) {
            return res.status(400).json({ success: false, error: 'Username and password are required' });
        }

        const ip = req.ip || req.socket?.remoteAddress || 'unknown';
        const { limited, key } = isLoginLimited(ip, username);
        if (limited) {
            return res.status(429).json({ success: false, error: 'Too many login attempts. Please try again later.' });
        }

        const user = await getUserByIdentity(String(username).trim());
        const userName = user ? (user.username || user.userName) : null;
        if (!user || !checkPassword(password, user.passwordHash)) {
            recordLoginAttempt(key);
            return res.status(401).json({ success: false, error: 'Invalid username or password' });
        }

        const token = signToken({
            uid: String(user.id),
            username: userName,
            role: user.role || 'admin'
        });

        res.json({ success: true, token, user: toPublicUser(user) });
    } catch (err) {
        console.error('[Auth] login error:', err.message);
        res.status(500).json({ success: false, error: 'Login failed' });
    }
};

export const session = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        const user = await getUserByIdentity(req.user.username).catch(() => null);
        res.json({ success: true, user: toPublicUser(user || req.user) });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

export const logout = (req, res) => {
    revokeRequestToken(req);
    res.json({ success: true });
};

export const verifyPassword = async (req, res) => {
    try {
        const { password } = req.body || {};
        if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
        if (!password) return res.status(400).json({ success: false, error: 'Password is required' });
        const user = await getUserByIdentity(req.user.username).catch(() => null);
        const ok = !!user && checkPassword(password, user.passwordHash);
        if (!ok) return res.status(401).json({ success: false, error: 'Incorrect password' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// ─── Dev bypass login (DMS_AUTH_BYPASS=1, development only — keep unset on Vercel) ──
const bypassEnabled = () => process.env.DMS_AUTH_BYPASS === '1';

export const bypassStatus = (req, res) => {
    res.json({ success: true, enabled: bypassEnabled() });
};

export const bypass = async (req, res) => {
    try {
        if (!bypassEnabled()) {
            return res.status(403).json({ success: false, error: 'Forbidden' });
        }
        const username = (process.env.ADMIN_USERNAME || 'admin').trim();
        const user = await getUserByIdentity(username);
        if (!user) {
            return res.status(404).json({ success: false, error: 'Admin user not found' });
        }
        const token = signToken({
            uid: String(user.id),
            username: user.username || user.userName,
            role: user.role || 'admin'
        });
        console.warn('[Auth] Dev bypass login used (DMS_AUTH_BYPASS=1) — no password checked');
        res.json({ success: true, token, user: toPublicUser(user) });
    } catch (err) {
        console.error('[Auth] bypass error:', err.message);
        res.status(500).json({ success: false, error: 'Bypass login failed' });
    }
};
