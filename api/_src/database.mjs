import { runAsync, allAsync, getAsync, withTransaction, getPool } from './db.mjs';
import { INIT_DDL, SETTINGS_SEEDS } from './schema.mjs';

// The old SQLite module exposed a file path; the serverless backend is backed
// by hosted PostgreSQL so there is no local path.
export const dbPath = null;

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

// Applies the full schema + default settings. Idempotent; safe to run on a
// fresh database (e.g. during the one-off data migration).
export const initDb = async () => {
    const pool = getPool();
    for (const ddl of INIT_DDL) {
        await pool.query(ddl);
    }
    for (const [key, value] of SETTINGS_SEEDS) {
        await pool.query(
            'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING',
            [key, value]
        );
    }
    console.log('[DB] PostgreSQL schema initialized');
    return { success: true };
};

// Schema is authoritative in PostgreSQL — nothing to heal.
export const healSchema = async () => ({ success: true });

export const logAction = async (userId, userName, action, details) => {
    const res = await runAsync(
        'INSERT INTO audit_logs (userId, userName, action, details) VALUES (?, ?, ?, ?) RETURNING id',
        [userId, userName, action, details]
    );
    return { id: res.lastID };
};

// ─── Users (authentication) ────────────────────────────────────────────
export const createUser = async ({ username, email = null, passwordHash, role = 'admin', fullName = null }) => {
    const res = await runAsync(
        'INSERT INTO users (username, email, passwordHash, role, fullName) VALUES (?, ?, ?, ?, ?) RETURNING id',
        [username, email, passwordHash, role, fullName]
    );
    return { id: res.lastID };
};

export const getUserByIdentity = async (identity) => {
    return getAsync('SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1', [identity, identity]);
};

export const getUsers = async () => {
    return allAsync('SELECT id, username, email, role, fullName, createdAt FROM users ORDER BY id ASC');
};

export const updateUserPassword = async (id, passwordHash) => {
    const res = await runAsync('UPDATE users SET passwordHash = ? WHERE id = ?', [passwordHash, id]);
    return { success: true, changes: res.changes };
};

export const runDataRepair = async () => {
    console.log('[DB] Starting Data Repair routines...');
    // 1. Clean whitespace from devotee names
    await runAsync("UPDATE devotees SET name = TRIM(name), initiatedName = TRIM(initiatedName)");

    // 2. Fix contact numbers (basic normalization)
    const rows = await allAsync("SELECT id, contact FROM devotees WHERE contact IS NOT NULL AND contact != ''");
    for (const row of rows) {
        let cleaned = (row.contact || '').replace(/[^0-9]/g, '');
        if (cleaned.length === 10) cleaned = '91' + cleaned; // Add India country code if 10 digits
        if (cleaned !== (row.contact || '').replace(/[^0-9]/g, '')) {
            await runAsync('UPDATE devotees SET contact = ? WHERE id = ?', [cleaned, row.id]);
        }
    }

    // 3. Flag duplicates in logs
    const dups = await allAsync("SELECT contact, COUNT(*) as count FROM devotees WHERE contact != '' GROUP BY contact HAVING count > 1");
    for (const row of dups) {
        await logIssue('warning', 'data-repair', `Duplicate contact found: ${row.contact} (${row.count} entries)`);
    }

    await logIssue('repair', 'backend', 'Automated data repair routines completed.');
    return { success: true };
};

export const logIssue = async (type, source, message, stack = '') => {
    const timestamp = new Date().toISOString();
    const res = await runAsync(
        'INSERT INTO system_logs (type, source, message, stack, timestamp) VALUES (?, ?, ?, ?, ?) RETURNING id',
        [type, source, message, stack, timestamp]
    );
    return { id: res.lastID };
};

export const getIssues = async (unresolvedOnly = false) => {
    const query = unresolvedOnly
        ? "SELECT * FROM system_logs WHERE resolved = 0 ORDER BY timestamp DESC"
        : "SELECT * FROM system_logs ORDER BY timestamp DESC LIMIT 100";
    return allAsync(query);
};

export const resolveIssue = async (id) => {
    await runAsync('UPDATE system_logs SET resolved = 1 WHERE id = ?', [id]);
    return { success: true };
};

export const clearIssues = async () => {
    await runAsync('DELETE FROM system_logs');
    return { success: true };
};

export const getDevotees = async (limit = 50, offset = 0, search = '', filters = {}) => {
    let query = "SELECT * FROM devotees";
    let countQuery = "SELECT COUNT(*) as total FROM devotees";
    const clauses = [];
    const params = [];

    if (search) {
        clauses.push("(name LIKE ? OR spiritualName LIKE ? OR contact LIKE ? OR initiatedName LIKE ?)");
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam, searchParam, searchParam);
    }

    if (filters.status) { clauses.push("status = ?"); params.push(filters.status); }
    if (filters.gender) { clauses.push("gender = ?"); params.push(filters.gender); }
    if (filters.spiritualStatus) { clauses.push("spiritualStatus = ?"); params.push(filters.spiritualStatus); }
    if (filters.counselor) { clauses.push("counselor = ?"); params.push(filters.counselor); }
    if (filters.district) { clauses.push("district = ?"); params.push(filters.district); }

    const whereClause = clauses.length > 0 ? " WHERE " + clauses.join(" AND ") : "";
    query += whereClause;
    countQuery += whereClause;

    query += " ORDER BY createdAt DESC LIMIT ? OFFSET ?";
    const queryParams = [...params, limit, offset];

    const countResult = await getAsync(countQuery, params);
    const rows = await allAsync(query, queryParams);
    return {
        data: rows,
        total: (countResult && countResult.total) || 0,
        limit,
        offset
    };
};

