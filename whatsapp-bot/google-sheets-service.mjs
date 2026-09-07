import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Google Sheets Service for Devotee Management Backup
 * Uses Service Account authentication
 */

class GoogleSheetsService {
    constructor() {
        this.sheets = null;
        this.auth = null;
    }

    /**
     * Initialize Google Sheets API with Service Account credentials
     */
    async initialize() {
        try {
            // Look for credentials file in multiple locations
            const credentialsPaths = [
                process.env.GOOGLE_SHEETS_CREDENTIALS_PATH,
                path.join(__dirname, 'google-credentials.json'),
                path.join(__dirname, '../google-credentials.json'),
                path.join(process.env.APPDATA_PATH || __dirname, 'google-credentials.json')
            ].filter(Boolean);

            let credentialsPath = null;
            for (const p of credentialsPaths) {
                if (fs.existsSync(p)) {
                    credentialsPath = p;
                    break;
                }
            }

            if (!credentialsPath) {
                throw new Error(
                    'Google credentials file not found. Please place google-credentials.json in the project root or set GOOGLE_SHEETS_CREDENTIALS_PATH environment variable.'
                );
            }

            const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

            this.auth = new google.auth.GoogleAuth({
                credentials,
                scopes: [
                    'https://www.googleapis.com/auth/spreadsheets',
                    'https://www.googleapis.com/auth/drive.file'
                ]
            });

            this.sheets = google.sheets({ version: 'v4', auth: this.auth });
            this.drive = google.drive({ version: 'v3', auth: this.auth });
            console.log('[Google Sheets] Service initialized successfully');
            return true;
        } catch (error) {
            console.error('[Google Sheets] Initialization failed:', error.message);
            throw error;
        }
    }

    /**
     * Create a new spreadsheet with devotee data
     * @param {Object} backupData - Data from getBackupData()
     * @returns {Object} - { spreadsheetId, spreadsheetUrl }
     */
    async createBackupSpreadsheet(backupData) {
        if (!this.sheets) {
            await this.initialize();
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
            console.log(`[Google Sheets] Created spreadsheet: ${spreadsheetId}`);

            // Prepare devotees data
            const devoteesData = this.prepareDevoteesData(backupData.devotees || []);

            // Prepare sadhana data
            const sadhanaData = this.prepareSadhanaData(backupData.sadhana || []);

            // Prepare metadata
            const metadataData = this.prepareMetadata(backupData);

            // Batch update all sheets
            const requests = [];

            // Update Devotees sheet
            if (devoteesData.length > 0) {
                requests.push({
                    updateCells: {
                        range: {
                            sheetId: 0,
                            startRowIndex: 0,
                            startColumnIndex: 0
                        },
                        rows: this.formatRows(devoteesData),
                        fields: 'userEnteredValue,userEnteredFormat'
                    }
                });
            }

            // Update Sadhana sheet
            if (sadhanaData.length > 0) {
                requests.push({
                    updateCells: {
                        range: {
                            sheetId: 1,
                            startRowIndex: 0,
                            startColumnIndex: 0
                        },
                        rows: this.formatRows(sadhanaData),
                        fields: 'userEnteredValue,userEnteredFormat'
                    }
                });
            }

            // Update Metadata sheet
            requests.push({
                updateCells: {
                    range: {
                        sheetId: 2,
                        startRowIndex: 0,
                        startColumnIndex: 0
                    },
                    rows: this.formatRows(metadataData),
                    fields: 'userEnteredValue,userEnteredFormat'
                }
            });

            // Format headers (bold, background color)
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

            // Share the spreadsheet with the configured email
            const shareEmail = process.env.GOOGLE_SHEETS_SHARE_EMAIL || 'info.iskcondrugapur@gmail.com';
            await this.shareSpreadsheet(spreadsheetId, shareEmail);

            const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
            console.log(`[Google Sheets] Backup created successfully: ${spreadsheetUrl}`);

            return {
                spreadsheetId,
                spreadsheetUrl,
                title: spreadsheetTitle
            };
        } catch (error) {
            console.error('[Google Sheets] Backup failed:', error);
            throw new Error(`Failed to create Google Sheets backup: ${error.message}`);
        }
    }

