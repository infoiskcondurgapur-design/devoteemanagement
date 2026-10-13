# CHANGELOG

## [2026-10-13]

### Initiated Name Normalization & Continuous Auto-Sync
- **Initiated Name vs Spiritual Name Unification**:
  - Resolved discrepancy where devotees with initiation records (such as *Nilakshi Bhattacharjee* / *Nilambari Padmaja Devi Dasi*) had their initiated name stored under `spiritualName` while `initiatedName` was blank, causing `DevoteeProfile.jsx` to render `Initiated Name: --` and a misleading `Uninitiated Devotee` badge.
  - Updated `DevoteeProfile.jsx`, `DevoteeList.jsx`, `DevoteeForm.jsx`, `SpiritualLifeStep.jsx`, and modal subtitles to gracefully cross-resolve `devotee.initiatedName || devotee.spiritualName`.
  - Sidebar profile card now correctly renders the initiated name and badge as `Initiated Devotee` when `spiritualStatus === 'Initiated'`, an initiation date is present, or an initiated name is recorded.
  - Synchronized database layers (`whatsapp-bot/database.mjs` and `api/_src/database.mjs`) on `addDevotee` and `updateDevotee` to auto-populate either field if one is missing.
  - Normalized existing SQLite and PostgreSQL database records so `initiatedName` and `spiritualName` are populated across all 172 congregation members.
- **Continuous Background Auto-Sync**:
  - Added quiet background polling interval (every 10 seconds) in `DevoteeContext.jsx` and `DevoteeList.jsx` that keeps master records and active paginated views in sync without UI flicker or lost pagination/scroll positions.
  - Enhanced header badge to indicate `Auto Sync Active` / `Live Sync` with an emerald pulse.


### Devotee List Real-Time Synchronization & Pagination Decoupling
- **Root Cause Resolution**:
  - `DevoteeContext.jsx` previously overwrote the global congregation list (`devotees`) inside `fetchPaginatedDevotees`, replacing all 172 records with only the 25 items of the active page. This broke components depending on the full dataset (`DevoteeMap`, `Reports`, `CounselorDashboard`, `Attendance`).
  - Separated state into `devotees` (full congregation, queried up to `limit=2000`) and `paginatedDevotees` (dedicated slice for table/grid views).
  - Fixed `DevoteeList.jsx` initial mount logic which was skipping server-side pagination due to `isFirstRender.current`, causing page 1 to dump all cached devotees and desynchronize page controls.
- **WebSocket Client Integration (`src/services/wsClient.js`)**:
  - Implemented client-side WebSocket manager connecting to `whatsapp-bot/services/wsService.mjs` with automatic reconnection, heartbeat, and window visibility awareness.
  - Subscribes to `DEVOTEE_CREATED`, `DEVOTEE_UPDATED`, `DEVOTEE_DELETED`, and `DATA_MUTATED` events broadcast by the backend.
  - Dispatches `dms:sync` and `devotees:refresh` DOM events to dynamically refresh devotee lists without page reloads.
- **UI Enhancements (`DevoteeList.jsx`)**:
  - Added real-time **Live Sync** status badge in the header indicating active WebSocket synchronization.
  - Added manual **Sync Now** refresh button with rotation micro-animation.
  - Pagination now strictly reflects server bounds ("Showing 1–25 of 172 devotees"), navigating seamlessly across all pages.


### WhatsApp Bot UI Integration & Device Linking
- **Live WhatsApp Bot Control Panel (`Settings.jsx`)**: Added an automated status & linking card to the Settings page. Displays live connection state (`Connected`, `Scan QR Code`, `Initializing`, `Disconnected`), live-streaming QR code, status check, and restart/disconnect buttons.
- **API Client Extensions (`api.js`)**: Added `getWhatsAppStatus`, `getWhatsAppQR`, `restartWhatsApp`, and `logoutWhatsApp` helpers for controlling the background bot service.

