# DEPLOYMENT GUIDE

## Environments

### 1. Development
- Active Vite hot-reload listener running on `http://localhost:5173`.
- Active WhatsApp automation API server listening on `http://localhost:3001`.
- Live connection with sqlite3 file `whatsapp-bot/devotee_mgmt.db`.

### 2. Production (Desktop App)
- Static React frontend compiled via Vite into `dist/`.
- Local Node Express backend packaged as local node service wrapper.
- Entire stack bundled as a standalone Win32 desktop application via Electron and NSIS target installer.

### 3. Production (Web / Cloud)
- **Vercel (current/recommended)**: static React frontend + serverless Express API in root `api/` + Vercel Postgres. Single function — `vercel.json` rewrites `/api/(.*)` → `/api`. One-time data migration via `node api/scripts/migrate.mjs`. WhatsApp bot features are not part of the web build. See README "Vercel (Web) Deployment".
- **Legacy — Docker + Caddy + Oracle Cloud (superseded for the web)**: Express API + SQLite + WhatsApp bot running in a Docker container (`whatsapp-bot/Dockerfile`), **Caddy** reverse proxy for automatic HTTPS (Let's Encrypt) + static serving + `/api` & `/ws` proxying, persistent SQLite DB and WhatsApp `sessions/` on a Docker named volume (`dms_data`). This variant remains valid if you self-host the desktop-style stack on a VM (WhatsApp included).

---

## Pre-Deployment Checklist
Before triggering the production compiler:
- [ ] Run `npm run lint` to ensure code matches lint rules.
- [ ] Build the static web files via `npm run build` and ensure no Rollup or PostCSS failures occur.
- [ ] Verify local database has backups configured.
- [ ] Ensure all local development secrets are cleared from `.env.example` configurations.
- [ ] Validate Electron window IPC channels.

---

## Deployment & Packaging Procedure
To compile the standalone Windows executable:

1. Open PowerShell / Command Prompt in the project workspace folder (`e:\WEBSITE\Devotee Management - Copy`).
2. Run the packaging command:
   ```bash
   npm run electron:build
   ```
3. `electron-builder` will execute the following steps:
   - Compiles Vite production chunks.
   - Rebuilds native SQLite3 database bindings for Electron's active architecture.
   - Extracts signing templates.
   - Bundles dependency files into an ASAR file.
   - Creates the NSIS `.exe` setup file.
4. Access the generated setup executable in the `release/` folder:
   - `release/Devotee Management Setup 0.0.0.exe`

---

## Post-Deployment Verification
Once installed on the user's system, run the application and verify:
- [ ] **Launch**: The application starts up and renders the UI dashboard.
- [ ] **Database Connection**: Devotee lists load correctly (proves local SQLite driver connection works).
- [ ] **WhatsApp Integration**: The QR scanner displays connection options on settings click.
- [ ] **Performance**: System responsiveness is normal, with low memory usage.

---

## Rollback Procedure
If a production version exhibits fatal errors:
1. Locate the previous working release version under `release/` or version history.
2. Uninstall the current version from Windows Control Panel.
3. Re-install the previous working `.exe` setup installer file.
4. Back up `devotee_mgmt.db` to protect local data before database downgrade actions.

---

## Monitoring
Since this is a client-side offline desktop application, check local log files for runtime diagnostic monitoring:
- Frontend/Electron console logs.
- Backend server error log file: `whatsapp-bot/server_error.log`.
- Local system events log file: `dev_error.log`.

---

## Web / Cloud Deployment (Docker + Caddy + Oracle Cloud Free Tier)

The backend is built to be local-first, but a production web deployment is supported via Docker.
Only genuine free, always-on hosts (e.g. **Oracle Cloud Free ARM VM**) can keep a persistent
SQLite DB and the WhatsApp bot running 24/7 — most free tiers auto-sleep or lack persistent disk.

### Prerequisites (on the dev machine)
- Node + Vite produced the web bundle (see `npm run build`). For this repo the bundle is often copied
  to a sibling folder such as `E:\WEBSITE\Devotee Management Web`.
- Docker + Docker Compose plugin installed on the target server.

### Files added for web deployment
- `whatsapp-bot/Dockerfile` — Node 20 + Chromium (for whatsapp-web.js), runs `node server.mjs`.
- `whatsapp-bot/.dockerignore` — excludes sessions, DBs, logs, secrets, tests from the image.
- `docker-compose.prod.yml` — `api` (Express+SQLite+WhatsApp) + `caddy` (HTTPS + static + proxy),
  persistent `dms_data` volume.
- `Caddyfile` — auto-HTTPS, serves `./web`, proxies `/api/*` and `/ws` to the API.
- `deploy-keys/` — SSH key pair for the Oracle Cloud VM (`id_ed25519` + `id_ed25519.pub`).

### Env configuration (web)
Add these to the server `.env` (see `whatsapp-bot/.env.example`):
- `HOST=0.0.0.0` — bind all interfaces so the proxy can reach the API.
- `ALLOWED_ORIGINS=https://yourname.duckdns.org` — frontend origin(s) for CORS + WebSocket allowlist.
- `DB_PATH=/data/devotee_mgmt.db` — persistent SQLite location (Docker volume).
- `CHROME_PATH=/usr/bin/chromium` — Chromium path for the WhatsApp bot.
- Cloudinary, Google OAuth, and any other secrets as in `.env.example`.

Frontend: set `VITE_API_URL` to the backend origin (or leave unset for same-origin behind Caddy) and rebuild.

### Deploy steps (server)
1. Copy this repo to the server (e.g. `/opt/dms`).
2. Copy the built web bundle to `./web`:
   `cp -r "E:/WEBSITE/Devotee Management Web/." ./web/`
3. Create `.env` from `.env.example` and fill in secrets + `DOMAIN`.
4. Point a (sub)domain (e.g. DuckDNS `yourname.duckdns.org`) at the server's public IP.
5. Open inbound **80/443** (and 22 for SSH) in the cloud security list.
6. Start it: `docker compose -f docker-compose.prod.yml up -d --build`
7. Verify with `curl -I https://yourname.duckdns.org`.

### WhatsApp bot on the server
- On first boot the bot prints/emits a QR code — scan it with the linked phone once; the session is
  saved to the persistent volume, so no re-scan across restarts.
- **Ban risk**: whatsapp-web.js is an unofficial client. Running it continuously from a server (datacenter)
  IP may get the linked phone number banned by Meta. Disable it with `DMS_DISABLE_WHATSAPP=1` if undesired.

---
