import oauthSheetsService from '../oauth-sheets-service.mjs';
import {
    hashPassword,
    verifyPassword as checkPassword,
    signToken,
    toPublicUser,
    revokeRequestToken,
    createPasswordResetRequest,
    verifyAndResetPassword
} from '../services/authService.mjs';
import { getUserByIdentity, getUserById, getDevoteeByContact, updateUserPassword } from '../database.mjs';

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

// ─── Forgot / Reset Password ──────────────────────────────────────────
const maskPhone = (phone) => {
    if (!phone || typeof phone !== 'string') return '';
    const clean = phone.replace(/\D/g, '');
    if (clean.length <= 4) return '****';
    return clean.slice(0, 2) + '******' + clean.slice(-4);
};

const findUserAndContact = async (identity) => {
    const raw = String(identity || '').trim();
    if (!raw) return { user: null, devotee: null, targetPhone: null };

    // 1. Direct match on users table (username or email)
    let user = await getUserByIdentity(raw).catch(() => null);

    // 2. Normalization if numeric/phone
    const digits = raw.replace(/\D/g, '');
    if (!user && digits) {
        user = await getUserByIdentity(digits).catch(() => null);
        if (!user && digits.length === 10) {
            user = await getUserByIdentity('91' + digits).catch(() => null);
        }
        if (!user && digits.length === 12 && digits.startsWith('91')) {
            user = await getUserByIdentity(digits.slice(2)).catch(() => null);
        }
    }

    // 3. Devotee lookup if user not found directly
    let devotee = null;
    if (!user) {
        devotee = await getDevoteeByContact(raw).catch(() => null);
        if (!devotee && digits) {
            devotee = await getDevoteeByContact(digits).catch(() => null);
            if (!devotee && digits.length === 10) {
                devotee = await getDevoteeByContact('91' + digits).catch(() => null);
            }
            if (!devotee && digits.length === 12 && digits.startsWith('91')) {
                devotee = await getDevoteeByContact(digits.slice(2)).catch(() => null);
            }
        }
        if (devotee && devotee.contact) {
            user = await getUserByIdentity(devotee.contact).catch(() => null);
        }
    } else {
        devotee = await getDevoteeByContact(user.username).catch(() => null);
    }

    let targetPhone = null;
    if (user) {
        const uDigits = String(user.username).replace(/\D/g, '');
        if (uDigits.length >= 10) {
            targetPhone = uDigits;
        } else if (devotee && (devotee.whatsapp || devotee.contact)) {
            targetPhone = String(devotee.whatsapp || devotee.contact).replace(/\D/g, '');
        } else if (user.role === 'admin' && process.env.ADMIN_PHONE) {
            targetPhone = String(process.env.ADMIN_PHONE).replace(/\D/g, '');
        }
    }

    return { user, devotee, targetPhone };
};

export const forgotPassword = async (req, res) => {
    try {
        const { identity } = req.body || {};
        if (!identity || !String(identity).trim()) {
            return res.status(400).json({ success: false, error: 'Please enter your username, email, or phone number.' });
        }

        const { user, targetPhone } = await findUserAndContact(identity);
        if (!user) {
            return res.status(404).json({ success: false, error: 'No account found matching this username, email, or phone number.' });
        }

        const { requestId, code } = createPasswordResetRequest(user, targetPhone);
        const isBypass = process.env.DMS_AUTH_BYPASS === '1' || process.env.NODE_ENV !== 'production';

        if (isBypass) {
            console.log(`[Auth] Password reset OTP for ${user.username} is: ${code}`);
            return res.json({
                success: true,
                requestId,
                method: 'dev',
                devCode: code,
                maskedContact: targetPhone ? maskPhone(targetPhone) : null,
                message: `Verification code generated: ${code}`
            });
        }

        return res.status(503).json({
            success: false,
            error: 'Automated SMS/WhatsApp reset is not configured on this web deployment. Please contact your temple administrator.'
        });
    } catch (err) {
        console.error('[Auth] forgotPassword error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to process password reset request.' });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { requestId, code, newPassword } = req.body || {};
        if (!requestId || !code || !newPassword) {
            return res.status(400).json({ success: false, error: 'Verification code and new password are required.' });
        }

        const result = await verifyAndResetPassword(requestId, code, newPassword);
        if (!result.success) {
            return res.status(400).json({ success: false, error: result.error });
        }

        res.json({
            success: true,
            message: 'Password has been reset successfully! You can now log in with your new password.'
        });
    } catch (err) {
        console.error('[Auth] resetPassword error:', err.message);
        res.status(500).json({ success: false, error: 'Password reset failed.' });
    }
};

export const changePassword = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        const { currentPassword, newPassword } = req.body || {};
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, error: 'Current password and new password are required' });
        }
        if (String(newPassword).trim().length < 6) {
            return res.status(400).json({ success: false, error: 'New password must be at least 6 characters long' });
        }

        const user = (await getUserById(req.user.id).catch(() => null)) ||
                     (await getUserByIdentity(req.user.username).catch(() => null));

        if (!user || !checkPassword(currentPassword, user.passwordHash || user.passwordhash)) {
            return res.status(401).json({ success: false, error: 'Current password is incorrect' });
        }

        const newHash = hashPassword(String(newPassword).trim());
        await updateUserPassword(user.id, newHash);

        res.json({ success: true, message: 'Password has been updated successfully.' });
    } catch (err) {
        console.error('[Auth] changePassword error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to update password' });
    }
};

export const adminResetUserPassword = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });
        }
        const { userId, newPassword } = req.body || {};
        if (!userId || !newPassword) {
            return res.status(400).json({ success: false, error: 'User ID and new password are required' });
        }
        if (String(newPassword).trim().length < 6) {
            return res.status(400).json({ success: false, error: 'New password must be at least 6 characters long' });
        }

        const user = (await getUserById(userId).catch(() => null)) ||
                     (await getUserByIdentity(userId).catch(() => null));
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const newHash = hashPassword(String(newPassword).trim());
        await updateUserPassword(user.id, newHash);

        res.json({
            success: true,
            message: `Password for ${user.fullName || user.fullname || user.username} has been reset successfully.`
        });
    } catch (err) {
        console.error('[Auth] adminResetUserPassword error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to reset user password' });
    }
};