export const getFilterOptions = async () => {
    const counselors = await allAsync("SELECT DISTINCT counselor FROM devotees WHERE counselor IS NOT NULL AND counselor != '' ORDER BY counselor");
    const districts = await allAsync("SELECT DISTINCT district FROM devotees WHERE district IS NOT NULL AND district != '' ORDER BY district");
    return {
        counselors: (counselors || []).map(c => c.counselor),
        districts: (districts || []).map(d => d.district)
    };
};

export const addDevotee = async (data) => {
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
    if (checkContact && checkName) {
        const existing = await allAsync('SELECT id, name FROM devotees WHERE contact = ?', [checkContact]);
        const dup = (existing || []).find(
            r => String(r.id) !== String(data.id)
              && (r.name || '').toString().trim().toLowerCase().replace(/\s+/g, ' ') === checkName
        );
        if (dup) {
            throw new Error(`A devotee with contact ${checkContact} (${dup.name}) already exists. Please search first instead of re-adding.`);
        }
    }

    const columns = Object.keys(filteredData).join(', ');
    const placeholders = Object.keys(filteredData).map(() => '?').join(', ');
    const values = Object.values(filteredData);
    if (columns.length === 0) throw new Error('No valid devotee fields to insert');

    // SQLite used INSERT OR REPLACE (upsert); PostgreSQL uses ON CONFLICT.
    const setClause = Object.keys(filteredData).map(k => `${k} = EXCLUDED.${k}`).join(', ');
    await runAsync(
        `INSERT INTO devotees (${columns}) VALUES (${placeholders})
         ON CONFLICT (id) DO UPDATE SET ${setClause}`,
        values
    );
    return { id: data.id };
};

export const updateDevotee = async (id, data) => {
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
    if (checkContact && checkName) {
        const existing = await allAsync('SELECT id, name FROM devotees WHERE contact = ?', [checkContact]);
        const dup = (existing || []).find(
            r => String(r.id) !== String(id)
              && (r.name || '').toString().trim().toLowerCase().replace(/\s+/g, ' ') === checkName
        );
        if (dup) {
            throw new Error(`A devotee with contact ${checkContact} (${dup.name}) already exists. Please search first instead of re-adding.`);
        }
    }

    const sets = Object.keys(filteredData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(filteredData), id];
    if (sets.length === 0) return { success: true };
    await runAsync(`UPDATE devotees SET ${sets} WHERE id = ?`, values);
    return { success: true };
};

export const deleteDevotee = async (id) => {
    await runAsync('DELETE FROM devotees WHERE id = ?', [id]);
    return { success: true };
};

export const getDevoteeStats = async () => {
    const query = `
        SELECT
            COUNT(*) as total,
            SUM(CASE WHEN spiritualStatus = 'Initiated' THEN 1 ELSE 0 END) as initiated,
            SUM(CASE WHEN spiritualStatus = 'Sheltered' THEN 1 ELSE 0 END) as sheltered,
            SUM(CASE WHEN (spiritualStatus = 'Aspiring' OR spiritualStatus IS NULL OR spiritualStatus = '') THEN 1 ELSE 0 END) as aspiring,
            (SELECT COUNT(*) FROM devotees WHERE TO_CHAR(NULLIF(dob, '')::date, 'MM-DD') = TO_CHAR(CURRENT_DATE, 'MM-DD')) as birthdaysToday,
            (SELECT COUNT(*) FROM devotees WHERE TO_CHAR(NULLIF(anniversary, '')::date, 'MM-DD') = TO_CHAR(CURRENT_DATE, 'MM-DD')) as anniversariesToday,
            (SELECT COUNT(*) FROM devotees WHERE TO_CHAR(NULLIF(createdAt, '')::date, 'YYYY-MM') = TO_CHAR(CURRENT_DATE, 'YYYY-MM')) as currentMonthRegistrations,
            (SELECT COUNT(*) FROM devotees WHERE TO_CHAR(NULLIF(createdAt, '')::date, 'YYYY-MM') = TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM')) as lastMonthRegistrations
        FROM devotees
    `;

    const row = await getAsync(query);
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
    try {
        const weeklyActivityQuery = `
            SELECT
                NULLIF(createdAt, '')::date as date,
                COUNT(*) as count
            FROM devotees
            WHERE NULLIF(createdAt, '')::date >= CURRENT_DATE - 7
            GROUP BY NULLIF(createdAt, '')::date
        `;
        const activityRows = await allAsync(weeklyActivityQuery);
        const weeklyActivity = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const found = (activityRows || []).find(r => r.date === dateStr);
            weeklyActivity.push(found ? found.count : 0);
        }
        stats.weeklyActivity = weeklyActivity;
    } catch (error) {
        console.error('[DB] Weekly Activity Query Error:', error);
    }

    try {
        stats.birthdaysTodayList = await allAsync(
            "SELECT id, name, initiatedName, photo, dob, contact, whatsapp FROM devotees WHERE TO_CHAR(NULLIF(dob, '')::date, 'MM-DD') = TO_CHAR(CURRENT_DATE, 'MM-DD')"
        );
        stats.anniversariesTodayList = await allAsync(
            "SELECT id, name, initiatedName, photo, anniversary, contact, whatsapp FROM devotees WHERE TO_CHAR(NULLIF(anniversary, '')::date, 'MM-DD') = TO_CHAR(CURRENT_DATE, 'MM-DD')"
        );
    } catch (error) {
        console.error('[DB] Birthday list query error:', error);
        stats.birthdaysTodayList = [];
        stats.anniversariesTodayList = [];
    }

    return stats;
};

