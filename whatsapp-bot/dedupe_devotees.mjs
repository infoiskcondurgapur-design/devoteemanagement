import sqlite3 from 'sqlite3';
import { readFileSync, writeFileSync } from 'fs';

const DB_PATH = './devotee_mgmt.db';
const db = new sqlite3.Database(DB_PATH);
const dbW = new sqlite3.Database(DB_PATH);

function q(sql, params = []) {
  return new Promise((res, rej) => db.all(sql, params, (e, r) => e ? rej(e) : res(r)));
}
function run(sql, params = []) {
  return new Promise((res, rej) => dbW.run(sql, params, function (e) { e ? rej(e) : res(this); }));
}

// (childTable, devoteeCol, uniqueKeyCols[]) - unique key cols used to avoid conflicts on remap
const CHILDREN = [
  { table: 'sadhana', devoteeCol: 'devoteeId', unique: [] },
  { table: 'attendance', devoteeCol: 'devoteeId', unique: ['devoteeId', 'eventName', 'eventDate'] },
  { table: 'counseling_sessions', devoteeCol: 'devoteeId', unique: [] },
  { table: 'seva_assignments', devoteeCol: 'devoteeId', unique: [] },
  { table: 'seva_shift_assignments', devoteeCol: 'devoteeId', unique: ['shiftId', 'devoteeId'] },
  { table: 'course_enrollments', devoteeCol: 'devoteeId', unique: ['courseId', 'devoteeId'] },
  { table: 'tour_enrollments', devoteeCol: 'devoteeId', unique: ['tourId', 'devoteeId'] },
  { table: 'donations', devoteeCol: 'devoteeId', unique: [] },
];

const norm = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');

const countNonNull = (r) => Object.entries(r).filter(([k, v]) => v !== null && v !== undefined && v !== '' && k !== 'photo').length;

const groups = await q(`
  SELECT contact, COUNT(*) as cnt, GROUP_CONCAT(id) as ids
  FROM devotees
  WHERE contact IS NOT NULL AND TRIM(contact) != ''
  GROUP BY contact HAVING cnt > 1
`);

console.log(`Duplicate contact groups: ${groups.length}`);

const removedRecords = [];
let removedCount = 0;
let skippedGroups = [];

for (const g of groups) {
  const recs = await q(`SELECT * FROM devotees WHERE contact = ?`, [g.contact]);

  // Group records by normalized name
  const byName = new Map();
  for (const r of recs) {
    const key = norm(r.name);
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key).push(r);
  }

  for (const [name, nameGroup] of byName) {
    if (nameGroup.length < 2) continue;

    // Choose keeper: most non-null fields, tie-break earliest createdAt
    const keeper = nameGroup.reduce((a, b) => {
      const ca = countNonNull(a), cb = countNonNull(b);
      if (ca !== cb) return ca > cb ? a : b;
      return (a.createdAt || '') <= (b.createdAt || '') ? a : b;
    });

    const removes = nameGroup.filter(r => r.id !== keeper.id);

    if (removes.length === 0) continue;

    // Remap child rows from each removed id -> keeper id
    for (const rm of removes) {
      for (const c of CHILDREN) {
        const moves = await q(`SELECT * FROM ${c.table} WHERE ${c.devoteeCol} = ?`, [rm.id]);
        for (const row of moves) {
          if (c.unique.length > 0) {
            const keyCond = c.unique.map(k => `${k} = ?`).join(' AND ');
            const keyVals = c.unique.map(k => row[k]);
            const existing = await q(
              `SELECT id FROM ${c.table} WHERE ${c.devoteeCol} = ? AND ${keyCond}`,
              [keeper.id, ...keyVals]
            );
            if (existing.length > 0) {
              // Keeper already has this unique row; drop the duplicate one
              await run(`DELETE FROM ${c.table} WHERE id = ?`, [row.id]);
              continue;
            }
          }
          await run(`UPDATE ${c.table} SET ${c.devoteeCol} = ? WHERE id = ?`, [keeper.id, row.id]);
        }
      }

      removedRecords.push(rm);
      await run(`DELETE FROM devotees WHERE id = ?`, [rm.id]);
      removedCount++;
      console.log(`REMOVED ${rm.id} (${rm.name}, contact ${g.contact}) -> keeper ${keeper.id} (${keeper.name})`);
    }
  }

  // If a contact group had only distinct-named records, flag it
  const remainingCount = (await q(`SELECT COUNT(*) as c FROM devotees WHERE contact = ?`, [g.contact]))[0].c;
  if (remainingCount > 1) {
    const names = (await q(`SELECT id, name FROM devotees WHERE contact = ?`, [g.contact])).map(r => `${r.id}:${r.name}`);
    skippedGroups.push({ contact: g.contact, names });
  }
}

console.log(`\nTotal removed: ${removedCount}`);
console.log(`Skipped (possible shared/multiple people):`);
for (const s of skippedGroups) console.log(`   ${s.contact} -> ${s.names.join(' | ')}`);

if (removedRecords.length > 0) {
  const out = `_dedupe_removed_${Date.now()}.json`;
  writeFileSync(out, JSON.stringify({ removedCount, timestamp: new Date().toISOString(), removed: removedRecords }, null, 2));
  console.log(`Backup of removed records written to ${out}`);
}

db.close();
dbW.close();