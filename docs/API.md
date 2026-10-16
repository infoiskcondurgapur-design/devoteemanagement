# API DOCUMENTATION

## Base URL
- **Web (Vercel)**: `https://<app>.vercel.app/api` — single serverless function (`vercel.json` rewrites `/api/(.*)` → `/api`); `src/services/api.js` reads `import.meta.env.VITE_API_URL`.
- **Desktop (Electron)**: the `whatsapp-bot/` server at `http://localhost:3001`.
- The web backend (`api/`) and desktop backend (`whatsapp-bot/`) expose the same endpoint surface for dedicated pages; the following sections document the web API.

---

## Authentication

All endpoints under `/api` (except the public set below) require a bearer token: `Authorization: Bearer <jwt>`.

- **Login**: `POST /api/auth/login` with `{ username, password }` → `{ success, token, user }`. Users: the seeded `admin` (credentials from `ADMIN_USERNAME`/`ADMIN_PASSWORD` env) and devotee accounts (username = contact number, role `viewer`).
- **Forgot Password**: `POST /api/auth/forgot-password` with `{ identity }` (username, email, or phone) → sends 6-digit OTP to registered WhatsApp number (or returns `devCode` if dev bypass is active) and returns `{ success, requestId, method, maskedContact }`.
- **Reset Password (OTP)**: `POST /api/auth/reset-password` with `{ requestId, code, newPassword }` → verifies OTP, updates passwordHash in database, and returns `{ success, message }`.
- **Change Password (Logged-in User)**: `POST /api/auth/change-password` with `{ currentPassword, newPassword }` → verifies `currentPassword`, updates caller's `passwordHash`, and returns `{ success, message }`.
- **Admin Reset Password**: `POST /api/auth/admin-reset-password` (Admin only) with `{ userId, newPassword }` → resets target user's password directly, optionally sends WhatsApp notification, and returns `{ success, message }`.
- **Session**: `GET /api/auth/session`, **Logout**: `POST /api/auth/logout` (revokes the presented token server-side), **Password check**: `POST /api/auth/verify-password`.
- **Public (no token)**: `/api/system/health`, `POST /api/auth/login`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, `GET|POST /api/auth/bypass`, `/api/auth/google/*`, `POST /api/public/register`.
- **Gate rule**: the auth gate matches against the URL **path only** (query strings are stripped first so `?x=/auth/login` cannot satisfy a public-path check).

### Dev bypass login (development only)

For local development when credentials are unknown:

- `GET /api/auth/bypass` → `{ success, enabled }` — reports whether the bypass is on.
- `POST /api/auth/bypass` → `{ success, token, user }` (admin token, no password) when enabled; **403** when disabled.
- Enabled **only** by `DMS_AUTH_BYPASS=1` in the environment (set in local `whatsapp-bot\.env`; never set it in the Vercel environment). Both backends print a loud boot warning while enabled, and the login page shows a "Skip login (dev mode)" button only when the status endpoint reports `enabled: true`.

---

## Key Endpoints

### 1. Devotee Endpoints (`/api/devotees`)

#### `GET /api/devotees`
- **Purpose**: Fetch all registered devotees list.
- **Query Params**:
  - `status`: Filter by status (`Active` or `Inactive`).
- **Response (200)**:
  ```json
  {
    "success": true,
    "data": [
      { "id": "uuid-1", "name": "Acyuta Das", "contact": "9876543210" }
    ]
  }
  ```

#### `GET /api/devotees/:id`
- **Purpose**: Fetch a single devotee details by ID.
- **Response (200)**:
  ```json
  {
    "success": true,
    "data": { "id": "uuid-1", "name": "Acyuta Das", ... }
  }
  ```

#### `POST /api/devotees`
- **Purpose**: Create a new devotee record.
- **Request Body**: JSON containing devotee profile fields.
- **Response (200)**:
  ```json
  {
    "success": true,
    "id": "uuid-1"
  }
  ```

#### `POST /api/devotees/bulk`
- **Purpose**: Bulk import multiple devotee records from Excel/CSV uploads with automatic deduplication.
- **Request Body**:
  ```json
  {
    "devotees": [
      { "name": "Radheshyam Das", "contact": "9876543210", "gender": "Male", "spiritualStatus": "Initiated" }
    ],
    "updateDuplicates": false
  }
  ```
- **Response (200)**:
  ```json
  {
    "success": true,
    "total": 1,
    "added": 1,
    "updated": 0,
    "skipped": 0,
    "skippedDetails": [],
    "errors": []
  }
  ```

#### `PUT /api/devotees/:id`
- **Purpose**: Update an existing devotee profile.
- **Response (200)**:
  ```json
  {
    "success": true
  }
  ```

#### `DELETE /api/devotees/:id`
- **Purpose**: Delete a devotee record.
- **Response (200)**:
  ```json
  {
    "success": true
  }
  ```

---

### 2. Sadhana Endpoints (`/api/sadhana`)

