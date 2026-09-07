import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localDbPath = path.join(__dirname, 'devotee_mgmt.db');
const appDataDbPath = process.env.APPDATA_PATH ? path.join(process.env.APPDATA_PATH, 'devotee_mgmt.db') : null;

// Explicit DB_PATH wins over every other location (throwaway DBs for regression
// tests / alternate environments). Otherwise prefer the local portable database
// if it exists, falling back to the AppData copy.
export const dbPath = process.env.DB_PATH
    || ((fs.existsSync(localDbPath))
        ? localDbPath
        : (appDataDbPath || localDbPath));

console.log('[DB] Using database at:', dbPath);
const db = new sqlite3.Database(dbPath);

// Generic SQLite async helpers
const runAsync = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
    });
});

const allAsync = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
    });
});

const getAsync = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
    });
});

const DEVOTEE_COLUMNS = [
    'id', 'name', 'spiritualName', 'email', 'gender', 'dob', 'age', 'bloodGroup',
    'education', 'occupation', 'relationType', 'guardianName', 'contact', 'whatsapp',
    'address', 'village', 'district', 'pinCode', 'state', 'maritalStatus', 'skills',
    'specialDay', 'specialDayName', 'spiritualStatus', 'initiatedName', 'counselor',
    'spiritualMaster', 'shelterDate', 'initiatedDate1', 'initiatedDate2', 'rounds',
    'followingPrinciplesSince', 'booksRead', 'booksReading', 'courses', 'anniversary',
    'child1Name', 'child1Dob', 'child1Status',
    'child2Name', 'child2Dob', 'child2Status',
    'child3Name', 'child3Dob', 'child3Status',
    'shraddhaName', 'shraddhaDate', 'feedback', 'otherFamilyMembers', 'currentService',
    'photo', 'status', 'createdAt'
];

/**
 * Migration Utility: Merges data from one database into another
 */
const mergeDatabases = (sourcePath, targetDb) => {
    return new Promise((resolve) => {
        if (!fs.existsSync(sourcePath)) return resolve(0);

        console.log(`[DB Merge] Checking source: ${sourcePath}`);
        const sourceDb = new sqlite3.Database(sourcePath);

        sourceDb.all("SELECT * FROM devotees", [], (err, devotees) => {
            if (err || !devotees) {
                sourceDb.close();
                return resolve(0);
            }

            let mergedCount = 0;
            let processed = 0;

            if (devotees.length === 0) {
                sourceDb.close();
                return resolve(0);
            }

            devotees.forEach(dev => {
                const cols = Object.keys(dev).join(', ');
                const placeholders = Object.keys(dev).map(() => '?').join(', ');
                const values = Object.values(dev);

                targetDb.run(`INSERT OR IGNORE INTO devotees (${cols}) VALUES (${placeholders})`, values, function (err) {
                    processed++;
                    if (this.changes > 0) mergedCount++;

                    if (processed === devotees.length) {
                        // Also merge sadhana entries
                        sourceDb.all("SELECT * FROM sadhana", [], (sadhanaErr, sadhanaRows) => {
                            if (!sadhanaErr && sadhanaRows) {
                                sadhanaRows.forEach(s => {
                                    const sCols = Object.keys(s).join(', ');
                                    const sPlaceholders = Object.keys(s).map(() => '?').join(', ');
                                    const sValues = Object.values(s);
                                    targetDb.run(`INSERT OR IGNORE INTO sadhana (${sCols}) VALUES (${sPlaceholders})`, sValues);
                                });
                            }
                            console.log(`[DB Merge] Successfully merged ${mergedCount} new devotees from ${sourcePath}`);
                            sourceDb.close();
                            resolve(mergedCount);
                        });
                    }
                });
            });
        });
    });
};