export const getSadhana = async (devoteeId) => {
    return allAsync('SELECT * FROM sadhana WHERE devoteeId = ? ORDER BY date DESC', [devoteeId]);
};

export const addSadhanaEntry = async (entry) => {
    const { id, devoteeId, date, rounds, timestamp } = entry;
    await runAsync(
        `INSERT INTO sadhana (id, devoteeId, date, rounds, timestamp) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (id) DO UPDATE SET devoteeId = EXCLUDED.devoteeId, date = EXCLUDED.date, rounds = EXCLUDED.rounds, timestamp = EXCLUDED.timestamp`,
        [id, devoteeId, date, rounds, timestamp]
    );
    return { id };
};

export const deleteSadhanaEntry = async (id) => {
    await runAsync('DELETE FROM sadhana WHERE id = ?', [id]);
    return { success: true };
};

export const getBackupData = async () => {
    const devotees = await allAsync('SELECT * FROM devotees');
    const sadhana = await allAsync('SELECT * FROM sadhana');
    return {
        devotees: (devotees || []).map(d => ({
            ...d,
            booksRead: d.booksRead ? JSON.parse(d.booksRead) : [],
            courses: d.courses ? JSON.parse(d.courses) : []
        })),
        sadhana: sadhana || [],
        timestamp: new Date().toISOString()
    };
};

export const restoreFromBackup = async (backupData) => {
    const result = await withTransaction(async (tx) => {
        await tx.run('DELETE FROM sadhana');
        await tx.run('DELETE FROM devotees');

        const devotees = backupData.devotees || [];
        for (const devotee of devotees) {
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
            if (columns.length === 0) continue;
            await tx.run(`INSERT INTO devotees (${columns}) VALUES (${placeholders})`, values);
        }

        const sadhana = backupData.sadhana || [];
        for (const entry of sadhana) {
            const { id, devoteeId, date, rounds, timestamp } = entry;
            await tx.run(
                'INSERT INTO sadhana (id, devoteeId, date, rounds, timestamp) VALUES (?, ?, ?, ?, ?)',
                [id, devoteeId, date, rounds, timestamp]
            );
        }

        return {
            success: true,
            devoteesRestored: devotees.length,
            sadhanaRestored: sadhana.length
        };
    });
    return result;
};

// ─── Attendance ────────────────────────────────────────────────────────
export const markAttendance = async ({ devoteeId, eventName, eventDate, markedBy = 'admin' }) => {
    const res = await runAsync(
        'INSERT INTO attendance (devoteeId, eventName, eventDate, markedBy) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING',
        [devoteeId, eventName, eventDate, markedBy]
    );
    return { inserted: res.changes };
};

export const removeAttendance = async ({ devoteeId, eventName, eventDate }) => {
    const res = await runAsync(
        'DELETE FROM attendance WHERE devoteeId=? AND eventName=? AND eventDate=?',
        [devoteeId, eventName, eventDate]
    );
    return { deleted: res.changes };
};

export const getAttendanceByEvent = async (eventName, eventDate) => {
    return allAsync(
        `SELECT a.devoteeId, d.name, d.photo, d.initiatedName, d.counselor
         FROM attendance a JOIN devotees d ON a.devoteeId=d.id
         WHERE a.eventName=? AND a.eventDate=?`,
        [eventName, eventDate]
    );
};

export const getAttendanceSummary = async () => {
    return allAsync(
        `SELECT d.id, d.name, d.photo, d.initiatedName, d.counselor, COUNT(a.id) as totalAttendance, MAX(a.eventDate) as lastSeen
         FROM devotees d LEFT JOIN attendance a ON d.id=a.devoteeId
         GROUP BY d.id ORDER BY totalAttendance DESC`
    );
};

export const getRecentAttendanceEvents = async (limit = 30) => {
    return allAsync(
        `SELECT DISTINCT eventName, eventDate, COUNT(*) as attendeeCount
         FROM attendance GROUP BY eventName, eventDate ORDER BY eventDate DESC LIMIT ?`,
        [limit]
    );
};

// ─── Events ────────────────────────────────────────────────────────────
export const createEvent = async (data) => {
    const res = await runAsync(
        'INSERT INTO events (name, eventType, eventDate, description, location) VALUES (?,?,?,?,?) RETURNING id',
        [data.name, data.eventType || 'Sunday Feast', data.eventDate, data.description || '', data.location || '']
    );
    return { id: res.lastID };
};

export const updateEvent = async (id, data) => {
    await runAsync(
        'UPDATE events SET name=?, eventType=?, eventDate=?, description=?, location=? WHERE id=?',
        [data.name, data.eventType || 'Sunday Feast', data.eventDate, data.description || '', data.location || '', id]
    );
    return { success: true };
};

export const getEvents = async (limit = 50) => {
    return allAsync('SELECT * FROM events ORDER BY eventDate DESC LIMIT ?', [limit]);
};

export const deleteEvent = async (id) => {
    await runAsync('DELETE FROM events WHERE id=?', [id]);
    return { success: true };
};

export const createEventsBulk = async (events) => {
    return withTransaction(async (tx) => {
        for (const data of events) {
            await tx.run(
                'INSERT INTO events (name, eventType, eventDate, description, location) VALUES (?,?,?,?,?)',
                [data.name, data.eventType || 'Sunday Feast', data.eventDate, data.description || '', data.location || '']
            );
        }
        return { success: true, count: events.length };
    });
};

// ─── Counseling ────────────────────────────────────────────────────────
export const addCounselingSession = async (data) => {
    const res = await runAsync(
        'INSERT INTO counseling_sessions (devoteeId, counselor, sessionDate, mood, notes, followUpDate) VALUES (?,?,?,?,?,?) RETURNING id',
        [data.devoteeId, data.counselor || '', data.sessionDate, data.mood || 'Good', data.notes || '', data.followUpDate || null]
    );
    return { id: res.lastID };
};

