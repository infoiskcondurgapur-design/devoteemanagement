# CHANGELOG

## [2026-09-14]

### Windows Desktop Application Build & Package
- **Electron Builder Configuration**: Configured `package.json` with `"npmRebuild": false` to prevent unnecessary and failing native module compilation (`bufferutil` node-gyp build) when optional C++ WebSockets addons are absent.
- **Package Metadata**: Added application `description` and `author` fields to package configuration.
- **Standalone Windows Executable**: Successfully compiled Vite production assets and generated the final NSIS setup installer file: `release/Devotee Management Setup 0.0.0.exe` (139 MB).

## [2026-09-07]

### Vercel (web) deployment: serverless backend + Vercel Postgres + WhatsApp removal
- **Serverless API**: The web backend now lives in the root `api/` folder (single Vercel function; `vercel.json` rewrites `/api/(.*)` → `/api`). Docker/Caddy/Oracle Cloud plans and the desktop-only WhatsApp bot server are superseded by serverless for the web while the Electron app continues to use `whatsapp-bot/`.
- **SQLite → Vercel Postgres**: `api/db.mjs` (`@vercel/postgres` `createPool`, lazy async `getPool()`) + `api/schema.mjs` (25 tables, `BIGINT GENERATED ALWAYS AS IDENTITY` PKs) + `api/database.mjs` (all parameterized queries, `ON CONFLICT (id) DO UPDATE` upserts, `RETURNING id`). Result rows are camelCased on read via `CAMEL_CASE_KEYS` derived from the DDL.
- **Schema identifier convention (critical)**: All PostgreSQL columns are created **lowercase** — quoted identifiers in the DDL are lowercased (e.g. `"createdAt"` → `"createdat"`; quotes kept for reserved words such as `key`) — because `database.mjs` references columns unquoted (Postgres folds identifiers to lowercase). Previously, quoted mixed-case names caused every query to fail with `column "createdat" does not exist`.
- **Migration tool**: `api/scripts/migrate.mjs` copies `whatsapp-bot/devotee_mgmt.db` into any Postgres via `pg` (wipes target tables, preserves identity ids with `OVERRIDING SYSTEM VALUE`, resets sequences, coerces `''` → NULL on non-text columns). Verified end-to-end against a local Postgres 16 container: 25 tables, row counts match SQLite exactly. `POSTGRES_SSL=1` is required when migrating to Vercel.
- **`POSTGRES_DRIVER=local` escape hatch**: `api/db.mjs` uses node-postgres (`pg`) instead of the Neon WebSocket client when set, so the API can run against vanilla Postgres locally (the Neon client only works with Neon/Vercel Postgres endpoints).
- **Attendance & Counseling made live**: `/api/attendance` and `/api/counseling` routes existed on the frontend but were never mounted by the old server; new `attendanceController.mjs` / `counselingController.mjs` + routes now serve the Attendance and Counseling Log pages. Fixed a broken relative import in `backupController.mjs` (`./services/` → `../services/`).
- **WhatsApp removed from the web app**: Settings page WhatsApp bot card and Pairing Guide removed; the receipt flows in `DonationForm.jsx` / `AddParticipantForm.jsx` now download the receipt PNG and open `https://wa.me/<number>?text=...` instead of `POST /api/whatsapp/send`; `checkBotStatus` and all `whatsappStatus`/`botReady` references removed from `DevoteeContext.jsx` (grep-verified clean). `src/services/whatsappService.js` is now dead code.
- **Backend stays parameterized, no secrets in repo**: all queries use prepared statements; Cloudinary/Google/AWS/Dropbox credentials load strictly from `process.env`.
- **Verification**: `npm run build` passes (vite 7.3.0); `npm run lint` exits 0 (0 errors; remaining warnings are pre-existing `react-hooks/exhaustive-deps`); every API file passes `node --check`; 14 route mounts enumerated; full endpoint + mutation smoke suite passes against real migrated data (devotee CRUD with camelCase restore, sadhana, donations/expenses/budgets, courses + attendance, tours + payments, seva, inventory, settings, auth).
- **Docs**: `API.md` (Base URL, attendance/counseling, WhatsApp endpoints now desktop-only), `DATABASE.md` (Postgres engine + lowercase identifiers + migration), `README.md` (Vercel deployment section), this CHANGELOG.