export const initDb = () => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Devotees Table
            db.run(`CREATE TABLE IF NOT EXISTS devotees (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                spiritualName TEXT,
                email TEXT,
                gender TEXT,
                dob TEXT,
                age INTEGER,
                bloodGroup TEXT,
                education TEXT,
                occupation TEXT,
                relationType TEXT,
                guardianName TEXT,
                contact TEXT,
                whatsapp TEXT,
                address TEXT,
                village TEXT,
                district TEXT,
                pinCode TEXT,
                state TEXT,
                maritalStatus TEXT,
                skills TEXT,
                specialDay TEXT,
                specialDayName TEXT,
                spiritualStatus TEXT,
                initiatedName TEXT,
                counselor TEXT,
                spiritualMaster TEXT,
                shelterDate TEXT,
                initiatedDate1 TEXT,
                initiatedDate2 TEXT,
                rounds INTEGER,
                followingPrinciplesSince TEXT,
                booksRead TEXT,
                booksReading TEXT,
                courses TEXT,
                anniversary TEXT,
                child1Name TEXT, child1Dob TEXT, child1Status TEXT,
                child2Name TEXT, child2Dob TEXT, child2Status TEXT,
                child3Name TEXT, child3Dob TEXT, child3Status TEXT,
                shraddhaName TEXT,
                shraddhaDate TEXT,
                feedback TEXT,
                otherFamilyMembers TEXT,
                currentService TEXT,
                photo TEXT,
                status TEXT DEFAULT 'Active',
                createdAt TEXT
            )`, async (err) => {
                if (err) reject(err);
                else {
                    try {
                        await healSchema();
                        // Perform auto-merge from whichever DB we are NOT using
                        const otherDbPath = (dbPath === localDbPath) ? appDataDbPath : localDbPath;
                        if (otherDbPath) {
                            await mergeDatabases(otherDbPath, db);
                        }
                    } catch (healErr) {
                        console.error('[DB] Post-Init Tasks Failed:', healErr);
                    }
                }
            });

            // System Logs Table
            db.run(`CREATE TABLE IF NOT EXISTS system_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT, -- 'error', 'info', 'repair'
                source TEXT, -- 'frontend', 'backend'
                message TEXT,
                stack TEXT,
                resolved INTEGER DEFAULT 0,
                timestamp TEXT
            )`, (err) => {
                if (err) reject(err);
            });

            // Sadhana Table
            db.run(`CREATE TABLE IF NOT EXISTS sadhana (
                id TEXT PRIMARY KEY,
                devoteeId TEXT,
                date TEXT,
                rounds INTEGER,
                timestamp TEXT,
                FOREIGN KEY (devoteeId) REFERENCES devotees (id)
            )`, (err) => { if (err) reject(err); });

            // Attendance Table
            db.run(`CREATE TABLE IF NOT EXISTS attendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                devoteeId TEXT NOT NULL,
                eventName TEXT NOT NULL,
                eventDate TEXT NOT NULL,
                markedBy TEXT DEFAULT 'admin',
                createdAt TEXT DEFAULT (datetime('now')),
                UNIQUE(devoteeId, eventName, eventDate),
                FOREIGN KEY (devoteeId) REFERENCES devotees (id)
            )`, (err) => { if (err) reject(err); });

            // Events Table
            db.run(`CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                eventType TEXT DEFAULT 'Sunday Feast',
                eventDate TEXT NOT NULL,
                description TEXT,
                location TEXT,
                createdAt TEXT DEFAULT (datetime('now'))
            )`, (err) => { if (err) reject(err); });

            // Counseling Sessions Table
            db.run(`CREATE TABLE IF NOT EXISTS counseling_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                devoteeId TEXT NOT NULL,
                counselor TEXT,
                sessionDate TEXT NOT NULL,
                mood TEXT DEFAULT 'Good',
                notes TEXT,
                followUpDate TEXT,
                createdAt TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (devoteeId) REFERENCES devotees (id)
            )`, (err) => { if (err) reject(err); });

            // Seva Assignments Table (Legacy/Fixed Roles)
            db.run(`CREATE TABLE IF NOT EXISTS seva_assignments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                devoteeId TEXT NOT NULL,
                department TEXT NOT NULL,
                role TEXT,
                startDate TEXT,
                notes TEXT,
                status TEXT DEFAULT 'Active',
                createdAt TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (devoteeId) REFERENCES devotees (id)
            )`, (err) => { if (err) reject(err); });

            // ─── Seva Scheduling ───
            db.run(`CREATE TABLE IF NOT EXISTS seva_shifts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                department TEXT NOT NULL,
                shiftName TEXT NOT NULL, -- e.g. 'Morning Deity Worship', 'Prasadam Serving'
                shiftDate TEXT NOT NULL,
                startTime TEXT,
                endTime TEXT,
                requiredVolunteers INTEGER DEFAULT 1,
                notes TEXT,
                createdAt TEXT DEFAULT (datetime('now'))
            )`, (err) => { if (err) reject(err); });

            db.run(`CREATE TABLE IF NOT EXISTS seva_shift_assignments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                shiftId INTEGER NOT NULL,
                devoteeId TEXT NOT NULL,
                status TEXT DEFAULT 'Confirmed', -- Confirmed, Cancelled, Completed
                createdAt TEXT DEFAULT (datetime('now')),
                UNIQUE(shiftId, devoteeId),
                FOREIGN KEY (shiftId) REFERENCES seva_shifts (id),
                FOREIGN KEY (devoteeId) REFERENCES devotees (id)
            )`, (err) => { if (err) reject(err); });

            // Donations Table
            db.run(`CREATE TABLE IF NOT EXISTS donations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                devoteeId TEXT,
                devoteeName TEXT,
                mobile TEXT,
                amount REAL NOT NULL,
                totalAmount REAL,
                dueAmount REAL,
                purpose TEXT,
                date TEXT NOT NULL,
                mode TEXT DEFAULT 'Cash',
                reference TEXT,
                createdAt TEXT DEFAULT (datetime('now'))
            )`, (err) => { if (err) reject(err); });

            // Expenses Table
            db.run(`CREATE TABLE IF NOT EXISTS expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                category TEXT NOT NULL,
                amount REAL NOT NULL,
                date TEXT NOT NULL,
                mode TEXT DEFAULT 'Cash',
                reference TEXT,
                notes TEXT,
                createdAt TEXT DEFAULT (datetime('now'))
            )`, (err) => { if (err) reject(err); });

            // Budgets Table
            db.run(`CREATE TABLE IF NOT EXISTS budgets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                department TEXT NOT NULL,
                amount REAL NOT NULL,
                month INTEGER NOT NULL,
                year INTEGER NOT NULL,
                createdAt TEXT DEFAULT (datetime('now')),
                UNIQUE(department, month, year)
            )`, (err) => { if (err) reject(err); });

            // Settings Table
            db.run(`CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updatedAt TEXT DEFAULT (datetime('now'))
            )`, (err) => {
                if (!err) {
                    db.run("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", ['automation_enabled', 'true']);
                    db.run("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", ['automation_time', '07:00']);
                    db.run("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", ['birthday_message', 'Hare Krishna {name}! 🙏\n\nMany many happy returns of the day! Wishing you a very Happy Birthday. May Lord Krishna bless you with more and more devotional service and spiritual progress. 🎂🌸✨\n\nBest wishes,\nISKCON Durgapur Team']);
                    db.run("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", ['anniversary_message', 'Hare Krishna {name}! 🙏\n\nWishing you a very Happy Marriage Anniversary! May your combined service to Guru and Gauranga grow stronger every day. May Lord Krishna bless your family with peace, prosperity, and pure devotion. 💐✨🕯️\n\nBest wishes,\nISKCON Durgapur Team']);
                }
            });

            // ─── Courses ───
            db.run(`CREATE TABLE IF NOT EXISTS courses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                startDate TEXT,
                endDate TEXT,
                status TEXT DEFAULT 'Upcoming',
                fees REAL DEFAULT 0,
                instructor TEXT,
                createdAt TEXT DEFAULT (datetime('now'))
            )`, (err) => { if (err) reject(err); });

            db.run(`CREATE TABLE IF NOT EXISTS course_enrollments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                courseId INTEGER NOT NULL,
                devoteeId TEXT NOT NULL,
                enrollmentDate TEXT NOT NULL,
                status TEXT DEFAULT 'Participated', -- Participated, Completed, Dropped
                totalPaid REAL DEFAULT 0,
                paymentStatus TEXT DEFAULT 'Due', -- Due, Partial, Completed
                certificateIssued INTEGER DEFAULT 0,
                createdAt TEXT DEFAULT (datetime('now')),
                UNIQUE(courseId, devoteeId),
                FOREIGN KEY (courseId) REFERENCES courses (id),
                FOREIGN KEY (devoteeId) REFERENCES devotees (id)
            )`, (err) => { if (err) reject(err); });

            db.run(`CREATE TABLE IF NOT EXISTS course_attendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                courseId INTEGER NOT NULL,
                devoteeId TEXT NOT NULL,
                sessionDate TEXT NOT NULL,
                markedBy TEXT DEFAULT 'admin',
                createdAt TEXT DEFAULT (datetime('now')),
                UNIQUE(courseId, devoteeId, sessionDate),
                FOREIGN KEY (courseId) REFERENCES courses (id),
                FOREIGN KEY (devoteeId) REFERENCES devotees (id)
            )`, (err) => { if (err) reject(err); });

            db.run(`CREATE TABLE IF NOT EXISTS course_payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                enrollmentId INTEGER NOT NULL,
                amount REAL NOT NULL,
                paymentDate TEXT NOT NULL,
                paymentMode TEXT DEFAULT 'Cash',
                reference TEXT,
                createdAt TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (enrollmentId) REFERENCES course_enrollments (id)
            )`, (err) => { if (err) reject(err); });

            // ─── Tours ───
            db.run(`CREATE TABLE IF NOT EXISTS tours (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                destination TEXT,
                startDate TEXT,
                endDate TEXT,
                status TEXT DEFAULT 'Upcoming',
                fees REAL DEFAULT 0,
                organizer TEXT,
                maxParticipants INTEGER,
                createdAt TEXT DEFAULT (datetime('now'))
            )`, (err) => { if (err) reject(err); });

            db.run(`CREATE TABLE IF NOT EXISTS tour_enrollments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tourId INTEGER NOT NULL,
                devoteeId TEXT,
                guestName TEXT,
                guestContact TEXT,
                bookingDate TEXT NOT NULL,
                status TEXT DEFAULT 'Reserved', -- Reserved, Confirmed, Cancelled
                totalPaid REAL DEFAULT 0,
                paymentStatus TEXT DEFAULT 'Due', -- Due, Partial, Completed
                createdAt TEXT DEFAULT (datetime('now')),
                UNIQUE(tourId, devoteeId),
                FOREIGN KEY (tourId) REFERENCES tours (id),
                FOREIGN KEY (devoteeId) REFERENCES devotees (id)
            )`, (err) => { if (err) reject(err); });

            db.run(`CREATE TABLE IF NOT EXISTS tour_payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                enrollmentId INTEGER NOT NULL,
                amount REAL NOT NULL,
                paymentDate TEXT NOT NULL,
                paymentMode TEXT DEFAULT 'Cash',
                reference TEXT,
                createdAt TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (enrollmentId) REFERENCES tour_enrollments (id)
            )`, (err) => { if (err) reject(err); });

            // ─── Inventory ───
            db.run(`CREATE TABLE IF NOT EXISTS inventory_categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                description TEXT,
                createdAt TEXT DEFAULT (datetime('now'))
            )`, (err) => { if (err) reject(err); });

            db.run(`CREATE TABLE IF NOT EXISTS inventory_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                categoryId INTEGER NOT NULL,
                name TEXT NOT NULL,
                sku TEXT UNIQUE,
                description TEXT,
                unit TEXT DEFAULT 'pcs', -- pcs, kg, ltr, etc.
                unitPrice REAL DEFAULT 0,
                stockLevel REAL DEFAULT 0,
                reorderLevel REAL DEFAULT 5,
                createdAt TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (categoryId) REFERENCES inventory_categories (id)
            )`, (err) => { if (err) reject(err); });

            db.run(`CREATE TABLE IF NOT EXISTS inventory_transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                itemId INTEGER NOT NULL,
                type TEXT NOT NULL, -- 'Stock In', 'Stock Out', 'Adjustment', 'Sale'
                quantity REAL NOT NULL,
                date TEXT NOT NULL,
                reason TEXT,
                reference TEXT,
                createdAt TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (itemId) REFERENCES inventory_items (id)
            )`, (err) => { if (err) reject(err); });

            // Users Table (server-side authentication)
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE,
                passwordHash TEXT NOT NULL,
                role TEXT DEFAULT 'admin',
                fullName TEXT,
                createdAt TEXT DEFAULT (datetime('now'))
            )`, (err) => { if (err) reject(err); });

            // Audit Logs Table
            db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId TEXT,
                userName TEXT,
                action TEXT NOT NULL,
                details TEXT,
                timestamp TEXT DEFAULT (datetime('now'))
            )`, (err) => {
                if (err) reject(err);
                else {
                    console.log('[DB] All tables initialized successfully');
                    resolve();
                }
            });
        });
    });
};

export const logAction = (userId, userName, action, details) => {
    return new Promise((resolve, reject) => {
        db.run("INSERT INTO audit_logs (userId, userName, action, details) VALUES (?, ?, ?, ?)",
            [userId, userName, action, details], function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
            });
    });
};

// ─── Users (authentication) ────────────────────────────────────────────
export const createUser = ({ username, email = null, passwordHash, role = 'admin', fullName = null }) => {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO users (username, email, passwordHash, role, fullName) VALUES (?, ?, ?, ?, ?)`,
            [username, email, passwordHash, role, fullName], function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
            });
    });
};

export const getUserByIdentity = (identity) => {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1`,
            [identity, identity], (err, row) => {
                if (err) reject(err);
                else resolve(row || null);
            });
    });
};

