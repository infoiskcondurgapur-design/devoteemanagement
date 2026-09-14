import { google } from 'googleapis';
import { getSettings, updateSetting } from './database.mjs';

/**
 * OAuth-based Google Sheets Service (serverless-safe)
 * Persists tokens in the database settings table instead of the filesystem.
 */
class OAuthSheetsService {
    constructor() {
        this.oauth2Client = null;
        this.sheets = null;
        this.drive = null;
        this.lastSyncTime = null;
        this._initializing = false;
    }

    async _loadTokens() {
        try {
            const settings = await getSettings();
            return settings.google_oauth_tokens ? JSON.parse(settings.google_oauth_tokens) : null;
        } catch {
            return null;
        }
    }

    async _saveTokens(tokens) {
        await updateSetting('google_oauth_tokens', JSON.stringify(tokens));
    }

    async _loadLastSyncTime() {
        try {
            const settings = await getSettings();
            this.lastSyncTime = settings.google_sync_last_time || null;
        } catch {
            this.lastSyncTime = null;
        }
    }

    async _saveLastSyncTime() {
        this.lastSyncTime = new Date().toISOString();
        await updateSetting('google_sync_last_time', this.lastSyncTime);
    }

    async initialize() {
        if (this._initializing) return;
        this._initializing = true;

        try {
            const client_id = process.env.GOOGLE_CLIENT_ID;
            const client_secret = process.env.GOOGLE_CLIENT_SECRET;
            const redirect_uri = process.env.GOOGLE_REDIRECT_URI;

            if (!client_id || !client_secret || !redirect_uri) {
                console.error('[OAuth Sheets] Missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REDIRECT_URI');
                return false;
            }

            this.oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri);

            this.oauth2Client.on('tokens', async (tokens) => {
                try {
                    const current = await this._loadTokens();
                    const updated = { ...current, ...tokens };
                    await this._saveTokens(updated);
                    console.log('[OAuth Sheets] Tokens refreshed and saved');
                } catch (err) {
                    console.error('[OAuth Sheets] Failed to save refreshed tokens:', err.message);
                }
            });

            const storedTokens = await this._loadTokens();
            await this._loadLastSyncTime();

            if (storedTokens) {
                this.oauth2Client.setCredentials(storedTokens);
                this.sheets = google.sheets({ version: 'v4', auth: this.oauth2Client });
                this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
                console.log('[OAuth Sheets] Initialized with stored tokens');
                return true;
            }

            console.log('[OAuth Sheets] No stored tokens. User needs to authenticate.');
            return false;
        } catch (error) {
            console.error('[OAuth Sheets] Init failed:', error.message);
            throw error;
        } finally {
            this._initializing = false;
        }
    }

    /**
     * Ensure the OAuth client is initialized (idempotent, safe to call per-request).
     */
    async ensureInitialized() {
        if (!this.oauth2Client) {
            await this.initialize();
        }
        return this.oauth2Client;
    }

    getAuthUrl() {
        if (!this.oauth2Client) {
            throw new Error('OAuth client not initialized. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI.');
        }
        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/drive.file'
            ],
            prompt: 'consent'
        });
    }

    async getTokensFromCode(code) {
        const { tokens } = await this.oauth2Client.getToken(code);
        this.oauth2Client.setCredentials(tokens);
        await this._saveTokens(tokens);

        this.sheets = google.sheets({ version: 'v4', auth: this.oauth2Client });
        this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
        console.log('[OAuth Sheets] Tokens obtained and saved');
        return true;
    }

    isAuthenticated() {
        return !!(this.oauth2Client?.credentials?.access_token);
    }

    async createBackupSpreadsheet(backupData) {
        if (!this.isAuthenticated()) {
            throw new Error('User not authenticated. Please sign in with Google first.');
        }

        const timestamp = new Date().toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', hour12: false
        }).replace(/[/:]/g, '-').replace(', ', '_');

        const spreadsheetTitle = `Devotee Management Backup - ${timestamp}`;

        const createResponse = await this.sheets.spreadsheets.create({
            requestBody: {
                properties: { title: spreadsheetTitle },
                sheets: [
                    { properties: { title: 'Devotees' } },
                    { properties: { title: 'Sadhana' } },
                    { properties: { title: 'Metadata' } }
                ]
            }
        });

        const spreadsheetId = createResponse.data.spreadsheetId;

        const devoteesData = this.prepareDevoteesData(backupData.devotees || []);
        const sadhanaData = this.prepareSadhanaData(backupData.sadhana || []);
        const metadataData = this.prepareMetadata(backupData);

        const requests = [];

        if (devoteesData.length > 0) {
            requests.push({
                updateCells: {
                    range: { sheetId: 0, startRowIndex: 0, startColumnIndex: 0 },
                    rows: this.formatRows(devoteesData),
                    fields: 'userEnteredValue,userEnteredFormat'
                }
            });
        }
        if (sadhanaData.length > 0) {
            requests.push({
                updateCells: {
                    range: { sheetId: 1, startRowIndex: 0, startColumnIndex: 0 },
                    rows: this.formatRows(sadhanaData),
                    fields: 'userEnteredValue,userEnteredFormat'
                }
            });
        }
        requests.push({
            updateCells: {
                range: { sheetId: 2, startRowIndex: 0, startColumnIndex: 0 },
                rows: this.formatRows(metadataData),
                fields: 'userEnteredValue,userEnteredFormat'
            }
        });

        requests.push(
            this.createHeaderFormatRequest(0, devoteesData[0]?.length || 0),
            this.createHeaderFormatRequest(1, sadhanaData[0]?.length || 0),
            this.createHeaderFormatRequest(2, metadataData[0]?.length || 0),
            { autoResizeDimensions: { dimensions: { sheetId: 0, dimension: 'COLUMNS' } } },
            { autoResizeDimensions: { dimensions: { sheetId: 1, dimension: 'COLUMNS' } } },
            { autoResizeDimensions: { dimensions: { sheetId: 2, dimension: 'COLUMNS' } } }
        );

        await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: { requests }
        });

        const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

        await this._saveLastSyncTime();

        return { spreadsheetId, spreadsheetUrl, title: spreadsheetTitle };
    }

    prepareDevoteesData(devotees) {
        const headers = ['Name', 'Contact', 'WhatsApp', 'Email', 'Spiritual Status', 'Spiritual Master', 'Service Preference'];
        const rows = [headers];
        devotees.forEach(d => {
            rows.push([
                d.name || '', d.contactNo || '', d.whatsappNo || '',
                d.emailAddress || '', d.spiritualStatus || '',
                d.spiritualMaster || '', d.servicePreference || ''
            ]);
        });
        return rows;
    }

    prepareSadhanaData(sadhana) {
        const headers = ['Devotee', 'Date', 'Rounds', 'Book Reading', 'Lecture Hearing', 'Service Hours'];
        const rows = [headers];
        sadhana.forEach(s => {
            rows.push([
                s.devoteeName || '', s.date || '', s.rounds || 0,
                s.bookReading || '', s.lectureHearing || '', s.serviceHours || 0
            ]);
        });
        return rows;
    }

    prepareMetadata(backupData) {
        return [
            ['Backup Information', ''],
            ['Created At', new Date().toISOString()],
            ['Total Devotees', backupData.devotees?.length || 0],
            ['Total Sadhana Entries', backupData.sadhana?.length || 0]
        ];
    }

    formatRows(data) {
        return data.map(row => ({
            values: row.map(cell => ({
                userEnteredValue: { stringValue: String(cell) }
            }))
        }));
    }

    createHeaderFormatRequest(sheetId, columnCount) {
        return {
            repeatCell: {
                range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: columnCount },
                cell: {
                    userEnteredFormat: {
                        backgroundColor: { red: 0.2, green: 0.5, blue: 0.8 },
                        textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                        horizontalAlignment: 'CENTER'
                    }
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
            }
        };
    }
}

export default new OAuthSheetsService();
