import express from 'express';
import * as authController from '../controllers/authController.mjs';

const router = express.Router();

// Public: login + Google OAuth (callback is hit directly by Google's redirect)
router.post('/login', authController.login);
router.get('/bypass', authController.bypassStatus);
router.post('/bypass', authController.bypass);
router.get('/session', authController.session);
router.post('/logout', authController.logout);
router.post('/verify-password', authController.verifyPassword);
router.get('/google/status', authController.getGoogleStatus);
router.get('/google/url', authController.getGoogleUrl);
router.get('/google/callback', authController.googleCallback);

export default router;