export const getUsers = () => {
    return new Promise((resolve, reject) => {
        db.all(`SELECT id, username, email, role, fullName, createdAt FROM users ORDER BY id ASC`, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
};

export const updateUserPassword = (id, passwordHash) => {
    return new Promise((resolve, reject) => {
        db.run(`UPDATE users SET passwordHash = ? WHERE id = ?`, [passwordHash, id], function (err) {
            if (err) reject(err);
            else resolve({ success: true, changes: this.changes });
        });
    });
};

export const healSchema = async () => {
    return new Promise((resolve, reject) => {
        db.all("PRAGMA table_info(devotees)", [], async (err, rows) => {
            if (err) return reject(err);
            const existingCols = rows.map(r => r.name);
            const missingCols = DEVOTEE_COLUMNS.filter(c => !existingCols.includes(c));

            if (missingCols.length > 0) {
                console.log(`[DB] Healing schema. Found ${missingCols.length} missing columns:`, missingCols);
                await new Promise(res => {
                    db.serialize(() => {
                        missingCols.forEach(col => {
                            db.run(`ALTER TABLE devotees ADD COLUMN ${col} TEXT`);
                        });
                        res();
                    });
                });
            }

            // Heal other tables...
            db.serialize(async () => {
                // Donations
                db.all("PRAGMA table_info(donations)", [], (err2, donationRows) => {
                    if (donationRows) {
                        const cols = donationRows.map(r => r.name);
                        if (!cols.includes('mobile')) db.run("ALTER TABLE donations ADD COLUMN mobile TEXT");
                        if (!cols.includes('totalAmount')) db.run("ALTER TABLE donations ADD COLUMN totalAmount REAL DEFAULT 0");
                    }
                });

                // Ensure payment tables exist (heal older databases missing them)
                db.run(`CREATE TABLE IF NOT EXISTS course_payments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    enrollmentId INTEGER NOT NULL,
                    amount REAL NOT NULL,
                    paymentDate TEXT NOT NULL,
                    paymentMode TEXT DEFAULT 'Cash',
                    reference TEXT,
                    createdAt TEXT DEFAULT (datetime('now')),
                    FOREIGN KEY (enrollmentId) REFERENCES course_enrollments (id)
                )`);
                db.run(`CREATE TABLE IF NOT EXISTS tour_payments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    enrollmentId INTEGER NOT NULL,
                    amount REAL NOT NULL,
                    paymentDate TEXT NOT NULL,
                    paymentMode TEXT DEFAULT 'Cash',
                    reference TEXT,
                    createdAt TEXT DEFAULT (datetime('now')),
                    FOREIGN KEY (enrollmentId) REFERENCES tour_enrollments (id)
                )`);

                // Non-unique index for duplicate-lookup performance (app-layer guard handles uniqueness;
                // a UNIQUE index would let INSERT OR REPLACE silently overwrite existing rows).
                db.run(`CREATE INDEX IF NOT EXISTS idx_devotees_contact ON devotees(contact)`);

                // Ensure users table exists on older databases
                db.run(`CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE,
                    passwordHash TEXT NOT NULL,
                    role TEXT DEFAULT 'admin',
                    fullName TEXT,
                    createdAt TEXT DEFAULT (datetime('now'))
                )`);

                // Run Data Repair
                try {
                    await runDataRepair();
                    logIssue('repair', 'backend', 'Automated data repair routines completed.');
                } catch (e) {
                    console.error('[DB] Data repair failed:', e);
                }

                resolve();
            });
        });
    });
};

export const runDataRepair = () => new Promise((resolve, reject) => {
    console.log('[DB] Starting Data Repair routines...');
    db.serialize(() => {
        // 1. Clean whitespace from devotee names
        db.run("UPDATE devotees SET name = TRIM(name), initiatedName = TRIM(initiatedName)");
        
        // 2. Fix contact numbers (basic normalization)
        db.all("SELECT id, contact FROM devotees WHERE contact IS NOT NULL AND contact != ''", [], (err, rows) => {
            if (rows) {
                rows.forEach(row => {
                    let cleaned = row.contact.replace(/[^0-9]/g, '');
                    if (cleaned.length === 10) cleaned = '91' + cleaned; // Add India country code if 10 digits
                    if (cleaned !== row.contact.replace(/[^0-9]/g, '')) {
                         db.run("UPDATE devotees SET contact = ? WHERE id = ?", [cleaned, row.id]);
                    }
                });
            }
        });

        // 3. Flag duplicates in logs
        db.all(`SELECT contact, COUNT(*) as count FROM devotees WHERE contact != '' GROUP BY contact HAVING count > 1`, [], (err, rows) => {
            if (rows && rows.length > 0) {
                rows.forEach(row => {
                    logIssue('warning', 'data-repair', `Duplicate contact found: ${row.contact} (${row.count} entries)`);
                });
            }
        });

        resolve({ success: true });
    });
});

export const logIssue = (type, source, message, stack = '') => {
    const timestamp = new Date().toISOString();
    return runAsync("INSERT INTO system_logs (type, source, message, stack, timestamp) VALUES (?, ?, ?, ?, ?)",
        [type, source, message, stack, timestamp]
    ).then(res => ({ id: res.lastID }));
};

export const getIssues = (unresolvedOnly = false) => {
    const query = unresolvedOnly ? "SELECT * FROM system_logs WHERE resolved = 0 ORDER BY timestamp DESC" : "SELECT * FROM system_logs ORDER BY timestamp DESC LIMIT 100";
    return allAsync(query);
};

export const resolveIssue = (id) => {
    return runAsync("UPDATE system_logs SET resolved = 1 WHERE id = ?", [id])
        .then(() => ({ success: true }));
};

export const clearIssues = () => {
    return runAsync("DELETE FROM system_logs")
        .then(() => ({ success: true }));
};

export const getDevotees = (limit = 50, offset = 0, search = '', filters = {}) => {
    return new Promise((resolve, reject) => {
        let query = "SELECT * FROM devotees";
        let countQuery = "SELECT COUNT(*) as total FROM devotees";
        const clauses = [];
        const params = [];

        if (search) {
            clauses.push("(name LIKE ? OR spiritualName LIKE ? OR contact LIKE ? OR initiatedName LIKE ?)");
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam, searchParam);
        }

        // Apply filters in SQLite
        if (filters.status) {
            clauses.push("status = ?");
            params.push(filters.status);
        }
        if (filters.gender) {
            clauses.push("gender = ?");
            params.push(filters.gender);
        }
        if (filters.spiritualStatus) {
            clauses.push("spiritualStatus = ?");
            params.push(filters.spiritualStatus);
        }
        if (filters.counselor) {
            clauses.push("counselor = ?");
            params.push(filters.counselor);
        }
        if (filters.district) {
            clauses.push("district = ?");
            params.push(filters.district);
        }

        const whereClause = clauses.length > 0 ? " WHERE " + clauses.join(" AND ") : "";
        query += whereClause;
        countQuery += whereClause;

        query += " ORDER BY createdAt DESC LIMIT ? OFFSET ?";
        const queryParams = [...params, limit, offset];

        db.get(countQuery, params, (err, countResult) => {
            if (err) return reject(err);
            db.all(query, queryParams, (err, rows) => {
                if (err) reject(err);
                else resolve({
                    data: rows,
                    total: countResult?.total || 0,
                    limit,
                    offset
                });
            });
        });
    });
};

export const getFilterOptions = () => {
    return new Promise((resolve, reject) => {
        db.all("SELECT DISTINCT counselor FROM devotees WHERE counselor IS NOT NULL AND counselor != '' ORDER BY counselor", [], (err, counselors) => {
            if (err) return reject(err);
            db.all("SELECT DISTINCT district FROM devotees WHERE district IS NOT NULL AND district != '' ORDER BY district", [], (err, districts) => {
                if (err) return reject(err);
                resolve({
                    counselors: (counselors || []).map(c => c.counselor),
                    districts: (districts || []).map(d => d.district)
                });
            });
        });
    });
};

export const addDevotee = (data) => {
    return new Promise((resolve, reject) => {
        const filteredData = {};
        DEVOTEE_COLUMNS.forEach(col => {
            if (data[col] !== undefined) {
                let val = data[col];
                if (Array.isArray(val)) val = JSON.stringify(val);
                filteredData[col] = val;
            }
        });

        const checkContact = (data.contact || '').toString().trim();
        const checkName = (data.name || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
        const checkExisting = (contact) => {
            return new Promise((res, rej) => {
                if (!contact || !checkName) return res();
                db.all(`SELECT id, name FROM devotees WHERE contact = ?`, [contact], (err, rows) => {
                    if (err) return rej(err);
                    const dup = (rows || []).find(
                        r => String(r.id) !== String(data.id)
                          && (r.name || '').toString().trim().toLowerCase().replace(/\s+/g, ' ') === checkName
                    );
                    if (dup) return rej(new Error(`A devotee with contact ${contact} (${dup.name}) already exists. Please search first instead of re-adding.`));
                    res();
                });
            });
        };

        checkExisting(checkContact).then(() => {
            const columns = Object.keys(filteredData).join(', ');
            const placeholders = Object.keys(filteredData).map(() => '?').join(', ');
            const values = Object.values(filteredData);

            db.run(`INSERT OR REPLACE INTO devotees (${columns}) VALUES (${placeholders})`, values, function (err) {
                if (err) {
                    console.error('[DB] Add Devotee Error:', err);
                    reject(err);
                } else {
                    resolve({ id: data.id });
                }
            });
        }).catch(reject);
    });
};

export const updateDevotee = (id, data) => {
    return new Promise((resolve, reject) => {
        const filteredData = {};
        DEVOTEE_COLUMNS.forEach(col => {
            if (data[col] !== undefined && col !== 'id') {
                let val = data[col];
                if (Array.isArray(val)) val = JSON.stringify(val);
                filteredData[col] = val;
            }
        });

        const checkContact = (filteredData.contact || '').toString().trim();
        const checkName = (filteredData.name || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
        const checkExisting = (contact) => {
            return new Promise((res, rej) => {
                if (!contact || !checkName) return res();
                db.all(`SELECT id, name FROM devotees WHERE contact = ?`, [contact], (err, rows) => {
                    if (err) return rej(err);
                    const dup = (rows || []).find(
                        r => String(r.id) !== String(id)
                          && (r.name || '').toString().trim().toLowerCase().replace(/\s+/g, ' ') === checkName
                    );
                    if (dup) return rej(new Error(`A devotee with contact ${contact} (${dup.name}) already exists. Please search first instead of re-adding.`));
                    res();
                });
            });
        };

        checkExisting(checkContact).then(() => {
            const sets = Object.keys(filteredData).map(key => `${key} = ?`).join(', ');
            const values = [...Object.values(filteredData), id];

            db.run(`UPDATE devotees SET ${sets} WHERE id = ?`, values, function (err) {
                if (err) {
                    console.error('[DB] Update Devotee Error:', err);
                    reject(err);
                } else {
                    resolve({ success: true });
                }
            });
        }).catch(reject);
    });
};

export const deleteDevotee = (id) => {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM devotees WHERE id = ?", [id], function (err) {
            if (err) reject(err);
            else resolve({ success: true });
        });
    });
};

