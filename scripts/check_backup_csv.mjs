import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(__dirname, '../whatsapp-bot/node_modules/'));
const sqlite3 = require('sqlite3');

const content = fs.readFileSync(path.join(__dirname, '../whatsapp-bot/backups/backup_2026-03-14.csv'), 'utf8');
const lines = content.trim().split('\n').slice(1);
const db = new sqlite3.Database(path.join(__dirname, '../whatsapp-bot/devotee_mgmt.db'));

console.log(`Checking ${lines.length} records from backup_2026-03-14.csv...`);

for (const line of lines) {
    const parts = line.split(',');
    const id = parts[0].replace(/"/g, '');
    const name = parts[1].replace(/"/g, '');
    const contact = parts[5].replace(/"/g, '');
    db.get('SELECT id, name, contact FROM devotees WHERE id = ? OR contact = ? OR name = ?', [id, contact, name], (err, row) => {
        if (err) {
            console.error('Error:', err);
        } else if (!row) {
            console.log(`❌ NOT FOUND: ${name} (Contact: ${contact}, ID: ${id})`);
        } else {
            const idMatch = row.id === id ? 'ID MATCH' : `DIFF ID (DB: ${row.id})`;
            const contactMatch = row.contact === contact ? 'CONTACT MATCH' : `DIFF CONTACT (DB: ${row.contact})`;
            console.log(`✅ FOUND: ${name} -> ${idMatch}, ${contactMatch}`);
        }
    });
}
