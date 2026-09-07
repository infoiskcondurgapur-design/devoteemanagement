import express from 'express';
import * as authController from '../controllers/authController.mjs';

const router = express.Router();

// Public: Google OAuth (callback is hit directly by Google's redirect)
router.get('/google/status', authController.getGoogleStatus);
router.get('/google/url', authController.getGoogleUrl);
router.get('/google/callback', authController.googleCallback);

export default router;