export const getDevoteeStats = () => {
    return new Promise((resolve, reject) => {
        const today = new Date();
        const mm_dd = (today.getMonth() + 1).toString().padStart(2, '0') + '-' + today.getDate().toString().padStart(2, '0');
        const currentMonth = today.toISOString().slice(0, 7); // YYYY-MM

        const lastMonthDate = new Date();
        lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
        const lastMonth = lastMonthDate.toISOString().slice(0, 7); // YYYY-MM

        const query = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN spiritualStatus = 'Initiated' THEN 1 ELSE 0 END) as initiated,
                SUM(CASE WHEN spiritualStatus = 'Sheltered' THEN 1 ELSE 0 END) as sheltered,
                SUM(CASE WHEN (spiritualStatus = 'Aspiring' OR spiritualStatus IS NULL OR spiritualStatus = '') THEN 1 ELSE 0 END) as aspiring,
                (SELECT COUNT(*) FROM devotees WHERE strftime('%m-%d', dob) = ?) as birthdaysToday,
                (SELECT COUNT(*) FROM devotees WHERE strftime('%m-%d', anniversary) = ?) as anniversariesToday,
                (SELECT COUNT(*) FROM devotees WHERE strftime('%Y-%m', createdAt) = ?) as currentMonthRegistrations,
                (SELECT COUNT(*) FROM devotees WHERE strftime('%Y-%m', createdAt) = ?) as lastMonthRegistrations
            FROM devotees
        `;

        db.get(query, [mm_dd, mm_dd, currentMonth, lastMonth], async (err, row) => {
            if (err) {
                console.error('[DB] Stats Query Error:', err);
                return reject(err);
            }

            const stats = {
                total: row.total || 0,
                initiated: row.initiated || 0,
                sheltered: row.sheltered || 0,
                aspiring: row.aspiring || 0,
                birthdaysToday: row.birthdaysToday || 0,
                anniversariesToday: row.anniversariesToday || 0,
                currentMonthRegistrations: row.currentMonthRegistrations || 0,
                lastMonthRegistrations: row.lastMonthRegistrations || 0
            };

            // Calculate weekly activity
            const weeklyActivityQuery = `
                SELECT 
                    date(createdAt) as date,
                    COUNT(*) as count
                FROM devotees
                WHERE createdAt >= date('now', '-7 days')
                GROUP BY date(createdAt)
            `;

            db.all(weeklyActivityQuery, [], (err, activityRows) => {
                if (err) {
                    console.error('[DB] Weekly Activity Query Error:', err);
                    return resolve(stats); // Return what we have
                }

                const weeklyActivity = [];
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const dateStr = d.toISOString().split('T')[0];
                    const found = activityRows.find(r => r.date === dateStr);
                    weeklyActivity.push(found ? found.count : 0);
                }
                stats.weeklyActivity = weeklyActivity;

                // Birthdays/Anniversaries Lists
                db.all("SELECT id, name, initiatedName, photo, dob, contact, whatsapp FROM devotees WHERE strftime('%m-%d', dob) = ?", [mm_dd], (err, birthdays) => {
                    stats.birthdaysTodayList = birthdays || [];
                    db.all("SELECT id, name, initiatedName, photo, anniversary, contact, whatsapp FROM devotees WHERE strftime('%m-%d', anniversary) = ?", [mm_dd], (err, anniversaries) => {
                        stats.anniversariesTodayList = anniversaries || [];
                        resolve(stats);
                    });
                });
            });
        });
    });
};

export const getSadhana = (devoteeId) => {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM sadhana WHERE devoteeId = ? ORDER BY date DESC", [devoteeId], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

export const addSadhanaEntry = (entry) => {
    return new Promise((resolve, reject) => {
        const { id, devoteeId, date, rounds, timestamp } = entry;
        db.run("INSERT OR REPLACE INTO sadhana (id, devoteeId, date, rounds, timestamp) VALUES (?, ?, ?, ?, ?)",
            [id, devoteeId, date, rounds, timestamp], function (err) {
                if (err) reject(err);
                else resolve({ id });
            });
    });
};

export const deleteSadhanaEntry = (id) => {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM sadhana WHERE id = ?", [id], function (err) {
            if (err) reject(err);
            else resolve({ success: true });
        });
    });
};

export const getBackupData = () => {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM devotees", [], (err, devotees) => {
            if (err) return reject(err);
            db.all("SELECT * FROM sadhana", [], (err, sadhana) => {
                if (err) return reject(err);
                resolve({
                    devotees: devotees.map(d => ({
                        ...d,
                        booksRead: d.booksRead ? JSON.parse(d.booksRead) : [],
                        courses: d.courses ? JSON.parse(d.courses) : []
                    })),
                    sadhana,
                    timestamp: new Date().toISOString()
                });
            });
        });
    });
};

export const restoreFromBackup = (backupData) => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Start transaction
            db.run("BEGIN TRANSACTION", (err) => {
                if (err) return reject(err);
            });

            // Clear existing data
            db.run("DELETE FROM sadhana", (err) => {
                if (err) {
                    db.run("ROLLBACK");
                    return reject(err);
                }
            });

            db.run("DELETE FROM devotees", (err) => {
                if (err) {
                    db.run("ROLLBACK");
                    return reject(err);
                }
            });

            // Restore devotees
            const devotees = backupData.devotees || [];
            let devoteesRestored = 0;

            if (devotees.length === 0) {
                // No devotees to restore, move to sadhana
                restoreSadhana();
            } else {
                devotees.forEach((devotee, index) => {
                    const filteredData = {};
                    DEVOTEE_COLUMNS.forEach(col => {
                        if (devotee[col] !== undefined) {
                            let val = devotee[col];
                            if (Array.isArray(val)) val = JSON.stringify(val);
                            filteredData[col] = val;
                        }
                    });

                    const columns = Object.keys(filteredData).join(', ');
                    const placeholders = Object.keys(filteredData).map(() => '?').join(', ');
                    const values = Object.values(filteredData);

                    db.run(`INSERT INTO devotees (${columns}) VALUES (${placeholders})`, values, (err) => {
                        if (err) {
                            console.error('[DB] Restore Devotee Error:', err);
                            db.run("ROLLBACK");
                            return reject(err);
                        }
                        devoteesRestored++;
                        if (devoteesRestored === devotees.length) {
                            restoreSadhana();
                        }
                    });
                });
            }

            function restoreSadhana() {
                const sadhana = backupData.sadhana || [];
                let sadhanaRestored = 0;

                if (sadhana.length === 0) {
                    // No sadhana to restore, commit transaction
                    db.run("COMMIT", (err) => {
                        if (err) {
                            db.run("ROLLBACK");
                            return reject(err);
                        }
                        resolve({
                            success: true,
                            devoteesRestored: devotees.length,
                            sadhanaRestored: 0
                        });
                    });
                } else {
                    sadhana.forEach((entry, index) => {
                        const { id, devoteeId, date, rounds, timestamp } = entry;
                        db.run("INSERT INTO sadhana (id, devoteeId, date, rounds, timestamp) VALUES (?, ?, ?, ?, ?)",
                            [id, devoteeId, date, rounds, timestamp], (err) => {
                                if (err) {
                                    console.error('[DB] Restore Sadhana Error:', err);
                                    db.run("ROLLBACK");
                                    return reject(err);
                                }
                                sadhanaRestored++;
                                if (sadhanaRestored === sadhana.length) {
                                    // Commit transaction
                                    db.run("COMMIT", (err) => {
                                        if (err) {
                                            db.run("ROLLBACK");
                                            return reject(err);
                                        }
                                        resolve({
                                            success: true,
                                            devoteesRestored: devotees.length,
                                            sadhanaRestored: sadhana.length
                                        });
                                    });
                                }
                            });
                    });
                }
            }
        });
    });
};


// Attendance
export const markAttendance = ({ devoteeId, eventName, eventDate, markedBy = 'admin' }) => new Promise((resolve, reject) => {
    db.run(`INSERT OR IGNORE INTO attendance (devoteeId, eventName, eventDate, markedBy) VALUES (?, ?, ?, ?)`, [devoteeId, eventName, eventDate, markedBy], function (err) { if (err) reject(err); else resolve({ inserted: this.changes }); });
});
export const removeAttendance = ({ devoteeId, eventName, eventDate }) => new Promise((resolve, reject) => {
    db.run(`DELETE FROM attendance WHERE devoteeId=? AND eventName=? AND eventDate=?`, [devoteeId, eventName, eventDate], function (err) { if (err) reject(err); else resolve({ deleted: this.changes }); });
});
export const getAttendanceByEvent = (eventName, eventDate) => new Promise((resolve, reject) => {
    db.all(`SELECT a.devoteeId, d.name, d.photo, d.initiatedName, d.counselor FROM attendance a JOIN devotees d ON a.devoteeId=d.id WHERE a.eventName=? AND a.eventDate=?`, [eventName, eventDate], (err, rows) => { if (err) reject(err); else resolve(rows || []); });
});
export const getAttendanceSummary = () => new Promise((resolve, reject) => {
    db.all(`SELECT d.id, d.name, d.photo, d.initiatedName, d.counselor, COUNT(a.id) as totalAttendance, MAX(a.eventDate) as lastSeen FROM devotees d LEFT JOIN attendance a ON d.id=a.devoteeId GROUP BY d.id ORDER BY totalAttendance DESC`, [], (err, rows) => { if (err) reject(err); else resolve(rows || []); });
});
export const getRecentAttendanceEvents = (limit = 30) => new Promise((resolve, reject) => {
    db.all(`SELECT DISTINCT eventName, eventDate, COUNT(*) as attendeeCount FROM attendance GROUP BY eventName, eventDate ORDER BY eventDate DESC LIMIT ?`, [limit], (err, rows) => { if (err) reject(err); else resolve(rows || []); });
});

// Events
export const createEvent = (data) => new Promise((resolve, reject) => {
    db.run(`INSERT INTO events (name, eventType, eventDate, description, location) VALUES (?,?,?,?,?)`, [data.name, data.eventType || 'Sunday Feast', data.eventDate, data.description || '', data.location || ''], function (err) { if (err) reject(err); else resolve({ id: this.lastID }); });
});
export const updateEvent = (id, data) => new Promise((resolve, reject) => {
    db.run(`UPDATE events SET name=?, eventType=?, eventDate=?, description=?, location=? WHERE id=?`,
        [data.name, data.eventType || 'Sunday Feast', data.eventDate, data.description || '', data.location || '', id],
        function (err) { if (err) reject(err); else resolve({ success: true }); });
});
export const getEvents = (limit = 50) => new Promise((resolve, reject) => {
    db.all(`SELECT * FROM events ORDER BY eventDate DESC LIMIT ?`, [limit], (err, rows) => { if (err) reject(err); else resolve(rows || []); });
});
export const deleteEvent = (id) => new Promise((resolve, reject) => {
    db.run(`DELETE FROM events WHERE id=?`, [id], function (err) { if (err) reject(err); else resolve({ success: true }); });
});

export const createEventsBulk = (events) => new Promise((resolve, reject) => {
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        try {
            const stmt = db.prepare(`INSERT INTO events (name, eventType, eventDate, description, location) VALUES (?,?,?,?,?)`);
            events.forEach(data => {
                stmt.run([data.name, data.eventType || 'Sunday Feast', data.eventDate, data.description || '', data.location || '']);
            });
            stmt.finalize();
            db.run("COMMIT", (err) => {
                if (err) reject(err);
                else resolve({ success: true, count: events.length });
            });
        } catch (err) {
            db.run("ROLLBACK");
            reject(err);
        }
    });
});

// Counseling
export const addCounselingSession = (data) => new Promise((resolve, reject) => {
    db.run(`INSERT INTO counseling_sessions (devoteeId, counselor, sessionDate, mood, notes, followUpDate) VALUES (?,?,?,?,?,?)`, [data.devoteeId, data.counselor || '', data.sessionDate, data.mood || 'Good', data.notes || '', data.followUpDate || null], function (err) { if (err) reject(err); else resolve({ id: this.lastID }); });
});
export const getCounselingSessions = (devoteeId) => new Promise((resolve, reject) => {
    const q = devoteeId ? `SELECT cs.*, d.name as devoteeName FROM counseling_sessions cs JOIN devotees d ON cs.devoteeId=d.id WHERE cs.devoteeId=? ORDER BY cs.sessionDate DESC` : `SELECT cs.*, d.name as devoteeName FROM counseling_sessions cs JOIN devotees d ON cs.devoteeId=d.id ORDER BY cs.sessionDate DESC LIMIT 100`;
    db.all(q, devoteeId ? [devoteeId] : [], (err, rows) => { if (err) reject(err); else resolve(rows || []); });
});
export const deleteCounselingSession = (id) => new Promise((resolve, reject) => {
    db.run(`DELETE FROM counseling_sessions WHERE id=?`, [id], function (err) { if (err) reject(err); else resolve({ success: true }); });
});

// Raw
export const getAllDevoteesRaw = () => new Promise((resolve, reject) => {
    db.all('SELECT * FROM devotees ORDER BY createdAt DESC', [], (err, rows) => { if (err) reject(err); else resolve(rows || []); });
});

export const getDevoteeByPhone = (phone) => new Promise((resolve, reject) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    db.get(
        `SELECT * FROM devotees WHERE REPLACE(contact, '-', '') LIKE '%' || ? OR REPLACE(whatsapp, '-', '') LIKE '%' || ? LIMIT 1`,
        [cleanPhone, cleanPhone],
        (err, row) => { if (err) reject(err); else resolve(row); }
    );
});

export const getDevoteeById = (id) => new Promise((resolve, reject) => {
    db.get('SELECT * FROM devotees WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
    });
});

// ─── Seva Assignments ────────────────────────────────────────────────
export const addSeva = (data) => new Promise((resolve, reject) => {
    db.run(`INSERT INTO seva_assignments (devoteeId, department, role, startDate, notes, status) VALUES (?,?,?,?,?,?)`,
        [data.devoteeId, data.department, data.role || '', data.startDate || new Date().toISOString().slice(0, 10), data.notes || '', data.status || 'Active'],
        function (err) { if (err) reject(err); else resolve({ id: this.lastID }); });
});

export const getSevas = () => new Promise((resolve, reject) => {
    db.all(`SELECT sa.*, d.name as devoteeName, d.initiatedName, d.photo, d.counselor
            FROM seva_assignments sa
            LEFT JOIN devotees d ON sa.devoteeId = d.id
            ORDER BY sa.department, sa.createdAt DESC`, [], (err, rows) => {
        if (err) reject(err); else resolve(rows || []);
    });
});

export const updateSeva = (id, data) => new Promise((resolve, reject) => {
    const validCols = ['department', 'role', 'status', 'notes'];
    const keys = Object.keys(data).filter(k => validCols.includes(k));
    const sets = keys.map(k => `${k} = ?`).join(', ');
    const vals = [...keys.map(k => data[k]), id];
    db.run(`UPDATE seva_assignments SET ${sets} WHERE id = ?`, vals, function (err) { if (err) reject(err); else resolve({ success: true }); });
});

export const deleteSeva = (id) => new Promise((resolve, reject) => {
    db.run(`DELETE FROM seva_assignments WHERE id = ?`, [id], function (err) { if (err) reject(err); else resolve({ success: true }); });
});

// ─── Seva Scheduling ────────────────────────────────────────────────────
export const createSevaShift = (data) => new Promise((resolve, reject) => {
    db.run(`INSERT INTO seva_shifts (department, shiftName, shiftDate, startTime, endTime, requiredVolunteers, notes) VALUES (?,?,?,?,?,?,?)`,
        [data.department, data.shiftName, data.shiftDate, data.startTime || '', data.endTime || '', data.requiredVolunteers || 1, data.notes || ''],
        function (err) { if (err) reject(err); else resolve({ id: this.lastID }); });
});

export const getSevaShifts = (date = null, department = null) => new Promise((resolve, reject) => {
    let q = `SELECT * FROM seva_shifts`;
    const params = [];
    if (date || department) {
        q += ' WHERE';
        if (date) { q += ' shiftDate = ?'; params.push(date); }
        if (date && department) q += ' AND';
        if (department) { q += ' department = ?'; params.push(department); }
    }
    q += ' ORDER BY shiftDate ASC, startTime ASC';
    db.all(q, params, (err, rows) => { if (err) reject(err); else resolve(rows || []); });
});

export const updateSevaShift = (id, data) => new Promise((resolve, reject) => {
    const validCols = ['department', 'shiftName', 'shiftDate', 'startTime', 'endTime', 'requiredVolunteers', 'notes'];
    const keys = Object.keys(data).filter(k => validCols.includes(k));
    const sets = keys.map(k => `${k} = ?`).join(', ');
    const vals = [...keys.map(k => data[k]), id];
    db.run(`UPDATE seva_shifts SET ${sets} WHERE id = ?`, vals, function (err) { if (err) reject(err); else resolve({ success: true }); });
});

export const deleteSevaShift = (id) => new Promise((resolve, reject) => {
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        db.run(`DELETE FROM seva_shift_assignments WHERE shiftId = ?`, [id]);
        db.run(`DELETE FROM seva_shifts WHERE id = ?`, [id], function (err) {
            if (err) { db.run("ROLLBACK"); reject(err); }
            else { db.run("COMMIT"); resolve({ success: true }); }
        });
    });
});

export const assignToShift = (data) => new Promise((resolve, reject) => {
    db.run(`INSERT INTO seva_shift_assignments (shiftId, devoteeId, status) VALUES (?,?,?)`,
        [data.shiftId, data.devoteeId, data.status || 'Confirmed'],
        function (err) { if (err) reject(err); else resolve({ id: this.lastID }); });
});

export const getShiftAssignments = (shiftId) => new Promise((resolve, reject) => {
    db.all(`SELECT ssa.*, d.name as devoteeName, d.spiritualName, d.initiatedName, d.photo, d.contact 
            FROM seva_shift_assignments ssa 
            JOIN devotees d ON ssa.devoteeId = d.id 
            WHERE ssa.shiftId = ?`, [shiftId], (err, rows) => { if (err) reject(err); else resolve(rows || []); });
});

export const removeShiftAssignment = (id) => new Promise((resolve, reject) => {
    db.run(`DELETE FROM seva_shift_assignments WHERE id = ?`, [id], function (err) { if (err) reject(err); else resolve({ success: true }); });
});

export const getSevaSchedule = (startDate, endDate) => new Promise((resolve, reject) => {
    db.all(`SELECT ss.*, (SELECT COUNT(*) FROM seva_shift_assignments WHERE shiftId = ss.id) as volunteerCount
            FROM seva_shifts ss
            WHERE shiftDate BETWEEN ? AND ?
            ORDER BY shiftDate ASC, startTime ASC`, [startDate, endDate], (err, rows) => { if (err) reject(err); else resolve(rows || []); });
});

// ─── Donations ───────────────────────────────────────────────────────
export const addDonation = (data) => new Promise((resolve, reject) => {
    db.run(`INSERT INTO donations (devoteeId, devoteeName, mobile, amount, totalAmount, dueAmount, purpose, date, mode, reference) VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [data.devoteeId || null, data.devoteeName || '', data.mobile || '', data.amount, data.totalAmount || data.amount, data.dueAmount || 0, data.purpose || '', data.date, data.mode || 'Cash', data.reference || ''],
        function (err) { if (err) reject(err); else resolve({ id: this.lastID }); });
});

