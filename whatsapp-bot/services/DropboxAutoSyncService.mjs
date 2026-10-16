import * as db from '../database.mjs';
import cloudBackupService from './CloudBackupService.mjs';
import { broadcast } from './wsService.mjs';

class DropboxAutoSyncService {
    constructor() {
        this.timer = null;
        this.isRunning = false;
        this.isSyncing = false;
    }

    start() {
        if (this.timer) return;
        this.isRunning = true;
        console.log('[Dropbox Auto-Sync] Service started. Checking schedule every 60s...');

        // Initial check after 15 seconds so server has time to fully initialize
        setTimeout(() => {
            this.checkAndSync().catch(err => {
                console.error('[Dropbox Auto-Sync] Initial check error:', err.message);
            });
        }, 15000);

        // Periodic check every 60 seconds
        this.timer = setInterval(() => {
            this.checkAndSync().catch(err => {
                console.error('[Dropbox Auto-Sync] Periodic check error:', err.message);
            });
        }, 60000);
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.isRunning = false;
        console.log('[Dropbox Auto-Sync] Service stopped.');
    }

    async checkAndSync() {
        if (this.isSyncing) return;

        try {
            const settings = await db.getSettings();
            if (!cloudBackupService.isDropboxConfigured(settings)) {
                return;
            }

            const autoSyncEnabled = settings.dropbox_auto_sync !== 'false';
            if (!autoSyncEnabled) {
                return;
            }

            const intervalMinutes = parseInt(settings.dropbox_auto_sync_interval, 10) || 60;
            const lastBackupTime = settings.last_dropbox_backup_time ? new Date(settings.last_dropbox_backup_time).getTime() : 0;
            const now = Date.now();
            const elapsed = now - lastBackupTime;
            const intervalMs = intervalMinutes * 60 * 1000;

            if (elapsed >= intervalMs || lastBackupTime === 0) {
                this.isSyncing = true;
                console.log(`[Dropbox Auto-Sync] Interval elapsed (${Math.round(elapsed / 60000)}m >= ${intervalMinutes}m). Starting automated sync...`);
                
                try {
                    const result = await cloudBackupService.syncDropboxOnly(false);
                    const timestamp = new Date().toISOString();
                    await db.updateSetting('last_dropbox_auto_sync_time', timestamp);
                    console.log(`[Dropbox Auto-Sync] Automatic sync successful: ${result.path} (${result.sizeFormatted})`);
                    
                    try {
                        broadcast('DATA_MUTATED', { reason: 'dropbox_auto_sync', timestamp });
                    } catch { }
                } catch (syncErr) {
                    console.error('[Dropbox Auto-Sync] Sync failed:', syncErr.message);
                } finally {
                    this.isSyncing = false;
                }
            }
        } catch (err) {
            this.isSyncing = false;
            console.error('[Dropbox Auto-Sync] Check error:', err.message);
        }
    }
}

export default new DropboxAutoSyncService();