    /**
     * Prepare devotees data for spreadsheet
     */
    prepareDevoteesData(devotees) {
        if (!devotees || devotees.length === 0) {
            return [['No devotee data available']];
        }

        // Define column order
        const columns = [
            'id', 'name', 'spiritualName', 'initiatedName', 'email', 'gender', 'dob', 'age',
            'bloodGroup', 'education', 'occupation', 'relationType', 'guardianName',
            'contact', 'whatsapp', 'address', 'village', 'district', 'pinCode', 'state',
            'maritalStatus', 'anniversary', 'spiritualStatus', 'counselor', 'spiritualMaster',
            'shelterDate', 'initiatedDate1', 'initiatedDate2', 'rounds', 'followingPrinciplesSince',
            'booksRead', 'booksReading', 'courses', 'skills', 'specialDay', 'specialDayName',
            'child1Name', 'child1Dob', 'child1Status',
            'child2Name', 'child2Dob', 'child2Status',
            'child3Name', 'child3Dob', 'child3Status',
            'status', 'createdAt'
        ];

        // Create header row
        const headers = columns.map(col => col.replace(/([A-Z])/g, ' $1').trim().toUpperCase());

        // Create data rows
        const rows = devotees.map(devotee => {
            return columns.map(col => {
                let value = devotee[col];
                if (value === null || value === undefined) return '';
                if (Array.isArray(value)) return value.join(', ');
                if (typeof value === 'object') return JSON.stringify(value);
                return String(value);
            });
        });

        return [headers, ...rows];
    }

    /**
     * Prepare sadhana data for spreadsheet
     */
    prepareSadhanaData(sadhana) {
        if (!sadhana || sadhana.length === 0) {
            return [['No sadhana data available']];
        }

        const headers = ['ID', 'DEVOTEE ID', 'DATE', 'ROUNDS', 'TIMESTAMP'];
        const rows = sadhana.map(entry => [
            entry.id || '',
            entry.devoteeId || '',
            entry.date || '',
            entry.rounds || '',
            entry.timestamp || ''
        ]);

        return [headers, ...rows];
    }

    /**
     * Prepare metadata for spreadsheet
     */
    prepareMetadata(backupData) {
        const devoteeCount = backupData.devotees?.length || 0;
        const sadhanaCount = backupData.sadhana?.length || 0;
        const backupTime = backupData.timestamp || new Date().toISOString();

        return [
            ['BACKUP INFORMATION', ''],
            ['Backup Date & Time', backupTime],
            ['Total Devotees', devoteeCount],
            ['Total Sadhana Entries', sadhanaCount],
            ['Application', 'Devotee Management System'],
            ['Version', '1.0.0']
        ];
    }

    /**
     * Format rows for Google Sheets API
     */
    formatRows(data) {
        return data.map((row, rowIndex) => ({
            values: row.map(cell => ({
                userEnteredValue: { stringValue: String(cell) },
                userEnteredFormat: rowIndex === 0 ? {
                    textFormat: { bold: true },
                    backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 }
                } : {}
            }))
        }));
    }

    /**
     * Create header formatting request
     */
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

    /**
     * Share spreadsheet with an email address
     * @param {string} spreadsheetId - The ID of the spreadsheet to share
     * @param {string} email - Email address to share with
     */
    async shareSpreadsheet(spreadsheetId, email) {
        try {
            console.log(`[Google Sheets] Sharing spreadsheet with ${email}...`);

            await this.drive.permissions.create({
                fileId: spreadsheetId,
                requestBody: {
                    type: 'user',
                    role: 'writer',
                    emailAddress: email
                },
                fields: 'id'
            });

            console.log(`[Google Sheets] Successfully shared with ${email}`);
        } catch (error) {
            console.error(`[Google Sheets] Failed to share spreadsheet:`, error.message);
            // Don't throw - the spreadsheet was created successfully, sharing is optional
        }
    }
}

export default new GoogleSheetsService();