export const getDonations = (limit = 200) => new Promise((resolve, reject) => {
    db.all(`SELECT dn.*, d.name as devoteeNameFull, d.initiatedName, d.photo
            FROM donations dn
            LEFT JOIN devotees d ON dn.devoteeId = d.id
            ORDER BY dn.date DESC, dn.createdAt DESC LIMIT ?`, [limit], (err, rows) => {
        if (err) reject(err); else resolve(rows || []);
    });
});

export const deleteDonation = (id) => new Promise((resolve, reject) => {
    db.run(`DELETE FROM donations WHERE id = ?`, [id], function (err) {
        if (err) reject(err); else resolve({ success: true });
    });
});

// ─── Expenses ───────────────────────────────────────────────────────
export const addExpense = (data) => new Promise((resolve, reject) => {
    db.run(`INSERT INTO expenses (title, category, amount, date, mode, reference, notes) VALUES (?,?,?,?,?,?,?)`,
        [data.title || '', data.category || 'General', data.amount, data.date, data.mode || 'Cash', data.reference || '', data.notes || ''],
        function (err) { if (err) reject(err); else resolve({ id: this.lastID }); });
});

export const getExpenses = (limit = 200) => new Promise((resolve, reject) => {
    db.all(`SELECT * FROM expenses ORDER BY date DESC, createdAt DESC LIMIT ?`, [limit], (err, rows) => {
        if (err) reject(err); else resolve(rows || []);
    });
});