export const getCounselingSessions = async (devoteeId) => {
    const q = devoteeId
        ? `SELECT cs.*, d.name as devoteeName FROM counseling_sessions cs JOIN devotees d ON cs.devoteeId=d.id WHERE cs.devoteeId=? ORDER BY cs.sessionDate DESC`
        : `SELECT cs.*, d.name as devoteeName FROM counseling_sessions cs JOIN devotees d ON cs.devoteeId=d.id ORDER BY cs.sessionDate DESC LIMIT 100`;
    return allAsync(q, devoteeId ? [devoteeId] : []);
};

export const deleteCounselingSession = async (id) => {
    await runAsync('DELETE FROM counseling_sessions WHERE id=?', [id]);
    return { success: true };
};

// ─── Raw ───────────────────────────────────────────────────────────────
export const getAllDevoteesRaw = async () => {
    return allAsync('SELECT * FROM devotees ORDER BY createdAt DESC');
};

export const getDevoteeByPhone = async (phone) => {
    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
    return getAsync(
        `SELECT * FROM devotees WHERE REPLACE(contact, '-', '') LIKE '%' || ? OR REPLACE(whatsapp, '-', '') LIKE '%' || ? LIMIT 1`,
        [cleanPhone, cleanPhone]
    );
};

export const getDevoteeById = async (id) => {
    return getAsync('SELECT * FROM devotees WHERE id = ?', [id]);
};

// ─── Seva Assignments ──────────────────────────────────────────────────
export const addSeva = async (data) => {
    const res = await runAsync(
        'INSERT INTO seva_assignments (devoteeId, department, role, startDate, notes, status) VALUES (?,?,?,?,?,?) RETURNING id',
        [data.devoteeId, data.department, data.role || '', data.startDate || new Date().toISOString().slice(0, 10), data.notes || '', data.status || 'Active']
    );
    return { id: res.lastID };
};

export const getSevas = async () => {
    return allAsync(
        `SELECT sa.*, d.name as devoteeName, d.initiatedName, d.photo, d.counselor
         FROM seva_assignments sa
         LEFT JOIN devotees d ON sa.devoteeId = d.id
         ORDER BY sa.department, sa.createdAt DESC`
    );
};

export const updateSeva = async (id, data) => {
    const validCols = ['department', 'role', 'status', 'notes'];
    const keys = Object.keys(data).filter(k => validCols.includes(k));
    if (keys.length === 0) return { success: true };
    const sets = keys.map(k => `${k} = ?`).join(', ');
    const vals = [...keys.map(k => data[k]), id];
    await runAsync(`UPDATE seva_assignments SET ${sets} WHERE id = ?`, vals);
    return { success: true };
};

export const deleteSeva = async (id) => {
    await runAsync('DELETE FROM seva_assignments WHERE id = ?', [id]);
    return { success: true };
};

// ─── Seva Scheduling ───────────────────────────────────────────────────
export const createSevaShift = async (data) => {
    const res = await runAsync(
        'INSERT INTO seva_shifts (department, shiftName, shiftDate, startTime, endTime, requiredVolunteers, notes) VALUES (?,?,?,?,?,?,?) RETURNING id',
        [data.department, data.shiftName, data.shiftDate, data.startTime || '', data.endTime || '', data.requiredVolunteers || 1, data.notes || '']
    );
    return { id: res.lastID };
};

export const getSevaShifts = async (date = null, department = null) => {
    let q = 'SELECT * FROM seva_shifts';
    const params = [];
    if (date || department) {
        q += ' WHERE';
        if (date) { q += ' shiftDate = ?'; params.push(date); }
        if (date && department) q += ' AND';
        if (department) { q += ' department = ?'; params.push(department); }
    }
    q += ' ORDER BY shiftDate ASC, startTime ASC';
    return allAsync(q, params);
};

export const updateSevaShift = async (id, data) => {
    const validCols = ['department', 'shiftName', 'shiftDate', 'startTime', 'endTime', 'requiredVolunteers', 'notes'];
    const keys = Object.keys(data).filter(k => validCols.includes(k));
    if (keys.length === 0) return { success: true };
    const sets = keys.map(k => `${k} = ?`).join(', ');
    const vals = [...keys.map(k => data[k]), id];
    await runAsync(`UPDATE seva_shifts SET ${sets} WHERE id = ?`, vals);
    return { success: true };
};

export const deleteSevaShift = async (id) => {
    return withTransaction(async (tx) => {
        await tx.run('DELETE FROM seva_shift_assignments WHERE shiftId = ?', [id]);
        await tx.run('DELETE FROM seva_shifts WHERE id = ?', [id]);
        return { success: true };
    });
};

export const assignToShift = async (data) => {
    const res = await runAsync(
        'INSERT INTO seva_shift_assignments (shiftId, devoteeId, status) VALUES (?,?,?) RETURNING id',
        [data.shiftId, data.devoteeId, data.status || 'Confirmed']
    );
    return { id: res.lastID };
};

export const getShiftAssignments = async (shiftId) => {
    return allAsync(
        `SELECT ssa.*, d.name as devoteeName, d.spiritualName, d.initiatedName, d.photo, d.contact
         FROM seva_shift_assignments ssa
         JOIN devotees d ON ssa.devoteeId = d.id
         WHERE ssa.shiftId = ?`,
        [shiftId]
    );
};

export const removeShiftAssignment = async (id) => {
    await runAsync('DELETE FROM seva_shift_assignments WHERE id = ?', [id]);
    return { success: true };
};

