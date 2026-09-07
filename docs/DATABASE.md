# DATABASE DOCUMENTATION

## Database Technology
The Devotee Management System uses **two engines** depending on where it runs:

- **Desktop (Electron)**: **SQLite3** stored locally at `whatsapp-bot/devotee_mgmt.db`. The database file is stored locally at `whatsapp-bot/devotee_mgmt.db`.
- **Web (Vercel)**: **PostgreSQL** (Vercel Postgres / Neon) reached through the serverless API in root `api/`. The schema is defined in `api/schema.mjs`, executed by `api/database.mjs` `initDb()`, and the original SQLite data is migrated with `api/scripts/migrate.mjs` (see "Migration" below).

### Postgres identifier convention
All PostgreSQL columns are created **lowercase**. `api/schema.mjs` lowercases every quoted identifier in the source DDL (`"createdAt"` → `"createdat"`) while keeping quotes so reserved words such as `key` remain legal. Queries in `api/database.mjs` reference columns unquoted (Postgres folds them to lowercase), and `api/db.mjs` restores camelCase result keys at read time (e.g. `spiritualname` → `spiritualName`) using `CAMEL_CASE_KEYS`, which is computed from the original (pre-lowercase) DDL. Primary keys are `BIGINT GENERATED ALWAYS AS IDENTITY` (an explicit data type is required before `GENERATED` in PostgreSQL); identity values from SQLite are preserved during migration with `OVERRIDING SYSTEM VALUE`, and sequences are reset afterward.

### Migration
`api/scripts/migrate.mjs` copies the SQLite database (`whatsapp-bot/devotee_mgmt.db`) into any Postgres instance:
- Target via `POSTGRES_URL` (or `DATABASE_URL`); set `POSTGRES_SSL=1` when targeting Vercel/Neon.
- Wipes all 25 target tables first, then copies row-for-row; `''` values on non-text columns are coerced to `NULL`.
- Run locally against a vanilla Postgres with the `pg` driver — the `@vercel/postgres` (Neon) WebSocket client in `api/db.mjs` cannot talk to a plain Postgres (the `POSTGRES_DRIVER=local` env switch selects `pg` for local development).

---

## Schema & Tables

### 1. `devotees`
Contains detailed biographical, family, contact, and spiritual info.
- **id**: `TEXT PRIMARY KEY` (Devotee UUID / ID)
- **name**: `TEXT NOT NULL`
- **spiritualName**: `TEXT`
- **email**: `TEXT`
- **gender**: `TEXT`
- **dob**: `TEXT` (Date of birth)
- **age**: `INTEGER`
- **bloodGroup**: `TEXT`
- **education**: `TEXT`
- **occupation**: `TEXT`
- **relationType**: `TEXT` (S/O, D/O, W/O)
- **guardianName**: `TEXT`
- **contact**: `TEXT`
- **whatsapp**: `TEXT`
- **address**: `TEXT`
- **village**: `TEXT`
- **district**: `TEXT`
- **pinCode**: `TEXT`
- **state**: `TEXT`
- **maritalStatus**: `TEXT`
- **skills**: `TEXT`
- **specialDay**: `TEXT`
- **specialDayName**: `TEXT`
- **spiritualStatus**: `TEXT` (Sheltered, Initiated, etc.)
- **initiatedName**: `TEXT`
- **counselor**: `TEXT`
- **spiritualMaster**: `TEXT`
- **shelterDate**: `TEXT`
- **initiatedDate1**: `TEXT`
- **initiatedDate2**: `TEXT`
- **rounds**: `INTEGER`
- **followingPrinciplesSince**: `TEXT`
- **booksRead**: `TEXT`
- **booksReading**: `TEXT`
- **courses**: `TEXT`
- **anniversary**: `TEXT`
- **photo**: `TEXT` (Cloudinary URL)
- **status**: `TEXT DEFAULT 'Active'` (Active / Inactive)
- **createdAt**: `TEXT`
- **shraddhaName**: `TEXT`
- **shraddhaDate**: `TEXT`
- **feedback**: `TEXT`
- **otherFamilyMembers**: `TEXT`
- **currentService**: `TEXT`

