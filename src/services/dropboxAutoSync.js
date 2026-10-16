import apiService from './api';

class DropboxAutoSyncManager {
    constructor() {
        this.timer = null;
        this.isRunning = false;
        this.isChecking = false;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;

        // Initial check after 20 seconds
        setTimeout(() => {
            this.runCheck();
        }, 20000);

        // Check every 3 minutes while the web app or desktop window is active
        this.timer = setInterval(() => {
            this.runCheck();
        }, 180000);
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.isRunning = false;
    }

    async runCheck() {
        if (this.isChecking) return;
        if (!apiService.hasToken()) return;

        this.isChecking = true;
        try {
            const res = await apiService.checkDropboxAutoSync();
            if (res?.success && res?.synced) {
                console.log('[Dropbox Auto-Sync] Background auto-sync executed:', res.result?.filename);
            }
        } catch {
            // Background check error is non-intrusive
        } finally {
            this.isChecking = false;
        }
    }
}

const dropboxAutoSyncManager = new DropboxAutoSyncManager();
export default dropboxAutoSyncManager;
