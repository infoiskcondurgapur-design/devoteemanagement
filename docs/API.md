# API DOCUMENTATION

## Base URL
- **Web (Vercel)**: `https://<app>.vercel.app/api` — single serverless function (`vercel.json` rewrites `/api/(.*)` → `/api`); `src/services/api.js` reads `import.meta.env.VITE_API_URL`.
- **Desktop (Electron)**: the `whatsapp-bot/` server at `http://localhost:3001`.
- The web backend (`api/`) and desktop backend (`whatsapp-bot/`) expose the same endpoint surface for dedicated pages; the following sections document the web API.

---

## Authentication

Admin login was removed; all endpoints under `/api` are public and require no bearer token.

- **Removed**: `POST /api/auth/login`, `GET /api/auth/session`, `POST /api/auth/verify-password`, `POST /api/auth/logout`.
- **Kept**: Google OAuth endpoints (`GET /api/auth/google/status`, `GET /api/auth/google/url`, `GET /api/auth/google/callback`) for Google Sheets integration, and `GET /api/system/health`.

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

---

## Status Codes
- **200 — Success**: The action executed successfully.
- **400 — Bad Request**: Invalid JSON formatting or missing parameters.
- **404 — Not Found**: Requested ID does not exist in the database.
- **500 — Server Error**: Unhandled exception on the backend server.

---

## API Rules
1. **Always Validate Input**: Controllers must verify properties such as positive numbers for currency/rounds.
2. **Encapsulate Errors**: Return consistent `{ success: false, error: error.message }` JSON responses on failures.
3. **No Direct Writes**: Clients must write using standard HTTP methods; database connections must be private to the server module.
4. **Log Exceptions**: Record error traces using local system logging.
