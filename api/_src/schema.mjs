// PostgreSQL schema for the Vercel serverless backend.
//
// IMPORTANT on identifier casing: every column that contains an uppercase
// letter is created with double-quoted (case-preserving) identifiers so that
// result rows keep the same camelCase keys the frontend expects. Queries in
// database.mjs refer to columns WITHOUT quotes; Postgres folds those to
// lowercase, which is why db.mjs camelizes row keys back via CASING below.
export const SERIAL = 'BIGINT GENERATED ALWAYS AS IDENTITY';

export const TABLES = {
    devotees: `CREATE TABLE IF NOT EXISTS devotees (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "spiritualName" TEXT,
        "email" TEXT,
        "gender" TEXT,
        "dob" TEXT,
        "age" INTEGER,
        "bloodGroup" TEXT,
        "education" TEXT,
        "occupation" TEXT,
        "relationType" TEXT,
        "guardianName" TEXT,
        "contact" TEXT,
        "whatsapp" TEXT,
        "address" TEXT,
        "village" TEXT,
        "district" TEXT,
        "pinCode" TEXT,
        "state" TEXT,
        "maritalStatus" TEXT,
        "skills" TEXT,
        "specialDay" TEXT,
        "specialDayName" TEXT,
        "spiritualStatus" TEXT,
        "initiatedName" TEXT,
        "counselor" TEXT,
        "spiritualMaster" TEXT,
        "shelterDate" TEXT,
        "initiatedDate1" TEXT,
        "initiatedDate2" TEXT,
        "rounds" INTEGER,
        "followingPrinciplesSince" TEXT,
        "booksRead" TEXT,
        "booksReading" TEXT,
        "courses" TEXT,
        "anniversary" TEXT,
        "child1Name" TEXT,
        "child1Dob" TEXT,
        "child1Status" TEXT,
        "child2Name" TEXT,
        "child2Dob" TEXT,
        "child2Status" TEXT,
        "child3Name" TEXT,
        "child3Dob" TEXT,
        "child3Status" TEXT,
        "shraddhaName" TEXT,
        "shraddhaDate" TEXT,
        "feedback" TEXT,
        "otherFamilyMembers" TEXT,
        "currentService" TEXT,
        "photo" TEXT,
        "status" TEXT DEFAULT 'Active',
        "createdAt" TEXT
    )`,
    system_logs: `CREATE TABLE IF NOT EXISTS system_logs (
        id ${SERIAL} PRIMARY KEY,
        type TEXT,
        source TEXT,
        message TEXT,
        stack TEXT,
        "resolved" INTEGER DEFAULT 0,
        timestamp TEXT
    )`,
    sadhana: `CREATE TABLE IF NOT EXISTS sadhana (
        "id" TEXT PRIMARY KEY,
        "devoteeId" TEXT,
        "date" TEXT,
        "rounds" INTEGER,
        timestamp TEXT
    )`,
    attendance: `CREATE TABLE IF NOT EXISTS attendance (
        id ${SERIAL} PRIMARY KEY,
        "devoteeId" TEXT NOT NULL,
        "eventName" TEXT NOT NULL,
        "eventDate" TEXT NOT NULL,
        "markedBy" TEXT DEFAULT 'admin',
        "createdAt" TEXT DEFAULT NOW(),
        UNIQUE("devoteeId", "eventName", "eventDate")
    )`,
    events: `CREATE TABLE IF NOT EXISTS events (
        id ${SERIAL} PRIMARY KEY,
        name TEXT NOT NULL,
        "eventType" TEXT DEFAULT 'Sunday Feast',
        "eventDate" TEXT NOT NULL,
        description TEXT,
        location TEXT,
        "createdAt" TEXT DEFAULT NOW()
    )`,
    counseling_sessions: `CREATE TABLE IF NOT EXISTS counseling_sessions (
        id ${SERIAL} PRIMARY KEY,
        "devoteeId" TEXT NOT NULL,
        counselor TEXT,
        "sessionDate" TEXT NOT NULL,
        mood TEXT DEFAULT 'Good',
        notes TEXT,
        "followUpDate" TEXT,
        "createdAt" TEXT DEFAULT NOW()
    )`,
    seva_assignments: `CREATE TABLE IF NOT EXISTS seva_assignments (
        id ${SERIAL} PRIMARY KEY,
        "devoteeId" TEXT NOT NULL,
        department TEXT NOT NULL,
        role TEXT,
        "startDate" TEXT,
        notes TEXT,
        status TEXT DEFAULT 'Active',
        "createdAt" TEXT DEFAULT NOW()
    )`,
    seva_shifts: `CREATE TABLE IF NOT EXISTS seva_shifts (
        id ${SERIAL} PRIMARY KEY,
        department TEXT NOT NULL,
        "shiftName" TEXT NOT NULL,
        "shiftDate" TEXT NOT NULL,
        "startTime" TEXT,
        "endTime" TEXT,
        "requiredVolunteers" INTEGER DEFAULT 1,
        notes TEXT,
        "createdAt" TEXT DEFAULT NOW()
    )`,
    seva_shift_assignments: `CREATE TABLE IF NOT EXISTS seva_shift_assignments (
        id ${SERIAL} PRIMARY KEY,
        "shiftId" INTEGER NOT NULL,
        "devoteeId" TEXT NOT NULL,
        status TEXT DEFAULT 'Confirmed',
        "createdAt" TEXT DEFAULT NOW(),
        UNIQUE("shiftId", "devoteeId")
    )`,
    donations: `CREATE TABLE IF NOT EXISTS donations (
        id ${SERIAL} PRIMARY KEY,
        "devoteeId" TEXT,
        "devoteeName" TEXT,
        mobile TEXT,
        amount NUMERIC NOT NULL,
        "totalAmount" NUMERIC,
        "dueAmount" NUMERIC,
        purpose TEXT,
        "date" TEXT NOT NULL,
        mode TEXT DEFAULT 'Cash',
        reference TEXT,
        "createdAt" TEXT DEFAULT NOW()
    )`,
    expenses: `CREATE TABLE IF NOT EXISTS expenses (
        id ${SERIAL} PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        amount NUMERIC NOT NULL,
        "date" TEXT NOT NULL,
        mode TEXT DEFAULT 'Cash',
        reference TEXT,
        notes TEXT,
        "createdAt" TEXT DEFAULT NOW()
    )`,
    budgets: `CREATE TABLE IF NOT EXISTS budgets (
        id ${SERIAL} PRIMARY KEY,
        department TEXT NOT NULL,
        amount NUMERIC NOT NULL,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        "createdAt" TEXT DEFAULT NOW(),
        UNIQUE(department, month, year)
    )`,
    settings: `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        "updatedAt" TEXT DEFAULT NOW()
    )`,
    courses: `CREATE TABLE IF NOT EXISTS courses (
        id ${SERIAL} PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        "startDate" TEXT,
        "endDate" TEXT,
        status TEXT DEFAULT 'Upcoming',
        fees NUMERIC DEFAULT 0,
        instructor TEXT,
        "createdAt" TEXT DEFAULT NOW()
    )`,
    course_enrollments: `CREATE TABLE IF NOT EXISTS course_enrollments (
        id ${SERIAL} PRIMARY KEY,
        "courseId" INTEGER NOT NULL,
        "devoteeId" TEXT NOT NULL,
        "enrollmentDate" TEXT NOT NULL,
        status TEXT DEFAULT 'Participated',
        "totalPaid" NUMERIC DEFAULT 0,
        "paymentStatus" TEXT DEFAULT 'Due',
        "certificateIssued" INTEGER DEFAULT 0,
        "createdAt" TEXT DEFAULT NOW(),
        UNIQUE("courseId", "devoteeId")
    )`,
    course_attendance: `CREATE TABLE IF NOT EXISTS course_attendance (
        id ${SERIAL} PRIMARY KEY,
        "courseId" INTEGER NOT NULL,
        "devoteeId" TEXT NOT NULL,
        "sessionDate" TEXT NOT NULL,
        "markedBy" TEXT DEFAULT 'admin',
        "createdAt" TEXT DEFAULT NOW(),
        UNIQUE("courseId", "devoteeId", "sessionDate")
    )`,
    course_payments: `CREATE TABLE IF NOT EXISTS course_payments (
        id ${SERIAL} PRIMARY KEY,
        "enrollmentId" INTEGER NOT NULL,
        amount NUMERIC NOT NULL,
        "paymentDate" TEXT NOT NULL,
        "paymentMode" TEXT DEFAULT 'Cash',
        reference TEXT,
        "createdAt" TEXT DEFAULT NOW()
    )`,
    tours: `CREATE TABLE IF NOT EXISTS tours (
        id ${SERIAL} PRIMARY KEY,
        name TEXT NOT NULL,
        destination TEXT,
        "startDate" TEXT,
        "endDate" TEXT,
        status TEXT DEFAULT 'Upcoming',
        fees NUMERIC DEFAULT 0,
        organizer TEXT,
        "maxParticipants" INTEGER,
        "createdAt" TEXT DEFAULT NOW()
    )`,
    tour_enrollments: `CREATE TABLE IF NOT EXISTS tour_enrollments (
        id ${SERIAL} PRIMARY KEY,
        "tourId" INTEGER NOT NULL,
        "devoteeId" TEXT,
        "guestName" TEXT,
        "guestContact" TEXT,
        "bookingDate" TEXT NOT NULL,
        status TEXT DEFAULT 'Reserved',
        "totalPaid" NUMERIC DEFAULT 0,
        "paymentStatus" TEXT DEFAULT 'Due',
        "createdAt" TEXT DEFAULT NOW(),
        UNIQUE("tourId", "devoteeId")
    )`,
    tour_payments: `CREATE TABLE IF NOT EXISTS tour_payments (
        id ${SERIAL} PRIMARY KEY,
        "enrollmentId" INTEGER NOT NULL,
        amount NUMERIC NOT NULL,
        "paymentDate" TEXT NOT NULL,
        "paymentMode" TEXT DEFAULT 'Cash',
        reference TEXT,
        "createdAt" TEXT DEFAULT NOW()
    )`,
    inventory_categories: `CREATE TABLE IF NOT EXISTS inventory_categories (
        id ${SERIAL} PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        "createdAt" TEXT DEFAULT NOW()
    )`,
    inventory_items: `CREATE TABLE IF NOT EXISTS inventory_items (
        id ${SERIAL} PRIMARY KEY,
        "categoryId" INTEGER NOT NULL,
        name TEXT NOT NULL,
        sku TEXT UNIQUE,
        description TEXT,
        unit TEXT DEFAULT 'pcs',
        "unitPrice" NUMERIC DEFAULT 0,
        "stockLevel" NUMERIC DEFAULT 0,
        "reorderLevel" NUMERIC DEFAULT 5,
        "createdAt" TEXT DEFAULT NOW()
    )`,
    inventory_transactions: `CREATE TABLE IF NOT EXISTS inventory_transactions (
        id ${SERIAL} PRIMARY KEY,
        "itemId" INTEGER NOT NULL,
        type TEXT NOT NULL,
        quantity NUMERIC NOT NULL,
        "date" TEXT NOT NULL,
        reason TEXT,
        reference TEXT,
        "createdAt" TEXT DEFAULT NOW()
    )`,
    users: `CREATE TABLE IF NOT EXISTS users (
        id ${SERIAL} PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        "passwordHash" TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        "fullName" TEXT,
        "createdAt" TEXT DEFAULT NOW()
    )`,
    audit_logs: `CREATE TABLE IF NOT EXISTS audit_logs (
        id ${SERIAL} PRIMARY KEY,
        "userId" TEXT,
        "userName" TEXT,
        action TEXT NOT NULL,
        details TEXT,
        timestamp TEXT DEFAULT NOW()
    )`
};

