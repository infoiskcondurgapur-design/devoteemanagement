# TESTING STRATEGY

## Unit Tests
- Test helper utilities, date parsers, string formatting functions, and Zod schemas inside `src/utils/` and controllers.
- Test isolated React UI components (buttons, receipt templates, card generators) using mock data.

---

## Integration Tests
- **Frontend & API**: Verify API requests mapped in `src/services/api.js` return matching JSON payloads when invoking backend endpoints.
- **Backend & Database**: Validate database queries executed from `database.mjs` successfully write and retrieve records from test SQLite database files.
- **WhatsApp Web Integration**: Validate WebSocket connection relays bot status updates (connected, disconnected, scanning QR) to the frontend handler.

---

## End-to-End (E2E) Tests
Perform complete, step-by-step user simulations to verify flow integrity:

```
  Launch Desktop App
         ↓
  Navigate to Devotees Tab
         ↓
  Click "Add Devotee" -> Fill Form
         ↓
  Save -> Confirm Success Toast
         ↓
  Search Devotee by Name
         ↓
  Verify Database Row Updates
         ↓
  Close Application
```

---

## Regression Testing Workflow
After resolving bugs or modifying logic:
1. **Reproduce**: Recreate the reported issue using exact steps/logs.
2. **Apply Minimal Fix**: Resolve the issue with the cleanest patch possible.
3. **Verify**: Ensure the original bug is fixed and does not occur under the same conditions.
4. **Impact Analysis**: Manually test related functions (e.g. if fixing devotee update details, verify sadhana logs and course enrollments linked to that devotee are unaffected).

---

## Pre-Deployment Verification Checklist
Before packaging code into production executables, the following checks must pass:
- [ ] **Linter Check**: Run `npm run lint` and verify zero ESLint errors are reported.
- [ ] **Frontend Compile**: Execute `npm run build` to verify Vite bundle successfully packages.
- [ ] **Electron Packages**: Verify IPC events compile properly without compilation errors.
- [ ] **Database Connection**: Run database initialization checks (`check_db.mjs`) to ensure all database indexes are healthy.
- [ ] **WhatsApp Bot Hook**: Verify backend successfully initializes connection with the browser headless client.