#### `GET /api/sadhana/:devoteeId`
- **Purpose**: Retrieve daily rounds logged for a devotee.
- **Response (200)**:
  ```json
  {
    "success": true,
    "data": [
      { "id": "log-1", "date": "2026-08-08", "rounds": 16 }
    ]
  }
  ```

#### `POST /api/sadhana`
- **Purpose**: Log daily rounds entry.
- **Request Body**:
  ```json
  {
    "devoteeId": "uuid-1",
    "date": "2026-08-08",
    "rounds": 16
  }
  ```
- **Response (200)**:
  ```json
  {
    "success": true,
    "id": "log-uuid"
  }
  ```

---

### 3. Events Endpoints (`/api/events`)

#### `GET /api/events`
- **Purpose**: Get scheduled events.
- **Response (200)**:
  ```json
  {
    "success": true,
    "data": [
      { "id": 1, "name": "Janmashtami Feast", "eventDate": "2026-08-28" }
    ]
  }
  ```

#### `POST /api/events`
- **Purpose**: Add a new festival or program.

---

### 4. Finance Endpoints (`/api/finance`)

#### `GET /api/finance/donations`
- **Purpose**: Fetch all donations list.
- **Response (200)**:
  ```json
  {
    "success": true,
    "data": [
      { "id": 1, "devoteeName": "Devotee 1", "amount": 1008, "date": "2026-08-08" }
    ]
  }
  ```

#### `POST /api/finance/donations`
- **Purpose**: Create a donation entry.

#### `GET /api/finance/expenses`
- **Purpose**: Fetch all expenses list.

---

### 5. Inventory Endpoints (`/api/inventory`)

#### `GET /api/inventory/items`
- **Purpose**: Fetch inventory items stock list.
- **Query Params**:
  - `categoryId`: Filter by category.

#### `POST /api/inventory/transactions`
- **Purpose**: Log a stock movement transaction (Stock In, Stock Out, Adjustment).

---

### 6. Attendance Endpoints (`/api/attendance`)

#### `GET /api/attendance`
- **Purpose**: Fetch attendance records. Query params `eventId`, `date`, `summary=true`, `recent=true` and `byEvent=true` are supported by `attendanceController`.

#### `POST /api/attendance`
- **Purpose**: Record attendance for an event. `devoteeIds` (array), `eventId`, and `eventDate` are required; also accepts a single `{ devoteeId, eventId, eventDate }` payload.

### 7. Counseling Endpoints (`/api/counseling`)

#### `GET /api/counseling`
- **Purpose**: Fetch all counseling session logs.

#### `POST /api/counseling`
- **Purpose**: Create a counseling session log entry.

#### `DELETE /api/counseling/:id`
- **Purpose**: Delete a counseling session log.

### 8. WhatsApp Bot Endpoints (desktop only)

The `whatsapp-bot/` server owns WhatsApp integration and its SSE stream. These endpoints do **not** exist in the Vercel web API (the web app removed WhatsApp in favor of `https://wa.me/<number>?text=...` share links):

#### `GET /api/whatsapp/status`
- **Purpose**: Retrieve WhatsApp connection state (CONNECTED, DISCONNECTED, INITIALIZING).
- **Response (200)**:
  ```json
  {
    "success": true,
    "status": "CONNECTED"
  }
  ```

#### `POST /api/whatsapp/broadcast`
- **Purpose**: Trigger custom WhatsApp broadcast messages to a dynamic devotee list.

### 9. Public Registration (`/api/public`)

Anonymous endpoints for the shareable self-registration form (`#/register`). Available on **both** backends (desktop + Vercel web). No `Authorization` header required; rate limited to 10 submissions / 15 min / IP (`RATE_LIMIT_PUBLIC_MAX` overrides the cap).

#### `POST /api/public/register`
- **Purpose**: Anyone can submit a full devotee registration (3-step form data + optional base64 photo) for admin approval.
- **Auth**: None.
- **Body**: JSON with the same fields as `POST /api/devotees` (see §1). Server-owned fields (`id`, `status`, `source`, `createdAt`) are always stripped and forced server-side. Optional honeypot field `website` — if filled, the request succeeds but nothing is stored.
- **Validation (400)**: `name` required; `gender` ∈ GENDERS; `relationType` ∈ RELATION_TYPES; `contact` must match `^[6-9]\d{9}$`; `maritalStatus` ∈ MARITAL_STATUSES; `spiritualStatus` ∈ SPIRITUAL_STATUSES; photo must be a `data:image/...` base64 string ≤ 14,000,000 chars.
- **Response (200)**:
  ```json
  {
    "success": true,
    "id": "generated-uuid",
    "status": "Pending",
    "message": "Registration submitted for approval."
  }
  ```
- **Side effects**: photo (if provided) is uploaded to Cloudinary (desktop) and the row is stored with `status = 'Pending'`, `source = 'Public Form'`. Desktop broadcasts `DEVOTEE_CREATED` over WebSocket so open admin screens refresh. **No WhatsApp greeting and no login credentials are issued** until an admin approves (status → `Active`).
- **Errors**: `400` validation failed; `409` duplicate name + contact — returns the generic message `"A registration with this name and mobile number already exists."` and never reveals the existing devotee's name; `429` rate limited.

