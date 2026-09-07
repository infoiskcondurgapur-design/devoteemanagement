import { app, BrowserWindow, Menu, net, dialog } from 'electron';
import fs from 'fs';
import path from 'path';
import { fork } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let backendProcess;
let autoBackupInterval;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true, // Recommended for security
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, '../public/favicon.ico')
    });

    // In development, wait for Vite to serve
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));

        // Intercept API requests in production to redirect to backend
        const session = mainWindow.webContents.session;
        session.webRequest.onBeforeRequest(
            { urls: ['file://*/*'] },
            (details, callback) => {
                const url = details.url;
                if (url.includes('/api/')) {
                    // Redirect file://.../api/... to http://localhost:3001/api/...
                    const newUrl = 'http://localhost:3001' + url.substring(url.indexOf('/api/'));
                    callback({ redirectURL: newUrl });
                } else {
                    callback({});
                }
            }
        );
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function startBackend() {
    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
        console.log('[Electron] Running in development mode. Using external backend server on port 3001.');
        return;
    }

    // Check production resources path
    const scriptPath = path.join(process.resourcesPath, 'whatsapp-bot/server.mjs');
    const userDataPath = app.getPath('userData');
    console.log('[Electron] Starting backend from:', scriptPath);
    console.log('[Electron] User Data Path:', userDataPath);

    // Forking ensures it runs in a separate process but uses the same V8 execution environment capabilities
    backendProcess = fork(scriptPath, [], {
        env: { ...process.env, APPDATA_PATH: userDataPath },
        stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    });

    backendProcess.stdout.on('data', (data) => console.log(`[Backend]: ${data}`));
    backendProcess.stderr.on('data', (data) => console.error(`[Backend Error]: ${data}`));

    backendProcess.on('error', (err) => {
        console.error('[Electron] Backend process failed:', err);
    });
}


const fetchBackupData = () => {
    return new Promise((resolve, reject) => {
        const request = net.request('http://localhost:3001/api/backup');
        request.on('response', (response) => {
            let data = '';
            response.on('data', (chunk) => data += chunk);
            response.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.success) resolve(json.data);
                    else reject(new Error(json.error || 'Unknown error'));
                } catch (e) { reject(e); }
            });
        });
        request.on('error', (err) => reject(err));
        request.end();
    });
};

const handleBackup = async (format) => {
    try {
        const data = await fetchBackupData();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        let filename = `backup-${timestamp}`;

        if (format === 'json') {
            const result = await dialog.showSaveDialog({
                title: 'Save JSON Backup',
                defaultPath: filename + '.json',
                filters: [{ name: 'JSON', extensions: ['json'] }]
            });
            if (!result.canceled && result.filePath) {
                fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2));
                dialog.showMessageBox({ message: 'Backup saved successfully!', type: 'info' });
            }
        } else if (format === 'csv') {
            // Use the new CSV export service
            const request = net.request({
                method: 'POST',
                protocol: 'http:',
                hostname: 'localhost',
                port: 3001,
                path: '/api/backup/csv'
            });

            const csvData = await new Promise((resolve, reject) => {
                request.on('response', (response) => {
                    let data = '';
                    response.on('data', (chunk) => data += chunk);
                    response.on('end', () => {
                        try {
                            const json = JSON.parse(data);
                            if (json.success) resolve(json);
                            else reject(new Error(json.error || 'Unknown error'));
                        } catch (e) { reject(e); }
                    });
                });
                request.on('error', (err) => reject(err));
                request.end();
            });

            // Save devotees CSV
            const devoteesResult = await dialog.showSaveDialog({
                title: 'Save Devotees CSV',
                defaultPath: `devotees-${timestamp}.csv`,
                filters: [{ name: 'CSV', extensions: ['csv'] }]
            });

            if (!devoteesResult.canceled && devoteesResult.filePath) {
                fs.writeFileSync(devoteesResult.filePath, csvData.devoteesCSV);

                // Save sadhana CSV
                const sadhanaResult = await dialog.showSaveDialog({
                    title: 'Save Sadhana CSV',
                    defaultPath: `sadhana-${timestamp}.csv`,
                    filters: [{ name: 'CSV', extensions: ['csv'] }]
                });

                if (!sadhanaResult.canceled && sadhanaResult.filePath) {
                    fs.writeFileSync(sadhanaResult.filePath, csvData.sadhanaCSV);
                    dialog.showMessageBox({
                        message: 'CSV backups saved successfully!\n\nFiles created:\n- Devotees CSV\n- Sadhana CSV',
                        type: 'info'
                    });
                }
            }
        } else if (format === 'pdf') {
            const devotees = data.devotees || [];
            if (devotees.length === 0) throw new Error('No devotee data to export.');

            const pdfWindow = new BrowserWindow({ show: false });
            const headers = Object.keys(devotees[0]);

            let html = `<html><head><style>
                table { border-collapse: collapse; width: 100%; font-family: sans-serif; }
                th, td { border: 1px solid #ddd; padding: 4px; font-size: 10px; text-align: left; }
                th { background-color: #f2f2f2; }
             </style></head><body>
             <h1>Devotee Database Backup</h1>
             <p>Generated on: ${new Date().toLocaleString()}</p>
             <table><thead><tr>`;

            headers.forEach(h => html += `<th>${h}</th>`);
            html += `</tr></thead><tbody>`;

            devotees.forEach(r => {
                html += `<tr>`;
                headers.forEach(h => {
                    let val = r[h];
                    if (typeof val === 'object') val = JSON.stringify(val);
                    html += `<td>${val || ''}</td>`;
                });
                html += `</tr>`;
            });
            html += `</tbody></table></body></html>`;

            const tempPath = path.join(app.getPath('temp'), `backup_temp_${Date.now()}.html`);
            fs.writeFileSync(tempPath, html);
            await pdfWindow.loadFile(tempPath);

            const pdfData = await pdfWindow.webContents.printToPDF({
                landscape: true,
                pageSize: 'A4',
                printBackground: true
            });

            const result = await dialog.showSaveDialog({
                title: 'Save PDF Backup',
                defaultPath: filename + '.pdf',
                filters: [{ name: 'PDF', extensions: ['pdf'] }]
            });

            if (!result.canceled && result.filePath) {
                fs.writeFileSync(result.filePath, pdfData);
                dialog.showMessageBox({ message: 'PDF Backup saved successfully!', type: 'info' });
            }

            // Clean up
            pdfWindow.close();
            try { fs.unlinkSync(tempPath); } catch { }
        }
    } catch (err) {
        console.error('Backup Error:', err);
        dialog.showErrorBox('Backup Failed', err.message);
    }
};

