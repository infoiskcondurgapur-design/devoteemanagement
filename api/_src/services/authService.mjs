import crypto from 'crypto';
import {
    createUser,
    getUserByIdentity,
    getUsers,
    updateUserPassword
} from '../database.mjs';

// ─── Password hashing (scrypt; stored as `salt:hash`) ──────────────────
// Matches the passwordHash format already present in the users table
// (32-byte hex salt + 64-byte scrypt key), so hashes written by the
// desktop client remain valid on the serverless backend.
export const hashPassword = (password) => {
    const salt = crypto.randomBytes(32).toString('hex');
    const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
    return `${salt}:${hash}`;
};

export const verifyPassword = (password, storedHash) => {
    if (!storedHash || !String(storedHash).includes(':')) return false;
    const [salt, hash] = String(storedHash).split(':');
    if (!salt || !hash) return false;
    const calculated = crypto.scryptSync(String(password), salt, 64).toString('hex');
    const a = Buffer.from(calculated, 'hex');
    const b = Buffer.from(hash, 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
};

// ─── Stateless bearer tokens (HMAC-SHA256, self-contained) ─────────────
// Memoize the fallback secret: tokens are signed and verified with the SAME
// instance secret as long as the process lives (sign and verify must agree).
let fallbackSecret = null;
const getSecret = () => {
    const fromEnv = process.env.AUTH_SECRET;
    if (fromEnv) return fromEnv;
    // Fallback (serverless cold-start friendly but not durable across restarts):
    if (!fallbackSecret) {
        console.warn('[Auth] AUTH_SECRET not set — tokens are signed with an ephemeral secret; set AUTH_SECRET in env.');
        fallbackSecret = crypto.randomBytes(32).toString('hex');
    }
    return fallbackSecret;
};

const b64url = (input) => Buffer.from(JSON.stringify(input)).toString('base64url');

export const signToken = (payload, ttlSeconds = 12 * 60 * 60) => {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'HS256', typ: 'JWT' };
    const body = { ...payload, jti: crypto.randomUUID(), iat: now, exp: now + ttlSeconds };
    const unsigned = `${b64url(header)}.${b64url(body)}`;
    const signature = crypto.createHmac('sha256', getSecret()).update(unsigned).digest('base64url');
    return `${unsigned}.${signature}`;
};

export const verifyToken = (token) => {
    if (!token || typeof token !== 'string') return null;
    if (revokedTokens.has(token)) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [h, b, sig] = parts;
    const expected = crypto.createHmac('sha256', getSecret()).update(`${h}.${b}`).digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;
    try {
        const body = JSON.parse(Buffer.from(b, 'base64url').toString('utf8'));
        if (!body.exp || body.exp < Math.floor(Date.now() / 1000)) return null;
        return body;
    } catch {
        return null;
    }
};

// ─── Revocation (logout) ─────────────────────────────────────────────────
// Stateless tokens can be revoked before expiry by remembering the exact
// token string until its own exp passes. Best-effort per instance on
// serverless; the desktop backend is single-process so it always holds.
const revokedTokens = new Map();

export const revokeToken = (token) => {
    if (!token || typeof token !== 'string') return;
    const payload = verifyToken(token);
    if (!payload) return;
    revokedTokens.set(token, payload.exp || 0);
    if (revokedTokens.size > 500) {
        const now = Math.floor(Date.now() / 1000);
        for (const [t, exp] of revokedTokens) {
            if (exp < now) revokedTokens.delete(t);
        }
    }
};

export const revokeRequestToken = (req) => revokeToken(extractToken(req));

const extractToken = (req) => {
    const auth = req.headers.authorization || '';
    if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
    if (req.query && req.query.token) return String(req.query.token);
    if (req.body && req.body.token) return String(req.body.token);
    return null;
};

// ─── Middleware ─────────────────────────────────────────────────────────
export const requireAuth = (req, res, next) => {
    const payload = verifyToken(extractToken(req));
    if (!payload || !payload.uid) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    req.user = {
        id: payload.uid,
        username: payload.username,
        role: payload.role || 'viewer'
    };
    next();
};

export const requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') return next();
    return res.status(403).json({ success: false, error: 'Forbidden' });
};

// Serialize a DB user row for API responses (never expose passwordHash).
export const toPublicUser = (row) => {
    if (!row) return null;
    // The global casing map restores `users.username` as `userName` (collision
    // with audit_logs."userName"); read both spellings defensively.
    const username = row.username || row.userName;
    return {
        id: String(row.id),
        username,
        email: row.email || null,
        role: row.role || 'viewer',
        fullName: row.fullname || row.fullName || username
    };
};