## [2026-09-02]

### Web deployment groundwork (Docker + Caddy + Oracle Cloud)
- **Frontend API base configurable**: `src/services/api.js` `BASE_URL` now reads `import.meta.env.VITE_API_URL` (fallback `http://localhost:3001`). The WebSocket (`DevoteeContext.jsx`) and SSE stream derive from `apiService.baseURL`, so both follow the same configured origin; in production the WebSocket connects via `/ws` rather than the root.
- **Backend CORS + WS allowlist env-driven**: `server.mjs` merges `ALLOWED_ORIGINS` (comma-separated) into the always-on localhost allowlist; `services/wsService.mjs` reads the same var for WebSocket Origin enforcement. `HOST` and `PORT` remain env-overridable.
- **Cross-platform Chrome path**: `whatsapp-bot/services/whatsappService.mjs` `getChromePath()` now honors a `CHROME_PATH` override and checks Linux paths (`/usr/bin/google-chrome-stable`, `/usr/bin/chromium`, `/usr/bin/chromium-browser`, `/usr/bin/brave-browser`) before the Windows paths, enabling the bot to run on servers/containers (Puppeteer already passes `--no-sandbox` and `--disable-dev-shm-usage`).
- **Docker packaging**: added `whatsapp-bot/Dockerfile` (Node 20 + Chromium), `whatsapp-bot/.dockerignore`, `docker-compose.prod.yml` (API + Caddy, persistent `dms_data` volume for SQLite + WhatsApp sessions), and a root `Caddyfile` (auto-HTTPS, static serving, `/api` + `/ws` proxying).
- **Env template**: expanded `whatsapp-bot/.env.example` with `HOST`, `ALLOWED_ORIGINS`, `CHROME_PATH`, `DB_PATH`, and `DMS_DISABLE_WHATSAPP` deployment knobs.
- **Deploy key**: generated an ED25519 SSH key pair in `deploy-keys/` for the Oracle Cloud VM.
- **Docs**: added the "Web / Cloud Deployment" section to `docs/DEPLOYMENT.md`.
- **Verification**: regression suite 8/8 pass (incl. WebSocket origin enforcement retains allowlist/reject behavior), lint clean, and `npm run build` succeeds.

## [2026-09-01]

### Removed admin login (all routes public)
- **Admin login removed**: Deleted the frontend login page (`src/pages/LoginPage.jsx`) and its `/login` HashRouter route. The `ProtectedRoute` wrapper and `AuthProvider` gating were removed from `App.jsx`, so all routes render directly without authentication.
- **Auth made optional / all routes public**: `AuthContext.jsx` now provides a static local admin user (no login/logout/session state, no token validation, no `app:unauthorized` handling). `api.js` no longer attaches a `Bearer` token, and its `authLogin`/`authLogout`/`validateSession` helpers were removed.
- **Backend auth middleware removed**: Deleted `services/authService.mjs` (hash/token store/`requireAuth`/`requireAdmin`/`ensureAdmin`). In `server.mjs` the `POST /api/auth/login` endpoint, its `loginLimiter`, `ensureAdmin()` bootstrap, and the `requireAuth` gate on every route were removed.
- **Kept**: Google OAuth endpoints (`GET /api/auth/google/status|url|callback`) in `routes/authRoutes.mjs`/`controllers/authController.mjs` (password-login, session, verify-password, and logout handlers removed). The `users` table and its DB functions in `database.mjs` are retained (harmless, no longer gated).
- **UI cleanup**: Removed the logout button and role-based nav filtering from `Sidebar.jsx` (all nav items shown), the "Sign Out" button from `Profile.jsx`, and the token query param in `Communication.jsx`'s WhatsApp SSE stream. Removed the password-gated `PasswordModal` and its `verify-password` checks from the devotee edit/delete flows (`DevoteeList.jsx`, `DevoteeProfile.jsx`) — these actions now proceed directly.
- **Regression tests updated**: `regression.api.test.mjs` now asserts API endpoints are public (200 without/garbage token), and the auth-specific tests (login/session/verify-password/logout/login rate limiter) were removed. 8/8 tests pass.

