import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { getPool } from '../api/_src/db.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(__dirname, '../whatsapp-bot/node_modules/'));
const sqlite3 = require('sqlite3');

// Load env
const envLocal = readFileSync('.env.local', 'utf8');
for (const line of envLocal.split('\n')) {
  const match = line.match(/^([^=]+)="?(.*?)"?$/);
  if (match) process.env[match[1]] = match[2].trim();
}

async function main() {
  console.log('--- Normalizing SQLite initiatedName <-> spiritualName ---');
  const sqlite = new sqlite3.Database('whatsapp-bot/devotee_mgmt.db');
  await new Promise((resolve, reject) => {
    sqlite.run(`
      UPDATE devotees 
      SET initiatedName = spiritualName 
      WHERE (initiatedName IS NULL OR initiatedName = '') 
        AND (spiritualName IS NOT NULL AND spiritualName != '')
    `, function (err) {
      if (err) return reject(err);
      console.log(`SQLite: Updated ${this.changes} rows with missing initiatedName from spiritualName.`);
      
      sqlite.run(`
        UPDATE devotees 
        SET spiritualName = initiatedName 
        WHERE (spiritualName IS NULL OR spiritualName = '') 
          AND (initiatedName IS NOT NULL AND initiatedName != '')
      `, function (err2) {
        if (err2) return reject(err2);
        console.log(`SQLite: Updated ${this.changes} rows with missing spiritualName from initiatedName.`);
        sqlite.close();
        resolve();
      });
    });
  });

  console.log('\n--- Normalizing PostgreSQL initiatedName <-> spiritualName ---');
  const pool = await getPool();
  const pgRes1 = await pool.query(`
    UPDATE devotees 
    SET initiatedname = spiritualname 
    WHERE (initiatedname IS NULL OR initiatedname = '') 
      AND (spiritualname IS NOT NULL AND spiritualname != '')
  `);
  console.log(`PostgreSQL: Updated ${pgRes1.rowCount} rows with missing initiatedname.`);

  const pgRes2 = await pool.query(`
    UPDATE devotees 
    SET spiritualname = initiatedname 
    WHERE (spiritualname IS NULL OR spiritualname = '') 
      AND (initiatedname IS NOT NULL AND initiatedname != '')
  `);
  console.log(`PostgreSQL: Updated ${pgRes2.rowCount} rows with missing spiritualname.`);
}

main().catch(console.error);