export const getSevaSchedule = async (startDate, endDate) => {
    return allAsync(
        `SELECT ss.*, (SELECT COUNT(*) FROM seva_shift_assignments WHERE shiftId = ss.id) as volunteerCount
         FROM seva_shifts ss
         WHERE shiftDate BETWEEN ? AND ?
         ORDER BY shiftDate ASC, startTime ASC`,
        [startDate, endDate]
    );
};

// ─── Donations ─────────────────────────────────────────────────────────
export const addDonation = async (data) => {
    const res = await runAsync(
        'INSERT INTO donations (devoteeId, devoteeName, mobile, amount, totalAmount, dueAmount, purpose, date, mode, reference) VALUES (?,?,?,?,?,?,?,?,?,?) RETURNING id',
        [data.devoteeId || null, data.devoteeName || '', data.mobile || '', data.amount, data.totalAmount || data.amount, data.dueAmount || 0, data.purpose || '', data.date, data.mode || 'Cash', data.reference || '']
    );
    return { id: res.lastID };
};

export const getDonations = async (limit = 200) => {
    return allAsync(
        `SELECT dn.*, d.name as devoteeNameFull, d.initiatedName, d.photo
         FROM donations dn
         LEFT JOIN devotees d ON dn.devoteeId = d.id
         ORDER BY dn.date DESC, dn.createdAt DESC LIMIT ?`,
        [limit]
    );
};

export const deleteDonation = async (id) => {
    await runAsync('DELETE FROM donations WHERE id = ?', [id]);
    return { success: true };
};

// ─── Expenses ──────────────────────────────────────────────────────────
export const addExpense = async (data) => {
    const res = await runAsync(
        'INSERT INTO expenses (title, category, amount, date, mode, reference, notes) VALUES (?,?,?,?,?,?,?) RETURNING id',
        [data.title || '', data.category || 'General', data.amount, data.date, data.mode || 'Cash', data.reference || '', data.notes || '']
    );
    return { id: res.lastID };
};

export const getExpenses = async (limit = 200) => {
    return allAsync('SELECT * FROM expenses ORDER BY date DESC, createdAt DESC LIMIT ?', [limit]);
};

export const deleteExpense = async (id) => {
    await runAsync('DELETE FROM expenses WHERE id = ?', [id]);
    return { success: true };
};

export const getFinanceStats = async () => {
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

    const incRow = await getAsync(
        `SELECT
            SUM(amount) as totalAll,
            SUM(CASE WHEN TO_CHAR(NULLIF(date, '')::date, 'YYYY-MM') = ? THEN amount ELSE 0 END) as totalThisMonth,
            COUNT(*) as totalCount
            FROM donations`,
        [currentMonth]
    );
    stats.totalIncome = incRow?.totalAll || 0;
    stats.totalIncomeThisMonth = incRow?.totalThisMonth || 0;
    stats.donationsCount = incRow?.totalCount || 0;

    const expRow = await getAsync(
        `SELECT
            SUM(amount) as totalAll,
            SUM(CASE WHEN TO_CHAR(NULLIF(date, '')::date, 'YYYY-MM') = ? THEN amount ELSE 0 END) as totalThisMonth,
            COUNT(*) as totalCount
            FROM expenses`,
        [currentMonth]
    );
    stats.totalExpenses = expRow?.totalAll || 0;
    stats.totalExpensesThisMonth = expRow?.totalThisMonth || 0;
    stats.expensesCount = expRow?.totalCount || 0;
    stats.netBalance = stats.totalIncome - stats.totalExpenses;

    stats.byPurpose = await allAsync('SELECT purpose, SUM(amount) as total FROM donations GROUP BY purpose ORDER BY total DESC LIMIT 5');
    stats.expenseByCategory = await allAsync('SELECT category, SUM(amount) as total FROM expenses GROUP BY category ORDER BY total DESC LIMIT 5');

    // For backward compatibility
    stats.totalAll = stats.totalIncome;
    stats.totalThisMonth = stats.totalIncomeThisMonth;
    stats.totalCount = stats.donationsCount;

    return stats;
};

// ─── Courses Logic ─────────────────────────────────────────────────────
export const createCourse = async (data) => {
    const res = await runAsync(
        'INSERT INTO courses (name, description, startDate, endDate, status, fees, instructor) VALUES (?,?,?,?,?,?,?) RETURNING id',
        [data.name, data.description || '', data.startDate, data.endDate, data.status || 'Upcoming', data.fees || 0, data.instructor || '']
    );
    return { id: res.lastID };
};

export const getCourses = async (upcomingOnly = false) => {
    const q = upcomingOnly
        ? "SELECT * FROM courses WHERE status != 'Completed' ORDER BY startDate ASC"
        : 'SELECT * FROM courses ORDER BY startDate DESC';
    return allAsync(q);
};

export const getCourseById = async (id) => {
    return getAsync('SELECT * FROM courses WHERE id = ?', [id]);
};

export const updateCourse = async (id, data) => {
    const validCols = ['name', 'description', 'startDate', 'endDate', 'status', 'fees', 'instructor'];
    const keys = Object.keys(data).filter(k => validCols.includes(k));
    if (keys.length === 0) return { success: true };
    const sets = keys.map(k => `${k} = ?`).join(', ');
    const vals = [...keys.map(k => data[k]), id];
    await runAsync(`UPDATE courses SET ${sets} WHERE id = ?`, vals);
    return { success: true };
};

export const deleteCourse = async (id) => {
    return withTransaction(async (tx) => {
        await tx.run('DELETE FROM course_payments WHERE enrollmentId IN (SELECT id FROM course_enrollments WHERE courseId = ?)', [id]);
        await tx.run('DELETE FROM course_enrollments WHERE courseId = ?', [id]);
        await tx.run('DELETE FROM courses WHERE id = ?', [id]);
        return { success: true };
    });
};