## [2026-08-30]

### Regression tests
- **Durable backend regression suite** (`npm run test:regression`): new zero-dependency suite built on Node's built-in `node:test` runner in `whatsapp-bot/tests/regression.api.test.mjs`. It spawns the real `server.mjs` as an isolated child so production data is never touched: ephemeral TCP port (never 3001), `DB_PATH` pointing at a throwaway SQLite file, `DMS_DISABLE_WHATSAPP=1`, and fresh seeded `ADMIN_*` credentials. 14/14 tests pass, covering boot/health, auth gating (401 without/with garbage token), login success/failure, session validation, `verify-password`, devotee CRUD lifecycle, the create+update duplicate guards, token revocation on logout, WebSocket origin enforcement (accepts loopback + allowlisted origins, rejects cross-site origins), and deterministic login rate-limit burst rejection on a dedicated low-limit server instance.
- **`DB_PATH` override** in `database.mjs`: an explicit env path now wins over the local/AppData DB locations, which is what lets the suite (or a second deployment environment) run against an isolated database.
- **Env-tunable rate limits** in `server.mjs`: `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_GLOBAL_MAX`, `RATE_LIMIT_LOGIN_MAX` overrides (defaults unchanged) documented in `whatsapp-bot/.env.example`. Operators keep full control of throttling; tests use a low `RATE_LIMIT_LOGIN_MAX` to assert 429 rejection deterministically.
- **Packaging**: `extraResources` now also excludes `whatsapp-bot/tests/**` so the suite never ships inside the installer.

