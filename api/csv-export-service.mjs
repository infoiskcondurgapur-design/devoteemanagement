/**
 * CSV Export Service (serverless-safe — no filesystem operations)
 */
class CSVExportService {
    /**
     * Convert array of objects to CSV string
     */
    arrayToCSV(data, headers) {
        if (!data || data.length === 0) {
            return headers.join(',') + '\n';
        }

        const escapeCSV = (value) => {
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        };

        const csvRows = [headers.join(',')];
        data.forEach(row => {
            const values = headers.map(header => escapeCSV(row[header]));
            csvRows.push(values.join(','));
        });

        return csvRows.join('\n');
    }

    exportDevotees(devotees) {
        const headers = [
            'name', 'fatherHusbandWife', 'dateOfBirth', 'age', 'contactNo',
            'whatsappNo', 'education', 'emailAddress', 'bloodGroup', 'maritalStatus',
            'occupation', 'address', 'spiritualStatus', 'spiritualMaster',
            'initiationDate1', 'initiationDate2', 'initiatedName', 'chantingRounds',
            'servicePreference', 'anniversaryDate', 'familyMembers', 'notes'
        ];
        return this.arrayToCSV(devotees, headers);
    }

    exportSadhana(sadhana) {
        const headers = [
            'devoteeId', 'devoteeName', 'date', 'rounds', 'bookReading',
            'lectureHearing', 'serviceHours', 'notes'
        ];
        return this.arrayToCSV(sadhana, headers);
    }

    createBackup(backupData) {
        const devoteesCSV = this.exportDevotees(backupData.devotees || []);
        const sadhanaCSV = this.exportSadhana(backupData.sadhana || []);

        return {
            devoteesCSV,
            sadhanaCSV,
            timestamp: new Date().toISOString()
        };
    }
}

export default new CSVExportService();