// ─── Enrollments ───────────────────────────────────────────────────────
export const enrollDevotee = async (data) => {
    const res = await runAsync(
        'INSERT INTO course_enrollments (courseId, devoteeId, enrollmentDate, status, totalPaid, paymentStatus) VALUES (?,?,?,?,?,?) RETURNING id',
        [data.courseId, data.devoteeId, data.enrollmentDate || new Date().toISOString().slice(0, 10), 'Participated', 0, 'Due']
    );
    return { id: res.lastID };
};

export const getCourseEnrollments = async (courseId) => {
    return allAsync(
        `SELECT ce.*, d.name as devoteeName, d.spiritualName, d.initiatedName, d.contact, d.photo, d.whatsapp,
                (SELECT COUNT(*) FROM course_attendance ca WHERE ca.courseId = ce.courseId AND ca.devoteeId = ce.devoteeId) as attendedSessions
         FROM course_enrollments ce
         JOIN devotees d ON ce.devoteeId = d.id
         WHERE ce.courseId = ?`,
        [courseId]
    );
};

// ─── Course Attendance ─────────────────────────────────────────────────
export const markCourseAttendance = async ({ courseId, devoteeId, sessionDate, markedBy = 'admin' }) => {
    const res = await runAsync(
        'INSERT INTO course_attendance (courseId, devoteeId, sessionDate, markedBy) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING',
        [courseId, devoteeId, sessionDate, markedBy]
    );
    return { inserted: res.changes };
};

export const removeCourseAttendance = async ({ courseId, devoteeId, sessionDate }) => {
    const res = await runAsync(
        'DELETE FROM course_attendance WHERE courseId=? AND devoteeId=? AND sessionDate=?',
        [courseId, devoteeId, sessionDate]
    );
    return { deleted: res.changes };
};

export const getCourseAttendanceBySession = async (courseId, sessionDate) => {
    return allAsync(
        'SELECT devoteeId FROM course_attendance WHERE courseId=? AND sessionDate=?',
        [courseId, sessionDate]
    );
};

export const getCourseAttendanceSummary = async (courseId) => {
    return allAsync(
        `SELECT ce.devoteeId, COUNT(ca.id) as attendedSessions
         FROM course_enrollments ce
         LEFT JOIN course_attendance ca ON ce.courseId = ca.courseId AND ce.devoteeId = ca.devoteeId
         WHERE ce.courseId = ?
         GROUP BY ce.devoteeId`,
        [courseId]
    );
};

export const syncCourseAttendance = async (courseId, sessionDate, devoteeIds, markedBy = 'admin') => {
    return withTransaction(async (tx) => {
        await tx.run('DELETE FROM course_attendance WHERE courseId=? AND sessionDate=?', [courseId, sessionDate]);
        if (devoteeIds && devoteeIds.length > 0) {
            for (const devoteeId of devoteeIds) {
                await tx.run(
                    'INSERT INTO course_attendance (courseId, devoteeId, sessionDate, markedBy) VALUES (?, ?, ?, ?)',
                    [courseId, devoteeId, sessionDate, markedBy]
                );
            }
        }
        return { success: true };
    });
};

export const updateEnrollment = async (id, data) => {
    const validCols = ['status', 'certificateIssued', 'totalPaid', 'paymentStatus'];
    const keys = Object.keys(data).filter(k => validCols.includes(k));
    if (keys.length === 0) return { success: true };
    const sets = keys.map(k => `${k} = ?`).join(', ');
    const vals = [...keys.map(k => data[k]), id];
    await runAsync(`UPDATE course_enrollments SET ${sets} WHERE id = ?`, vals);
    return { success: true };
};

export const deleteEnrollment = async (id) => {
    const res = await runAsync('DELETE FROM course_enrollments WHERE id = ?', [id]);
    return { success: true, changes: res.changes };
};

// ─── Payments ──────────────────────────────────────────────────────────
export const addCoursePayment = async (data) => {
    return withTransaction(async (tx) => {
        const payRes = await tx.run(
            'INSERT INTO course_payments (enrollmentId, amount, paymentDate, paymentMode, reference) VALUES (?,?,?,?,?) RETURNING id',
            [data.enrollmentId, data.amount, data.paymentDate || new Date().toISOString().slice(0, 10), data.paymentMode || 'Cash', data.reference || '']
        );
        const paymentId = payRes.lastID;

        const row = await tx.get(
            'SELECT ce.totalPaid, c.fees FROM course_enrollments ce JOIN courses c ON ce.courseId = c.id WHERE ce.id = ?',
            [data.enrollmentId]
        );
        if (!row) throw new Error('Enrollment not found');
        const newTotal = Number(row.totalPaid || 0) + Number(data.amount);
        let paymentStatus = 'Partial';
        if (newTotal >= Number(row.fees || 0)) paymentStatus = 'Completed';
        if (newTotal <= 0) paymentStatus = 'Due';

        await tx.run(
            'UPDATE course_enrollments SET totalPaid = ?, paymentStatus = ? WHERE id = ?',
            [newTotal, paymentStatus, data.enrollmentId]
        );
        return { id: paymentId, newTotal, paymentStatus };
    });
};

export const getEnrollmentPayments = async (enrollmentId) => {
    return allAsync('SELECT * FROM course_payments WHERE enrollmentId = ? ORDER BY paymentDate DESC', [enrollmentId]);
};

