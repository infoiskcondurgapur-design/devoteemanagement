# SYSTEM ARCHITECTURE

## Architecture Overview
The Devotee Management System (DMS) uses a multi-layer desktop-integrated application architecture. It combines a standalone local web server (WhatsApp bot backend) with a native Electron shell container that renders the Single Page Application (SPA) frontend.

```
       +---------------------------------------------+
       |               Electron Shell                |
       |                                             |
       |  +-------------------+                      |
       |  |  React Frontend   |                      |
       |  |     (Vite)        |                      |
       |  +---------+---------+                      |
       |            |                                |
       |            | IPC Channels /                 |
       |            | HTTP Requests                  |
       |            v                                |
       |  +-------------------+    Local Filesystem  |
       |  |  Express Backend  +-------------------+  |
       |  |      (Node)       |                   |  |
       |  +----+---------+----+                   v  |
       |       |         |               [SQLite Database]
       |       |         |               (devotee_mgmt.db)
       +-------|---------|---------------------------+
               |         |
               | HTTP    | whatsapp-web.js
               v         v
         [Cloudinary]  [WhatsApp Web]
         (Image CDN)   (Broadcasts / Bot)
```

---

## Frontend
- **Framework**: React 19. Built and served locally with Vite for fast performance and Hot Module Replacement (HMR).
- **Routing**: `react-router-dom` (HashRouter is used to maintain local routing compatibility inside Electron package bundles).
- **State Management**: React Hooks (`useState`, `useContext`, `useEffect`) and custom contexts (e.g. settings context) control local UI state.
- **Forms & Validation**: Built using `react-hook-form` and validated using `zod` schema resolvers for input forms.
- **Charts & Mapping**:
  - `recharts` for financial and demographic statistics visualization.
  - `leaflet` / `react-leaflet` for devotee geo-location mapping.
  - `reactflow` for visualizing devotee relationships.

---

## Backend
- **Framework**: Node.js and Express.js backend listening locally on port 3001.
- **Communication Protocols**:
  - HTTP REST endpoints for querying and modifying tables.
  - WebSockets (WS) to relay real-time WhatsApp QR code, connection state status, and progress metrics to the Electron frontend.
- **Background Jobs**: `node-cron` schedules recurring automation routines.

---

## Database
- **Engine**: SQLite3 database driver (`sqlite3` module).
- **Data File**: Local filesystem file located at `whatsapp-bot/devotee_mgmt.db`.
- **Initialization**: Automatically compiles and updates required tables on backend initialization via `database.mjs`.

---

## External Services
1. **WhatsApp Automation**: `whatsapp-web.js` instantiates a headless Chromium browser instance to connect with the user's mobile WhatsApp session.
2. **Image Hosting**: Cloudinary holds profile picture uploads via base64 encoded API transfers.
3. **Backup Integration**: Google Sheets API. Connected through OAuth 2.0 or service account keys (`google-credentials.json`) to write dynamic devotee backup spreadsheets.

---

## Data Flow
### Example Devotee Creation Workflow:
1. **User Input**: Admin inputs a new devotee profile via the React form UI (`DevoteeForm.jsx`).
2. **Validation**: Form inputs are checked client-side via Zod validation resolver.
3. **API Request**: Frontend triggers `apiService.post('/api/devotees', data)` to the local Express server on `http://localhost:3001`.
4. **Database Query**: Backend Controller calls `db.addDevotee(data)` executing parameterized SQL queries:
   ```sql
   INSERT INTO devotees (id, name, contact, ...) VALUES (?, ?, ?, ...)
   ```
5. **WhatsApp Notification**: The backend triggers an automated greetings message to the new devotee's contact number.
6. **Response**: Express server returns `{ success: true, id: devoteeId }`. The frontend displays a success toast message.

---

## Web (Vercel) Variant

The same frontend can be hosted on Vercel with a serverless backend instead of the Electron + local server shell. Desktop (`whatsapp-bot/`) and web (`api/`) backends share the identical endpoint contract for dedicated pages; differences:

```
        +-----------------------------------------------+
        |                 Vercel Pipeline               |
        |                                               |
        |  /  (static SPA, rewrite for deep links)      |
        |  /api (serverless Express function)           |
        |       app.mjs → controllers → database.mjs    |
        |                                   |           |
        |                          [Vercel Postgres]    |
        |                          (schema: schema.mjs) |
        +-----------------------------------------------+
                          | HTTP
                          v
                    [Cloudinary]             [wa.me deep link]
                    (Image CDN)              (receipt sharing)
```

- **API**: single serverless function — `vercel.json` rewrites `/api/(.*)` → `/api`; Express 5 app assembled in `api/app.mjs`, one function in `api/index.mjs`.
- **Database**: Vercel Postgres (Neon). `api/db.mjs` uses `@vercel/postgres` `createPool()` (Neon WebSocket client); `POSTGRES_DRIVER=local` switches to node-postgres for local development against vanilla Postgres. Schema in `api/schema.mjs` (lowercase identifiers, identity columns — see `docs/DATABASE.md`).
- **Migration**: `api/scripts/migrate.mjs` one-time copy of the desktop SQLite DB into Postgres.
- **Removed vs desktop**: WhatsApp bot, WebSocket, SSE, cron, and the `requireAuth` gate are not present on the web backend; receipts share via `https://wa.me/<number>?text=...`, and `/api/attendance` + `/api/counseling` (dead frontend calls on the old server) are now real endpoints.

---

## Architectural Principles
- **Separation of Concerns**: Frontend remains agnostic of database logic; backend handles database querying and external API interactions.
- **Reusable Component Library**: Modals, list tables, inputs, and receipt templates are isolated components.
- **Input Validation**: Strictly enforced at both UI validation layer (React Hook Form + Zod) and database table constraint specifications.
- **Local-First Design**: Primary operations (SQLite database queries, desktop rendering) work offline without requiring external internet connections.
- **Serverless-First (web)**: Stateless API functions scale with Vercel; the database is the only shared state, accessed through fully parameterized queries.