export const INDEXES = [
    `CREATE INDEX IF NOT EXISTS idx_devotees_contact ON devotees(contact)`
];

export const SETTINGS_SEEDS = [
    ['automation_enabled', 'true'],
    ['automation_time', '07:00'],
    ['birthday_message', 'Hare Krishna {name}! 🙏\n\nMany many happy returns of the day! Wishing you a very Happy Birthday. May Lord Krishna bless you with more and more devotional service and spiritual progress. 🎂🌸✨\n\nBest wishes,\nISKCON Durgapur Team'],
    ['anniversary_message', 'Hare Krishna {name}! 🙏\n\nWishing you a very Happy Marriage Anniversary! May your combined service to Guru and Gauranga grow stronger every day. May Lord Krishna bless your family with peace, prosperity, and pure devotion. 💐✨🕯️\n\nBest wishes,\nISKCON Durgapur Team']
];

export const INIT_DDL = (() => {
    // database.mjs queries reference identifiers WITHOUT quotes, which Postgres
    // folds to lowercase (e.g. `createdAt` -> `createdat`). So every identifier
    // is created lowercase here; db.mjs restores camelCase keys on read via
    // CAMEL_CASE_KEYS below. Quotes are kept so reserved words (key, etc.)
    // remain legal identifiers.
    const lowerIdentifiers = (sql) =>
        sql.replace(/"([A-Za-z_][A-Za-z0-9_]*)"/g, (m, name) => `"${name.toLowerCase()}"`);
    return Object.values(TABLES).map(lowerIdentifiers).concat(INDEXES);
})();

