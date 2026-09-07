import { google } from 'googleapis';
import fs from 'fs';

async function testAuth() {
    try {
        console.log('Loading credentials...');
        const credentials = JSON.parse(fs.readFileSync('../google-credentials.json', 'utf8'));

        console.log('Creating auth client...');
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: [
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/drive.file'
            ]
        });

        console.log('Getting client...');
        const client = await auth.getClient();
        console.log('✅ Authentication successful!');
        console.log('Service Account Email:', credentials.client_email);

        console.log('\nTesting Google Sheets API...');
        const sheets = google.sheets({ version: 'v4', auth });

        console.log('Creating test spreadsheet...');
        const response = await sheets.spreadsheets.create({
            requestBody: {
                properties: {
                    title: 'Test Spreadsheet - DELETE ME'
                }
            }
        });

        console.log('✅ SUCCESS! Spreadsheet created:');
        console.log('Spreadsheet ID:', response.data.spreadsheetId);
        console.log('URL:', `https://docs.google.com/spreadsheets/d/${response.data.spreadsheetId}`);

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        if (error.code) {
            console.error('Error Code:', error.code);
        }
        if (error.errors) {
            console.error('Details:', JSON.stringify(error.errors, null, 2));
        }
    }
}

testAuth();