### Original Profile Picture Preview Modal
- **Full-Resolution Image Lightbox**: Added `src/components/ImageModal.jsx` enabling devotees' profile pictures to be previewed in their uncropped, original high resolution upon clicking.
- **Interactive Controls**: Lightbox includes backdrop-click to dismiss, `Esc` key listener, zoom in/out toggle, direct download button, and an "Open Original in New Tab" external link.
- **Smart URL Resolution**: Added `getOriginalImageUrl` utility that strips thumbnail/cropping dimensions from Cloudinary transformation paths and Unsplash query parameters, providing maximum available clarity.
- **Integrated Views**:
  - `DevoteeProfile.jsx`: Profile picture header features subtle hover zoom effect with maximize icon overlay; clicking opens the original image modal.
  - `DevoteeList.jsx`: Both table avatar and grid card picture open the original image modal on click without interrupting navigation.
  - `Profile.jsx`: Admin profile avatar preview on click.
  - `Dashboard.jsx`: Birthday and anniversary devotees' profile photos can be clicked to view original image.
  - `CounselorDashboard.jsx`: Counselee list profile pictures are now clickable for original image preview.

### Backend Parity & Authentication Token Collision Fix
- **Token Unique Nonce (`jti`)**: Added `jti: crypto.randomUUID()` to `signToken` in both `whatsapp-bot/services/authService.mjs` and `api/_src/services/authService.mjs`. Prevents rapid successive logins within the same second from generating identical deterministic tokens that collide with the revocation cache (`revokedTokens`). Restored 100% pass rate (21/21) in regression tests.
- **Desktop Electron Backend Route Parity**: Added missing `attendanceRoutes.mjs`, `attendanceController.mjs`, `counselingRoutes.mjs`, and `counselingController.mjs` to `whatsapp-bot/` and mounted `/api/attendance` and `/api/counseling` in `server.mjs`.
- **Serverless Web Backend Route Parity**: Added `change_requests` table DDL to `api/_src/schema.mjs`, change request queries/approval handlers to `api/_src/database.mjs`, added `api/_src/routes/changeRequestRoutes.mjs`, and mounted `/api/change-requests` in `api/_src/app.mjs`.

## [2026-10-09]

### Supabase PostgreSQL support and safe hosted-data migration
- Added a `pg` driver mode for the web API using `POSTGRES_DRIVER=pg` and `SUPABASE_DATABASE_URL`; TLS is enabled by default and the application pool is capped at one connection per serverless instance.
- Added `api/_src/scripts/migrate-neon-to-supabase.mjs` to copy the existing hosted Neon tables into an empty Supabase project. It is dry-run by default, reports row counts, refuses non-empty targets, preserves identity ids, and wraps writes in one transaction.
- Updated deployment and database documentation. Desktop continues to use local SQLite; this change configures Supabase for the hosted API only.

## [2026-10-08]

