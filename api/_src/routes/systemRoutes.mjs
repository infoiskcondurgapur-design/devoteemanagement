import express from 'express';
import * as systemController from '../controllers/systemController.mjs';

const router = express.Router();

router.post('/logs', systemController.logSystemIssue);
router.get('/logs', systemController.getSystemLogs);
router.delete('/logs', systemController.clearSystemLogs);
router.put('/logs/:id/resolve', systemController.resolveSystemIssue);
router.get('/health', systemController.checkHealth);
router.post('/repair', systemController.runRepair);
router.get('/backup', systemController.getBackup);
router.post('/backup/csv', systemController.backupToCSV);
router.post('/restore', systemController.restore);

router.get('/settings', systemController.getSettings);
router.post('/settings', systemController.updateSettings);

router.get('/audit', systemController.getAuditLogs);
router.post('/audit', systemController.createAuditEntry);

export default router;