---

### 2. `sadhana`
Stores daily spiritual chanting performance logs.
- **id**: `TEXT PRIMARY KEY`
- **devoteeId**: `TEXT` (`FOREIGN KEY` references `devotees(id)`)
- **date**: `TEXT`
- **rounds**: `INTEGER`
- **timestamp**: `TEXT`

---

### 3. `attendance`
Maintains event attendance logs.
- **id**: `INTEGER PRIMARY KEY AUTOINCREMENT`
- **devoteeId**: `TEXT NOT NULL` (`FOREIGN KEY` references `devotees(id)`)
- **eventName**: `TEXT NOT NULL`
- **eventDate**: `TEXT NOT NULL`
- **markedBy**: `TEXT DEFAULT 'admin'`
- **createdAt**: `TEXT DEFAULT (datetime('now'))`
- **Constraints**: `UNIQUE(devoteeId, eventName, eventDate)`

---

### 4. `events`
Details scheduled Sunday feasts, festivals, and educational programs.
- **id**: `INTEGER PRIMARY KEY AUTOINCREMENT`
- **name**: `TEXT NOT NULL`
- **eventType**: `TEXT DEFAULT 'Sunday Feast'`
- **eventDate**: `TEXT NOT NULL`
- **description**: `TEXT`
- **location**: `TEXT`
- **createdAt**: `TEXT DEFAULT (datetime('now'))`

---

### 5. `counseling_sessions`
Tracks counselors periodic reviews and devotee moods.
- **id**: `INTEGER PRIMARY KEY AUTOINCREMENT`
- **devoteeId**: `TEXT NOT NULL` (`FOREIGN KEY` references `devotees(id)`)
- **counselor**: `TEXT`
- **sessionDate**: `TEXT NOT NULL`
- **mood**: `TEXT DEFAULT 'Good'`
- **notes**: `TEXT`
- **followUpDate**: `TEXT`
- **createdAt**: `TEXT DEFAULT (datetime('now'))`

---

### 6. `donations`
Logs financial receipts and contributions.
- **id**: `INTEGER PRIMARY KEY AUTOINCREMENT`
- **devoteeId**: `TEXT` (Optional, links to `devotees(id)`)
- **devoteeName**: `TEXT` (Custom name if unregistered)
- **mobile**: `TEXT`
- **amount**: `REAL NOT NULL`
- **purpose**: `TEXT`
- **date**: `TEXT NOT NULL`
- **mode**: `TEXT DEFAULT 'Cash'` (Cash, UPI, Bank Transfer)
- **reference**: `TEXT`
- **totalAmount**: `REAL DEFAULT 0`
- **dueAmount**: `REAL DEFAULT 0`
- **createdAt**: `TEXT DEFAULT (datetime('now'))`

---

### 7. `expenses`
Records outflows and transactions.
- **id**: `INTEGER PRIMARY KEY AUTOINCREMENT`
- **title**: `TEXT NOT NULL`
- **category**: `TEXT NOT NULL`
- **amount**: `REAL NOT NULL`
- **date**: `TEXT NOT NULL`
- **mode**: `TEXT DEFAULT 'Cash'`
- **reference**: `TEXT`
- **notes**: `TEXT`
- **createdAt**: `TEXT DEFAULT (datetime('now'))`

---

### 8. `courses`, `course_enrollments` & `course_payments`
- **courses**: Handles program names, dates, fees.
- **course_enrollments**: Connects devoteeId to courseId. Holds `paymentStatus` (Due, Partial, Completed) and `certificateIssued`.
- **course_payments**: Payments transactions for specific course enrollments (`enrollmentId`, `amount`, `paymentDate`, `paymentMode`, `reference`).

---

### 9. `tours`, `tour_enrollments` & `tour_payments`
- **tours**: Details pilgrim tours (name, destination, fee).
- **tour_enrollments**: Connects devoteeId with booking dates and guest information.
- **tour_payments**: Payment details linked to specific tour bookings (`enrollmentId`, `amount`, `paymentDate`, `paymentMode`, `reference`).

---

