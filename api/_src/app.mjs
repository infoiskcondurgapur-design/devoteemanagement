import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bodyParser from 'body-parser';

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

export const createApp = () => {
    const app = express();

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
