import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getBackupData } from '../database.mjs';
import csvExportService from '../csv-export-service.mjs';
import oauthSheetsService from '../oauth-sheets-service.mjs';
import googleSheetsService from '../google-sheets-service.mjs';
import cloudBackupService from '../services/CloudBackupService.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKUPS_DIR = path.join(__dirname, '../../backups');

/**
 * List all local backup files
 */
export const listBackups = async (req, res) => {
    try {
        if (!fs.existsSync(BACKUPS_DIR)) {
            return res.json({ success: true, files: [] });
        }
        
        const files = fs.readdirSync(BACKUPS_DIR)
            .filter(file => file.endsWith('.csv') || file.endsWith('.json'))
            .sort((a, b) => {
                const statA = fs.statSync(path.join(BACKUPS_DIR, a));
                const statB = fs.statSync(path.join(BACKUPS_DIR, b));
                return statB.mtime.getTime() - statA.mtime.getTime();
            });
            
        res.json({ success: true, files });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * Run a manual CSV backup
 */
export const runManualBackup = async (req, res) => {
    try {
        const data = await getBackupData();
        const csvData = csvExportService.createBackup(data);
        const paths = csvExportService.saveToFiles(csvData, BACKUPS_DIR);
        
        res.json({ 
            success: true, 
            filename: path.basename(paths.devoteesPath),
            paths 
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * Sync data to Google Sheets via OAuth
 */
export const handleGoogleBackup = async (req, res) => {
    try {
        if (!oauthSheetsService.isAuthenticated()) {
            return res.status(401).json({ success: false, error: 'Google account not connected' });
        }
        
        const data = await getBackupData();
        const result = await oauthSheetsService.createBackupSpreadsheet(data);
        
        res.json({ 
            success: true, 
            title: result.title,
            spreadsheetUrl: result.spreadsheetUrl,
            spreadsheetId: result.spreadsheetId
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * Get full backup data (used by Electron auto-backup)
 */
export const getBackupFullData = async (req, res) => {
    try {
        const data = await getBackupData();
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * Generate and return CSV data (used by Electron manual CSV backup)
 */
export const backupToCSVRaw = async (req, res) => {
    try {
        const data = await getBackupData();
        const csvData = csvExportService.createBackup(data);
        res.json({
            success: true,
            ...csvData
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * Sync data to Google Sheets via Service Account
 */
export const handleServiceAccountBackup = async (req, res) => {
    try {
        const data = await getBackupData();
        const result = await googleSheetsService.createBackupSpreadsheet(data);
        
        res.json({ 
            success: true, 
            title: result.title,
            spreadsheetUrl: result.spreadsheetUrl,
            spreadsheetId: result.spreadsheetId
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * Get S3 & Dropbox backup configuration & execution status
 */
export const getCloudBackupStatus = async (req, res) => {
    try {
        const report = await cloudBackupService.getStatusReport();
        res.json({ success: true, status: report });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * Manually trigger a backup upload to configured S3/Dropbox
 */
export const runCloudSyncManual = async (req, res) => {
    try {
        const results = await cloudBackupService.syncAllClouds(true);
        res.json({ success: true, results });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * Save Dropbox configuration (Access Token or Refresh Token + App Key/Secret)
 */
export const saveDropboxConfig = async (req, res) => {
    try {
        const { updateSetting } = await import('../database.mjs');
        const { accessToken, refreshToken, appKey, appSecret, clear } = req.body || {};
        if (clear) {
            await updateSetting('dropbox_access_token', '');
            await updateSetting('dropbox_refresh_token', '');
            await updateSetting('dropbox_app_key', '');
            await updateSetting('dropbox_app_secret', '');
            const report = await cloudBackupService.getStatusReport();
            return res.json({ success: true, message: 'Dropbox credentials cleared', status: report });
        }

        if (accessToken !== undefined) {
            await updateSetting('dropbox_access_token', (accessToken || '').trim());
        }
        if (refreshToken !== undefined) {
            await updateSetting('dropbox_refresh_token', (refreshToken || '').trim());
        }
        if (appKey !== undefined) {
            await updateSetting('dropbox_app_key', (appKey || '').trim());
        }
        if (appSecret !== undefined) {
            await updateSetting('dropbox_app_secret', (appSecret || '').trim());
        }

        const report = await cloudBackupService.getStatusReport();
        res.json({ success: true, message: 'Dropbox settings saved successfully', status: report });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * Specifically run Dropbox backup sync
 */
export const runDropboxSyncManual = async (req, res) => {
    try {
        const result = await cloudBackupService.syncDropboxOnly(true);
        res.json({ success: true, result });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * Configure Dropbox Auto-Sync toggle & interval
 */
export const saveDropboxAutoSyncConfig = async (req, res) => {
    try {
        const { updateSetting } = await import('../database.mjs');
        const { enabled, intervalMinutes } = req.body || {};

        if (enabled !== undefined) {
            await updateSetting('dropbox_auto_sync', enabled ? 'true' : 'false');
        }
        if (intervalMinutes !== undefined) {
            const parsed = parseInt(intervalMinutes, 10);
            if (!isNaN(parsed) && parsed > 0) {
                await updateSetting('dropbox_auto_sync_interval', String(parsed));
            }
        }

        const report = await cloudBackupService.getStatusReport();
        res.json({
            success: true,
            message: `Dropbox auto-sync ${enabled ? 'enabled' : 'disabled'}`,
            status: report
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * Check if Dropbox auto-sync is due, and run if needed (used by client-side or scheduled triggers)
 */
export const checkAndRunAutoSync = async (req, res) => {
    try {
        const { getSettings, updateSetting } = await import('../database.mjs');
        const settings = await getSettings();

        if (!cloudBackupService.isDropboxConfigured(settings)) {
            return res.json({ success: true, synced: false, message: 'Dropbox is not configured' });
        }

        const enabled = settings.dropbox_auto_sync !== 'false';
        if (!enabled) {
            return res.json({ success: true, synced: false, message: 'Dropbox auto-sync is disabled' });
        }

        const intervalMinutes = parseInt(settings.dropbox_auto_sync_interval, 10) || 60;
        const lastBackup = settings.last_dropbox_backup_time ? new Date(settings.last_dropbox_backup_time).getTime() : 0;
        const elapsed = Date.now() - lastBackup;
        const isDue = elapsed >= intervalMinutes * 60 * 1000;

        if (!isDue && lastBackup > 0) {
            const remainingMins = Math.max(1, Math.round((intervalMinutes * 60 * 1000 - elapsed) / 60000));
            return res.json({
                success: true,
                synced: false,
                message: `Auto-sync not due yet (~${remainingMins}m remaining)`
            });
        }

        console.log('[Dropbox Auto-Sync] Auto-sync triggered via check endpoint...');
        const result = await cloudBackupService.syncDropboxOnly(false);
        const timestamp = new Date().toISOString();
        await updateSetting('last_dropbox_auto_sync_time', timestamp);

        return res.json({
            success: true,
            synced: true,
            result,
            message: `Dropbox auto-sync completed successfully (${result.sizeFormatted})`
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * Endpoint for cron triggers (e.g. Vercel Cron or local scheduler)
 */
export const cronSync = async (req, res) => {
    try {
        const cronSecret = process.env.CRON_SECRET;
        if (cronSecret && req.headers['authorization'] !== `Bearer ${cronSecret}`) {
            return res.status(401).json({ success: false, error: 'Unauthorized cron request' });
        }
        const { getSettings, updateSetting } = await import('../database.mjs');
        const settings = await getSettings();
        if (!cloudBackupService.isDropboxConfigured(settings) || settings.dropbox_auto_sync === 'false') {
            return res.json({ success: true, skipped: true, reason: 'Not configured or disabled' });
        }

        const result = await cloudBackupService.syncDropboxOnly(false);
        await updateSetting('last_dropbox_auto_sync_time', new Date().toISOString());
        return res.json({ success: true, synced: true, result });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};