### 10. `seva_shifts` & `seva_shift_assignments`
- **seva_shifts**: Scheduled services (date, department, time, required volunteers).
- **seva_shift_assignments**: Devotee assignments linked to specific shifts.

---

### 11. `inventory_items` & `inventory_transactions`
- **inventory_categories**: Item tags.
- **inventory_items**: Item levels (`stockLevel`, `reorderLevel`, `unitPrice`).
- **inventory_transactions**: Quantity adjustments ('Stock In', 'Stock Out', etc.).

---

### 12. `users`
Holds server-side login accounts (no longer used by the app — admin login was removed and all routes are public):
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `username` TEXT NOT NULL UNIQUE — can hold an email.
- `email` TEXT
- `passwordHash` TEXT NOT NULL — formerly scrypt `salt:hash` (SHA-256, 64-byte key).
- `role` TEXT DEFAULT 'admin' — 'admin' (only role currently seeded; extendable to 'counselor'/'viewer').
- `fullName` TEXT
- `createdAt` / `updatedAt` TEXT

Created by `initDb()` and guaranteed by `healSchema()`. The table and its DB functions (`createUser`, `getUserByIdentity`, `getUsers`, `updateUserPassword`) are retained but are no longer referenced by any route or service. The `ensureAdmin()` seeding routine was removed with the auth service.

---

## Database Relationships

```
  [devotees]
      |
      +----(1 : N)----> [sadhana]
      |
      +----(1 : N)----> [attendance]
      |
      +----(1 : N)----> [counseling_sessions]
      |
      +----(1 : N)----> [seva_assignments]
      |
      +----(1 : N)----> [course_enrollments] <---(1 : N)--- [courses]
      |                       |
      |                       +---(1 : N)---> [course_payments]
      |
      +----(1 : N)----> [tour_enrollments] <---(1 : N)--- [tours]
                              |
                              +---(1 : N)---> [tour_payments]
```

---

## Security
- All database write/read logic is processed through the local Express controller endpoints.
- No direct database connections are allowed from clients outside the localhost loop.

---

## Database Validation Rules
- Text inputs must be sanitized to strip dangerous characters before executing SQLite writes.
- Mandatory fields (e.g. devotee name, transaction dates, positive payment values) are validated in Express middleware controllers.
- **Duplicate protection (application layer)** (`database.mjs` `addDevotee`/`updateDevotee`): rejects records whose `contact` + normalized `name` already exist on a different `id`, returning a clean "already exists" error. A deliberately **non-unique** index `idx_devotees_contact` on `devotees(contact)` accelerates the lookup; a schema-level `UNIQUE` constraint is intentionally avoided because `INSERT OR REPLACE` would silently overwrite existing rows (e.g. family members sharing one phone number).

---

## Migration Notes
- `course_payments` / `tour_payments` tables are created in `initDb()` **and** ensured by `healSchema()` so pre-existing databases are upgraded on startup without manual migration.
- The `users` table (server-side authentication) is created in `initDb()` and ensured by `healSchema()`; the initial admin is seeded by `ensureAdmin()` on first start.
- Duplicate devotee records are consolidated by `whatsapp-bot/dedupe_devotees.mjs` (keeps the most complete row, remaps child-table foreign keys, writes a JSON backup of removed rows). True duplicates are the same contact + same name (whitespace/case-insensitive); shared-phone records with different names are preserved.

---

## Migration Rules
- Schema updates must use safe scripts. Tables must be checked for existence before calling `CREATE TABLE`.
- Column additions must be appended using `ALTER TABLE ... ADD COLUMN ...` statements with default values within the setup migration helper block inside `whatsapp-bot/database.mjs`.

---

## Backup & Recovery
- **Google Sheets Backup**: Syncs tables onto Google Drive spreadsheets on demand.
- **Local SQLite Backups**: Copies of `devotee_mgmt.db` are placed inside the `whatsapp-bot/backups` directory on startup.
- **Recovery Procedure**: To restore the database to a previous state, copy the target database from the backup folder, rename it to `devotee_mgmt.db`, and replace the file in `whatsapp-bot/`.
