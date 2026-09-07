import fs from 'fs';
import path from 'path';

/**
 * CSV Export Service
 * Exports devotee and sadhana data to CSV format
 */
class CSVExportService {
    /**
     * Convert array of objects to CSV string
     * @param {Array} data - Array of objects to convert
     * @param {Array} headers - Array of header names
     * @returns {string} CSV formatted string
     */
    arrayToCSV(data, headers) {
        if (!data || data.length === 0) {
            return headers.join(',') + '\n';
        }

        // Escape CSV values
        const escapeCSV = (value) => {
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            // If value contains comma, quote, or newline, wrap in quotes and escape quotes
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        };

        // Create header row
        const csvRows = [headers.join(',')];

        // Create data rows
        data.forEach(row => {
            const values = headers.map(header => escapeCSV(row[header]));
            csvRows.push(values.join(','));
        });

        return csvRows.join('\n');
    }

    /**
     * Export devotees data to CSV
     * @param {Array} devotees - Array of devotee objects
     * @returns {string} CSV string
     */
    exportDevotees(devotees) {
        const headers = [
            'name',
            'fatherHusbandWife',
            'dateOfBirth',
            'age',
            'contactNo',
            'whatsappNo',
            'education',
            'emailAddress',
            'bloodGroup',
            'maritalStatus',
            'occupation',
            'address',
            'spiritualStatus',
            'spiritualMaster',
            'initiationDate1',
            'initiationDate2',
            'initiatedName',
            'chantingRounds',
            'servicePreference',
            'anniversaryDate',
            'familyMembers',
            'notes'
        ];

        return this.arrayToCSV(devotees, headers);
    }

    /**
     * Export sadhana data to CSV
     * @param {Array} sadhana - Array of sadhana objects
     * @returns {string} CSV string
     */
    exportSadhana(sadhana) {
        const headers = [
            'devoteeId',
            'devoteeName',
            'date',
            'rounds',
            'bookReading',
            'lectureHearing',
            'serviceHours',
            'notes'
        ];

        return this.arrayToCSV(sadhana, headers);
    }

    /**
     * Create CSV backup files
     * @param {Object} backupData - Data from getBackupData()
     * @returns {Object} - { devoteesCSV, sadhanaCSV }
     */
    createBackup(backupData) {
        console.log('[CSV Export] Creating CSV backup...');

        const devoteesCSV = this.exportDevotees(backupData.devotees || []);
        const sadhanaCSV = this.exportSadhana(backupData.sadhana || []);

        console.log('[CSV Export] CSV backup created successfully');
        console.log(`[CSV Export] Devotees: ${backupData.devotees?.length || 0} records`);
        console.log(`[CSV Export] Sadhana: ${backupData.sadhana?.length || 0} records`);

        return {
            devoteesCSV,
            sadhanaCSV,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Save CSV files to disk
     * @param {Object} csvData - Object with devoteesCSV and sadhanaCSV
     * @param {string} outputDir - Directory to save files
     * @returns {Object} - { devoteesPath, sadhanaPath }
     */
    saveToFiles(csvData, outputDir) {
        // Create output directory if it doesn't exist
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const devoteesPath = path.join(outputDir, `devotees_${timestamp}.csv`);
        const sadhanaPath = path.join(outputDir, `sadhana_${timestamp}.csv`);

        fs.writeFileSync(devoteesPath, csvData.devoteesCSV, 'utf8');
        fs.writeFileSync(sadhanaPath, csvData.sadhanaCSV, 'utf8');

        console.log(`[CSV Export] Files saved:`);
        console.log(`[CSV Export] - ${devoteesPath}`);
        console.log(`[CSV Export] - ${sadhanaPath}`);

        return {
            devoteesPath,
            sadhanaPath
        };
    }
}

export default new CSVExportService();
