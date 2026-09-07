import express from 'express';
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
import { checkHealth } from './controllers/systemController.mjs';

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

// Security headers (CSP disabled: inline scripts are needed by the OAuth callback/popup pages)
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.set('trust proxy', 1);

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

app.use(bodyParser.json({ limit: '15mb' }));
app.use(bodyParser.urlencoded({ limit: '15mb', extended: true }));

// --- Public endpoints ---
app.get('/api/system/health', checkHealth);
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

        const server = app.listen(port, host, () => {
            console.log(`[System] Server running on http://${host}:${port}`);
            initializeWs(server);
            if (process.env.DMS_DISABLE_WHATSAPP !== '1') {
                automationService.initialize();
            }
        });
    } catch (err) {
        console.error('[System] Startup error:', err);
        process.exit(1);
    }
};

start();