// All camelCase columns per table, used by db.mjs to restore camelCase keys
// on result rows (Postgres folds unquoted, lowercased identifiers).
// Computed from the ORIGINAL (pre-lowercasing) DDL so mixed-case names are kept.
export const CAMEL_CASE_KEYS = Object.values(TABLES)
    .join(' ')
    .match(/"([A-Za-z][A-Za-z0-9]*)"/g)
    .map(s => s.slice(1, -1))
    .filter(k => /[A-Z]/.test(k));

// Lowercase names of all columns whose PostgreSQL type is numeric (NUMERIC,
// BIGINT, REAL, DOUBLE PRECISION). The pg drivers serialize these types as
// JS strings; the old SQLite driver returned them as numbers, so db.mjs
// coerces such values back to numbers so the frontend keeps receiving the
// numeric JSON it was built against. Derived from the ORIGINAL DDL.
export const NUMERIC_COLUMNS = new Set(
    Object.values(TABLES)
        .join(' ')
        .match(/"?([A-Za-z_][A-Za-z0-9_]*)"?,?\s+(NUMERIC(?:\(\d+(?:,\s*\d+)?\))?|BIGINT|REAL|DOUBLE\s+PRECISION)\b/gi)
        .map(m => m.match(/"?([A-Za-z_][A-Za-z0-9_]*)"?/)[1])
        .map(n => n.toLowerCase())
);