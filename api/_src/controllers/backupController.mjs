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
