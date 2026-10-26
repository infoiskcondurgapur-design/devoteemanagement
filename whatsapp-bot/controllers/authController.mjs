import oauthSheetsService from '../oauth-sheets-service.mjs';
import whatsappService from '../services/whatsappService.mjs';
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

const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/**
 * Get Google OAuth authorization URL
 */
export const getGoogleUrl = (req, res) => {
    try {
        const url = oauthSheetsService.getAuthUrl();
        res.json({ success: true, url, authUrl: url });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * Handle Google OAuth callback
 */
export const googleCallback = async (req, res) => {
    try {
        const { code } = req.query;
        if (!code) {
            return res.status(400).send('<h1>Authentication Failed</h1><p>No code provided by Google.</p>');
        }

        await oauthSheetsService.getTokensFromCode(code);

        // Return a simple HTML page that closes the popup and notifies the opener
        res.send(`
            <html>
                <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 90vh;">
                    <div style="text-align: center; background: #f0fdf4; padding: 2rem; border-radius: 1rem; border: 1px solid #bbf7d0;">
                        <h1 style="color: #166534; margin-bottom: 0.5rem;">Authentication Successful!</h1>
                        <p style="color: #15803d;">You can now close this window and continue using the app.</p>
                        <button onclick="window.close()" style="background: #166534; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-weight: bold; margin-top: 1rem;">Close Window</button>
                    </div>
                    <script>
                        // Small delay before auto-closing
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
        if (err.message.includes('invalid_client')) {
            console.error('[Google Auth] ERROR Details: Your Client ID or Secret is likely invalid or revoked by Google.');
        }
        const safeMessage = escapeHtml(err.message);
        res.status(500).send(`
            <h1 style="color: #ef4444; font-family: sans-serif;">Authentication Error</h1>
            <p style="color: #374151; font-family: sans-serif;"><strong>Google Error:</strong> ${safeMessage}</p>
            <hr style="margin: 1.5rem 0; border: 0; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-family: sans-serif; font-size: 0.875rem;">
                <strong>Possible solutions:</strong><br>
                1. Check that your <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> in <code>.env</code> are correct.<br>
                2. Ensure the redirect URI <code>http://localhost:3001/api/auth/google/callback</code> is whitelisted in your Google Cloud Console.<br>
                3. If the project is in "Testing" mode, add your email to the "Test Users" list.
            </p>
            <button onclick="window.close()" style="margin-top: 1rem; cursor: pointer;">Close Window</button>
        `);
    }
};

/**
 * Get Google account connection status
 */
export const getGoogleStatus = (req, res) => {
    try {
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

        const user = await getUserByIdentity(String(username).trim());
        if (!user || !checkPassword(password, user.passwordHash)) {
            return res.status(401).json({ success: false, error: 'Invalid username or password' });
        }

        const devotee = await getDevoteeByContact(String(username).trim());
        const devoteeId = devotee ? String(devotee.id) : null;

        const token = signToken({
            uid: String(user.id),
            username: user.username,
            role: user.role || 'admin',
            devoteeId
        });

        res.json({ success: true, token, user: toPublicUser({ ...user, _devoteeId: devoteeId }) });
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
        const devotee = await getDevoteeByContact(String(user?.username || req.user.username).trim()).catch(() => null);
        const devoteeId = devotee ? String(devotee.id) : (req.user.devoteeId || null);
        res.json({ success: true, user: toPublicUser({ ...(user || req.user), _devoteeId: devoteeId }) });
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

// ─── Dev bypass login (DMS_AUTH_BYPASS=1, local development only) ─────
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
        const devotee = await getDevoteeByContact(username);
        const devoteeId = devotee ? String(devotee.id) : null;
        const token = signToken({
            uid: String(user.id),
            username: user.username,
            role: user.role || 'admin',
            devoteeId
        });
        console.warn('[Auth] Dev bypass login used (DMS_AUTH_BYPASS=1) — no password checked');
        res.json({ success: true, token, user: toPublicUser({ ...user, _devoteeId: devoteeId }) });
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

    // Determine target phone
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
        const isBypass = process.env.DMS_AUTH_BYPASS === '1';
        const waReady = !!whatsappService && whatsappService.status === 'READY';

        if (waReady && targetPhone) {
            try {
                const message = `Hare Krishna! Your ISKCON DMS password reset verification code is: *${code}*.\n\nThis code is valid for 10 minutes.\nIf you did not request a password reset, please ignore this message.`;
                await whatsappService.sendMessage(targetPhone, message);
                console.log(`[Auth] Password reset OTP sent to WhatsApp for ${user.username} (${maskPhone(targetPhone)})`);
                return res.json({
                    success: true,
                    requestId,
                    method: 'whatsapp',
                    maskedContact: maskPhone(targetPhone),
                    message: `A 6-digit verification code has been sent to your WhatsApp number (${maskPhone(targetPhone)}).`,
                    ...(isBypass ? { devCode: code } : {})
                });
            } catch (sendErr) {
                console.error('[Auth] Failed to send WhatsApp OTP:', sendErr.message);
                if (isBypass) {
                    return res.json({
                        success: true,
                        requestId,
                        method: 'dev',
                        devCode: code,
                        message: `Dev mode: WhatsApp send failed, but verification code is: ${code}`
                    });
                }
                return res.status(500).json({
                    success: false,
                    error: 'Failed to deliver verification code via WhatsApp. Please try again or contact the administrator.'
                });
            }
        }

        if (isBypass) {
            console.log(`[Auth] Dev mode: Password reset OTP for ${user.username} is: ${code}`);
            return res.json({
                success: true,
                requestId,
                method: 'dev',
                devCode: code,
                message: `Dev Mode (WhatsApp offline): Verification code is ${code}`
            });
        }

        return res.status(503).json({
            success: false,
            error: 'WhatsApp service is currently offline. Please ensure the WhatsApp bot is connected or contact the temple administrator.'
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

        if (result.targetPhone && whatsappService && whatsappService.status === 'READY') {
            try {
                const message = `Hare Krishna! Your ISKCON DMS account password for user *${result.username}* was successfully reset.\n\nIf you did not perform this change, please notify your administrator immediately.`;
                await whatsappService.sendMessage(result.targetPhone, message);
            } catch (err) {
                console.warn('[Auth] Post-reset WhatsApp confirmation not sent:', err.message);
            }
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

        if (!user || !checkPassword(currentPassword, user.passwordHash)) {
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

        // Notify user via WhatsApp if connected
        const devotee = await getDevoteeByContact(user.username).catch(() => null);
        const targetPhone = (String(user.username).replace(/\D/g, '').length >= 10)
            ? user.username
            : (devotee && (devotee.whatsapp || devotee.contact));

        if (targetPhone && whatsappService && whatsappService.status === 'READY') {
            try {
                const message = `Hare Krishna! Your ISKCON DMS password has been updated by the administrator.\n\nUsername: ${user.username}\nNew password: ${newPassword}\n\nPlease keep this safe.`;
                await whatsappService.sendMessage(targetPhone, message);
            } catch (msgErr) {
                console.warn('[Auth] Admin reset notification WhatsApp failed:', msgErr.message);
            }
        }

        res.json({
            success: true,
            message: `Password for ${user.fullName || user.username} has been reset successfully.`
        });
    } catch (err) {
        console.error('[Auth] adminResetUserPassword error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to reset user password' });
    }
};


