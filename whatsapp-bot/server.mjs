import express from 'express';
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env BEFORE any service module initializes (ESM import ordering matters)
import './env.mjs';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { initDb } from './database.mjs';
import whatsappService from './services/whatsappService.mjs';
import { uploadImageToCloudinary } from './cloudinary-service.mjs';
import automationService from './services/AutomationService.mjs';
import { initializeWs } from './services/wsService.mjs';
import { requireAuth, ensureAdmin } from './services/authService.mjs';
import { linkUserToDevotee, getUnlinkedDevotees } from './database.mjs';

// Routes
import devoteeRoutes from './routes/devoteeRoutes.mjs';
import eventRoutes from './routes/eventRoutes.mjs';
import sadhanaRoutes from './routes/sadhanaRoutes.mjs';
import systemRoutes from './routes/systemRoutes.mjs';
import whatsappRoutes from './routes/whatsappRoutes.mjs';
import authRoutes from './routes/authRoutes.mjs';
import sevaRoutes from './routes/sevaRoutes.mjs';
import financeRoutes from './routes/financeRoutes.mjs';
import backupRoutes from './routes/backupRoutes.mjs';
import oauthSheetsService from './oauth-sheets-service.mjs';
import courseRoutes from './routes/courseRoutes.mjs';
import tourRoutes from './routes/tourRoutes.mjs';
import inventoryRoutes from './routes/inventoryRoutes.mjs';
import changeRequestRoutes from './routes/changeRequestRoutes.mjs';
import attendanceRoutes from './routes/attendanceRoutes.mjs';
import counselingRoutes from './routes/counselingRoutes.mjs';
import publicRoutes from './routes/publicRoutes.mjs';
import userRoutes from './routes/userRoutes.mjs';
import { checkHealth, restore } from './controllers/systemController.mjs';

// Link unlinked devotees to user accounts and send credentials via WhatsApp
const linkUnlinkedDevotees = async () => {
    try {
        const unlinked = await getUnlinkedDevotees();
        if (unlinked.length === 0) {
            console.log('[Credentials] All devotees already linked.');
            return;
        }
        console.log(`[Credentials] Linking ${unlinked.length} unlinked devotees...`);
        let linked = 0;
        let failed = 0;
        for (const devotee of unlinked) {
            try {
                const result = await linkUserToDevotee(devotee.id, devotee);
                if (result.success) {
                    linked++;
                    try {
                        const message = `DMS Login Credentials\n\nYour username: ${devotee.contact}\nYour password: ${result.generatedPassword}\n\nLogin at the app. Contact admin if you have questions.`;
                        await whatsappService.sendMessage(devotee.contact, message);
                        console.log(`[Credentials] Sent login credentials to ${devotee.name} (${devotee.contact})`);
                    } catch (msgErr) {
                        console.warn(`[Credentials] Could not send WhatsApp to ${devotee.contact}:`, msgErr.message);
                    }
                } else {
                    failed++;
                }
            } catch (err) {
                console.error(`[Credentials] Failed for ${devotee.name}:`, err.message);
                failed++;
            }
        }
        console.log(`[Credentials] Linked ${linked} devotees, ${failed} failed.`);
    } catch (err) {
        console.error('[Credentials] Migration failed:', err.message);
    }
};

const app = express();
const port = process.env.PORT || 3001;
// Local-first: bind to loopback so the API is not exposed to the LAN.
const host = process.env.HOST || '127.0.0.1';

// Origin allowlist. Comma-separated via ALLOWED_ORIGINS (for web deployments), plus the
// always-allowed local origins (Vite dev server / Electron renderer / localhost).
const localOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3001',
    'http://127.0.0.1:3001'
];
const deployedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
    : [];
const allowedOrigins = [...new Set([...localOrigins, ...deployedOrigins])];
app.use(cors({
    origin(origin, cb) {
        // No origin header (curl, same-origin fetch) is allowed; browser origins must be allowlisted
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        return cb(null, false);
    }
}));

// Security headers with HSTS (Strict-Transport-Security)
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));
app.set('trust proxy', 1);

// Enforce HTTPS redirect if FORCE_HTTPS=1 or behind proxy in production
app.use((req, res, next) => {
    if (process.env.FORCE_HTTPS === '1') {
        const proto = req.headers['x-forwarded-proto'] || (req.socket.encrypted ? 'https' : 'http');
        const hostHeader = req.headers.host;
        const isLocal = hostHeader && (hostHeader.startsWith('localhost') || hostHeader.startsWith('127.0.0.1'));
        if (proto === 'http' && !isLocal) {
            return res.redirect(301, `https://${hostHeader}${req.originalUrl}`);
        }
    }
    next();
});

// Global rate limit (generous for local paginated loads, still blocks drive-by abuse).
// Windows/limits are env-tunable so operators can relax them on busy local installs
// and the regression suite can exercise the limiter deterministically.
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || (15 * 60 * 1000);
const globalLimiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    limit: process.env.RATE_LIMIT_GLOBAL_MAX ? parseInt(process.env.RATE_LIMIT_GLOBAL_MAX, 10) : 2000,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later.' }
});
app.use('/api', globalLimiter);

