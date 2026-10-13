import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import rateLimit from 'express-rate-limit';

import { uploadImageToCloudinary } from './cloudinary-service.mjs';

import devoteeRoutes from './routes/devoteeRoutes.mjs';
import eventRoutes from './routes/eventRoutes.mjs';
import sadhanaRoutes from './routes/sadhanaRoutes.mjs';
import systemRoutes from './routes/systemRoutes.mjs';
import authRoutes from './routes/authRoutes.mjs';
import sevaRoutes from './routes/sevaRoutes.mjs';
import financeRoutes from './routes/financeRoutes.mjs';
import backupRoutes from './routes/backupRoutes.mjs';
import courseRoutes from './routes/courseRoutes.mjs';
import tourRoutes from './routes/tourRoutes.mjs';
import inventoryRoutes from './routes/inventoryRoutes.mjs';
import attendanceRoutes from './routes/attendanceRoutes.mjs';
import counselingRoutes from './routes/counselingRoutes.mjs';
import changeRequestRoutes from './routes/changeRequestRoutes.mjs';
import publicRoutes from './routes/publicRoutes.mjs';
import { requireAuth } from './services/authService.mjs';

export const createApp = () => {
    const app = express();

    if (process.env.DMS_AUTH_BYPASS === '1') {
        console.warn('[Auth] *** DMS_AUTH_BYPASS=1 — dev bypass login ENABLED (no password required). Never enable in production. ***');
    }

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
            if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
            return cb(null, false);
        }
    }));

    app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
    app.set('trust proxy', 1);

    app.use(bodyParser.json({ limit: '15mb' }));
    app.use(bodyParser.urlencoded({ limit: '15mb', extended: true }));

    // Middleware to normalize req.url for Vercel serverless rewrites
    app.use((req, res, next) => {
        if (!req.url.startsWith('/api')) {
            req.url = '/api' + (req.url.startsWith('/') ? '' : '/') + req.url;
        }
        next();
    });

    app.get(['/api/system/health', '/system/health'], (req, res) => {
        res.json({ success: true, status: 'healthy' });
    });

    // Strict limiter for the public self-registration endpoint (open shareable form).
    const publicRegisterLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: process.env.RATE_LIMIT_PUBLIC_MAX ? parseInt(process.env.RATE_LIMIT_PUBLIC_MAX, 10) : 10,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        message: { success: false, error: 'Too many registration attempts. Please try again later.' }
    });
    app.use(['/api/public', '/public'], publicRegisterLimiter);

    // Auth gate: protect every /api route except the documented public set.
    app.use((req, res, next) => {
        if (req.method === 'OPTIONS') return next();
        // Compare against the path only — the query string must never satisfy a public-path check.
        const p = (req.originalUrl || req.url || '').split('?')[0];
        const loginPath = req.method === 'POST' && (p.includes('/api/auth/login') || p.includes('/auth/login'));
        const googlePath = p.includes('/api/auth/google') || p.includes('/auth/google');
        const healthPath = p.includes('/system/health');
        const publicPath = p.includes('/public/register');
        const bypassPath = p.includes('/api/auth/bypass') || p.includes('/auth/bypass');
        if (loginPath || googlePath || healthPath || publicPath || bypassPath) return next();
        return requireAuth(req, res, next);
    });

    app.use(['/api/auth', '/auth'], authRoutes);
    app.use(['/api/devotees', '/devotees'], devoteeRoutes);
    app.use(['/api/events', '/events'], eventRoutes);
    app.use(['/api/sadhana', '/sadhana'], sadhanaRoutes);
    app.use(['/api/system', '/system'], systemRoutes);
    app.use(['/api/seva', '/seva'], sevaRoutes);
    app.use(['/api/donations', '/donations'], financeRoutes);
    app.use(['/api/finance', '/finance'], financeRoutes);
    app.use(['/api/backup', '/backup'], backupRoutes);
    app.use(['/api/courses', '/courses'], courseRoutes);
    app.use(['/api/tours', '/tours'], tourRoutes);
    app.use(['/api/inventory', '/inventory'], inventoryRoutes);
    app.use(['/api/attendance', '/attendance'], attendanceRoutes);
    app.use(['/api/counseling', '/counseling'], counselingRoutes);
    app.use(['/api/change-requests', '/change-requests'], changeRequestRoutes);
    app.use(['/api/public', '/public'], publicRoutes);

    app.post(['/api/upload', '/upload'], async (req, res) => {
        try {
            const { image } = req.body;
            if (!image) return res.status(400).json({ success: false, error: 'No image provided' });
            const url = await uploadImageToCloudinary(image);
            res.json({ success: true, url });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Catch-all for unmatched /api routes
    app.use(['/api', '/'], (req, res) => {
        res.status(404).json({ success: false, error: 'Not found' });
    });

    return app;
};

export default createApp;