export const deleteExpense = (id) => new Promise((resolve, reject) => {
    db.run(`DELETE FROM expenses WHERE id = ?`, [id], function (err) {
        if (err) reject(err); else resolve({ success: true });
    });
});

export const getFinanceStats = () => new Promise((resolve, reject) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    const stats = {
        totalIncome: 0,
        totalIncomeThisMonth: 0,
        totalExpenses: 0,
        totalExpensesThisMonth: 0,
        netBalance: 0,
        donationsCount: 0,
        expensesCount: 0,
        byPurpose: [],
        expenseByCategory: []
    };

    db.get(`SELECT
        SUM(amount) as totalAll,
        SUM(CASE WHEN strftime('%Y-%m', date) = ? THEN amount ELSE 0 END) as totalThisMonth,
        COUNT(*) as totalCount
        FROM donations`, [currentMonth], (err, incRow) => {
        if (err) return reject(err);
        
        stats.totalIncome = incRow?.totalAll || 0;
        stats.totalIncomeThisMonth = incRow?.totalThisMonth || 0;
        stats.donationsCount = incRow?.totalCount || 0;

        db.get(`SELECT
            SUM(amount) as totalAll,
            SUM(CASE WHEN strftime('%Y-%m', date) = ? THEN amount ELSE 0 END) as totalThisMonth,
            COUNT(*) as totalCount
            FROM expenses`, [currentMonth], (err2, expRow) => {
            if (err2) return reject(err2);

            stats.totalExpenses = expRow?.totalAll || 0;
            stats.totalExpensesThisMonth = expRow?.totalThisMonth || 0;
            stats.expensesCount = expRow?.totalCount || 0;
            stats.netBalance = stats.totalIncome - stats.totalExpenses;

            db.all(`SELECT purpose, SUM(amount) as total FROM donations GROUP BY purpose ORDER BY total DESC LIMIT 5`, [], (err3, byPurpose) => {
                if (err3) return reject(err3);
                stats.byPurpose = byPurpose || [];

                db.all(`SELECT category, SUM(amount) as total FROM expenses GROUP BY category ORDER BY total DESC LIMIT 5`, [], (err4, expByCat) => {
                    if (err4) return reject(err4);
                    stats.expenseByCategory = expByCat || [];
                    
                    // For backward compatibility
                    stats.totalAll = stats.totalIncome;
                    stats.totalThisMonth = stats.totalIncomeThisMonth;
                    stats.totalCount = stats.donationsCount;

                    resolve(stats);
                });
            });
        });
    });
});


// ─── Courses Logic ──────────────────────────────────────────────────
export const createCourse = (data) => new Promise((resolve, reject) => {
    db.run(`INSERT INTO courses (name, description, startDate, endDate, status, fees, instructor) VALUES (?,?,?,?,?,?,?)`,
        [data.name, data.description || '', data.startDate, data.endDate, data.status || 'Upcoming', data.fees || 0, data.instructor || ''],
        function (err) { if (err) reject(err); else resolve({ id: this.lastID }); });
});

export const getCourses = (upcomingOnly = false) => new Promise((resolve, reject) => {
    const q = upcomingOnly ? `SELECT * FROM courses WHERE status != 'Completed' ORDER BY startDate ASC` : `SELECT * FROM courses ORDER BY startDate DESC`;
    db.all(q, [], (err, rows) => { if (err) reject(err); else resolve(rows || []); });
});

export const getCourseById = (id) => new Promise((resolve, reject) => {
    db.get(`SELECT * FROM courses WHERE id = ?`, [id], (err, row) => { if (err) reject(err); else resolve(row || null); });
});

export const updateCourse = (id, data) => new Promise((resolve, reject) => {
    const validCols = ['name', 'description', 'startDate', 'endDate', 'status', 'fees', 'instructor'];
    const keys = Object.keys(data).filter(k => validCols.includes(k));
    const sets = keys.map(k => `${k} = ?`).join(', ');
    const vals = [...keys.map(k => data[k]), id];
    db.run(`UPDATE courses SET ${sets} WHERE id = ?`, vals, function (err) { if (err) reject(err); else resolve({ success: true }); });
});

export const deleteCourse = (id) => new Promise((resolve, reject) => {
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        db.run(`DELETE FROM course_payments WHERE enrollmentId IN (SELECT id FROM course_enrollments WHERE courseId = ?)`, [id]);
        db.run(`DELETE FROM course_enrollments WHERE courseId = ?`, [id]);
        db.run(`DELETE FROM courses WHERE id = ?`, [id], function (err) {
            if (err) { db.run("ROLLBACK"); reject(err); }
            else { db.run("COMMIT"); resolve({ success: true }); }
        });
    });
});

// ─── Enrollments ───────────────────────────────────────────────────
export const enrollDevotee = (data) => new Promise((resolve, reject) => {
    db.run(`INSERT INTO course_enrollments (courseId, devoteeId, enrollmentDate, status, totalPaid, paymentStatus) VALUES (?,?,?,?,?,?)`,
        [data.courseId, data.devoteeId, data.enrollmentDate || new Date().toISOString().slice(0, 10), 'Participated', 0, 'Due'],
        function (err) { if (err) reject(err); else resolve({ id: this.lastID }); });
});

export const getCourseEnrollments = (courseId) => new Promise((resolve, reject) => {
    db.all(`SELECT ce.*, d.name as devoteeName, d.spiritualName, d.initiatedName, d.contact, d.photo, d.whatsapp,
            (SELECT COUNT(*) FROM course_attendance ca WHERE ca.courseId = ce.courseId AND ca.devoteeId = ce.devoteeId) as attendedSessions
            FROM course_enrollments ce
            JOIN devotees d ON ce.devoteeId = d.id
            WHERE ce.courseId = ?`, [courseId], (err, rows) => { if (err) reject(err); else resolve(rows || []); });
});