// Strict limiter for the public self-registration endpoint (open shareable form).
const publicRegisterLimiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    limit: process.env.RATE_LIMIT_PUBLIC_MAX ? parseInt(process.env.RATE_LIMIT_PUBLIC_MAX, 10) : 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, error: 'Too many registration attempts. Please try again later.' }
});
app.use('/api/public', publicRegisterLimiter);

app.use(bodyParser.json({ limit: '15mb' }));
app.use(bodyParser.urlencoded({ limit: '15mb', extended: true }));

// --- Public endpoints ---
app.get('/api/system/health', checkHealth);

// Auth gate: protect every /api route except the documented public set.
app.use((req, res, next) => {
    if (req.method === 'OPTIONS') return next();
    // Compare against the path only — the query string must never satisfy a public-path check.
    const p = (req.originalUrl || req.url || '').split('?')[0];
    const loginPath = req.method === 'POST' && (p.includes('/api/auth/login') || p.includes('/auth/login'));
    const forgotPath = req.method === 'POST' && (
        p.includes('/api/auth/forgot-password') || p.includes('/auth/forgot-password') ||
        p.includes('/api/auth/reset-password') || p.includes('/auth/reset-password')
    );
    const googlePath = p.includes('/api/auth/google') || p.includes('/auth/google');
    const healthPath = p.includes('/system/health');
    const publicPath = p.includes('/public/register');
    const bypassPath = p.includes('/api/auth/bypass') || p.includes('/auth/bypass');
    if (loginPath || forgotPath || googlePath || healthPath || publicPath || bypassPath) return next();
    return requireAuth(req, res, next);
});

app.use('/api/auth', authRoutes);

// --- API Routes ---
app.use('/api/devotees', devoteeRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/sadhana', sadhanaRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/seva', sevaRoutes);
app.use('/api/donations', financeRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/tours', tourRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/change-requests', changeRequestRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/counseling', counselingRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/users', userRoutes);
app.post('/api/restore', restore);

// --- Generic Upload API (kept for backward compatibility or simple uploads) ---
app.post('/api/upload', async (req, res) => {
    try {
        const { image } = req.body;
        if (!image) return res.status(400).json({ success: false, error: 'No image provided' });
        const url = await uploadImageToCloudinary(image);
        res.json({ success: true, url });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- Initialize Services ---
const start = async () => {
    try {
        await initDb();
        console.log('[System] Database initialized');

        try {
            await ensureAdmin();
        } catch (err) {
            console.error('[System] ensureAdmin failed:', err.message);
        }

        // Optional services must not prevent the API from starting (e.g. bot can't launch,
        // OAuth not yet configured). The app keeps working for CRUD; features degrade gracefully.
        if (process.env.DMS_DISABLE_WHATSAPP !== '1') {
            try {
                await whatsappService.initialize();
                console.log('[System] WhatsApp service initialized');
            } catch (err) {
                console.warn('[System] WhatsApp service failed to initialize (continuing without bot):', err.message);
            }
        }

        try {
            await oauthSheetsService.initialize();
            console.log('[System] Google Sheets OAuth service initialized');
        } catch (err) {
            console.warn('[System] Google Sheets OAuth init skipped:', err.message);
        }

        let server;
        const sslKeyPath = process.env.SSL_KEY_PATH;
        const sslCertPath = process.env.SSL_CERT_PATH;
        const hasSsl = Boolean(sslKeyPath && sslCertPath && fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath));

        if (hasSsl) {
            const sslOptions = {
                key: fs.readFileSync(sslKeyPath),
                cert: fs.readFileSync(sslCertPath),
                ...(process.env.SSL_CA_PATH && fs.existsSync(process.env.SSL_CA_PATH)
                    ? { ca: fs.readFileSync(process.env.SSL_CA_PATH) }
                    : {})
            };
            server = https.createServer(sslOptions, app);
        } else {
            server = http.createServer(app);
        }

        server.listen(port, host, () => {
            const proto = hasSsl ? 'https' : 'http';
            console.log(`[System] Server running on ${proto}://${host}:${port}${hasSsl ? ' (SSL/TLS Encrypted)' : ''}`);
            if (process.env.DMS_AUTH_BYPASS === '1') {
                console.warn('[Auth] *** DMS_AUTH_BYPASS=1 — dev bypass login ENABLED (no password required). Never enable in production. ***');
            }
            initializeWs(server);
            if (process.env.DMS_DISABLE_WHATSAPP !== '1') {
                automationService.initialize();
            }
        });

        // Credential linking: create user accounts for devotees without one
        linkUnlinkedDevotees().catch(err => {
            console.error('[System] Credential linking failed:', err.message);
        });
    } catch (err) {
        console.error('[System] Startup error:', err);
        process.exit(1);
    }
};

start();