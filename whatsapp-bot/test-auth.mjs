import { google } from 'googleapis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const client_id = process.env.GOOGLE_CLIENT_ID;
const client_secret = process.env.GOOGLE_CLIENT_SECRET;
const redirect_uri = process.env.GOOGLE_REDIRECT_URI;

console.log('Testing credentials:');
console.log('ID:', client_id);
console.log('Secret:', client_secret ? 'Present (length: ' + client_secret.length + ')' : 'MISSING');
console.log('Redirect:', redirect_uri);

const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri);

// Try to generate an Auth URL - this doesn't hit the server but validates basic client setup
try {
    const url = oauth2Client.generateAuthUrl({ 
        access_type: 'offline', 
        scope: ['https://www.googleapis.com/auth/spreadsheets'],
        prompt: 'consent'
    });
    console.log('Auth URL:', url);
} catch (e) {
    console.error('Failed to generate Auth URL:', e.message);
}

// Since we have a code from the screenshot (partially visible), we can't test it here without a real code.
// But we can check if the client ID/Secret are valid by trying to refresh a dummy token (might give invalid_client if client info is bad)
async function test() {
    try {
        console.log('Attempting dummy token exchange to verify client info...');
        await oauth2Client.getToken('dummy_code');
    } catch (e) {
        console.log('Google Error Message:', e.message);
        // If it says 'invalid_grant', the client info is likely OK but the code is bad.
        // If it says 'invalid_client', the client ID/Secret are definitely rejected.
    }
}

test();
