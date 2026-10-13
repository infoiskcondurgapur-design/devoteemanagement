import { initDb } from './_src/database.mjs';
import { createApp } from './_src/app.mjs';
import { ensureAdmin } from './_src/services/authService.mjs';

// Ensure schema exists on cold start (idempotent). Best-effort: if the DB is
// already migrated, this is a no-op. Failures here should not block requests
// indefinitely, but we await to guarantee tables exist before serving.
const app = createApp();

initDb().then(async () => {
    console.log('[Vercel] Database initialized');
    try {
        await ensureAdmin();
    } catch (err) {
        console.error('[Vercel] ensureAdmin failed:', err.message);
    }
}).catch((err) => {
    console.error('[Vercel] initDb failed:', err.message);
});

export default app;
