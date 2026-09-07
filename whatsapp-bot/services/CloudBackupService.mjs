import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { dbPath, updateSetting, getSettings, logIssue } from '../database.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
     * Check if Dropbox backup is configured in env
     * @returns {boolean}
     */
    isDropboxConfigured() {
        return !!(
            process.env.DROPBOX_REFRESH_TOKEN &&
            process.env.DROPBOX_APP_KEY &&
            process.env.DROPBOX_APP_SECRET
        ) || !!process.env.DROPBOX_ACCESS_TOKEN;
    }

    /**
     * Refresh Dropbox Access Token using OAuth refresh token flow
     * @returns {Promise<string>} Access Token
     */
    async getDropboxAccessToken() {
        if (process.env.DROPBOX_ACCESS_TOKEN && !process.env.DROPBOX_REFRESH_TOKEN) {
            console.log('[Cloud Backup] Using legacy static Dropbox Access Token.');
            return process.env.DROPBOX_ACCESS_TOKEN;
        }

        console.log('[Cloud Backup] Refreshing Dropbox access token...');
        const url = 'https://api.dropbox.com/oauth2/token';
        const params = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: process.env.DROPBOX_REFRESH_TOKEN,
            client_id: process.env.DROPBOX_APP_KEY,
            client_secret: process.env.DROPBOX_APP_SECRET
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
     */
    async uploadToDropbox(fileName, fileBuffer) {
        if (!this.isDropboxConfigured()) {
            throw new Error('Dropbox is not configured in environment variables');
        }

        console.log(`[Cloud Backup] Uploading to Dropbox as: ${fileName}...`);
        const accessToken = await this.getDropboxAccessToken();
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
            throw new Error(`Dropbox upload API error: ${errText}`);
        }

        await response.json();
        console.log('[Cloud Backup] Dropbox upload completed successfully.');
    }

    /**
     * Run disaster recovery backup sync for configured clouds
     * @param {boolean} manual - Whether this was manually triggered via UI
     * @returns {Promise<Object>} Status report of the sync
     */
    async syncAllClouds(manual = false) {
        const results = {
            s3: { attempted: false, success: false, error: null },
            dropbox: { attempted: false, success: false, error: null }
        };

        try {
            if (!fs.existsSync(dbPath)) {
                throw new Error(`Database file not found at path: ${dbPath}`);
            }

            console.log(`[Cloud Backup] Reading database file from ${dbPath}...`);
            const fileBuffer = fs.readFileSync(dbPath);
            
            // Format: devotee_mgmt_backup_YYYY-MM-DD_HHMMSS.db
            const dateStr = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('-').slice(0, 5).join('-') + 'Z';
            const filename = `devotee_mgmt_backup_${dateStr}.db`;

            // AWS S3 Sync
            if (this.isS3Configured()) {
                results.s3.attempted = true;
                try {
                    await this.uploadToS3(`backups/${filename}`, fileBuffer);
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
            if (this.isDropboxConfigured()) {
                results.dropbox.attempted = true;
                try {
                    await this.uploadToDropbox(filename, fileBuffer);
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

    /**
     * Compile status reports for cloud integrations
     * @returns {Promise<Object>} Status report JSON
     */
    async getStatusReport() {
        const settings = await getSettings();
        
        return {
            s3: {
                configured: this.isS3Configured(),
                bucket: process.env.AWS_BUCKET_NAME || null,
                region: process.env.AWS_REGION || null,
                lastBackupTime: settings.last_s3_backup_time || null,
                lastBackupStatus: settings.last_s3_backup_status || 'Never run'
            },
            dropbox: {
                configured: this.isDropboxConfigured(),
                folderPath: '/DMS_Backups/',
                lastBackupTime: settings.last_dropbox_backup_time || null,
                lastBackupStatus: settings.last_dropbox_backup_status || 'Never run'
            }
        };
    }
}

export default new CloudBackupService();