// Ensure the admin account exists. Syncs the password with ADMIN_PASSWORD so
// operators can rotate login credentials purely via environment variables.
export const ensureAdmin = async () => {
    const username = (process.env.ADMIN_USERNAME || 'admin').trim();
    const fullName = process.env.ADMIN_NAME || 'Super Admin';
    const email = (process.env.ADMIN_EMAIL || 'admin@iskcon.org').trim();
    const password = process.env.ADMIN_PASSWORD;

    let existing = null;
    try {
        existing = await getUserByIdentity(username);
    } catch (err) {
        console.error('[Auth] ensureAdmin lookup failed:', err.message);
    }

    if (!existing) {
        try {
            const pwd = password || crypto.randomBytes(12).toString('base64url');
            await createUser({
                username,
                email,
                passwordHash: hashPassword(pwd),
                role: 'admin',
                fullName
            });
            console.log(`[Auth] Admin account '${username}' created${password ? '' : ' with a generated password (set ADMIN_PASSWORD to manage it)'}.`);
        } catch (err) {
            console.error('[Auth] ensureAdmin create failed:', err.message);
        }
        return;
    }

    if (password) {
        try {
            const newHash = hashPassword(password);
            await updateUserPassword(existing.id, newHash);
            console.log(`[Auth] Admin password synced from ADMIN_PASSWORD for '${username}'.`);
        } catch (err) {
            console.error('[Auth] ensureAdmin update failed:', err.message);
        }
    }
};

export const listPublicUsers = async () => {
    const rows = await getUsers();
    return (rows || []).map(toPublicUser);
};

// ─── Password Reset via OTP ──────────────────────────────────────────────
const resetRequests = new Map();

const pruneExpiredResets = () => {
    const now = Date.now();
    for (const [id, req] of resetRequests) {
        if (req.expiresAt < now) resetRequests.delete(id);
    }
};

export const createPasswordResetRequest = (user, targetPhone = null) => {
    pruneExpiredResets();
    for (const [id, req] of resetRequests) {
        if (req.userId === user.id) resetRequests.delete(id);
    }

    const code = String(crypto.randomInt(100000, 1000000));
    const requestId = crypto.randomUUID();
    const codeHash = crypto.createHmac('sha256', getSecret()).update(code).digest('hex');

    resetRequests.set(requestId, {
        userId: user.id,
        username: user.username,
        targetPhone,
        codeHash,
        expiresAt: Date.now() + (10 * 60 * 1000), // 10 minutes
        attempts: 0
    });

    return { requestId, code };
};

export const verifyAndResetPassword = async (requestId, code, newPassword) => {
    pruneExpiredResets();
    if (!requestId || typeof requestId !== 'string') {
        return { success: false, error: 'Invalid or missing reset request.' };
    }

    const session = resetRequests.get(requestId);
    if (!session || session.expiresAt < Date.now()) {
        if (session) resetRequests.delete(requestId);
        return { success: false, error: 'Verification code has expired. Please request a new one.' };
    }

    if (session.attempts >= 5) {
        resetRequests.delete(requestId);
        return { success: false, error: 'Too many incorrect attempts. Please request a new code.' };
    }

    const calculated = crypto.createHmac('sha256', getSecret()).update(String(code || '').trim()).digest('hex');
    const a = Buffer.from(calculated, 'hex');
    const b = Buffer.from(session.codeHash, 'hex');
    const matches = a.length === b.length && crypto.timingSafeEqual(a, b);

    if (!matches) {
        session.attempts += 1;
        return { success: false, error: 'Incorrect verification code. Please try again.' };
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 6) {
        return { success: false, error: 'New password must be at least 6 characters long.' };
    }

    const newHash = hashPassword(newPassword.trim());
    await updateUserPassword(session.userId, newHash);
    resetRequests.delete(requestId);

    return {
        success: true,
        userId: session.userId,
        username: session.username,
        targetPhone: session.targetPhone
    };
};

export default {
    hashPassword,
    verifyPassword,
    signToken,
    verifyToken,
    revokeToken,
    revokeRequestToken,
    requireAuth,
    requireAdmin,
    toPublicUser,
    ensureAdmin,
    listPublicUsers,
    createPasswordResetRequest,
    verifyAndResetPassword
};