// ─── Course Attendance ───
export const markCourseAttendance = ({ courseId, devoteeId, sessionDate, markedBy = 'admin' }) => new Promise((resolve, reject) => {
    db.run(`INSERT OR IGNORE INTO course_attendance (courseId, devoteeId, sessionDate, markedBy) VALUES (?, ?, ?, ?)`,
        [courseId, devoteeId, sessionDate, markedBy],
        function (err) { if (err) reject(err); else resolve({ inserted: this.changes }); });
});
export const removeCourseAttendance = ({ courseId, devoteeId, sessionDate }) => new Promise((resolve, reject) => {
    db.run(`DELETE FROM course_attendance WHERE courseId=? AND devoteeId=? AND sessionDate=?`,
        [courseId, devoteeId, sessionDate],
        function (err) { if (err) reject(err); else resolve({ deleted: this.changes }); });
});
export const getCourseAttendanceBySession = (courseId, sessionDate) => new Promise((resolve, reject) => {
    db.all(`SELECT devoteeId FROM course_attendance WHERE courseId=? AND sessionDate=?`,
        [courseId, sessionDate], (err, rows) => { if (err) reject(err); else resolve(rows || []); });
});
export const getCourseAttendanceSummary = (courseId) => new Promise((resolve, reject) => {
    db.all(`
        SELECT ce.devoteeId, COUNT(ca.id) as attendedSessions
        FROM course_enrollments ce
        LEFT JOIN course_attendance ca ON ce.courseId = ca.courseId AND ce.devoteeId = ca.devoteeId
        WHERE ce.courseId = ?
        GROUP BY ce.devoteeId
    `, [courseId], (err, rows) => { if (err) reject(err); else resolve(rows || []); });
});
export const syncCourseAttendance = (courseId, sessionDate, devoteeIds, markedBy = 'admin') => new Promise((resolve, reject) => {
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        db.run(`DELETE FROM course_attendance WHERE courseId=? AND sessionDate=?`, [courseId, sessionDate]);
        if (devoteeIds && devoteeIds.length > 0) {
            const stmt = db.prepare(`INSERT INTO course_attendance (courseId, devoteeId, sessionDate, markedBy) VALUES (?, ?, ?, ?)`);
            devoteeIds.forEach(devoteeId => {
                stmt.run([courseId, devoteeId, sessionDate, markedBy]);
            });
            stmt.finalize();
        }
        db.run("COMMIT", function (err) {
            if (err) {
                db.run("ROLLBACK");
                reject(err);
            } else {
                resolve({ success: true });
            }
        });
    });
});

export const updateEnrollment = (id, data) => new Promise((resolve, reject) => {
    const validCols = ['status', 'certificateIssued', 'totalPaid', 'paymentStatus'];
    const keys = Object.keys(data).filter(k => validCols.includes(k));
    const sets = keys.map(k => `${k} = ?`).join(', ');
    const vals = [...keys.map(k => data[k]), id];
    db.run(`UPDATE course_enrollments SET ${sets} WHERE id = ?`, vals, function (err) { if (err) reject(err); else resolve({ success: true }); });
});

export const deleteEnrollment = (id) => new Promise((resolve, reject) => {
    db.run(`DELETE FROM course_enrollments WHERE id = ?`, [id], function (err) {
        if (err) reject(err); else resolve({ success: true, changes: this.changes });
    });
});

// ─── Payments ──────────────────────────────────────────────────────
export const addCoursePayment = (data) => new Promise((resolve, reject) => {
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        db.run(`INSERT INTO course_payments (enrollmentId, amount, paymentDate, paymentMode, reference) VALUES (?,?,?,?,?)`,
            [data.enrollmentId, data.amount, data.paymentDate || new Date().toISOString().slice(0, 10), data.paymentMode || 'Cash', data.reference || ''],
            function (err) {
                if (err) { db.run("ROLLBACK"); return reject(err); }
                const paymentId = this.lastID;

                // Update enrollment totals
                db.get(`SELECT ce.totalPaid, c.fees FROM course_enrollments ce JOIN courses c ON ce.courseId = c.id WHERE ce.id = ?`, [data.enrollmentId], (err, row) => {
                    if (err || !row) { db.run("ROLLBACK"); return reject(err || new Error("Enrollment not found")); }
                    const newTotal = Number(row.totalPaid) + Number(data.amount);
                    let paymentStatus = 'Partial';
                    if (newTotal >= row.fees) paymentStatus = 'Completed';
                    if (newTotal <= 0) paymentStatus = 'Due';

                    db.run(`UPDATE course_enrollments SET totalPaid = ?, paymentStatus = ? WHERE id = ?`, [newTotal, paymentStatus, data.enrollmentId], function (err) {
                        if (err) { db.run("ROLLBACK"); reject(err); }
                        else { db.run("COMMIT"); resolve({ id: paymentId, newTotal, paymentStatus }); }
                    });
                });
            });
    });
});

export const getEnrollmentPayments = (enrollmentId) => new Promise((resolve, reject) => {
    db.all(`SELECT * FROM course_payments WHERE enrollmentId = ? ORDER BY paymentDate DESC`, [enrollmentId], (err, rows) => { if (err) reject(err); else resolve(rows || []); });
});

// ─── Tours Logic ──────────────────────────────────────────────────
export const createTour = (data) => new Promise((resolve, reject) => {
    db.run(`INSERT INTO tours (name, destination, startDate, endDate, status, fees, organizer, maxParticipants) VALUES (?,?,?,?,?,?,?,?)`,
        [data.name, data.destination || '', data.startDate, data.endDate, data.status || 'Upcoming', data.fees || 0, data.organizer || '', data.maxParticipants || null],
        function (err) { if (err) reject(err); else resolve({ id: this.lastID }); });
});

export const getTours = (upcomingOnly = false) => new Promise((resolve, reject) => {
    const q = upcomingOnly ? `SELECT * FROM tours WHERE status != 'Completed' ORDER BY startDate ASC` : `SELECT * FROM tours ORDER BY startDate DESC`;
    db.all(q, [], (err, rows) => { if (err) reject(err); else resolve(rows || []); });
});

export const getTourById = (id) => new Promise((resolve, reject) => {
    db.get(`SELECT * FROM tours WHERE id = ?`, [id], (err, row) => { if (err) reject(err); else resolve(row || null); });
});

export const updateTour = (id, data) => new Promise((resolve, reject) => {
    const validCols = ['name', 'destination', 'startDate', 'endDate', 'status', 'fees', 'organizer', 'maxParticipants'];
    const keys = Object.keys(data).filter(k => validCols.includes(k));
    const sets = keys.map(k => `${k} = ?`).join(', ');
    const vals = [...keys.map(k => data[k]), id];
    db.run(`UPDATE tours SET ${sets} WHERE id = ?`, vals, function (err) { if (err) reject(err); else resolve({ success: true }); });
});

export const deleteTour = (id) => new Promise((resolve, reject) => {
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        db.run(`DELETE FROM tour_payments WHERE enrollmentId IN (SELECT id FROM tour_enrollments WHERE tourId = ?)`, [id]);
        db.run(`DELETE FROM tour_enrollments WHERE tourId = ?`, [id]);
        db.run(`DELETE FROM tours WHERE id = ?`, [id], function (err) {
            if (err) { db.run("ROLLBACK"); reject(err); }
            else { db.run("COMMIT"); resolve({ success: true }); }
        });
    });
});