### Local SQLite re-synced from Neon (86 → 172 devotees)
- **Problem**: the local DB (`whatsapp-bot/devotee_mgmt.db`) held only 86 devotees while the deployed Neon DB had 172 (local was a strict subset — 86 common ids, 0 local-only). Dashboard totals therefore showed 86 instead of the expected 172.
- **Fix**: new script `scripts/import-from-neon.mjs` pulls missing `devotees` rows from Neon into SQLite — never overwrites existing local rows (INSERT OR IGNORE by id), auto-backups to `whatsapp-bot/backups/` before applying, dry-run by default (`--apply` to execute). Neon columns map by lowercasing the SQLite column names; `source` has no Neon counterpart and stays `NULL` (consistent with local rows).
- **Verified**: local total 172, `/api/devotees/stats` → `total: 172`, and the one content conflict (Sampa Mondal's contact) kept the better local value `918158953524` (Neon has the un-normalized `8158953524`).
- **Warning**: `api/_src/scripts/migrate.mjs` is **wipe-and-copy SQLite→Postgres** — never run it while Neon is ahead; it would destroy the 172.

## [2026-10-07]

### Public Self-Registration Form (`#/register`)
- **Shareable link**: Anonymous visitors open `https://<host>/#/register` (web) or the local app URL + `#/register` (desktop) and fill the full 3-step wizard (Personal → Family & Location → Spiritual Life) with an optional photo — no login required. New page `src/pages/public/PublicRegister.jsx` (lazy route in `src/App.jsx`) reuses `DevoteeForm` steps; `StepNavigation` gained a `submitLabel` prop ("Submit Registration"). Success screen shows a Reference ID; the left `VerticalNav` is hidden on mobile for a kiosk-friendly layout.
- **New endpoint `POST /api/public/register`** on **both** backends (`whatsapp-bot/controllers|routes/publicController|publicRoutes.mjs` and the `api/_src/` mirror): strict validation (name, enum membership for gender/relation/marital/spiritual status, `contact` `^[6-9]\d{9}$`, photo `data:image/` base64 ≤ 14,000,000 chars), hidden honeypot field `website` silently swallows bots, and server-owned fields (`id`, `status`, `source`, `createdAt`) are always stripped and forced (`status: 'Pending'`, `source: 'Public Form'`). Duplicates (same name + contact) return a **generic 409** that never reveals the existing devotee's name. Photos upload via this endpoint only (`/api/upload` stays authenticated); desktop broadcasts `DEVOTEE_CREATED` over WebSocket. No WhatsApp greeting and no login credentials are issued until an admin approves.
- **Rate limiting**: dedicated `publicRegisterLimiter` (10 / 15 min / IP, `RATE_LIMIT_PUBLIC_MAX` override) mounted after the global limiter; `express-rate-limit@^8.7.0` added to root dependencies. Auth gates in `server.mjs` and `api/_src/app.mjs` allowlist `/public/register` alongside `/login`.
- **`devotees.source` column**: added to `DEVOTEE_COLUMNS` + DDL (SQLite) and the Postgres schema; existing Neon tables are healed at startup via `ALTER TABLE devotees ADD COLUMN IF NOT EXISTS` in `initDb()`. Dashboard stats, weekly/birthday/anniversary queries, and `getUnlinkedDevotees` (credential-linking WhatsApp sweep) all exclude `status = 'Pending'` (`IFNULL`/`COALESCE(status,'Active') != 'Pending'`) so pending rows never inflate totals or trigger password messages.
- **Admin approval queue**: `DevoteeList` gains a `Pending` filter option, amber Pending badge (tagged "• Public" when `source === 'Public Form'`), amber grid indicator, and `UserCheck` approve buttons; `DevoteeProfile` shows a "Pending Approval" badge and an admin Approve button. Approval is a normal `PUT /api/devotees/:id { status: 'Active' }`.
- **Anonymous-401 fixes**: `api.js` only dispatches `app:unauthorized` when a token exists and emits a new `auth:changed` event from `setToken`; `AuthContext` skips the redirect for `/login` and `/register` hashes; `DevoteeContext` and `ReferenceDataContext` gate polling/fetches on an authenticated token with `auth:changed` listeners — visiting `#/register` logged out no longer produces redirect loops or 401 noise.

### Logout now invalidates tokens
- Stateless HMAC tokens are revoked server-side: `revokeToken`/`revokeRequestToken` in both `authService.mjs` mirrors keep an in-memory denylist (bounded, prunes expired entries) checked by `verifyToken`; `POST /api/auth/logout` records the presented token before returning success. Fixes the `logout invalidates the issued token` regression test.

### Dev bypass login (local only, `DMS_AUTH_BYPASS=1`)
- **New endpoints (both backends)**: `GET /api/auth/bypass` (`{enabled}` status) and `POST /api/auth/bypass` (issues an admin token with no password when `DMS_AUTH_BYPASS=1`; **403** otherwise). Both are allowlisted through the auth gate; a loud boot warning prints while enabled. The flag is set in local `whatsapp-bot\.env` only — **never** in the Vercel env, where the endpoints stay inert.
- **Frontend**: `api.js` gains `authBypassStatus`/`authBypass`; `AuthContext` exposes `bypassEnabled` + `bypassLogin`; `LoginPage` shows a dashed **"Skip login (dev mode)"** button only when the status endpoint reports enabled.
- **Auth-gate hardening**: both gates now compare public paths against the URL **path only** (query string stripped) so `?x=/auth/login` can no longer satisfy an allowlist check.
- **Tests**: +2 (bypass status → `enabled:false` and bypass POST → 403 with the flag forced off via `DMS_AUTH_BYPASS: '0'`); health-wait raised to 90s because boot (schema heal + prod-DB merge) can exceed the old 30s budget. Suite now **21/21**.

### Verification
- `npm run test:regression`: **21/21 pass** (6 public-registration tests, 2 bypass tests, logout-revocation test).
- `npm run build` passes (vite 7.3.0, `PublicRegister` chunk emitted); `npx eslint .` has 0 errors (25 pre-existing warnings); backend files pass `node --check`.
- Docs updated: `API.md` (§9 Public Registration + 401/409/429 status codes), `DATABASE.md` (`source` column, Pending exclusion rules, Postgres heal note).

## [2026-09-25]

### Change Request Workflow (Devotee Self-Service)
- **Devotee Login Accounts**: Devotees log in with their contact number; an auto-generated password is created and delivered via WhatsApp (`linkUserToDevotee` in `whatsapp-bot/database.mjs`, migration run by `whatsapp-bot/server.mjs` on startup). Username = `devotee.contact`, role `viewer`.
- **Profile Edit Parity with Role**: Admins see Edit/Delete on the profile; non-admin devotees see a "Request Changes" button instead (`DevoteeProfile.jsx`).
- **Change Requests**: New `change_requests` table plus `whatsapp-bot/routes/changeRequestRoutes.mjs` (`POST /`, `GET /pending`, `GET /history`, `GET /mine`, `PUT /:id/approve`, `PUT /:id/reject`). Statuses: `pending | approved | rejected | applied`. Approve only whitelists 25 safe devotee columns (`CHANGEABLE_FIELDS`) and applies via parameterized UPDATE.
- **Frontend Pages**: `src/pages/ChangeRequestForm.jsx`, `src/pages/AdminChangeRequests.jsx` (admin approve/reject), `src/pages/MyRequests.jsx` (devotee status tracking); routes registered in `src/App.jsx`; quick-access entries added to the Command Palette.
- **Auth plumb-through**: `authController`/`authService` include `devoteeId`; `AuthContext` exposes `devoteeId`, `canEdit`, `canRequestChanges`.

### Admin-Managed Reference Names (Counselors & Spiritual Masters)
- **New `ReferenceDataContext`** (`src/context/ReferenceDataContext.jsx`): reads `counselors_list` / `spiritual_masters_list` (JSON arrays) from the existing `settings` table via `GET /api/system/settings`, and exposes `counselors` / `spiritualMasters` as the deduped union of the built-in defaults + custom entries.
- **Settings UI**: Admin-only "Reference Names" card with add/remove inputs for both lists (`Settings.jsx`); changes persist via `POST /api/system/settings`.
- **Live dropdowns**: Devotee Form Counselor + Spiritual Master selects (`SpiritualLifeStep.jsx`) and the Counselor Dashboard list (`CounselorDashboard.jsx`) now use the context lists.
- Added counselor "Lakshirani Dayamoyee Debi Dasi" to the built-in defaults.
- Fixed a `getDevoteeById` missing-closure-paren syntax bug in `whatsapp-bot/database.mjs`.

### Verification
- `npm run build` passes (vite 7.3.0); `npx eslint .` exits with 0 errors (24 pre-existing warnings); backend files pass `node --check`.

## [2026-09-14]

### Windows Desktop Application Build & Package
- **Electron Builder Configuration**: Configured `package.json` with `"npmRebuild": false` to prevent unnecessary and failing native module compilation (`bufferutil` node-gyp build) when optional C++ WebSockets addons are absent.
- **Package Metadata**: Added application `description` and `author` fields to package configuration.
- **Standalone Windows Executable**: Successfully compiled Vite production assets and generated the final NSIS setup installer file: `release/Devotee Management Setup 0.0.0.exe` (139 MB).

### Progressive Web App (PWA) Support
- **Service Worker & Manifest**: Generated standard PWA icon assets (`apple-touch-icon.png`, `pwa-192x192.png`, `pwa-512x512.png`, `maskable-icon.png`) and registered `VitePWA` workbox caching.
- **PWA Installation Component**: Integrated [`src/components/PwaInstallPrompt.jsx`](file:///e:/WEBSITE/Devotee%20Management%20Web/src/components/PwaInstallPrompt.jsx) in the header for 1-click installation on Chrome, Edge, and iOS Safari.

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
