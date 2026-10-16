import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { dbPath, updateSetting, getSettings, logIssue, getBackupData } from '../database.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

class CloudBackupService {
    /**
     * Check if AWS S3 backup is configured in env
     * @returns {boolean}
     */
    isS3Configured() {
        return !!(
            process.env.AWS_ACCESS_KEY_ID &&
            process.env.AWS_SECRET_ACCESS_KEY &&
            process.env.AWS_BUCKET_NAME &&
            process.env.AWS_REGION
        );
    }

    /**
     * Check if Dropbox backup is configured in env or settings
     * @param {Object} [settings]
     * @returns {boolean}
     */
    isDropboxConfigured(settings = null) {
        const hasStatic = !!(settings?.dropbox_access_token || process.env.DROPBOX_ACCESS_TOKEN);
        const hasRefresh = !!(
            (settings?.dropbox_refresh_token || process.env.DROPBOX_REFRESH_TOKEN) &&
            (settings?.dropbox_app_key || process.env.DROPBOX_APP_KEY) &&
            (settings?.dropbox_app_secret || process.env.DROPBOX_APP_SECRET)
        );
        return hasStatic || hasRefresh;
    }

    /**
     * Refresh Dropbox Access Token using OAuth refresh token flow or return static token
     * @param {Object} [settings]
     * @returns {Promise<string>} Access Token
     */
    async getDropboxAccessToken(settings = null) {
        if (!settings) {
            try { settings = await getSettings(); } catch { settings = {}; }
        }
        const staticToken = settings?.dropbox_access_token || process.env.DROPBOX_ACCESS_TOKEN;
        const refreshToken = settings?.dropbox_refresh_token || process.env.DROPBOX_REFRESH_TOKEN;
        const appKey = settings?.dropbox_app_key || process.env.DROPBOX_APP_KEY;
        const appSecret = settings?.dropbox_app_secret || process.env.DROPBOX_APP_SECRET;

        // If we have static token and no complete refresh flow credentials, use it
        if (staticToken && (!refreshToken || !appKey || !appSecret)) {
            console.log('[Cloud Backup] Using Dropbox Access Token.');
            return staticToken;
        }

        // If complete refresh flow credentials exist, obtain a fresh token
        if (refreshToken && appKey && appSecret) {
            console.log('[Cloud Backup] Refreshing Dropbox access token...');
            const url = 'https://api.dropbox.com/oauth2/token';
            const params = new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: appKey,
                client_secret: appSecret
            });

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params.toString()
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Failed to refresh Dropbox token: ${errText}`);
            }

            const data = await response.json();
            return data.access_token;
        }

        if (staticToken) {
            return staticToken;
        }

        throw new Error('Dropbox is not configured. Please provide a Dropbox Access Token or App Credentials in Settings.');
    }

    /**
     * Check remaining storage quota on the connected Dropbox account
     * @param {Object} [settings]
     * @returns {Promise<Object|null>}
     */
    async getDropboxSpace(settings = null) {
        try {
            if (!settings) settings = await getSettings();
            if (!this.isDropboxConfigured(settings)) return null;
            const accessToken = await this.getDropboxAccessToken(settings);
            const response = await fetch('https://api.dropbox.com/2/users/get_space_usage', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) return null;
            const data = await response.json();
            const used = data.used || 0;
            const allocated = data.allocation?.allocated || data.allocation?.team?.allocated || 0;
            const free = Math.max(0, allocated - used);
            return {
                usedBytes: used,
                allocatedBytes: allocated,
                freeBytes: free,
                usedFormatted: formatBytes(used),
                allocatedFormatted: formatBytes(allocated),
                freeFormatted: formatBytes(free),
                percentUsed: allocated > 0 ? Math.round((used / allocated) * 100) : 0,
                isFull: allocated > 0 && used >= allocated
            };
        } catch {
            return null;
        }
    }

    /**
     * Upload a file to Amazon S3
     * @param {string} keyName - S3 target filename/path
     * @param {Buffer} fileBuffer - Binary content
     */
    async uploadToS3(keyName, fileBuffer) {
        if (!this.isS3Configured()) {
            throw new Error('S3 is not configured in environment variables');
        }

        console.log(`[Cloud Backup] Uploading to S3 bucket ${process.env.AWS_BUCKET_NAME} as key: ${keyName}...`);
        
        const s3Client = new S3Client({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
        });

        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: keyName,
            Body: fileBuffer,
            ContentType: 'application/octet-stream'
        });

        await s3Client.send(command);
        console.log('[Cloud Backup] S3 upload completed successfully.');
    }

    /**
     * Upload a file to Dropbox
     * @param {string} fileName - Destination filename in Dropbox
     * @param {Buffer} fileBuffer - Binary content
     * @param {Object} [settings]
     */
    async uploadToDropbox(fileName, fileBuffer, settings = null) {
        if (!settings) {
            try { settings = await getSettings(); } catch { settings = {}; }
        }
        if (!this.isDropboxConfigured(settings)) {
            throw new Error('Dropbox is not configured. Please configure credentials in Settings.');
        }

        console.log(`[Cloud Backup] Uploading to Dropbox as: ${fileName}...`);
        const accessToken = await this.getDropboxAccessToken(settings);
        const url = 'https://content.dropboxapi.com/2/files/upload';

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Dropbox-API-Arg': JSON.stringify({
                    path: `/DMS_Backups/${fileName}`,
                    mode: 'overwrite',
                    autorename: false,
                    mute: true
                }),
                'Content-Type': 'application/octet-stream'
            },
            body: fileBuffer
        });

        if (!response.ok) {
            const errText = await response.text();
            let parsed = null;
            try { parsed = JSON.parse(errText); } catch { }
            const summary = parsed?.error_summary || '';
            const reasonTag = parsed?.error?.reason?.['.tag'] || '';

            if (summary.includes('insufficient_space') || reasonTag === 'insufficient_space') {
                const space = await this.getDropboxSpace(settings);
                const spaceInfo = space ? ` (Account space: ${space.usedFormatted} used of ${space.allocatedFormatted})` : '';
                throw new Error(`Your Dropbox account storage is FULL${spaceInfo}. Please delete files or empty the Deleted Files / Trash on dropbox.com to free up space, or connect an account with available space.`);
            }
            if (summary.includes('invalid_access_token') || summary.includes('expired_access_token')) {
                throw new Error('Dropbox access token is expired or invalid. Please generate a new access token in your Dropbox Console and update Settings.');
            }
            throw new Error(`Dropbox upload API error: ${summary || errText}`);
        }

        const data = await response.json();
        console.log('[Cloud Backup] Dropbox upload completed successfully:', data.path_display);
        return data;
    }

    /**
     * Specifically trigger a backup upload to Dropbox only (compressed with gzip)
     * @param {boolean} manual - Whether this was manually triggered via UI
     * @returns {Promise<Object>} Result details
     */
    async syncDropboxOnly(manual = true) {
        const settings = await getSettings();
        if (!this.isDropboxConfigured(settings)) {
            throw new Error('Dropbox is not configured. Please configure your Dropbox Access Token in Settings.');
        }

        let fileBuffer;
        let filename;
        let rawLen = 0;
        const dateStr = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('-').slice(0, 5).join('-') + 'Z';

        if (dbPath && fs.existsSync(dbPath)) {
            console.log(`[Cloud Backup] Reading database file from ${dbPath}...`);
            const rawDb = fs.readFileSync(dbPath);
            rawLen = rawDb.length;
            fileBuffer = zlib.gzipSync(rawDb);
            filename = `devotee_mgmt_backup_${dateStr}.db.gz`;
        } else {
            console.log('[Cloud Backup] dbPath unavailable, exporting JSON snapshot...');
            const backupData = await getBackupData();
            const rawJson = Buffer.from(JSON.stringify(backupData, null, 2), 'utf8');
            rawLen = rawJson.length;
            fileBuffer = zlib.gzipSync(rawJson);
            filename = `devotee_mgmt_backup_${dateStr}.json.gz`;
        }

        try {
            const uploadRes = await this.uploadToDropbox(filename, fileBuffer, settings);
            const now = new Date().toISOString();
            await updateSetting('last_dropbox_backup_time', now);
            await updateSetting('last_dropbox_backup_status', 'Success');

            // Prune older backups in the background to prevent Dropbox from running out of space
            this.pruneOldDropboxBackups(10, settings).catch(pruneErr => {
                console.warn('[Cloud Backup] Dropbox retention pruning note (non-fatal):', pruneErr.message);
            });

            return {
                success: true,
                filename,
                path: uploadRes?.path_display || `/DMS_Backups/${filename}`,
                size: fileBuffer.length,
                sizeFormatted: formatBytes(fileBuffer.length),
                rawSizeFormatted: formatBytes(rawLen),
                timestamp: now
            };
        } catch (dbxErr) {
            console.error('[Cloud Backup] Dropbox Sync Error:', dbxErr);
            await updateSetting('last_dropbox_backup_status', `Failed: ${dbxErr.message}`);
            await logIssue('error', 'cloud-backup-dropbox', `Dropbox Sync failed: ${dbxErr.message}`, dbxErr.stack);
            throw dbxErr;
        }
    }

    /**
     * Keep the most recent backups in Dropbox and prune older ones to avoid insufficient space
     * @param {number} maxKeep - Number of recent snapshots to retain (default 10)
     * @param {Object} [settings]
     */
    async pruneOldDropboxBackups(maxKeep = 10, settings = null) {
        try {
            if (!settings) settings = await getSettings();
            if (!this.isDropboxConfigured(settings)) return;
            const accessToken = await this.getDropboxAccessToken(settings);

            const listUrl = 'https://api.dropboxapi.com/2/files/list_folder';
            const listRes = await fetch(listUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ path: '/DMS_Backups' })
            });

            if (!listRes.ok) return;
            const listData = await listRes.json();
            const entries = (listData.entries || [])
                .filter(item => item['.tag'] === 'file' && item.name.startsWith('devotee_mgmt_backup_'))
                .sort((a, b) => new Date(b.server_modified || 0) - new Date(a.server_modified || 0));

            if (entries.length > maxKeep) {
                const toDelete = entries.slice(maxKeep);
                console.log(`[Cloud Backup] Pruning ${toDelete.length} old Dropbox backup snapshots to preserve space...`);
                for (const item of toDelete) {
                    try {
                        await fetch('https://api.dropboxapi.com/2/files/delete_v2', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ path: item.path_lower })
                        });
                        console.log(`[Cloud Backup] Removed old Dropbox backup: ${item.name}`);
                    } catch (delErr) {
                        console.warn(`[Cloud Backup] Could not delete old backup ${item.name}:`, delErr.message);
                    }
                }
            }
        } catch (err) {
            console.warn('[Cloud Backup] pruneOldDropboxBackups warning:', err.message);
        }
    }

    /**
     * Run disaster recovery backup sync for configured clouds
     * @param {boolean} manual - Whether this was manually triggered via UI
     * @returns {Promise<Object>} Status report of the sync
     */
    async syncAllClouds(manual = false) {
        const settings = await getSettings();
        const results = {
            s3: { attempted: false, success: false, error: null },
            dropbox: { attempted: false, success: false, error: null }
        };

        try {
            let fileBuffer;
            let dbFilename;
            const dateStr = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('-').slice(0, 5).join('-') + 'Z';

            if (dbPath && fs.existsSync(dbPath)) {
                console.log(`[Cloud Backup] Reading database file from ${dbPath}...`);
                const rawDb = fs.readFileSync(dbPath);
                fileBuffer = zlib.gzipSync(rawDb);
                dbFilename = `devotee_mgmt_backup_${dateStr}.db.gz`;
            } else {
                console.log('[Cloud Backup] dbPath unavailable, exporting JSON snapshot...');
                const backupData = await getBackupData();
                const rawJson = Buffer.from(JSON.stringify(backupData, null, 2), 'utf8');
                fileBuffer = zlib.gzipSync(rawJson);
                dbFilename = `devotee_mgmt_backup_${dateStr}.json.gz`;
            }

            // AWS S3 Sync
            if (this.isS3Configured()) {
                results.s3.attempted = true;
                try {
                    await this.uploadToS3(`backups/${dbFilename}`, fileBuffer);
                    results.s3.success = true;
                    await updateSetting('last_s3_backup_time', new Date().toISOString());
                    await updateSetting('last_s3_backup_status', 'Success');
                } catch (s3Err) {
                    console.error('[Cloud Backup] AWS S3 Sync Error:', s3Err);
                    results.s3.error = s3Err.message;
                    await updateSetting('last_s3_backup_status', `Failed: ${s3Err.message}`);
                    await logIssue('error', 'cloud-backup-s3', `S3 Sync failed: ${s3Err.message}`, s3Err.stack);
                }
            } else {
                console.log('[Cloud Backup] AWS S3 is not configured. Skipping S3 upload.');
            }

            // Dropbox Sync
            if (this.isDropboxConfigured(settings)) {
                results.dropbox.attempted = true;
                try {
                    await this.uploadToDropbox(dbFilename, fileBuffer, settings);
                    results.dropbox.success = true;
                    await updateSetting('last_dropbox_backup_time', new Date().toISOString());
                    await updateSetting('last_dropbox_backup_status', 'Success');
                } catch (dbxErr) {
                    console.error('[Cloud Backup] Dropbox Sync Error:', dbxErr);
                    results.dropbox.error = dbxErr.message;
                    await updateSetting('last_dropbox_backup_status', `Failed: ${dbxErr.message}`);
                    await logIssue('error', 'cloud-backup-dropbox', `Dropbox Sync failed: ${dbxErr.message}`, dbxErr.stack);
                }
            } else {
                console.log('[Cloud Backup] Dropbox is not configured. Skipping Dropbox upload.');
            }

        } catch (globalErr) {
            console.error('[Cloud Backup] Global Backup Execution Failure:', globalErr);
            await logIssue('error', 'cloud-backup-global', globalErr.message, globalErr.stack);
            throw globalErr;
        }

        return results;
    }

    async getStatusReport() {
        const settings = await getSettings();
        const configured = this.isDropboxConfigured(settings);
        const space = configured ? await this.getDropboxSpace(settings) : null;
        const autoSyncEnabled = settings.dropbox_auto_sync !== 'false';
        const autoSyncIntervalMinutes = parseInt(settings.dropbox_auto_sync_interval, 10) || 60;
        const lastBackupTime = settings.last_dropbox_backup_time || null;
        let nextSyncTime = null;
        if (autoSyncEnabled && configured) {
            if (lastBackupTime) {
                const nextDate = new Date(new Date(lastBackupTime).getTime() + autoSyncIntervalMinutes * 60 * 1000);
                nextSyncTime = nextDate.toISOString();
            } else {
                nextSyncTime = new Date().toISOString();
            }
        }

        return {
            s3: {
                configured: this.isS3Configured(),
                bucket: process.env.AWS_BUCKET_NAME || null,
                region: process.env.AWS_REGION || null,
                lastBackupTime: settings.last_s3_backup_time || null,
                lastBackupStatus: settings.last_s3_backup_status || 'Never run'
            },
            dropbox: {
                configured,
                hasToken: !!(settings.dropbox_access_token || process.env.DROPBOX_ACCESS_TOKEN),
                hasRefreshToken: !!(settings.dropbox_refresh_token || process.env.DROPBOX_REFRESH_TOKEN),
                folderPath: '/DMS_Backups/',
                space,
                autoSyncEnabled,
                autoSyncIntervalMinutes,
                lastAutoSyncTime: settings.last_dropbox_auto_sync_time || null,
                nextSyncTime,
                lastBackupTime,
                lastBackupStatus: settings.last_dropbox_backup_status || 'Never run'
            }
        };
    }
}

export default new CloudBackupService();


