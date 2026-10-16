import express from 'express';
import * as authController from '../controllers/authController.mjs';

const router = express.Router();

// Public: login + Google OAuth (callback is hit directly by Google's redirect)
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/bypass', authController.bypassStatus);
router.post('/bypass', authController.bypass);
router.get('/session', authController.session);
router.post('/logout', authController.logout);
router.post('/change-password', authController.changePassword);
router.post('/admin-reset-password', authController.adminResetUserPassword);
router.post('/verify-password', authController.verifyPassword);
router.get('/google/status', authController.getGoogleStatus);
router.get('/google/url', authController.getGoogleUrl);
router.get('/google/callback', authController.googleCallback);

export default router;
