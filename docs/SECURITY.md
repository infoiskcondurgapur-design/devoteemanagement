# SECURITY RULES

## Secrets Management
- **Never Commit Secrets**: Do not check API keys, client passwords, or credentials JSON files into public repositories.
- **Environment Exclusions**: `.env` (root and `whatsapp-bot/`), `*.db`, `google-credentials.json`, `google-oauth-credentials.json`, `google-oauth-tokens.json`, `google-sync-info.json`, `whatsapp-bot/sessions/`, `whatsapp-bot/.wwebjs_cache/`, and `whatsapp-bot/initial_admin_password.txt` are excluded from git and from electron-builder packaging (`package.json` → `build.extraResources` filter, `!` entries).
- **Runtime requirement**: `google-credentials.json` is loaded at runtime by `oauth-sheets-service.mjs`; it must exist locally but is filtered out of release packages. `google-oauth-credentials.json` is unused and must not be re-added.
- **Generated admin password**: On first start without `ADMIN_PASSWORD`, a random password is written to `whatsapp-bot/initial_admin_password.txt` and printed once to the console; the file is excluded from git and packaging and should be deleted after the first login.
- **Credential rotation**: After a compromise the Cloudinary (`CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET`), Google (`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`, service-account `google-credentials.json`), AWS, and Dropbox secrets must be rotated at their providers.

---

## Authentication & Authorization
- **Bearer-token gate**: Every `/api` endpoint requires a valid bearer token via `requireAuth` middleware, except the public whitelist: `POST /api/auth/login`, `GET /api/system/health`, and `/api/auth/google/*` (OAuth redirects).
- **Login flow**: `POST /api/auth/login` validates username/email + password against the `users` table. Passwords are hashed with Node `crypto.scryptSync` (`salt:hash`, SHA-256, 64-byte key) and never stored or logged in plaintext.
- **Tokens**: 32-byte random hex issued for 12 hours, kept in an in-memory `Map`; `POST /api/auth/logout` revokes immediately; `requireAuth` accepts `Authorization: Bearer`, `?token=` (for SSE), or body `token`.
- **Rate limiting**: `express-rate-limit` — login is limited to 20 attempts / 15 min; global `/api` limit 2000 requests / 15 min.
- **Network posture**: Server binds to loopback `127.0.0.1` by default (`HOST` env can override deliberately). CORS allowlist permits only `localhost`/`127.0.0.1` dev and app origins on ports 5173/3001. Helmet security headers are enabled with `contentSecurityPolicy: false` only because the OAuth callback/popup pages require inline scripts. Body size is capped at 15 MB.
- **OAuth callback checks**: Google OAuth error messages rendered into the callback HTML are escaped with `escapeHtml` to prevent reflected XSS.
- **IPC Isolation**: Do not expose Node.js context directly to the Electron frontend renderer context. Use a secure preload context bridge (`electron/preload.js`) containing strict IPC channels.

---

## Input Validation
- **Never Trust Client Inputs**: Sanitize and validate all incoming HTTP request bodies server-side inside Express controllers before database inclusion.
- **Zod Validation Resolver**: Implement Zod schemes on frontend forms to intercept invalid parameter submissions at UI level.
- **SQL Parameterization**: Use parameterized SQL placeholders (`?`) for database transactions to eliminate SQL injection risks.
  ```javascript
  // Correct
  db.run("INSERT INTO devotees (name) VALUES (?)", [name]);
  ```

---

## File Uploads
- **Base64 Photo Uploads**: Limit profile picture uploads to secure image formats (JPG/PNG).
- **Max File Size**: Profile pictures should not exceed 5MB.
- **CDN Offloading**: Keep image storage isolated from the local database by uploading pictures to Cloudinary and storing only the resulting HTTPS URL in the database.

---

## Logging Guidelines
- **Never Log Secrets**: Ensure error logs never write passwords, Google API credentials, OAuth secrets, or PII.
- **Log Sanitation**: Stack traces saved to `system_logs` or `server_error.log` must exclude credentials parameters.

---

## Security Review Checklist
Before releasing production setup installers, verify the following checklist:
- [ ] No hardcoded passwords, tokens, or API keys are present in files (auth is server-side; the frontend seeds no credentials).
- [ ] Every `/api` route is gated by `requireAuth` except the documented public whitelist; confirm with a 401 smoke test on a protected route without a token.
- [ ] Preload script (`electron/preload.js`) does not enable `nodeIntegration` in the renderer window context.
- [ ] SQLite queries across controllers utilize `?` parameterized input bindings.
- [ ] Image uploads are checked for valid dimensions and mime types.
- [ ] Local server port `3001` is bound exclusively to loopback interface `127.0.0.1` unless `HOST` is deliberately overridden.
- [ ] Secret files (`.env`, `google-*.json`, `*.db`, `sessions/`, `initial_admin_password.txt`) are excluded from the installer (`build.extraResources` filter) — verify the `release/` output contains none of them.
