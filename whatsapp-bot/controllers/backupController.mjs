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

