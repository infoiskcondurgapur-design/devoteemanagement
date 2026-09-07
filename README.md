# ISKCON Devotee Management System (DMS)

## Overview
The **Devotee Management System (DMS)** is an Electron-based desktop application integrated with a React/Vite frontend and a Node.js/Express backend server that connects with WhatsApp Web and SQLite database. It is designed to manage devotee registration, sadhana logs, seva scheduling, events attendance, courses, inventory tracking, financial donations, expenses, and automated backups to Google Sheets. The same frontend and API surface are also deployable to **Vercel** as a serverless web app backed by Postgres (see [Vercel (Web) Deployment](#vercel-web-deployment)).

## Technology Stack
- **Frontend**: React (v19), Vite (v7), React Router, TailwindCSS, Lucide Icons, Leaflet (Map Visualization), Recharts (Analytics)
- **Backend / Integration Services**: Node.js, Express, SQLite3 (desktop) / PostgreSQL + `@vercel/postgres` (web), WebSocket (WS), `whatsapp-web.js` (WhatsApp Bot integration, desktop only)
- **Database**: SQLite3 (desktop, `whatsapp-bot/devotee_mgmt.db`) / PostgreSQL — Vercel Postgres (web, schema in `api/schema.mjs`)
- **Authentication**: Google OAuth 2.0 (for Google Sheets backup services)
- **API**: REST APIs with JSON payloads over HTTP
- **Hosting / Distribution**: Packaged as a Win32 executable desktop installer (.exe) via Electron & Electron Builder; web deployment to Vercel (single serverless function + static SPA)
- **Storage**: Cloudinary (Image uploads) & local SQLite database files / Vercel Postgres with optional Google Sheets backup integration

---

## Features
1. **Devotee Database Management**: Complete profile records with personal, educational, occupational, family, and spiritual detail tracking.
2. **Sadhana Logs**: Individual logging of daily rounds chanted and spiritual practices.
3. **Seva Board & Scheduler**: Volunteers assignment to specific temple seva departments and shifts.
4. **Attendance Tracking**: Sunday feasts, festivals, and course session attendance logs.
5. **Course Enrollments**: Temple educational program signups, fee tracking, payment status, and certificate issuance management.
6. **Tour Bookings**: Temple tour reservation, participant counts, booking dates, and payment history.
7. **Financial Analytics**: Tracking temple donations, expenses, category budgets, and revenue trends.
8. **Inventory Tracker**: Store items level tracking, categories, stock inputs/outputs, and reorder alerts.
9. **WhatsApp Bot Automation**: Automatic session management, QR code scanning page, and automated broadcast communications.
10. **Google Sheets Sync**: On-demand and automatic synchronization of devotee details, sadhana sheets, and metadata backups.

---

## Installation
1. Install [Node.js](https://nodejs.org/) (version 18 or higher).
2. Clone/download the repository folder: `e:\WEBSITE\Devotee Management - Copy`.
3. Open a terminal in the root folder and run the setup script:
   ```cmd
   Setup_DMS.bat
   ```
4. Choose **Option [1]** to install all dependencies for both Frontend and WhatsApp Bot.

## Development
To start the application in development mode with HMR support:
1. Run the launcher script:
   ```cmd
   Setup_DMS.bat
   ```
2. Choose **Option [2]** (or run `npm run electron:dev`).
3. The application will start Electron concurrently with the Vite dev server (port 5173) and the WhatsApp bot backend service (port 3001).
4. The browser will open the WhatsApp QR Code page at `http://localhost:5173/#/settings`.

## Testing
To test endpoints and connections, run scripts in the root or bot subfolder:
- Test Google Auth: `node whatsapp-bot/test-google-auth.mjs`
- Test database schemas: `node check_db.mjs`

## Build
To build the application frontend and compile assets:
```bash
npm run build
```

## Deployment
To build the standalone Windows setup installer executable:
1. Ensure all environment configurations are set.
2. Run:
   ```bash
   npm run electron:build
   ```
3. The setup package will be built under the `release/` folder as `Devotee Management Setup 0.0.0.exe`.

---

## Vercel (Web) Deployment

The web version runs the same React frontend on Vercel with a **serverless Express API** (root `api/`, `vercel.json` rewrites `/api/(.*)` → `/api`) and **Vercel Postgres**. WhatsApp bot features are removed from the web build (receipts share via `https://wa.me` links); the desktop (`whatsapp-bot/`) keeps full WhatsApp integration.

### 1. Provision a Postgres database
Create a Vercel Postgres (or Neon) project. In Vercel, link the project to the database so its `POSTGRES_URL` (and `POSTGRES_SSL`-related) env vars are injected automatically.

### 2. Migrate the existing data (one-time, from your machine)
```bash
npm install                        # includes pg (devDependency used by the migration)
$env:POSTGRES_URL   = '<your postgres url>'   # or DATABASE_URL
$env:POSTGRES_SSL   = "1"                     # required for Vercel/Neon (TLS)
node api/scripts/migrate.mjs       # copies whatsapp-bot/devotee_mgmt.db → Postgres
```
The migration wipes the 25 target tables and copies row-for-row (identity ids preserved, sequences reset).

### 3. Configure environment variables (Vercel project settings)
- `POSTGRES_URL` — Vercel Postgres connection string (link the Postgres integration to inject automatically). Do **not** set `POSTGRES_DRIVER` on Vercel.
- `ALLOWED_ORIGINS` — comma-separated origins allowed by CORS (your Vercel app URL).
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — server-side image uploads.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `GOOGLE_SHEETS_CREDENTIALS` — Google Sheets backup / OAuth.
- AWS S3 (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_BUCKET`) and `DROPBOX_TOKEN` — disaster-recovery backups.

### 4. Deploy
```bash
npm run build                      # optional local check; forces the build
vercel                             # static SPA + api/ serverless function
```
SPA deep links work because `vercel.json` rewrites non-asset routes to `/` and keeps `base: './'` in `vite.config.js`. Note the 4.5 MB serverless request body cap applies to large base64 payloads (profile photos are compressed client-side).

---

## Environment Variables
Copy `.env.example` templates to `.env` configurations:
- Root environment configuration file: `.env`
- WhatsApp bot configuration file: `whatsapp-bot/.env`

*Note: Never commit `.env` or `google-credentials.json` files to Git version control. These files are listed in `.gitignore`.*

---

## Project Structure
```
Devotee Management - Copy/
├── AGENTS.md                 # AI agent coding guidelines & workflows
├── README.md                 # Main project summary & launcher guide
├── Setup_DMS.bat             # Desktop launcher & builder CLI tool
├── Start_DMS.bat             # Startup script for dev execution
├── .env.example              # Environment variables template
├── .gitignore                # File exclusions configuration
│
├── docs/                     # Detailed architectural docs
│   ├── ARCHITECTURE.md       # Multi-layer architecture layout
│   ├── DATABASE.md           # SQLite relational table structures
│   ├── API.md                # Express endpoint specification
│   ├── SECURITY.md           # Parameterization & secrets rules
│   ├── TESTING.md            # Validation checklist before packaging
│   ├── DEPLOYMENT.md         # Production installer packaging details
│   └── CHANGELOG.md          # Version logs and feature details
│
├── src/                      # Frontend UI components & context
│   ├── components/           # Reusable UI modals, receipt generators, forms
│   ├── context/              # Context providers (e.g. auth status)
│   ├── pages/                # Main dashboards (Seva, Devotees, Finance, etc.)
│   ├── services/             # API client services
│   ├── data/                 # Static data resources (counselors, defaults)
│   └── main.jsx              # Main entrypoint index loader
│
├── electron/                 # Electron main and preload processes
│   ├── main.js               # IPC messaging, window creation, lifecycle handler
│   └── preload.js            # Secure context bridge between renderer and node
│
├── whatsapp-bot/             # Express.js WhatsApp automation server (desktop)
│   ├── controllers/          # Endpoint handlers for devotees, tours, inventory
│   ├── routes/               # API route mapping
│   ├── services/             # WhatsApp Client, Sheets Sync, Automation jobs
│   ├── database.mjs          # SQLite driver connection, table builders, and queries
│   └── server.mjs            # Express server listener & port configurations
│
├── api/                      # Serverless Express API (Vercel web deployment)
│   ├── index.mjs             # Single Vercel function entrypoint
│   ├── app.mjs               # Express app assembly (all /api routes)
│   ├── db.mjs                # Postgres pool (@vercel/postgres; "local" driver switch)
│   ├── schema.mjs            # Postgres DDL (25 tables, lowercase identifiers, INIT_DDL)
│   ├── database.mjs          # Parameterized Postgres queries (upserts, RETURNING id)
│   ├── controllers/          # Endpoint handlers (devotees, attendance, counseling, …)
│   ├── routes/               # 13 route modules (14 mounts incl. finance ×2)
│   ├── services/             # Cloudinary, Google Sheets, CSV export, Cloud backup
│   └── scripts/migrate.mjs   # SQLite → Postgres migration tool
│
└── release/                  # Compiled executable & setup binaries
```

## Troubleshooting
- **7za.exe exit code 2 (Symlink failure)**: On Windows, non-admin environments fail to create symlinks when extracting `winCodeSign-2.6.0.7z`. A custom wrapper `fix_7za.py` has been compiled to intercept this return code and bypass execution errors.
- **WhatsApp Bot disconnects**: Restart the bot and verify the QR code status by visiting the settings panel in the app or browsing to `http://localhost:5173/#/settings`.
