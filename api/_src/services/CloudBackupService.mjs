import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { updateSetting, getSettings, logIssue } from '../database.mjs';
import { getBackupData } from '../database.mjs';

/**
 * Cloud Backup Service (serverless-safe)
 * Uploads JSON backup data (not SQLite file) to S3 / Dropbox.
 */
class CloudBackupService {
    isS3Configured() {
        return !!(
            process.env.AWS_ACCESS_KEY_ID &&
            process.env.AWS_SECRET_ACCESS_KEY &&
            process.env.AWS_BUCKET_NAME &&
            process.env.AWS_REGION
        );
    }

    isDropboxConfigured() {
        return !!(
            process.env.DROPBOX_REFRESH_TOKEN &&
            process.env.DROPBOX_APP_KEY &&
            process.env.DROPBOX_APP_SECRET
        ) || !!process.env.DROPBOX_ACCESS_TOKEN;
    }

    async getDropboxAccessToken() {
        if (process.env.DROPBOX_ACCESS_TOKEN && !process.env.DROPBOX_REFRESH_TOKEN) {
            return process.env.DROPBOX_ACCESS_TOKEN;
        }

        const url = 'https://api.dropbox.com/oauth2/token';
        const params = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: process.env.DROPBOX_REFRESH_TOKEN,
            client_id: process.env.DROPBOX_APP_KEY,
            client_secret: process.env.DROPBOX_APP_SECRET
        });

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Failed to refresh Dropbox token: ${errText}`);
        }

        const data = await response.json();
        return data.access_token;
    }

    async uploadToS3(keyName, fileBuffer) {
        const s3Client = new S3Client({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
        });

        await s3Client.send(new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: keyName,
            Body: fileBuffer,
            ContentType: 'application/octet-stream'
        }));
    }

    async uploadToDropbox(fileName, fileBuffer) {
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
    }

    /**
     * Run cloud backup — exports data as JSON (no SQLite file on serverless)
     */
    async syncAllClouds(manual = false) {
        const results = {
            s3: { attempted: false, success: false, error: null },
            dropbox: { attempted: false, success: false, error: null }
        };

        try {
            const backupData = await getBackupData();
            const fileBuffer = Buffer.from(JSON.stringify(backupData, null, 2), 'utf8');

            const dateStr = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('-').slice(0, 5).join('-') + 'Z';
            const filename = `devotee_mgmt_backup_${dateStr}.json`;

            if (this.isS3Configured()) {
                results.s3.attempted = true;
                try {
                    await this.uploadToS3(`backups/${filename}`, fileBuffer);
                    results.s3.success = true;
                    await updateSetting('last_s3_backup_time', new Date().toISOString());
                    await updateSetting('last_s3_backup_status', 'Success');
                } catch (s3Err) {
                    results.s3.error = s3Err.message;
                    await updateSetting('last_s3_backup_status', `Failed: ${s3Err.message}`);
                    await logIssue('error', 'cloud-backup-s3', `S3 Sync failed: ${s3Err.message}`, s3Err.stack);
                }
            }

            if (this.isDropboxConfigured()) {
                results.dropbox.attempted = true;
                try {
                    await this.uploadToDropbox(filename, fileBuffer);
                    results.dropbox.success = true;
                    await updateSetting('last_dropbox_backup_time', new Date().toISOString());
                    await updateSetting('last_dropbox_backup_status', 'Success');
                } catch (dbxErr) {
                    results.dropbox.error = dbxErr.message;
                    await updateSetting('last_dropbox_backup_status', `Failed: ${dbxErr.message}`);
                    await logIssue('error', 'cloud-backup-dropbox', `Dropbox Sync failed: ${dbxErr.message}`, dbxErr.stack);
                }
            }
        } catch (globalErr) {
            await logIssue('error', 'cloud-backup-global', globalErr.message, globalErr.stack);
            throw globalErr;
        }

        return results;
    }

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
