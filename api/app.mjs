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

    app.get('/api/system/health', (req, res) => {
        res.json({ success: true, status: 'healthy' });
    });

    app.use('/api/auth', authRoutes);
    app.use('/api/devotees', devoteeRoutes);
    app.use('/api/events', eventRoutes);
    app.use('/api/sadhana', sadhanaRoutes);
    app.use('/api/system', systemRoutes);
    app.use('/api/seva', sevaRoutes);
    app.use('/api/donations', financeRoutes);
    app.use('/api/finance', financeRoutes);
    app.use('/api/backup', backupRoutes);
    app.use('/api/courses', courseRoutes);
    app.use('/api/tours', tourRoutes);
    app.use('/api/inventory', inventoryRoutes);
    app.use('/api/attendance', attendanceRoutes);
    app.use('/api/counseling', counselingRoutes);

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

    // Catch-all for unmatched /api routes (helps Vercel health checks / 404s)
    app.use('/api', (req, res) => {
        res.status(404).json({ success: false, error: 'Not found' });
    });

    return app;
};

export default createApp;