// ─── Tours Logic ───────────────────────────────────────────────────────
export const createTour = async (data) => {
    const res = await runAsync(
        'INSERT INTO tours (name, destination, startDate, endDate, status, fees, organizer, maxParticipants) VALUES (?,?,?,?,?,?,?,?) RETURNING id',
        [data.name, data.destination || '', data.startDate, data.endDate, data.status || 'Upcoming', data.fees || 0, data.organizer || '', data.maxParticipants || null]
    );
    return { id: res.lastID };
};

export const getTours = async (upcomingOnly = false) => {
    const q = upcomingOnly
        ? "SELECT * FROM tours WHERE status != 'Completed' ORDER BY startDate ASC"
        : 'SELECT * FROM tours ORDER BY startDate DESC';
    return allAsync(q);
};

export const getTourById = async (id) => {
    return getAsync('SELECT * FROM tours WHERE id = ?', [id]);
};

export const updateTour = async (id, data) => {
    const validCols = ['name', 'destination', 'startDate', 'endDate', 'status', 'fees', 'organizer', 'maxParticipants'];
    const keys = Object.keys(data).filter(k => validCols.includes(k));
    if (keys.length === 0) return { success: true };
    const sets = keys.map(k => `${k} = ?`).join(', ');
    const vals = [...keys.map(k => data[k]), id];
    await runAsync(`UPDATE tours SET ${sets} WHERE id = ?`, vals);
    return { success: true };
};

export const deleteTour = async (id) => {
    return withTransaction(async (tx) => {
        await tx.run('DELETE FROM tour_payments WHERE enrollmentId IN (SELECT id FROM tour_enrollments WHERE tourId = ?)', [id]);
        await tx.run('DELETE FROM tour_enrollments WHERE tourId = ?', [id]);
        await tx.run('DELETE FROM tours WHERE id = ?', [id]);
        return { success: true };
    });
};