// ─── Tour Enrollments ───────────────────────────────────────────────────
export const enrollInTour = (data) => new Promise((resolve, reject) => {
    // Workaround for NOT NULL constraint on devoteeId in existing databases
    const effectiveDevoteeId = data.devoteeId || `GUEST_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    db.run(`INSERT INTO tour_enrollments (tourId, devoteeId, guestName, guestContact, bookingDate, status, totalPaid, paymentStatus) VALUES (?,?,?,?,?,?,?,?)`,
        [data.tourId, effectiveDevoteeId, data.guestName || null, data.guestContact || null, data.bookingDate || new Date().toISOString().slice(0, 10), 'Reserved', 0, 'Due'],
        function (err) { if (err) reject(err); else resolve({ id: this.lastID }); });
});

export const getTourEnrollments = (tourId) => new Promise((resolve, reject) => {
    db.all(`SELECT te.*, d.name as devoteeName, d.spiritualName, d.initiatedName, d.contact, d.photo, d.whatsapp
            FROM tour_enrollments te
            LEFT JOIN devotees d ON te.devoteeId = d.id
            WHERE te.tourId = ?`, [tourId], (err, rows) => { if (err) reject(err); else resolve(rows || []); });
});

export const updateTourEnrollment = (id, data) => new Promise((resolve, reject) => {
    const validCols = ['status', 'totalPaid', 'paymentStatus'];
    const keys = Object.keys(data).filter(k => validCols.includes(k));
    const sets = keys.map(k => `${k} = ?`).join(', ');
    const vals = [...keys.map(k => data[k]), id];
    db.run(`UPDATE tour_enrollments SET ${sets} WHERE id = ?`, vals, function (err) { if (err) reject(err); else resolve({ success: true }); });
});

export const deleteTourEnrollment = (id) => new Promise((resolve, reject) => {
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        db.run(`DELETE FROM tour_payments WHERE enrollmentId = ?`, [id]);
        db.run(`DELETE FROM tour_enrollments WHERE id = ?`, [id], function (err) {
            if (err) { db.run("ROLLBACK"); reject(err); }
            else { db.run("COMMIT"); resolve({ success: true }); }
        });
    });
});

// ─── Tour Payments ──────────────────────────────────────────────────────
export const addTourPayment = (data) => new Promise((resolve, reject) => {
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        db.run(`INSERT INTO tour_payments (enrollmentId, amount, paymentDate, paymentMode, reference) VALUES (?,?,?,?,?)`,
            [data.enrollmentId, data.amount, data.paymentDate || new Date().toISOString().slice(0, 10), data.paymentMode || 'Cash', data.reference || ''],
            function (err) {
                if (err) { db.run("ROLLBACK"); return reject(err); }
                const paymentId = this.lastID;

                db.get(`SELECT te.totalPaid, t.fees FROM tour_enrollments te JOIN tours t ON te.tourId = t.id WHERE te.id = ?`, [data.enrollmentId], (err, row) => {
                    if (err || !row) { db.run("ROLLBACK"); return reject(err || new Error("Tour Enrollment not found")); }
                    const newTotal = Number(row.totalPaid) + Number(data.amount);
                    let paymentStatus = 'Partial';
                    if (newTotal >= row.fees) paymentStatus = 'Completed';
                    if (newTotal <= 0) paymentStatus = 'Due';

                    db.run(`UPDATE tour_enrollments SET totalPaid = ?, paymentStatus = ? WHERE id = ?`, [newTotal, paymentStatus, data.enrollmentId], function (err) {
                        if (err) { db.run("ROLLBACK"); reject(err); }
                        else { db.run("COMMIT"); resolve({ id: paymentId, newTotal, paymentStatus }); }
                    });
                });
            });
    });
});

export const getTourPayments = (enrollmentId) => new Promise((resolve, reject) => {
    db.all(`SELECT * FROM tour_payments WHERE enrollmentId = ? ORDER BY paymentDate DESC`, [enrollmentId], (err, rows) => { if (err) reject(err); else resolve(rows || []); });
});


// ─── Inventory ──────────────────────────────────────────────────────────
export const getInventoryCategories = () => new Promise((resolve, reject) => {
    db.all(`SELECT * FROM inventory_categories ORDER BY name ASC`, [], (err, rows) => { if (err) reject(err); else resolve(rows || []); });
});

export const addInventoryCategory = (data) => new Promise((resolve, reject) => {
    db.run(`INSERT INTO inventory_categories (name, description) VALUES (?, ?)`, [data.name, data.description || ''], function (err) { if (err) reject(err); else resolve({ id: this.lastID }); });
});

export const updateInventoryCategory = (id, data) => new Promise((resolve, reject) => {
    db.run(`UPDATE inventory_categories SET name = ?, description = ? WHERE id = ?`, [data.name, data.description || '', id], function (err) { if (err) reject(err); else resolve({ success: true }); });
});

export const deleteInventoryCategory = (id) => new Promise((resolve, reject) => {
    // Check if category has items
    db.get(`SELECT COUNT(*) as count FROM inventory_items WHERE categoryId = ?`, [id], (err, row) => {
        if (err) return reject(err);
        if (row.count > 0) return reject(new Error('Cannot delete category with active items'));
        db.run(`DELETE FROM inventory_categories WHERE id = ?`, [id], function (err) { if (err) reject(err); else resolve({ success: true }); });
    });
});

export const getInventoryItems = (categoryId = null) => new Promise((resolve, reject) => {
    let q = `SELECT i.*, c.name as categoryName FROM inventory_items i JOIN inventory_categories c ON i.categoryId = c.id`;
    const params = [];
    if (categoryId) {
        q += ` WHERE i.categoryId = ?`;
        params.push(categoryId);
    }
    q += ` ORDER BY i.name ASC`;
    db.all(q, params, (err, rows) => { if (err) reject(err); else resolve(rows || []); });
});

export const getInventoryItemById = (id) => new Promise((resolve, reject) => {
    db.get(`SELECT i.*, c.name as categoryName FROM inventory_items i JOIN inventory_categories c ON i.categoryId = c.id WHERE i.id = ?`, [id], (err, row) => { if (err) reject(err); else resolve(row || null); });
});

export const addInventoryItem = (data) => new Promise((resolve, reject) => {
    db.run(`INSERT INTO inventory_items (categoryId, name, sku, description, unit, unitPrice, stockLevel, reorderLevel) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.categoryId, data.name, data.sku || null, data.description || '', data.unit || 'pcs', data.unitPrice || 0, data.stockLevel || 0, data.reorderLevel || 5],
        function (err) { if (err) reject(err); else resolve({ id: this.lastID }); });
});

export const updateInventoryItem = (id, data) => new Promise((resolve, reject) => {
    const validCols = ['categoryId', 'name', 'sku', 'description', 'unit', 'unitPrice', 'stockLevel', 'reorderLevel'];
    const keys = Object.keys(data).filter(k => validCols.includes(k));
    const sets = keys.map(k => `${k} = ?`).join(', ');
    const vals = [...keys.map(k => data[k]), id];
    db.run(`UPDATE inventory_items SET ${sets} WHERE id = ?`, vals, function (err) { if (err) reject(err); else resolve({ success: true }); });
});

export const deleteInventoryItem = (id) => new Promise((resolve, reject) => {
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        db.run(`DELETE FROM inventory_transactions WHERE itemId = ?`, [id]);
        db.run(`DELETE FROM inventory_items WHERE id = ?`, [id], function (err) {
            if (err) { db.run("ROLLBACK"); reject(err); }
            else { db.run("COMMIT"); resolve({ success: true }); }
        });
    });
});

export const addInventoryTransaction = (data) => new Promise((resolve, reject) => {
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        db.run(`INSERT INTO inventory_transactions (itemId, type, quantity, date, reason, reference) VALUES (?, ?, ?, ?, ?, ?)`,
            [data.itemId, data.type, data.quantity, data.date || new Date().toISOString().slice(0, 10), data.reason || '', data.reference || ''],
            function (err) {
                if (err) { db.run("ROLLBACK"); return reject(err); }
                const transId = this.lastID;

                // Update stock level
                // type: 'Stock In', 'Stock Out', 'Adjustment', 'Sale'
                let multiplier = 1;
                if (data.type === 'Stock Out' || data.type === 'Sale') multiplier = -1;
                if (data.type === 'Adjustment') multiplier = 1; // For adjustment, we expect signed quantity

                db.run(`UPDATE inventory_items SET stockLevel = stockLevel + ? WHERE id = ?`, [data.quantity * multiplier, data.itemId], function (err) {
                    if (err) { db.run("ROLLBACK"); reject(err); }
                    else { db.run("COMMIT"); resolve({ id: transId }); }
                });
            });
    });
});

export const getInventoryTransactions = (itemId = null, limit = 50) => new Promise((resolve, reject) => {
    let q = `SELECT t.*, i.name as itemName FROM inventory_transactions t JOIN inventory_items i ON t.itemId = i.id`;
    const params = [];
    if (itemId) {
        q += ` WHERE t.itemId = ?`;
        params.push(itemId);
    }
    q += ` ORDER BY t.date DESC, t.id DESC LIMIT ?`;
    params.push(limit);
    db.all(q, params, (err, rows) => { if (err) reject(err); else resolve(rows || []); });
});

// ─── Financial Analytics & Budgets ───────────────────────────────────────
export const setBudget = (data) => {
    return runAsync(`INSERT INTO budgets (department, amount, month, year) VALUES (?,?,?,?) 
            ON CONFLICT(department, month, year) DO UPDATE SET amount = excluded.amount`,
        [data.department, data.amount, data.month, data.year]
    ).then(() => ({ success: true }));
};

export const getBudgets = (month, year) => {
    return allAsync(`SELECT * FROM budgets WHERE month = ? AND year = ?`, [month, year]);
};

export const getFinancialHistory = (months = 6) => {
    const q = `
        SELECT 
            strftime('%Y-%m', date) as month,
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
        FROM (
            SELECT date, amount, 'income' as type FROM donations
            UNION ALL
            SELECT date, amount, 'expense' as type FROM expenses
        )
        GROUP BY month
        ORDER BY month DESC
        LIMIT ?
    `;
    return allAsync(q, [months]);
};

export const getBudgetPerformance = (month, year) => {
    const q = `
        SELECT 
            b.department,
            b.amount as budgetAmount,
            COALESCE(e.actualAmount, 0) as actualAmount,
            CASE WHEN b.amount > 0 THEN ROUND((COALESCE(e.actualAmount, 0) / b.amount) * 100, 1) ELSE 0 END as utilization
        FROM budgets b
        LEFT JOIN (
            SELECT category, SUM(amount) as actualAmount 
            FROM expenses 
            WHERE strftime('%m', date) = ? AND strftime('%Y', date) = ?
            GROUP BY category
        ) e ON b.department = e.category
        WHERE b.month = ? AND b.year = ?
    `;
    const mStr = month.toString().padStart(2, '0');
    const yStr = year.toString();
    return allAsync(q, [mStr, yStr, month, year]);
};

// ─── Settings ───────────────────────────────────────────────────────────
export const getSettings = () => {
    return allAsync("SELECT * FROM settings").then(rows => {
        const settings = {};
        rows.forEach(r => settings[r.key] = r.value);
        return settings;
    });
};

export const updateSetting = (key, value) => {
    return runAsync("INSERT OR REPLACE INTO settings (key, value, updatedAt) VALUES (?, ?, datetime('now'))", [key, value])
        .then(() => ({ success: true }));
};

export const logAudit = (userId, userName, action, details) => {
    return runAsync("INSERT INTO audit_logs (userId, userName, action, details) VALUES (?, ?, ?, ?)",
        [userId, userName, action, details]
    ).then(res => ({ id: res.lastID }));
};

export const getAuditLogs = (limit = 100) => {
    return allAsync("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?", [limit]);
};