Pending rows are excluded from `GET /api/devotees/stats`, weekly/birthday/anniversary queries, and credential-linking sweeps.

---

### 10. User Management Endpoints (`/api/users`)
*All user management endpoints require `role: admin` bearer token.*

#### `GET /api/users`
- **Purpose**: Fetch all registered user accounts from the database.
- **Response (200)**:
  ```json
  {
    "success": true,
    "data": [
      { "id": "1", "username": "admin", "email": "admin@iskcon.org", "role": "admin", "fullName": "Super Admin", "createdAt": "2026-01-01" }
    ]
  }
  ```

#### `POST /api/users`
- **Purpose**: Create a new user account directly in the database.
- **Body**: `{ username, fullName, email, password, role }`
- **Response (200)**: `{ success: true, user: { id, username, email, role, fullName } }`

#### `PUT /api/users/:id/role`
- **Purpose**: Update an existing user's role (`admin`, `counselor`, `viewer`).
- **Body**: `{ role }`
- **Response (200)**: `{ success: true, message: "Role updated successfully" }`

#### `DELETE /api/users/:id`
- **Purpose**: Delete a user account from the system (prevents self-deletion).
- **Response (200)**: `{ success: true, message: "User deleted successfully" }`

---

### 11. Cloud Backup & Disaster Recovery Endpoints (`/api/backup`)

#### `GET /api/backup/cloud-status`
- **Purpose**: Get current configuration and last execution status for AWS S3 and Dropbox.
- **Response (200)**:
  ```json
  {
    "success": true,
    "status": {
      "s3": { "configured": false, "bucket": null, "lastBackupTime": null, "lastBackupStatus": "Never run" },
      "dropbox": { "configured": true, "folderPath": "/DMS_Backups/", "lastBackupTime": "2026-10-15T12:00:00Z", "lastBackupStatus": "Success" }
    }
  }
  ```

#### `POST /api/backup/dropbox-config`
- **Purpose**: Save or clear Dropbox disaster recovery credentials (stored securely in database `settings` table).
- **Body**: `{ accessToken?: string, refreshToken?: string, appKey?: string, appSecret?: string, clear?: boolean }`
- **Response (200)**: `{ success: true, message: "Dropbox settings saved successfully", status: { ... } }`

#### `POST /api/backup/dropbox-sync`
- **Purpose**: Trigger an immediate on-demand backup upload directly to Dropbox (`/DMS_Backups/`).
- **Response (200)**: `{ success: true, result: { filename: "devotee_mgmt_backup_....json", path: "/DMS_Backups/devotee_mgmt_backup_....json", size: 12345, timestamp: "2026-10-15T12:00:00Z" } }`

#### `POST /api/backup/dropbox-auto-sync`
- **Purpose**: Configure automated Dropbox background sync state and interval.
- **Body**: `{ enabled?: boolean, intervalMinutes?: number }`
- **Response (200)**: `{ success: true, message: "Dropbox auto-sync enabled", status: { ... } }`

#### `POST /api/backup/auto-sync-check`
- **Purpose**: Verify if the scheduled sync interval has elapsed since the last backup, and automatically trigger sync if due.
- **Response (200)**: `{ success: true, synced: boolean, message: string, result?: object }`

#### `GET /api/backup/cron-sync` (or `POST`)
- **Purpose**: Webhook endpoint for automated serverless cron jobs (e.g., Vercel Cron) to execute background disaster recovery backups. Bypasses standard bearer auth gate (optionally secured via `Bearer <CRON_SECRET>` header).
- **Response (200)**: `{ success: true, synced: true, result: { ... } }` or `{ success: true, skipped: true }`

#### `POST /api/backup/cloud-sync`
- **Purpose**: Trigger multi-cloud sync across all configured cloud providers (S3 and Dropbox).
- **Response (200)**: `{ success: true, results: { s3: { ... }, dropbox: { ... } } }`

---


## Status Codes
- **200 — Success**: The action executed successfully.
- **400 — Bad Request**: Invalid JSON formatting or missing parameters.
- **401 — Unauthorized**: Missing/expired/revoked token (tokens are revoked server-side by `POST /api/auth/logout`).
- **404 — Not Found**: Requested ID does not exist in the database.
- **409 — Conflict**: Duplicate submission on a public endpoint (generic message only).
- **429 — Too Many Requests**: Rate limit exceeded.
- **500 — Server Error**: Unhandled exception on the backend server.

---

## API Rules
1. **Always Validate Input**: Controllers must verify properties such as positive numbers for currency/rounds.
2. **Encapsulate Errors**: Return consistent `{ success: false, error: error.message }` JSON responses on failures.
3. **No Direct Writes**: Clients must write using standard HTTP methods; database connections must be private to the server module.
4. **Log Exceptions**: Record error traces using local system logging.