// ─── Tour Enrollments ──────────────────────────────────────────────────
export const enrollInTour = async (data) => {
    const effectiveDevoteeId = data.devoteeId || `GUEST_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const res = await runAsync(
        'INSERT INTO tour_enrollments (tourId, devoteeId, guestName, guestContact, bookingDate, status, totalPaid, paymentStatus) VALUES (?,?,?,?,?,?,?,?) RETURNING id',
        [data.tourId, effectiveDevoteeId, data.guestName || null, data.guestContact || null, data.bookingDate || new Date().toISOString().slice(0, 10), 'Reserved', 0, 'Due']
    );
    return { id: res.lastID };
};

export const getTourEnrollments = async (tourId) => {
    return allAsync(
        `SELECT te.*, d.name as devoteeName, d.spiritualName, d.initiatedName, d.contact, d.photo, d.whatsapp
         FROM tour_enrollments te
         LEFT JOIN devotees d ON te.devoteeId = d.id
         WHERE te.tourId = ?`,
        [tourId]
    );
};

export const updateTourEnrollment = async (id, data) => {
    const validCols = ['status', 'totalPaid', 'paymentStatus'];
    const keys = Object.keys(data).filter(k => validCols.includes(k));
    if (keys.length === 0) return { success: true };
    const sets = keys.map(k => `${k} = ?`).join(', ');
    const vals = [...keys.map(k => data[k]), id];
    await runAsync(`UPDATE tour_enrollments SET ${sets} WHERE id = ?`, vals);
    return { success: true };
};

export const deleteTourEnrollment = async (id) => {
    return withTransaction(async (tx) => {
        await tx.run('DELETE FROM tour_payments WHERE enrollmentId = ?', [id]);
        await tx.run('DELETE FROM tour_enrollments WHERE id = ?', [id]);
        return { success: true };
    });
};

// ─── Tour Payments ─────────────────────────────────────────────────────
export const addTourPayment = async (data) => {
    return withTransaction(async (tx) => {
        const payRes = await tx.run(
            'INSERT INTO tour_payments (enrollmentId, amount, paymentDate, paymentMode, reference) VALUES (?,?,?,?,?) RETURNING id',
            [data.enrollmentId, data.amount, data.paymentDate || new Date().toISOString().slice(0, 10), data.paymentMode || 'Cash', data.reference || '']
        );
        const paymentId = payRes.lastID;

        const row = await tx.get(
            'SELECT te.totalPaid, t.fees FROM tour_enrollments te JOIN tours t ON te.tourId = t.id WHERE te.id = ?',
            [data.enrollmentId]
        );
        if (!row) throw new Error('Tour Enrollment not found');
        const newTotal = Number(row.totalPaid || 0) + Number(data.amount);
        let paymentStatus = 'Partial';
        if (newTotal >= Number(row.fees || 0)) paymentStatus = 'Completed';
        if (newTotal <= 0) paymentStatus = 'Due';

        await tx.run(
            'UPDATE tour_enrollments SET totalPaid = ?, paymentStatus = ? WHERE id = ?',
            [newTotal, paymentStatus, data.enrollmentId]
        );
        return { id: paymentId, newTotal, paymentStatus };
    });
};

export const getTourPayments = async (enrollmentId) => {
    return allAsync('SELECT * FROM tour_payments WHERE enrollmentId = ? ORDER BY paymentDate DESC', [enrollmentId]);
};

// ─── Inventory ─────────────────────────────────────────────────────────
export const getInventoryCategories = async () => {
    return allAsync('SELECT * FROM inventory_categories ORDER BY name ASC');
};

export const addInventoryCategory = async (data) => {
    const res = await runAsync(
        'INSERT INTO inventory_categories (name, description) VALUES (?, ?) RETURNING id',
        [data.name, data.description || '']
    );
    return { id: res.lastID };
};

export const updateInventoryCategory = async (id, data) => {
    await runAsync('UPDATE inventory_categories SET name = ?, description = ? WHERE id = ?', [data.name, data.description || '', id]);
    return { success: true };
};

export const deleteInventoryCategory = async (id) => {
    const row = await getAsync('SELECT COUNT(*) as count FROM inventory_items WHERE categoryId = ?', [id]);
    if (row.count > 0) throw new Error('Cannot delete category with active items');
    await runAsync('DELETE FROM inventory_categories WHERE id = ?', [id]);
    return { success: true };
};

export const getInventoryItems = async (categoryId = null) => {
    let q = 'SELECT i.*, c.name as categoryName FROM inventory_items i JOIN inventory_categories c ON i.categoryId = c.id';
    const params = [];
    if (categoryId) {
        q += ' WHERE i.categoryId = ?';
        params.push(categoryId);
    }
    q += ' ORDER BY i.name ASC';
    return allAsync(q, params);
};

export const getInventoryItemById = async (id) => {
    return getAsync(
        'SELECT i.*, c.name as categoryName FROM inventory_items i JOIN inventory_categories c ON i.categoryId = c.id WHERE i.id = ?',
        [id]
    );
};

export const addInventoryItem = async (data) => {
    const res = await runAsync(
        'INSERT INTO inventory_items (categoryId, name, sku, description, unit, unitPrice, stockLevel, reorderLevel) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id',
        [data.categoryId, data.name, data.sku || null, data.description || '', data.unit || 'pcs', data.unitPrice || 0, data.stockLevel || 0, data.reorderLevel || 5]
    );
    return { id: res.lastID };
};

export const updateInventoryItem = async (id, data) => {
    const validCols = ['categoryId', 'name', 'sku', 'description', 'unit', 'unitPrice', 'stockLevel', 'reorderLevel'];
    const keys = Object.keys(data).filter(k => validCols.includes(k));
    if (keys.length === 0) return { success: true };
    const sets = keys.map(k => `${k} = ?`).join(', ');
    const vals = [...keys.map(k => data[k]), id];
    await runAsync(`UPDATE inventory_items SET ${sets} WHERE id = ?`, vals);
    return { success: true };
};

export const deleteInventoryItem = async (id) => {
    return withTransaction(async (tx) => {
        await tx.run('DELETE FROM inventory_transactions WHERE itemId = ?', [id]);
        await tx.run('DELETE FROM inventory_items WHERE id = ?', [id]);
        return { success: true };
    });
};

export const addInventoryTransaction = async (data) => {
    return withTransaction(async (tx) => {
        const transRes = await tx.run(
            'INSERT INTO inventory_transactions (itemId, type, quantity, date, reason, reference) VALUES (?, ?, ?, ?, ?, ?) RETURNING id',
            [data.itemId, data.type, data.quantity, data.date || new Date().toISOString().slice(0, 10), data.reason || '', data.reference || '']
        );
        const transId = transRes.lastID;

        let multiplier = 1;
        if (data.type === 'Stock Out' || data.type === 'Sale') multiplier = -1;
        if (data.type === 'Adjustment') multiplier = 1;

        await tx.run(
            'UPDATE inventory_items SET stockLevel = stockLevel + ? WHERE id = ?',
            [Number(data.quantity) * multiplier, data.itemId]
        );
        return { id: transId };
    });
};

export const getInventoryTransactions = async (itemId = null, limit = 50) => {
    let q = 'SELECT t.*, i.name as itemName FROM inventory_transactions t JOIN inventory_items i ON t.itemId = i.id';
    const params = [];
    if (itemId) {
        q += ' WHERE t.itemId = ?';
        params.push(itemId);
    }
    q += ' ORDER BY t.date DESC, t.id DESC LIMIT ?';
    params.push(limit);
    return allAsync(q, params);
};

// ─── Financial Analytics & Budgets ─────────────────────────────────────
export const setBudget = async (data) => {
    await runAsync(
        `INSERT INTO budgets (department, amount, month, year) VALUES (?,?,?,?)
         ON CONFLICT(department, month, year) DO UPDATE SET amount = excluded.amount`,
        [data.department, data.amount, data.month, data.year]
    );
    return { success: true };
};

export const getBudgets = async (month, year) => {
    return allAsync('SELECT * FROM budgets WHERE month = ? AND year = ?', [month, year]);
};

export const getFinancialHistory = async (months = 6) => {
    const q = `
        SELECT
            TO_CHAR(NULLIF(date, '')::date, 'YYYY-MM') as month,
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

export const getBudgetPerformance = async (month, year) => {
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
            WHERE TO_CHAR(NULLIF(date, '')::date, 'MM') = ? AND TO_CHAR(NULLIF(date, '')::date, 'YYYY') = ?
            GROUP BY category
        ) e ON b.department = e.category
        WHERE b.month = ? AND b.year = ?
    `;
    const mStr = month.toString().padStart(2, '0');
    const yStr = year.toString();
    return allAsync(q, [mStr, yStr, month, year]);
};

// ─── Settings ──────────────────────────────────────────────────────────
export const getSettings = async () => {
    const rows = await allAsync('SELECT * FROM settings');
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    return settings;
};

export const updateSetting = async (key, value) => {
    await runAsync(
        'INSERT INTO settings (key, value, updatedAt) VALUES (?, ?, ?) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updatedAt = EXCLUDED.updatedAt',
        [key, value, new Date().toISOString()]
    );
    return { success: true };
};

export const logAudit = async (userId, userName, action, details) => {
    const res = await runAsync(
        'INSERT INTO audit_logs (userId, userName, action, details) VALUES (?, ?, ?, ?) RETURNING id',
        [userId, userName, action, details]
    );
    return { id: res.lastID };
};

export const getAuditLogs = async (limit = 100) => {
    return allAsync('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?', [limit]);
};