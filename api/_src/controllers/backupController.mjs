import { getBackupData } from '../database.mjs';
import csvExportService from '../csv-export-service.mjs';
import oauthSheetsService from '../oauth-sheets-service.mjs';
import googleSheetsService from '../google-sheets-service.mjs';
import cloudBackupService from '../services/CloudBackupService.mjs';

export const listBackups = async (req, res) => {
    return res.json({ success: true, files: [] });
};

export const runManualBackup = async (req, res) => {
    try {
        const data = await getBackupData();
        const csvData = csvExportService.createBackup(data);
        res.json({ success: true, ...csvData });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

export const handleGoogleBackup = async (req, res) => {
    try {
        await oauthSheetsService.ensureInitialized();
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

export const getBackupFullData = async (req, res) => {
    try {
        const data = await getBackupData();
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

export const backupToCSVRaw = async (req, res) => {
    try {
        const data = await getBackupData();
        const csvData = csvExportService.createBackup(data);
        res.json({ success: true, ...csvData });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

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

export const getCloudBackupStatus = async (req, res) => {
    try {
        const report = await cloudBackupService.getStatusReport();
        res.json({ success: true, status: report });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

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

