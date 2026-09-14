import oauthSheetsService from '../oauth-sheets-service.mjs';

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