### Frontend hardening
- **Lint is fully green**: `npm run lint` now exits 0 (0 errors). Rewrote `eslint.config.js` (flat config): ignored `.venv`, `backups`, the nested project copy, and `*.mjs`; added an `electron/**` override with Node globals; set `no-unused-vars` uppercase-ignore pattern (`^[A-Z_]`) for both vars and args (the codebase's JSX `icon: Icon` props had no `react/jsx-uses-vars` rule, so ESLint core couldn't count JSX element-name usages); disabled `react-refresh/only-export-components` and the new `react-hooks/set-state-in-effect` opinionated rule; allowed empty catch blocks (fire-and-forget error handlers). Cleaned the remaining ~130 errors across `src/` (unused catch params → optional `catch {`, unused imports/destructures/args removed, `no-prototype-builtins` fix in `Reports.jsx`, `process.env` → `import.meta.env.DEV` in `ErrorBoundary.jsx`).
- **401 auto-logout**: `api.js` now dispatches a `app:unauthorized` browser event whenever any non-login API call receives a 401 (login attempts are exempt so wrong credentials don't trigger a logout flash). `AuthContext.jsx` listens and clears `currentUser`/`auth_user`/`auth_token`; the `ProtectedRoute` (HashRouter) then redirects to `/login` automatically.
- **WebSocket resilience**: `DevoteeContext.jsx` derives the WebSocket URL from `apiService.baseURL` (`http` → `ws`) instead of hardcoding `ws://localhost:3001`, and replaces the flat 3s retry with exponential backoff (3s, 6s, 12s… capped at 30s) plus random jitter to avoid synchronized reconnect storms. Reconnect attempts reset on successful open.
- **Removed duplicate initial fetch on the Devotees page**: `DevoteeList.jsx` now skips its initial paginated fetch — `DevoteeContext` already hydrates the list and total count on mount — and only re-fetches when page/size/search/filters change. `DevoteeContext` now seeds `totalCount` during its own hydration so the "Total N devotees" header and pagination math are correct without the extra request.
- **Electron handler cleanup**: removed dead IPC handlers `handleGoogleSheetsBackup` / `handleOAuthGoogleSheetsBackup` from `electron/main.js` (these created `nodeIntegration: true` browser windows) along with the now-unused `ipcMain`/`spawn` imports.
- **Communication page cleanup**: removed dead `sentIds` state, unused `botReady`/`todaysEvents`/`activeDevotee`/`showWhatsApp`/`copyToClipboard`, trimmed unused lucide icon imports, and dropped the never-openable `WhatsAppModal` from `Communication.jsx`.

### Security
- **Server-side authentication**: Replaced frontend-seeded credentials with a bearer-token API. Added the `users` table (`database.mjs`), scrypt password hashing + token store (`services/authService.mjs`), and auth endpoints (`POST /api/auth/login`, `GET /api/auth/session`, `POST /api/auth/verify-password`, `POST /api/auth/logout`). Admin account is seeded on first start from `ADMIN_USERNAME`/`ADMIN_EMAIL`/`ADMIN_PASSWORD`; a random password is generated and written to `whatsapp-bot/initial_admin_password.txt` when not set.
- **API authenticated by default**: Every `/api` route is now gated by `requireAuth` except the public whitelist (`POST /api/auth/login`, `GET /api/system/health`, Google OAuth `google/*`). Tokens are accepted via `Authorization: Bearer`, `?token=` (SSE), or body; 12h TTL with immediate logout revocation. The frontend (`api.js`, `AuthContext.jsx`, `PasswordModal.jsx`, `Communication.jsx`) now drives login/session/verification from the backend; the hardcoded `'Mynameis00#'` modal password and seeded email login are removed.
- **Network hardening**: `server.mjs` binds to `127.0.0.1` by default (`HOST` override), enables a strict CORS allowlist (localhost frontend/origins only), installs Helmet security headers (CSP disabled solely for OAuth inline scripts), applies `express-rate-limit` (login 20/15min, global 2000/15min), and reduces the body limit to 15 MB.
- **XSS fix**: Google OAuth callback error HTML is now escaped (`escapeHtml`) before rendering.
- **Secret purge**: Deleted unused `google-oauth-credentials.json` (zero code references) and removed its check from `Setup_DMS.bat`; expanded `.gitignore` and electron-builder `extraResources` filters so `.env`, `*.db`, `google-*.json`, `sessions/`, logs, and `initial_admin_password.txt` never ship in installers. Added `ADMIN_*`, `HOST`, `PORT` to `whatsapp-bot/.env.example`.
- **Resilient startup**: WhatsApp and Google Sheets/OAuth service failures no longer crash the API on boot (`DMS_DISABLE_WHATSAPP=1` disables the bot entirely for headless/test runs).

### Added
- `whatsapp-bot/env.mjs`: central `.env` bootstrap imported before all other modules to guarantee env availability (Cloudinary "api_key missing" class of startup errors).

### Fixed
- **Seva scheduler 500 errors**: Added the missing `db` import to `whatsapp-bot/routes/sevaRoutes.mjs`. All `/api/seva/shifts`, `/api/seva/shifts/:id/assignments`, `/api/seva/shifts/assign`, `/api/seva/assignments/:id`, and `/api/seva/schedule` endpoints previously crashed with `ReferenceError: db is not defined`.
- **Broken course/tour payments**: `course_payments` and `tour_payments` tables were referenced by `courseController`/`tourController` and `database.mjs` but never created. Both are now created in `initDb()` and also guaranteed by `healSchema()` so existing live databases upgrade in place on server startup.
- **Devotee duplicates**: Removed 4 duplicate devotee records across 4 contacts (Barsha Garai, Souvik Goswami, Ritu Garai, Krishna Nanda Das), keeping the most-complete row and remapping child-table foreign keys. Shared-phone records with distinct names (Jayanta/Prasiddha Burman) were intentionally preserved. Added application-layer duplicate guard to `addDevotee`/`updateDevotee` rejecting a second record with identical contact + normalized name.

### Added
- `idx_devotees_contact` non-unique index on `devotees(contact)` for duplicate-lookup performance (`healSchema`). Deliberately NOT a UNIQUE index: with `INSERT OR REPLACE`, a UNIQUE constraint would silently overwrite existing rows (data-loss hazard for family-shared phones).
- `whatsapp-bot/dedupe_devotees.mjs`: reusable maintenance script that consolidates duplicate devotee rows, remaps children, and backs up removed rows to JSON.

## [2026-08-19]
### Added
- **Cloud Resilience & Disaster Recovery**: Implemented automated and manual SQLite database backup systems syncing directly to AWS S3 and Dropbox:
  - Created `CloudBackupService.mjs` to handle S3 uploads (using `@aws-sdk/client-s3`) and Dropbox uploads (using OAuth refresh token flow and Node `fetch`).
  - Registered `/api/backup/cloud-status` and `/api/backup/cloud-sync` backend API endpoints.
  - Hooked the cloud backup routine into `AutomationService.mjs` daily tasks check.
  - Extended the Settings UI page (`Settings.jsx`) to display sync statuses, configurations, and a manual sync trigger.
  - Added AWS and Dropbox template variables to `.env.example`.
- **Data Scaling & View Virtualization**: Engineered server-side pagination, sorting, and viewport-based virtualization to support scale tests > 10,000 devotee records:
  - Modified `getDevotees` in `database.mjs` to execute queries with dynamic SQLite `WHERE` clauses matching chosen filters.
  - Created backend helper `getFilterOptions` and API endpoint `GET /api/devotees/filter-options` to dynamically pull distinct counselor and district list options.
  - Added `fetchPaginatedDevotees` to `DevoteeContext.jsx` to query backend page slices using dynamic parameters.
  - Integrated list table virtualization inside `DevoteeList.jsx` utilizing scroll-offset height listeners and padding filler rows to only mount visible records in DOM.
  - Integrated adjustable page size selector on the UI table footer.

## [2026-08-08]
### Added
- Created comprehensive project documentation structure under the `docs/` folder to guide Antigravity AI agents workflow:
  - `docs/ARCHITECTURE.md`: Covers multi-layer React-Electron architecture, data flows, and design principles.
  - `docs/DATABASE.md`: Indexes SQLite schemas, field constraints, relationship maps, and backups.
  - `docs/API.md`: Details routes, methods, payload parameters, and response rules.
  - `docs/SECURITY.md`: Outlines parameterization, credential isolation, and IPC bridging safeguards.
  - `docs/TESTING.md`: Provides testing criteria, regression flows, and pre-deployment checklists.
  - `docs/DEPLOYMENT.md`: Documents NSIS packaging, installer generation, and local loopback configurations.
  - `docs/CHANGELOG.md`: Set up change logs.
- Added `AGENTS.md` in the project root to enforce AI developer workflows and error-handling steps.

### Changed
- Re-architected `README.md` to follow the recommended project structure layout.
- Refactored database module [`database.mjs`](file:///e:/WEBSITE/Devotee%20Management%20-%20Copy/whatsapp-bot/database.mjs) to implement async wrapper helpers (`runAsync`, `allAsync`, `getAsync`), simplifying query formatting and reducing promise-wrapper boilerplates.
- Activated the missing service-account backup route `/api/backup/google-sheets` by mapping it in [`backupRoutes.mjs`](file:///e:/WEBSITE/Devotee%20Management%20-%20Copy/whatsapp-bot/routes/backupRoutes.mjs) and implementing the controller handler in [`backupController.mjs`](file:///e:/WEBSITE/Devotee%20Management%20-%20Copy/whatsapp-bot/controllers/backupController.mjs) to enable standard menu backups.

---

## [2026-07-24]
### Added
- Added automated `Setup_DMS.bat` wizard script in root directory for automated dependency installation (`npm install`), environment files creation, database audits, and production packaging.
- Added `whatsapp-bot/.env.example` configurations template.

### Fixed
- Fixed Windows compilation issues with `7za.exe` extracting `winCodeSign` archive symlinks by deploying a compiled Python wrapper (`fix_7za.py`) to bypass exit code 2 errors in non-admin shells.

---

## [2026-07-21]
### Fixed
- Fixed Devotee Photo Upload interface to correctly encode files and communicate with Cloudinary API services.
