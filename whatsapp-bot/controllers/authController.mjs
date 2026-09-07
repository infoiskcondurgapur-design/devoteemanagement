import oauthSheetsService from '../oauth-sheets-service.mjs';

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