// Auto-backup service
const performAutoBackup = async () => {
    try {
        const data = await fetchBackupData();
        const filename = 'auto-backup.json';

        // Ensure backups directory exists
        const backupsDir = path.join(__dirname, '../backups');
        if (!fs.existsSync(backupsDir)) {
            fs.mkdirSync(backupsDir, { recursive: true });
        }

        const filepath = path.join(backupsDir, filename);
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));

        console.log(`[Auto-Backup] Backup saved: ${filename}`);
    } catch (err) {
        // Silent failure - don't crash the app if backup fails
        console.error('[Auto-Backup] Failed:', err.message);
    }
};

const startAutoBackup = () => {
    console.log('[Auto-Backup] Starting auto-backup service (every 5 seconds)');

    // Perform initial backup after 5 seconds
    setTimeout(performAutoBackup, 5000);

    // Then continue every 5 seconds
    autoBackupInterval = setInterval(performAutoBackup, 5000);
};

const stopAutoBackup = () => {
    if (autoBackupInterval) {
        clearInterval(autoBackupInterval);
        console.log('[Auto-Backup] Auto-backup service stopped');
    }
};

const handleRestore = async () => {
    try {
        // Show file selection dialog
        const result = await dialog.showOpenDialog({
            title: 'Select Backup File to Restore',
            filters: [{ name: 'JSON', extensions: ['json'] }],
            properties: ['openFile']
        });

        if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
            return;
        }

        const filePath = result.filePaths[0];

        // Confirm with user
        const confirmResult = await dialog.showMessageBox({
            type: 'warning',
            title: 'Confirm Restore',
            message: 'Are you sure you want to restore from this backup?',
            detail: 'This will DELETE all current data and replace it with the backup data. This action cannot be undone!',
            buttons: ['Cancel', 'Restore'],
            defaultId: 0,
            cancelId: 0
        });

        if (confirmResult.response === 0) {
            return; // User cancelled
        }

        // Read backup file
        const backupData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        // Send restore request to backend
        const request = net.request({
            method: 'POST',
            protocol: 'http:',
            hostname: 'localhost',
            port: 3001,
            path: '/api/restore'
        });

        request.setHeader('Content-Type', 'application/json');

        const response = await new Promise((resolve, reject) => {
            request.on('response', (response) => {
                let data = '';
                response.on('data', (chunk) => data += chunk);
                response.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        if (json.success) resolve(json);
                        else reject(new Error(json.error || 'Unknown error'));
                    } catch (e) { reject(e); }
                });
            });
            request.on('error', (err) => reject(err));
            request.write(JSON.stringify(backupData));
            request.end();
        });

        // Show success message
        dialog.showMessageBox({
            type: 'info',
            title: 'Restore Successful',
            message: 'Data restored successfully!',
            detail: `Devotees restored: ${response.devoteesRestored}\nSadhana entries restored: ${response.sadhanaRestored}\n\nPlease refresh the application to see the restored data.`
        });

    } catch (err) {
        console.error('Restore Error:', err);
        dialog.showErrorBox('Restore Failed', err.message);
    }
};

function createCustomMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Backup',
                    submenu: [
                        { label: 'json File', click: () => handleBackup('json') },
                        { label: 'CSV Files (Devotees + Sadhana)', click: () => handleBackup('csv') },
                        { label: 'Pdf File', click: () => handleBackup('pdf') }
                    ]
                },
                { label: 'Restore from Backup...', click: () => handleRestore() },
                { type: 'separator' },
                { role: 'quit', label: 'Exit' }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}



app.on('ready', () => {
    // Determine env. If run with 'electron .' usually NODE_ENV is not set, but our script sets it.
    // If packaged, it won't be development.
    startBackend();
    createCustomMenu();
    createWindow();

    // Start auto-backup service
    startAutoBackup();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('quit', () => {
    if (backendProcess) {
        console.log('[Electron] Killing backend process...');
        backendProcess.kill();
    }

    // Stop auto-backup service
    stopAutoBackup();
});
