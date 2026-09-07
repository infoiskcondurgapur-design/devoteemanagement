import {
    logIssue, getIssues, clearIssues, resolveIssue, healSchema, getDevotees, getBackupData, restoreFromBackup,
    getSettings as dbGetSettings, updateSetting, logAudit, getAuditLogs as dbGetAuditLogs
} from '../database.mjs';
import csvExportService from '../csv-export-service.mjs';

export const logSystemIssue = async (req, res) => {
    try {
        const { type, source, message, stack } = req.body;
        const result = await logIssue(type, source, message, stack);
        res.json({ success: true, id: result.id });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

export const getSystemLogs = async (req, res) => {
    try {
        const unresolved = req.query.unresolved === 'true';
        const logs = await getIssues(unresolved);
        res.json({ success: true, data: logs });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

export const clearSystemLogs = async (req, res) => {
    try {
        await clearIssues();
        res.json({ success: true, message: 'All logs cleared' });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

export const resolveSystemIssue = async (req, res) => {
    try {
        await resolveIssue(req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

export const checkHealth = async (req, res) => {
    try {
        await getDevotees(1, 0);
        res.json({
            success: true,
            status: 'healthy'
        });
    } catch (err) { res.status(500).json({ success: false, status: 'unhealthy', error: err.message }); }
};

export const runRepair = async (req, res) => {
    try {
        await healSchema();
        res.json({ success: true, message: 'Repair routines completed' });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

export const getBackup = async (req, res) => {
    try {
        const data = await getBackupData();
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const backupToCSV = async (req, res) => {
    try {
        const data = await getBackupData();
        const csvData = csvExportService.createBackup(data);
        res.json({ success: true, ...csvData });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const restore = async (req, res) => {
    try {
        const backupData = req.body;
        if (!backupData || !backupData.devotees) {
            return res.status(400).json({ success: false, error: 'Invalid backup data format' });
        }
        const result = await restoreFromBackup(backupData);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getSettings = async (req, res) => {
    try {
        const settings = await dbGetSettings();
        res.json({ success: true, data: settings });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

export const updateSettings = async (req, res) => {
    try {
        const updates = req.body;
        for (const [key, value] of Object.entries(updates)) {
            await updateSetting(key, String(value));
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

export const getAuditLogs = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const logs = await dbGetAuditLogs(limit);
        res.json({ success: true, data: logs });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

export const createAuditEntry = async (req, res) => {
    try {
        const { userId, userName, action, details } = req.body;
        const result = await logAudit(userId, userName, action, details);
        res.json({ success: true, id: result.id });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};
