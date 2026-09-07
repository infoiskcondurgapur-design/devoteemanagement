import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { URL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * OAuth-based Google Sheets Service
 * Uses user's personal Google account instead of service account
 */
class OAuthSheetsService {
    constructor() {
        this.oauth2Client = null;
        this.sheets = null;
        this.drive = null;
        this.tokenPath = path.join(__dirname, '../google-oauth-tokens.json');
        this.lastSyncTime = null;
        this.loadLastSyncTime();
    }

    loadLastSyncTime() {
        try {
            const syncPath = path.join(__dirname, '../google-sync-info.json');
            if (fs.existsSync(syncPath)) {
                const info = JSON.parse(fs.readFileSync(syncPath, 'utf8'));
                this.lastSyncTime = info.lastSyncTime;
            }
        } catch (e) {
            console.error('[OAuth Sheets] Failed to load sync info:', e.message);
        }
    }

    saveLastSyncTime() {
        try {
            this.lastSyncTime = new Date().toISOString();
            const syncPath = path.join(__dirname, '../google-sync-info.json');
            fs.writeFileSync(syncPath, JSON.stringify({ lastSyncTime: this.lastSyncTime }));
        } catch (e) {
            console.error('[OAuth Sheets] Failed to save sync info:', e.message);
        }
    }

    /**
     * Initialize OAuth client
     */
    async initialize() {
        try {
            const client_id = process.env.GOOGLE_CLIENT_ID;
            const client_secret = process.env.GOOGLE_CLIENT_SECRET;
            const redirect_uri = process.env.GOOGLE_REDIRECT_URI;

            if (!client_id || !client_secret || !redirect_uri) {
                console.error('[OAuth Sheets] Missing credentials in environment variables.');
                return false;
            }

            console.log(`[OAuth Sheets] Using Client ID: ${client_id.substring(0, 15)}...[HIDDEN]`);
            console.log(`[OAuth Sheets] Using Redirect URI: ${redirect_uri}`);

            this.oauth2Client = new google.auth.OAuth2(
                client_id,
                client_secret,
                redirect_uri
            );

            // Add listener for automatic token refreshes
            this.oauth2Client.on('tokens', (tokens) => {
                try {
                    console.log('[OAuth Sheets] Tokens refreshed, saving...');
                    let currentTokens = {};
                    if (fs.existsSync(this.tokenPath)) {
                        currentTokens = JSON.parse(fs.readFileSync(this.tokenPath, 'utf8'));
                    }
                    const updatedTokens = { ...currentTokens, ...tokens };
                    fs.writeFileSync(this.tokenPath, JSON.stringify(updatedTokens, null, 2));
                    console.log('[OAuth Sheets] Tokens saved successfully');
                } catch (err) {
                    console.error('[OAuth Sheets] Failed to save refreshed tokens:', err.message);
                }
            });

            // Check if we have stored tokens
            if (fs.existsSync(this.tokenPath)) {
                const tokens = JSON.parse(fs.readFileSync(this.tokenPath, 'utf8'));
                this.oauth2Client.setCredentials(tokens);

                // Initialize APIs
                this.sheets = google.sheets({ version: 'v4', auth: this.oauth2Client });
                this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });

                console.log('[OAuth Sheets] Service initialized with stored tokens');
                return true;
            }

            console.log('[OAuth Sheets] No stored tokens found. User needs to authenticate.');
            return false;
        } catch (error) {
            console.error('[OAuth Sheets] Initialization failed:', error.message);
            throw error;
        }
    }

    /**
     * Get authorization URL for user to visit
     */
    getAuthUrl() {
        if (!this.oauth2Client) {
            throw new Error('OAuth client not initialized. Please ensure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI are set in your .env file.');
        }

        const scopes = [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive.file'
        ];

        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent' // Force consent screen to get refresh token
        });
    }

    /**
     * Exchange authorization code for tokens
     * @param {string} code - Authorization code from OAuth callback
     */
    async getTokensFromCode(code) {
        try {
            console.log('[OAuth Sheets] Exchanging code for tokens...');
            const { tokens } = await this.oauth2Client.getToken(code);
            this.oauth2Client.setCredentials(tokens);

            // Save tokens for future use
            fs.writeFileSync(this.tokenPath, JSON.stringify(tokens, null, 2));

            // Initialize APIs
            this.sheets = google.sheets({ version: 'v4', auth: this.oauth2Client });
            this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });

            console.log('[OAuth Sheets] Tokens obtained and saved successfully');
            return true;
        } catch (error) {
            console.error('[OAuth Sheets] Failed to get tokens. Full Error:', JSON.stringify(error, null, 2));
            throw error;
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.oauth2Client && this.oauth2Client.credentials && this.oauth2Client.credentials.access_token;
    }

    /**
     * Create backup spreadsheet (reuses logic from google-sheets-service.mjs)
     * @param {Object} backupData - Data from getBackupData()
     */
    async createBackupSpreadsheet(backupData) {
        if (!this.isAuthenticated()) {
            throw new Error('User not authenticated. Please sign in with Google first.');
        }

        try {
            const timestamp = new Date().toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }).replace(/[/:]/g, '-').replace(', ', '_');

            const spreadsheetTitle = `Devotee Management Backup - ${timestamp}`;

            // Create new spreadsheet
            const createResponse = await this.sheets.spreadsheets.create({
                requestBody: {
                    properties: {
                        title: spreadsheetTitle
                    },
                    sheets: [
                        { properties: { title: 'Devotees' } },
                        { properties: { title: 'Sadhana' } },
                        { properties: { title: 'Metadata' } }
                    ]
                }
            });

            const spreadsheetId = createResponse.data.spreadsheetId;
            console.log(`[OAuth Sheets] Created spreadsheet: ${spreadsheetId}`);

            // Prepare and populate data (simplified version)
            const devoteesData = this.prepareDevoteesData(backupData.devotees || []);
            const sadhanaData = this.prepareSadhanaData(backupData.sadhana || []);
            const metadataData = this.prepareMetadata(backupData);

            // Update sheets with data
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

            // Format headers
            requests.push(
                this.createHeaderFormatRequest(0, devoteesData[0]?.length || 0),
                this.createHeaderFormatRequest(1, sadhanaData[0]?.length || 0),
                this.createHeaderFormatRequest(2, metadataData[0]?.length || 0)
            );

            // Auto-resize columns
            requests.push(
                { autoResizeDimensions: { dimensions: { sheetId: 0, dimension: 'COLUMNS' } } },
                { autoResizeDimensions: { dimensions: { sheetId: 1, dimension: 'COLUMNS' } } },
                { autoResizeDimensions: { dimensions: { sheetId: 2, dimension: 'COLUMNS' } } }
            );

            await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: { requests }
            });

            const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
            console.log(`[OAuth Sheets] Backup created successfully: ${spreadsheetUrl}`);

            this.saveLastSyncTime();
            return {
                spreadsheetId,
                spreadsheetUrl,
                title: spreadsheetTitle
            };
        } catch (error) {
            console.error('[OAuth Sheets] Backup failed:', error.message);
            throw error;
        }
    }

    // Helper methods (copied from google-sheets-service.mjs)
    prepareDevoteesData(devotees) {
        const headers = ['Name', 'Contact', 'WhatsApp', 'Email', 'Spiritual Status', 'Spiritual Master', 'Service Preference'];
        const rows = [headers];
        devotees.forEach(d => {
            rows.push([
                d.name || '',
                d.contactNo || '',
                d.whatsappNo || '',
                d.emailAddress || '',
                d.spiritualStatus || '',
                d.spiritualMaster || '',
                d.servicePreference || ''
            ]);
        });
        return rows;
    }

    prepareSadhanaData(sadhana) {
        const headers = ['Devotee', 'Date', 'Rounds', 'Book Reading', 'Lecture Hearing', 'Service Hours'];
        const rows = [headers];
        sadhana.forEach(s => {
            rows.push([
                s.devoteeName || '',
                s.date || '',
                s.rounds || 0,
                s.bookReading || '',
                s.lectureHearing || '',
                s.serviceHours || 0
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
                range: {
                    sheetId,
                    startRowIndex: 0,
                    endRowIndex: 1,
                    startColumnIndex: 0,
                    endColumnIndex: columnCount
                },
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
