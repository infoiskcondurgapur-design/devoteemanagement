import express from 'express';
import * as backupController from '../controllers/backupController.mjs';

const router = express.Router();

router.get('/', backupController.getBackupFullData);
router.get('/list', backupController.listBackups);
router.post('/run', backupController.runManualBackup);
router.post('/csv', backupController.backupToCSVRaw);
router.post('/google-sheets-oauth', backupController.handleGoogleBackup);
router.post('/google-sheets', backupController.handleServiceAccountBackup);
router.get('/cloud-status', backupController.getCloudBackupStatus);
router.post('/cloud-sync', backupController.runCloudSyncManual);
router.post('/dropbox-config', backupController.saveDropboxConfig);
router.post('/dropbox-sync', backupController.runDropboxSyncManual);
router.post('/dropbox-auto-sync', backupController.saveDropboxAutoSyncConfig);
router.post('/auto-sync-check', backupController.checkAndRunAutoSync);
router.get('/cron-sync', backupController.cronSync);
router.post('/cron-sync', backupController.cronSync);

export default router;

