import { google } from 'googleapis';

/**
 * Google Sheets Service for Devotee Management Backup
 * Uses Service Account authentication via GOOGLE_SHEETS_CREDENTIALS env var (JSON string)
 */
class GoogleSheetsService {
    constructor() {
        this.sheets = null;
        this.auth = null;
    }

    async initialize() {
        try {
            const credsJson = process.env.GOOGLE_SHEETS_CREDENTIALS;
            if (!credsJson) {
                throw new Error(
                    'GOOGLE_SHEETS_CREDENTIALS env var not set. Set it to the JSON content of your service account credentials file.'
                );
            }

            const credentials = JSON.parse(credsJson);

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

    async createBackupSpreadsheet(backupData) {
        if (!this.sheets) await this.initialize();

        try {
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

            const shareEmail = process.env.GOOGLE_SHEETS_SHARE_EMAIL || 'info.iskcondrugapur@gmail.com';
            await this.shareSpreadsheet(spreadsheetId, shareEmail);

            const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
            return { spreadsheetId, spreadsheetUrl, title: spreadsheetTitle };
        } catch (error) {
            console.error('[Google Sheets] Backup failed:', error.message);
            throw new Error(`Failed to create Google Sheets backup: ${error.message}`);
        }
    }

    prepareDevoteesData(devotees) {
        if (!devotees || devotees.length === 0) return [['No devotee data available']];
        const columns = [
            'id', 'name', 'spiritualName', 'initiatedName', 'email', 'gender', 'dob', 'age',
            'bloodGroup', 'education', 'occupation', 'relationType', 'guardianName',
            'contact', 'whatsapp', 'address', 'village', 'district', 'pinCode', 'state',
            'maritalStatus', 'anniversary', 'spiritualStatus', 'counselor', 'spiritualMaster',
            'shelterDate', 'initiatedDate1', 'initiatedDate2', 'rounds', 'followingPrinciplesSince',
            'booksRead', 'booksReading', 'courses', 'skills', 'specialDay', 'specialDayName',
            'child1Name', 'child1Dob', 'child1Status', 'child2Name', 'child2Dob', 'child2Status',
            'child3Name', 'child3Dob', 'child3Status', 'status', 'createdAt'
        ];
        const headers = columns.map(col => col.replace(/([A-Z])/g, ' $1').trim().toUpperCase());
        const rows = devotees.map(devotee =>
            columns.map(col => {
                let value = devotee[col];
                if (value === null || value === undefined) return '';
                if (Array.isArray(value)) return value.join(', ');
                if (typeof value === 'object') return JSON.stringify(value);
                return String(value);
            })
        );
        return [headers, ...rows];
    }

    prepareSadhanaData(sadhana) {
        if (!sadhana || sadhana.length === 0) return [['No sadhana data available']];
        const headers = ['ID', 'DEVOTEE ID', 'DATE', 'ROUNDS', 'TIMESTAMP'];
        const rows = sadhana.map(e => [e.id || '', e.devoteeId || '', e.date || '', e.rounds || '', e.timestamp || '']);
        return [headers, ...rows];
    }

    prepareMetadata(backupData) {
        return [
            ['BACKUP INFORMATION', ''],
            ['Backup Date & Time', backupData.timestamp || new Date().toISOString()],
            ['Total Devotees', backupData.devotees?.length || 0],
            ['Total Sadhana Entries', backupData.sadhana?.length || 0],
            ['Application', 'Devotee Management System'],
            ['Version', '1.0.0']
        ];
    }

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

    async shareSpreadsheet(spreadsheetId, email) {
        try {
            await this.drive.permissions.create({
                fileId: spreadsheetId,
                requestBody: { type: 'user', role: 'writer', emailAddress: email },
                fields: 'id'
            });
            console.log(`[Google Sheets] Successfully shared with ${email}`);
        } catch (error) {
            console.error(`[Google Sheets] Failed to share:`, error.message);
        }
    }
}

export default new GoogleSheetsService();
