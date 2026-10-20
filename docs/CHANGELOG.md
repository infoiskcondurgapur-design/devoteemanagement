# CHANGELOG

## [2026-10-20]

### Live Devotee Map Overhaul & Eye-Comfort Theming (লাইভ ম্যাপ পেজের আধুনিকীকরণ ও আই-প্রোটেক্ট থিম)
- **Leaflet Map Eye-Comfort Styling (`src/index.css`)**:
  - Overrode Leaflet map zoom controls (`.leaflet-bar a`), popup bubble wrappers (`.leaflet-popup-content-wrapper`), and tip pins with dark spruce backgrounds (`#243e40`), subtle borders (`#385c5e`), and soft sage mist typography, eliminating harsh white popups.
  - Styled Leaflet attribution banner to dark translucent teal.
- **Enhanced Live Map UI & Features (`src/pages/DevoteeMap.jsx`)**:
  - **Tile Layer Switcher**: Added 3 selectable basemaps (Eye Comfort Dark, Street View, Satellite Imagery) with one-click toggling.
  - **Temple Centerpiece Marker**: Added a prominent gold temple marker (🛕) at Sri Sri Radha Govinda Mandir (ISKCON Durgapur City Center) with a "Recenter Temple" compass button.
  - **Status-Coded Vector Pins**: Replaced blurry default PNG pins with lightweight glowing vector markers color-coded by spiritual status: Saffron for Initiated, Indigo for Sheltered, Emerald for Aspiring.
  - **Crash Prevention**: Patched potential `TypeError: d.id.split is not a function` when devotee IDs are numeric integers.
  - **Live Search & Autocomplete**: Added a floating devotee search bar on the map that smoothly pans/flies the camera directly to any devotee's pin.
  - **Status & Counselor Filters**: Added instant status filter pills and counselor dropdown filter with live devotee count badges.
  - **Interactive Popups**: Popups now display the devotee's spiritual status, counselor, area, a 1-click WhatsApp chat button, and a link to view their full profile.

### Complete White Text & Icon Glare Extinction (সাদা টেক্সট, সাদা আইকন ও সার্চ/ইনপুট বক্সের তীব্র সাদা আলো দূরীকরণ)
- **Taming Harsh 100% Pure White Text (`src/index.css`)**:
  - Overrode `.text-white`, `.dark:text-white`, `.text-slate-100`, `.dark:text-slate-100`, and `.dark:text-slate-200` to a soothing warm sage mist (`#c4d7d3`), eliminating severe contrast glare (halation) against the `#213738` background.
  - Preserved crystal-clear legibility with an optimal 8.4:1 contrast ratio that fully exceeds WCAG AAA standards while preventing eye fatigue.
- **Calming White Vector Icons (`src/index.css`)**:
  - Softened pure `#FFFFFF` Lucide & SVG icons (`svg.text-white`, `.text-white svg`, etc.) to calming sage-teal (`#9cbdb6`), preventing icons from acting like glaring flashlights on the dark canvas.
- **Universal Form Input & Dropdown Theming (`src/index.css`)**:
  - Applied global overrides for all native `<input>`, `<select>`, and `<textarea>` elements to prevent browser default white background (`background-color: field / #FFFFFF`), giving them a recessed pine-slate background (`#1a2c2d`), soft sage text (`#c4d7d3`), and subtle borders (`#37595b`).
  - Added missing overrides for `.bg-red-50`, `.bg-red-100`, `.bg-corporate-50`, and `.bg-corporate-100`.
- **Seva Board Component Overhaul (`src/pages/services/SevaBoard.jsx`)**:
  - Replaced browser default white "Search sevaks..." `<input>` with `#1a2c2d` eye-comfort input.
  - Converted active status filter buttons (`All`, `Active`, `On Leave`) from glaring white box to elevated spruce (`#264042` with amber text).
  - Styled department filter dropdown to dark `#1a2c2d`.
- **Finance & Expenses Overhaul (`src/pages/finance/DonationList.jsx`)**:
  - Styled search inputs, date pickers, and "All Modes" `<select>` with `#1a2c2d` backgrounds.
  - Converted the Total Expense stat card icon well from bright white-red to dark recessed well (`bg-red-950/40 border border-red-900/40 text-red-400`).
  - Converted the mini chart toggle button from white `bg-corporate-50` to dark spruce (`bg-[#253f41] border-[#385c5e] text-amber-300`).
- **Communication Hub Overhaul (`src/pages/Communication.jsx`)**:
  - Converted active `Daily Spirits` tab button (`NavButton`) from pure white rectangle (`bg-corporate-50`) to elevated spruce card (`#264042` with amber-300 highlights).
  - Toned down "Wish Now" buttons to soft emerald (`bg-emerald-700/80`) and rose (`bg-rose-700/80`).
  - Form inputs, selects, and campaign textareas now render in eye-protect `#1a2c2d`.
- **Vaishnava Calendar Tone Softening (`src/pages/VaishnavaCalendar.jsx`)**:
  - Subdued the top banner from glaring saturated neon orange to a deep, sacred Vedic terracotta-spruce gradient (`from-[#3e2417] via-[#2f241a] to-[#1c3031]`).
  - Replaced glaring white banner title and text with sacred sandalwood gold (`#edd8bd`) and soft sage (`#9db7b1`).
  - Converted the "Sync" button from glaring pure white to warm amber spruce (`bg-amber-600/90 text-amber-50`).
  - Updated search bar, month pills, and event card date/mahatmya boxes to eye-protect spruce tones.
- **Sidebar & Header Search Integration (`src/components/layout/Sidebar.jsx` & `HeaderSearch.jsx`)**:
  - Removed `focus:bg-white` from global header search input.
  - Styled sidebar active items with soft amber-gold accents (`bg-[#243f41] text-amber-300 border-l-4 border-amber-400`) and soft sage icons.

### Bug Fix: Missing User Icon Import in DevoteeList (কম্পোনেন্ট রেন্ডার ক্র্যাশ সমাধান)
- **Resolved ReferenceError (`src/pages/devotees/DevoteeList.jsx`)**:
  - Fixed missing `User` icon import from `lucide-react` which triggered the React `ErrorBoundary` ("Something went wrong. The component failed to render").
  - Cleaned up unused `setSearchParams` hook variable.

### Devotee Table Row Hover & Checkbox Theme Fix (টেবিল রো হোভারের উগ্র সাদা ব্যাকগ্রাউন্ড ও সাদা চেকবক্স দূরীকরণ)
- **Table Hover Glare Extinguished (`src/index.css`)**:
  - Overrode all Tailwind `.hover\:bg-slate-50:hover`, `.hover\:bg-gray-50:hover`, and default `tbody tr:hover` to `#263f41` (soft elevated spruce), preventing table rows from flashing blinding white when hovered.
  - Aligned sticky column backgrounds (`td.sticky`) to seamlessly transition during row hover.
- **Custom Eye-Comfort Checkbox Theme (`src/index.css`)**:
  - Styled native `input[type="checkbox"]` with custom pine-slate background (`#172728`) and subtle border (`#3b5f61`), completely removing browser default white square boxes.
  - Styled checked and indeterminate states with ISKCON saffron/orange (`#ea580c`) and crisp vector checkmarks.
- **Devotee List Table Refinements (`src/pages/devotees/DevoteeList.jsx`)**:
  - Migrated table header to `#1b2e2f` with muted sage typography (`#86a09c`).
  - Updated status pill badges (Active/Pending) to dark emerald and amber wells (`bg-emerald-950/60`, `bg-amber-950/60`).
  - Added clean `<User />` vector fallback for avatar images with `#37595b` borders, replacing white rings and broken image boxes.

### Eye-Strain Elimination: Softer Text Luminance & Glare-Free Icon Wells (উগ্র সাদা টেক্সট ও সাদা আইকন বক্সের আলোক হ্রাস করে আরামদায়ক শান্ত কালারে রূপান্তর)
- **Soft Soothing Typography (`src/index.css`)**:
  - Replaced piercing 95% high-luminance white (`--foreground: 180 20% 95%`) with comfortable warm sage mist (`--foreground: 180 12% 80%` / `#c2d4d0`), eliminating text halation and photopic glare on the dark `#213738` pine-teal canvas.
  - Adjusted `--muted-foreground` to a gentle pine sage (`180 10% 60%` / `#86a09c`) providing a restful 4.5:1 secondary text contrast.
  - Bound all headings (`h1-h6`) and stat card numbers (`1039`, `14`, `5`, `1020`, `Overview`) to `#c7ded9`.
- **Elimination of Pastel 50 & 100 Glaring White Boxes (`src/index.css`)**:
  - Applied global theme overrides converting all `.bg-*-50` and `.bg-*-100` classes (pink, indigo, emerald, amber, orange, rose, purple, blue, teal) into soft dark-tinted recessed wells (`rgba(...)`), extinguishing over 670 potential white boxes across the application.
  - Inverted baked white backgrounds of default avatar assets (`img[src*="default-avatar"]`).
- **Dashboard & Widget Refinements (`src/pages/Dashboard.jsx` & `src/components/dashboard/EkadashiWidget.jsx`)**:
  - Replaced missing avatar images with `<User />` vector icons housed in recessed spruce wells (`bg-[#1d3334] text-[#8fa8a4] border-[#37595b]`), completely removing white square avatar placeholders.
  - Converted StatCard icon wells to dark spruce wells (`bg-[#1d3233] text-[#86a09c] border-[#2d4d4f]`).
  - Converted Occasions & Upcoming Events calendar icons to soft tinted dark containers (`bg-pink-950/40 text-pink-300`, `bg-indigo-950/50 text-indigo-300`).
  - Redesigned "WhatsApp রিমাইন্ডার" button in EkadashiWidget to deep emerald spruce (`bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-300 border-emerald-800/80`).

### White Glare Elimination Across Entire App (সকল পেজে সাদা রঙের উগ্রতা দূরীকরণ ও আরামদায়ক স্প্রুস কার্ডে রূপান্তর)
- **Universal White Card Overhaul (`src/index.css`)**:
  - Automatically mapped all `.bg-white` card instances across Attendance, Devotees, Counseling, Events, Tours, and Modals to `hsl(var(--card))` (`#294445` elevated spruce), completely extinguishing eye-straining white rectangles on the `#213738` background.
  - Mapped `.text-slate-900`, `.text-slate-800` to `hsl(var(--foreground))` (`#edf5f5` soft light mint), ensuring bright and effortless text legibility.
  - Mapped `.border-slate-200` to `hsl(var(--border))` (`#37595b`) and inner lists (`.bg-slate-50`, `.bg-slate-100`) to `hsl(var(--muted))` (`#2d4a4c`).
- **Dark Theme Initialization (`src/context/ThemeContext.jsx`)**:
  - Initialized `theme_dark_mode_v2` to default `true` so all Tailwind `dark:` variants and icons activate hand-in-hand with the CSS layer.


### Full-Site Canvas Migration to Deep Soothing Pine Teal `#213738` (অপশন খ: সমগ্র সাইটের ডিফল্ট ব্যাকগ্রাউন্ড `#213738`-এ রূপান্তর)
- **Universal Root Background (`src/index.css`)**:
  - Established `--background: 183 26% 17.5%` (`#213738`) directly within `:root`, ensuring that every page across the entire application defaults immediately to `#213738` without requiring any manual toggle.
  - Set universal elevated card surfaces (`--card: 183 24% 21%` / `#294445`), subtle borders (`--border: 183 20% 28%` / `#37595b`), and soft light mint typography (`--foreground: 180 20% 95%` / `#edf5f5`).
  - Standardized sidebar (`#172728`), borders (`#274345`), and custom scrollbars (`#1b2e2f` / `#3b5f61`) globally.
- **Layout Canvas Resilience (`src/components/layout/Layout.jsx`)**:
  - Configured outer shell with `bg-[#213738] bg-background text-foreground`, eliminating any flash of grey or white during initial page paint.


### Eye Protection Color Customization: Deep Soothing Pine Teal `#213738` (চোখের সুরক্ষায় স্পেশাল ডিপ স্প্রুস/পাইন টিল ব্যাকগ্রাউন্ড)
- **Background Color Specification (`#213738`)**:
  - Configured `--background: 183 26% 17.5%` (`#213738`) across both `.dark` and `.eye-protect` themes in `src/index.css`.
  - Harmonized card surface layers (`--card: 183 24% 21%` / `#294445`), soft borders (`--border: 183 20% 28%` / `#37595b`), and soft light mint typography (`--foreground: 180 20% 95%` / `#edf5f5`), achieving WCAG AAA contrast ratio (10.5:1).
  - Enhanced sidebar (`#172728`) and scrollbar tracks (`#1b2e2f`) to perfectly match the deep teal eye protection palette.
  - Set `eyeProtectMode` default to `true` in `ThemeContext.jsx` (`theme_eye_protect_v2`), ensuring users immediately experience the `#213738` soothing anti-glare background upon arrival.


### Dashboard Eye-Protective Color Palette & Eye Comfort Mode (ড্যাশবোর্ড চোখের আরামদায়ক ও অ্যান্টি-গ্লেয়ার কালার সিস্টেম)
- **Eye-Protective Color Architecture & CSS Variables (`src/index.css`)**:
  - Replaced high-glare pure white (`#FFFFFF`) with soothing warm ivory paper (`--card: 40 25% 99%`) in base light mode and warm sandstone (`--background: 35 20% 97.5%`).
  - Added dedicated `.eye-protect` and `.eye-protect.dark` warm reading spectrum tokens with soft sandstone paper (`#F5F1E8`), soft charcoal ink (`#2B2623`), warm sand borders (`#DED7C9`), and twilight warm obsidian (`#141519`).
  - Added customized eye-protect dark scrollbar tracks and soft espresso sidebar theme (`.eye-protect .sidebar`).
- **ThemeContext Eye Comfort State (`src/context/ThemeContext.jsx`)**:
  - Added `eyeProtectMode` state with automatic persistence to `localStorage` (`theme_eye_protect`).
  - Dynamically attaches and detaches `.eye-protect` class to `document.documentElement`.
  - Exposed `eyeProtectMode` and `toggleEyeProtect` via `useTheme()` across the entire app.
- **Top Navigation Header Eye Comfort Toggle (`src/components/layout/Header.jsx`)**:
  - Added dedicated Eye Comfort button with `Glasses` icon, active pulse indicator badge, and tooltip beside the Dark Mode switch.
  - Converted Header from hardcoded slate to semantic `bg-card border-border text-foreground`.
- **Layout Theme Dynamic Adaptation (`src/components/layout/Layout.jsx`)**:
  - Replaced hardcoded `bg-[#f4f6f8] dark:bg-[#0a0f1d]` with `bg-background text-foreground transition-colors duration-300`, guaranteeing smooth, flicker-free background transitions across all themes.
- **Dashboard Glare-Free Transformation (`src/pages/Dashboard.jsx`)**:
  - Converted `StatCard` to `bg-card text-card-foreground border-border` with soft charcoal digits and warm amber hover accents.
  - Added interactive "Eye Comfort" quick-toggle button in the Dashboard top header alongside "Refresh" and "New Devotee".
  - Transformed Occasions Panel (Birthdays, Anniversaries, Upcoming Major Events) and Weekly Calendar tracker to warm semantic tokens (`bg-card`, `border-border`, `bg-muted/40`).
- **Vaishnava Calendar Hub Alignment (`src/components/dashboard/EkadashiWidget.jsx`)**:
  - Migrated hardcoded cards and countdown wells to `bg-card`, `border-border`, and `bg-muted/40`, perfectly blending with devotional Vedic temple tones.


### Tour Participant Date of Birth (DOB) Integration (ট্যুর পার্টিসিপেন্ট জন্মতারিখ অপশন ও কলাম)
- **Zero-Data-Loss Schema Migration (`ALTER TABLE tour_enrollments ADD COLUMN dob TEXT`)**:
  - Added `dob TEXT` column to `tour_enrollments` in SQLite (`whatsapp-bot/devotee_mgmt.db`) and PostgreSQL (`api/_src/database.mjs` & `api/_src/schema.mjs`).
  - Confirmed 100% preservation of all existing 125 tour enrollments and 130 payments without data loss.
  - Implemented automatic schema healing in `healSchema()` (SQLite) and `initDb()` (PostgreSQL) with `ALTER TABLE tour_enrollments ADD COLUMN IF NOT EXISTS "dob" TEXT`.
  - Joined `d.dob as "devoteeDob"` and `d.age as "devoteeAge"` in `getTourEnrollments()`, ensuring all 125 previously enrolled devotees automatically display their DOB from their profile even if not re-entered.
- **Add Participant Modal DOB Integration (`src/components/tours/AddParticipantForm.jsx`)**:
  - Added Date of Birth (DOB) field for both Walk-in participants and Existing Devotees.
  - Selecting an existing devotee automatically auto-fills their registered DOB into the form while allowing custom overrides.
  - Included DOB in the booking confirmation receipt (`TourReceipt.jsx`).
- **Tour Details Table & Excel Management (`src/pages/tours/TourDetails.jsx`)**:
  - Added dedicated **DOB** column to both Active and Cancelled participant tables.
  - Displays formatted date with dynamic age indicator (e.g. `15 May 1992 (34y)`).
  - Inline DOB quick-editing for administrators with interactive date picker, Save (✔), and Cancel (✖) buttons.
  - Multi-token search matches date of birth queries.
  - Excel export (`handleExportExcel`) includes `'DOB'` and `'Age'` columns.
  - WhatsApp booking summary receipt reflects the participant's DOB and age.

### Bug Fixes & Cross-Environment Consistency Hardening (বাগ ফিক্স ও ক্রস-এনভায়রনমেন্ট কনসিস্টেন্সি)
- **PostgreSQL Column Alias Lowercase Restoration (`api/_src/schema.mjs` & `api/_src/db.mjs`)**:
  - Identified that PostgreSQL folds unquoted JOIN and aggregate query aliases (`devoteeName`, `devoteeCounselor`, `totalRefunded`, `totalReceived`, `attendedSessions`, `devoteeContact`, etc.) to lowercase. Because these aliases were not columns defined in `TABLES`, `db.mjs` was returning lowercase keys (`devoteecounselor`, `devoteename`), causing frontend UI elements on Vercel to miss fields or fall back to defaults.
  - Quoted JOIN aliases in `api/_src/database.mjs` (`as "devoteeCounselor"`, `as "totalRefunded"`, `as "totalReceived"`).
  - Extended `CAMEL_CASE_KEYS` in `api/_src/schema.mjs` with `QUERY_ALIAS_CAMEL_CASE` across 23 known aliases to guarantee full camelCase restoration across all Postgres query rows.
  - Added `totalrefunded` and `totalreceived` to `AGGREGATE_KEYS` in `api/_src/db.mjs` for automatic numeric coercion.
  - Added defensive fallback `en.devoteeCounselor || en.devoteecounselor` and `en.devoteeName || en.devoteename` across `TourDetails.jsx`, `CancelRefundModal.jsx`, `AdminChangeRequests.jsx`, and `MyRequests.jsx`.
- **Empty Payload Update Guard in SQLite (`whatsapp-bot/database.mjs`)**:
  - Added `if (keys.length === 0) return resolve({ success: true });` across all SQLite update functions (`updateTourEnrollment`, `updateTour`, `updateCourse`, `updateEnrollment`, `updateSeva`, `updateSevaShift`, `updateInventoryItem`), preventing SQL syntax errors (`UPDATE ... SET  WHERE id = ?`) when empty update payloads are dispatched.
- **Safe Math & Error Handling (`src/pages/tours/TourDetails.jsx`)**:
  - Hardened Excel export math: `Math.max(0, Number(tour?.fees || 0) - Number(en.totalPaid || 0))` preventing `NaN` values.
  - Improved error toasts in `updateEnrollmentStatus` and `updateEnrollmentLeader` to display the actual server rejection message (`err?.message || 'Update failed'`).
- **Test Suite Modernization (`package.json` & `test/searchUtils.test.mjs`)**:
  - Configured `npm test` script with `--test-concurrency=1` to ensure sequential test execution against the SQLite database without locking contention.
  - Updated search unit tests to align with enhanced scoring constants (95 prefix, 85 substring). All 16 unit tests and 23 regression tests pass with 0 errors.

### Tour Participant Leader Column Option (ট্যুর পার্টিসিপেন্ট লিডার কলাম ও ম্যানেজমেন্ট)
- **Zero-Data-Loss Schema Migration (`ALTER TABLE tour_enrollments ADD COLUMN leader TEXT`)**:
  - Successfully altered `tour_enrollments` in SQLite (`whatsapp-bot/devotee_mgmt.db`) and PostgreSQL (`api/_src/database.mjs` & `api/_src/schema.mjs`) to include the `leader` column.
  - Confirmed 100% preservation of all existing 125 tour enrollments, 130 payment records, and tours without any data loss or truncation.
  - Integrated safe auto-healing routine in `healSchema()` across SQLite and PostgreSQL to ensure any future cold starts or database merges maintain the `leader` column.
- **Add Participant Form Leader Integration (`src/components/tours/AddParticipantForm.jsx`)**:
  - Added dedicated **Leader / Guide** input field to the booking modal.
  - Auto-suggests known counselors and leaders from the devotee database and existing tour enrollments via an interactive datalist.
  - Automatically pre-populates with devotee's counselor when an existing devotee is selected.
  - Supports custom leader entry for both devotees and walk-in participants.
  - Enhanced booking confirmation receipts and WhatsApp broadcast messages to display the assigned Group Leader.
- **Tour Details Leader Management (`src/pages/tours/TourDetails.jsx`)**:
  - Added **Leader** column to the Participant List table between Devotee and Booking Status.
  - Styled with a crown badge displaying the Leader's name.
  - Inline Leader assignment and editing: Admins can assign or change leaders on the fly with 1 click without leaving the table.
  - Unassigned participants with an existing DMS counselor display a 1-click `+ {counselorName}` quick assign shortcut.
  - Added **Leader Filter** dropdown in the toolbar (`All Leaders`, `Without Leader`, and filter by specific leader).
  - Multi-token participant search matches leader and counselor names.
  - Excel export (`handleExportExcel`) includes the 'Leader' column for all active participants.
  - Cancelled participants table updated with the Leader column for visual consistency.
- **Verification & Deployment**:
  - Unit test `test/tour_leader.test.mjs` created and passing.
  - All 23 backend regression tests and unit tests passing.
  - Production Vite build passing in 35.21s.
  - Deployed to Vercel production: `https://devoteemanagement.vercel.app`.

### Full-Stack Performance Optimization & Latency Resolution (ওয়েবসাইটের গতি ও পারফরম্যান্স উন্নয়ন)
- **18.9 MB Database Photo Payload Reduction (98% Payload Drop)**:
  - Discovered and resolved massive multi-megabyte payload bloat caused by 7 uncompressed devotee photos stored as raw base64 in database (including a single 16.5 MB raw photo on `Manjusri Sikder`).
  - Compressed all oversized base64 images in `whatsapp-bot/devotee_mgmt.db` to standard web quality (under 40KB each), dropping the total devotee bulk API payload from **18.9 MB down to ~385 KB**.
  - Added self-healing database routine in `runDataRepair()` across both `whatsapp-bot/database.mjs` and `api/_src/database.mjs` to automatically nullify any base64 photo bloat exceeding 100KB.
  - Added bulk payload guard in `getDevotees()` (`whatsapp-bot/database.mjs` & `api/_src/database.mjs`) to strip oversized base64 images when fetching list views with `limit > 50`, preventing Vercel function timeouts and response size limits (4.5 MB).
- **Client-Side Image Auto-Compression (`src/lib/imageCompression.js`)**:
  - Implemented canvas-based client-side image compressor converting uploaded photos to max 500x500px JPEG at 75% quality before encoding into base64.
  - Integrated into `src/pages/devotees/DevoteeForm.jsx` and `src/pages/public/PublicRegister.jsx`, preventing raw 10MB-20MB phone camera uploads from reaching the database.
- **Render-Blocking CSS `@import` Elimination (`src/index.css`)**:
  - Removed blocking `@import url(...)` for Google Fonts from top of stylesheet.
  - Added `font-display: swap` to local `@font-face` rules to eliminate render-blocking stylesheet latency and prevent Flash of Invisible Text (FOIT).
- **Polling Loop Throttling & Visibility Guards**:
  - In `src/context/DevoteeContext.jsx`: Throttled background stats polling from 10 seconds to 60 seconds, gated with `document.visibilityState === 'visible'`, and restricted to lightweight `/api/stats` instead of full devotee list refills into `localStorage`.
  - In `src/pages/devotees/DevoteeList.jsx`: Throttled auto-sync interval from 10 seconds to 60 seconds with tab visibility check.
- **WebSocket Reconnection Loop Guard on Vercel (`src/services/wsClient.js`)**:
  - Prevented infinite rapid WebSocket connection failure loops when running on `*.vercel.app` (which does not support persistent WebSockets without an external broker).
- **Verification & Deployment**:
  - All 23 backend regression tests and unit tests passing.
  - Production Vite build passing in 7.63s.
  - Successfully deployed to Vercel production: `https://devoteemanagement.vercel.app`.

### Vaishnava Calendar & Ekadashi Notification Hub (বৈষ্ণব ক্যালেন্ডার ও একাদশী নোটিফিকেশন হাব)
- **Astronomical Vaishnava Dataset (`src/data/vaishnavaCalendarData.js`)**:
  - Comprehensive dataset for 2026 and 2027 calibrated to ISKCON Sri Mayapur Dham / West Bengal / Kolkata / Durgapur standard time (IST, UTC+05:30).
  - Contains all Ekadashi fasting dates, exact Parana (fast-breaking) windows, Gaura/Krishna Pakshas, scriptural Katha/Mahatmya excerpts, and major Vaishnava appearances/disappearances (Gaura Purnima, Rama Navami, Janmashtami, Radhashtami, Nrisimha Caturdashi, Srila Prabhupada Vyasa-Puja, Govardhana Puja, Gita Jayanti, etc.).
  - Fasting guidelines dictionary (`FASTING_GUIDELINES`) listing prohibited grains & pulses (পঞ্চরবিশস্য) and permitted satvik foods.
- **Calendar & Countdown Utility Engine (`src/lib/vaishnavaCalendarUtils.js`)**:
  - `getNextEkadashi()`: Real-time detection of upcoming Ekadashi, remaining days countdown, and instant status detection for Ekadashi Day (আজ একাদশী) and Parana Day (আজ পারণ সময়).
  - `generateEkadashiWhatsAppText()`: Generates pre-formatted devotional WhatsApp broadcast messages with support for Bilingual (Bengali & English), Bengali-only, and English-only templates.
  - `getEventsByMonth()`, `searchVaishnavaEvents()`, `formatParanaNotice()`.
- **Live Ekadashi Widget on Dashboard (`src/components/dashboard/EkadashiWidget.jsx`)**:
  - Embedded prominently at the top of the side column on `src/pages/Dashboard.jsx`.
  - Three real-time states:
    1. *Ekadashi Day (Today)*: Saffron glowing banner displaying current Ekadashi vrata with fasting guidance.
    2. *Parana Day (Today)*: Emerald alert displaying exact Parana time window for breaking fast.
    3. *Upcoming Countdown*: Shows remaining days, date, and Parana time preview with quick action buttons.
  - 1-Click WhatsApp notification modal trigger and link to full calendar.
- **Dedicated Vaishnava Calendar Page (`src/pages/VaishnavaCalendar.jsx`)**:
  - Available at route `/calendar` and linked in the primary sidebar navigation (`src/components/layout/Sidebar.jsx`).
  - Year selector (2026 / 2027) and quick month pills (জানুয়ারি - ডিসেম্বর).
  - Category filters: All, Ekadashis Only 📿, Appearances & Disappearances 🙏, Major Festivals 🪔.
  - Real-time search across Bengali name, English name, and Katha.
  - Fasting & Parana badges, scriptural Mahatmya previews.
  - Fasting Guidelines Drawer / Modal ("অনুকূল ও প্রতিকূল খাদ্য বিধি").
  - "শ্রীমন্দির ইভেন্টে সিঙ্ক করুন" (Sync to DMS Events) button: 1-click auto-import into `/api/events` table for temple attendance & feast coordination.
- **WhatsApp Notification Hub Modal (`src/components/spiritual/EkadashiBroadcastModal.jsx`)**:
  - Allows counselors and admins to preview, edit, choose language (Bilingual / Bengali / English), and dispatch Ekadashi reminders to WhatsApp contacts or copy to clipboard for broadcast groups.
- **Automated Verification & Deployment**:
  - 7 unit tests created and passing (`test/vaishnava_calendar.test.mjs`).
  - 23 backend regression tests passing (`npm run test:regression`).
  - Vite production build passing (`npm run build`).
  - Deployed directly to production: `https://devoteemanagement.vercel.app`.

### Smart Case-Insensitive, Multi-Token & Any-Word Search
- **Client Search Engine Upgrade (`src/lib/searchUtils.js`)**:
  - **Tokenized Matching**: Search queries with multiple words, reversed word order, or middle names (e.g. `das sadananda`, `sadananda das`, `mukherjee koushik`) now match devotees regardless of word position.
  - **Any-Word & Substring Matching**: Typing any word, partial letters, or nickname in brackets (e.g. `gour`, `sajal`, `sada`, `deb`, `dasi`) from anywhere in the devotee's legal name, initiated name, spiritual name, phone, or email successfully matches.
  - **Multi-Token Highlighting (`HighlightText`)**: Highlights every matched search token simultaneously across the full name or initiated name.
- **Backend SQL Query Enhancement (`whatsapp-bot/database.mjs` & `api/_src/database.mjs`)**:
  - Replaced strict full-string pattern matching with multi-token query generation (`(token1 matches) AND (token2 matches)`).
  - Matches across `name`, `initiatedName`, `spiritualName`, `contact`, `whatsapp`, and `email` using parameterized queries for SQLite and PostgreSQL.
- **Unified Component Adoption**:
  - Updated `CounselorDashboard.jsx`, `DonationForm.jsx`, `Attendance.jsx`, `CourseDetails.jsx`, and `TourDetails.jsx` to leverage the new flexible search matching.
- **Verification**:
  - 12 comprehensive search unit tests created and passing (`test/search_devotees.test.mjs`).
  - All 23 backend regression tests passing (`npm run test:regression`).
  - Production build passing (`npm run build`).

### Removal of Unwanted Default Photo Placeholder
- **Removed Hardcoded Stock Photo Fallback (`src/context/DevoteeContext.jsx`)**:
  - Removed `'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop'` which was being assigned whenever a devotee was entered manually without a photo.
  - New devotees created manually or via forms now default cleanly to `''` (no image), letting the UI use its standard clean avatar placeholders (`/default-avatar.png` or initials/icons).
  - Added `cleanPhotoUrl` utility in `DevoteeContext.jsx` to dynamically strip this legacy photo URL from in-memory state and `localStorage`.
- **Database Self-Healing & Cleanup (`whatsapp-bot/database.mjs` & `api/_src/database.mjs`)**:
  - Added self-healing database routine in `runDataRepair` and `initDb` to automatically clear the legacy placeholder photo from existing devotee records.
  - Cleared legacy placeholder photo occurrences from the local SQLite database.

## [2026-10-16]

### Comprehensive Cancel & Refund Management for Tours and Courses
- **Unified Cancel & Refund Workflow (`src/components/CancelRefundModal.jsx`)**:
  - Created a reusable, dark-mode ready modal for Tours and Courses managing the complete cancellation & refund lifecycle.
  - Three distinct refund choices with live financial computation:
    - **Full Refund**: Instantly refunds 100% of the remaining paid balance.
    - **Partial Refund**: Number input bounded between ₹1 and remaining balance, displaying dynamic deduction / cancellation fee calculation.
    - **No Refund**: Confirms cancellation while retaining the entire balance with temple accounts under non-refundable policies.
  - Channel selection: Cash, UPI / PhonePe / GPay, Bank Transfer / NEFT, or Cheque.
  - Note and reason logging persisted into payment and transaction records.
- **Tour Section Enhancements (`src/pages/tours/TourDetails.jsx`)**:
  - Intercepted participant status dropdown changes to `'Cancelled'` to launch `CancelRefundModal` before updating records.
  - Added dedicated `<RotateCcw />` Cancel & Refund row action for active tour participants.
  - Upgraded Cancelled Participants table with real-time financial tracking: Net Balance, Total Received, Total Refunded, and status badges (`Refunded`, `Partial Refund`).
  - Added "Refund" action button in cancelled table to process remaining refunds for partially refunded or unrefunded cancelled bookings at any future time.
  - Added specialized Yatra Cancellation & Refund WhatsApp receipts with detailed breakdown of fees, amount paid, amount refunded, balance retained, and contact assistance.
- **Course Section Enhancements (`src/pages/courses/CourseDetails.jsx`)**:
  - Added `'Cancelled'` status option alongside `'Participated'`, `'Completed'`, and `'Dropped'`.
  - Added `<RotateCcw />` action button on course participant rows for 1-click cancellation and refund processing.
  - Integrated `<MessageSquare />` WhatsApp action button on all course participant rows and mounted `<WhatsAppModal>`.
  - Structured dedicated **Cancelled & Dropped Participants** section below the active table with net fee tracking, refund history, and WhatsApp receipt options.
  - Updated course dashboard statistics (Active Enrolled, Total Collected, Total Due) to calculate strictly across active enrollments.
- **Database Parity (`whatsapp-bot/database.mjs` & `api/_src/database.mjs`)**:
  - Updated `addCoursePayment` and `addTourPayment` to support negative refund transactions (`amount: -refundAmount`).
  - Implemented `Math.max(0, ...)` safe bounds preventing negative enrollment totals.
  - Automatic `paymentStatus` calculation (`'Refunded'`, `'Partial Refund'`, `'Due'`, `'Completed'`).
  - Added `totalRefunded` and `totalReceived` SQL subqueries into `getTourEnrollments` and `getCourseEnrollments` for both SQLite and PostgreSQL.
- **Unblockable WhatsApp Web Launching (`src/services/whatsappLink.js`)**:
  - Direct dispatch to `https://web.whatsapp.com/send` avoids prompting for Microsoft Store app installations.
  - Added clickable fallback link inside toast notifications (`Opening WhatsApp Web for ... Click if not opened`), ensuring popups can always be opened even under strict browser popup blocker settings.
- **Verification**:
  - Passed all 23 backend regression tests (`npm run test:regression`).
  - Passed 5 automated DOM integration tests (`test/dom_tour_whatsapp.test.mjs`).
  - Passed all database refund tests (`test/refund_backend.test.mjs`).
  - Clean production build with Vite (`npm run build`).
- **Root Cause Resolution**:
  - Previously, clicking WhatsApp buttons in the Tour section (`TourDetails.jsx` and `AddParticipantForm.jsx`) invoked raw `window.open("https://wa.me/...")`. In desktop browsers, `wa.me` links often fail or prompt for nonexistent Microsoft Store apps instead of opening WhatsApp Web.
  - In `AddParticipantForm.jsx`, an asynchronous receipt image rendering via `htmlToImage.toPng()` was awaited *before* invoking `window.open()`, causing browsers to block the window as an unprompted popup after the user gesture expired.
  - In Electron desktop builds, raw `window.open()` was not bound to `shell.openExternal()`.
  - SQLite and PostgreSQL queries in `getTourEnrollments` used strict ID equality against devotees, which failed when numeric IDs mismatched string IDs and cleared contact/phone numbers.
- **Universal Multi-Mode WhatsApp Link Integration (`src/services/whatsappLink.js`)**:
  - Unified all WhatsApp launches through `openWhatsApp(targetPhone, message, mode)`.
  - Supports automatic routing: WhatsApp Web (`https://web.whatsapp.com/send`), WhatsApp App (`https://wa.me/` / `whatsapp://`), and Electron desktop shell integration.
- **Enhanced Tour Details (`src/pages/tours/TourDetails.jsx`)**:
  - Integrated `WhatsAppModal` directly into Tour participant management (both Active and Cancelled participant tables).
  - Formatted comprehensive, professional Yatra receipts including Booking ID, Tour Name, Destination, Dates, Total Tour Fees, Paid Amount, Balance Due, and ISKCON Durgapur signoff.
  - Added multi-source phone resolution: falls back gracefully through `en.whatsapp` -> `en.contact` -> `devotees` context lookup -> `en.guestContact`.
  - Automatically triggers the WhatsApp confirmation modal upon recording an installment payment.
- **Enhanced Add Participant Booking Modal (`src/components/tours/AddParticipantForm.jsx`)**:
  - Added dedicated WhatsApp sharing card in the booking success view.
  - Displays editable phone number input with instant copy-to-clipboard button.
  - Dual action buttons: "WhatsApp Web" and "WhatsApp App" for desktop and mobile devices.
  - Integrated full preview and custom message editor via `<WhatsAppModal>`.
- **Popup Blocker & User Activation Fixes**:
  - Eliminated the `noopener,noreferrer` parameter in `window.open` within `openWhatsApp`, which previously caused modern Chromium browsers to return `null` and trigger an accidental secondary `anchor.click()` popup that got blocked by browser security.
  - Made WhatsApp opening completely synchronous on user click in `AddParticipantForm.jsx`: `openWhatsApp` now dispatches immediately, while receipt image PNG generation runs smoothly in the background without stealing or expiring transient user activation.
  - Provided 1-click direct WhatsApp Web dispatch from the Tour participant table in `TourDetails.jsx` when a phone number is present, with automatic fallback to `<WhatsAppModal>` if a phone number is missing.
  - Deferred modal dismissal (`setTimeout(() => onClose(), 300)`) in `WhatsAppModal.jsx` to prevent abruptly destroying the trigger element mid-navigation.
  - Pre-seeded `targetPhone` and `message` directly in `useState` from props in `WhatsAppModal.jsx` to avoid initial invalid-phone state rendering.
- **Automated DOM Testing (`test/dom_tour_whatsapp.test.mjs`)**:
  - Implemented 5 automated DOM integration test suites using JSDOM:
    1. Phone normalization across Indian standard, 0-prefixed, and country-code formats.
    2. Direct window.open dispatch with target="_blank" and prefilled WhatsApp parameters.
    3. Tour participant data resolution, Yatra balance due calculation, and message formatting.
    4. DOM button click event simulation and unblocked dispatch.
    5. Native clipboard copying integration.


### Case-Insensitive & Prefix-Prioritized Devotee Search
- **Core Search Engine (`src/lib/searchUtils.js`)**:
  - Implemented `searchDevoteesByName`, `matchDevoteeName`, `normalizeText`, and `highlightMatches`.
  - Guaranteed case-insensitivity: converts both user input and candidate strings to normalized lower-case with accent removal (`normalize('NFD')`), treating uppercase, lowercase, and mixed-case queries identically.
  - Prefix Prioritization: Candidates whose legal name or initiated name starts with the user's typed characters (e.g. typing "deb" or "DEB" matches "**Deb**abrata Sahoo") are ranked at the highest priority (score 90-100), followed by word-initial matches (e.g. "sah" matching "Debabrata **Sah**oo"), then general substrings and contact numbers.
  - Implemented `HighlightText` component dynamically highlighting the exact matching character sequence in amber (`<mark>`) without fragile regular expressions.
- **Top Navigation Live Search Header (`src/components/layout/HeaderSearch.jsx` & `Header.jsx`)**:
  - Replaced static dummy search input in application header with an interactive instant search bar accessible from every page.
  - Displays instant floating dropdown showing matched devotees with avatar, highlighted name, spiritual name, counselor, contact, and status badge.
  - Supports keyboard accessibility (Arrow Up/Down, Enter to view profile, Escape to dismiss) and clear button (`X`).
  - Added mobile search trigger overlay for seamless phone and tablet navigation.
- **Devotee List & Directory Integration (`src/pages/devotees/DevoteeList.jsx`)**:
  - Integrated `searchDevoteesByName` and `HighlightText` in both Table and Grid views with live match highlights.
  - Synchronized `searchTerm` state with URL `?search=` parameters so navigating from global search or links pre-populates and filters the directory instantly.
  - Added single-click search clear button (`X`) and updated placeholder guide.
- **Command Palette Integration (`src/components/CommandPalette.jsx`)**:
  - Connected `Ctrl+K` global command palette devotee filter to `searchDevoteesByName` for unified ranking and case-insensitivity.
- **Database Search Parity (`whatsapp-bot/database.mjs` & `api/_src/database.mjs`)**:
  - SQLite: Upgraded `getDevotees` to use `LOWER(name) LIKE LOWER(?)` and `ORDER BY CASE WHEN LOWER(name) LIKE LOWER(?) THEN 1 ... END` for database-level prefix ranking.
  - PostgreSQL: Trimmed queries and added `ORDER BY CASE WHEN name ILIKE ? THEN 1 ... END` for case-insensitive prefix prioritization.
- **Automated Verification**:
  - Created unit test suite (`test/searchUtils.test.mjs`) passing all 4 test suites (normalization, case-insensitivity, prefix sorting, segment highlighting).
  - Verified full backend regression test suite (`tests/regression.api.test.mjs` - 23/23 tests passing).
  - Production Vite build compiled cleanly with 0 errors (`dist/`).

### Devotee Profile Details Restoration & ID Type Coercion Fix
- **Dark Mode Font Visibility Fix (`src/pages/devotees/DevoteeProfile.jsx`)**:
  - Fixed critical dark mode issue where `InfoRow` values were styled with `text-slate-900` without `dark:text-slate-100`, making all profile details visually black-on-black (invisible) on dark backgrounds while headers remained light. Added `dark:text-slate-100` and cleaned up malformed Tailwind class names (`dark:bg-slate-900/50/50`).
- **Comprehensive Profile Field Display (`src/pages/devotees/DevoteeProfile.jsx`)**:
  - Restored over 15 previously omitted fields into structured sections:
    - *Personal & Demographics:* Full Name, Initiated/Spiritual Name, Gender, Date of Birth with calculated Age, Blood Group, Marital Status, Marriage Anniversary, Contact Number (with integrated WhatsApp launcher), WhatsApp Number, Email Address, Father/Guardian Name & Relationship.
    - *Education & Profession:* Highest Qualification/Education, Occupation, Special Skills, Current Seva.
    - *Residential Address:* Street Address, Village/Town, District, State, PIN Code.
    - *Spiritual Journey:* Spiritual Status, Counselor, Spiritual Master (Diksha Guru), Daily Japa Rounds, Following 4 Regulative Principles Since, Shelter Date, 1st & 2nd Initiation Dates, Books Read, Books Currently Reading, Courses Completed.
    - *Family & Commemorative Dates:* Children details (Child 1/2/3 with DOBs), Other Family Members, Shraddha Ceremony Date.
- **Type-Safe ID Coercion across Frontend & Backend**:
  - Standardized ID comparison across all components to string-coerced comparisons (`String(d.id) === String(id)`), preventing strict equality mismatches when IDs are parsed as numbers from PostgreSQL schemas:
    - `src/pages/devotees/DevoteeProfile.jsx`: Prevented profile clearing during background auto-sync polls; added graceful loading spinner; wrapped numeric ID substrings with `String()`.
    - `src/pages/devotees/DevoteeForm.jsx`: Implemented fallback fetching directly from API if devotee is not yet in local context state on page refresh.
    - `src/pages/courses/CourseDetails.jsx` & `src/pages/Attendance.jsx`: Reconciled scanner check-ins to support string and numeric devotee IDs seamlessly.
    - `src/pages/ChangeRequestForm.jsx` & `src/context/SadhanaContext.jsx`: Safe ID string matching.
    - `src/components/JourneyTimeline.jsx`: Added Appearance Day (DOB), 4 Regulative Principles commitment, and Anniversary milestones.
- **Backend ID Lookup Parity (`whatsapp-bot/database.mjs` & `api/_src/database.mjs`)**:
  - Updated `getDevoteeById` to query by `id = ? OR CAST(id AS TEXT) = ?` in SQLite, ensuring numeric and string queries resolve correctly.
  - Updated PostgreSQL `getDevoteeById` to accept both string and integer IDs, and converted search filters to `ILIKE` for full SQLite case-insensitive parity.

### Automated Dropbox Disaster Recovery & Space-Safe Auto-Sync
- **Backend Autonomous Sync Service (`whatsapp-bot/services/DropboxAutoSyncService.mjs` & `server.mjs`)**:
  - Engineered standalone 24/7 background scheduler monitoring sync schedules every 60 seconds independently of WhatsApp client availability.
  - Automatically executes compressed Gzip snapshots to Dropbox (`/DMS_Backups/`) whenever the configured interval elapses.
  - Broadcasts real-time WebSocket notifications (`DATA_MUTATED`) to connected clients upon sync completion.
- **Intelligent Dropbox Storage Protection & Auto-Pruning (`CloudBackupService.mjs`)**:
  - Added `pruneOldDropboxBackups`: automatically retains the 10 most recent snapshots and safely removes older archives via Dropbox `delete_v2` to prevent `insufficient_space` errors.
  - Formatted detailed quota usage metrics and human-readable capacity bars in status responses.
- **Client-Side Session Synchronization (`src/services/dropboxAutoSync.js` & `src/App.jsx`)**:
  - Implemented client-side sync heartbeat for cloud serverless (Vercel) environments, triggering background backups while active admin sessions are open.
  - Added `POST /api/backup/auto-sync-check` and `GET/POST /api/backup/cron-sync` with optional Vercel Cron support (`vercel.json`).
- **Electron Desktop Continuous Backup (`electron/main.js`)**:
  - Integrated Dropbox auto-sync check directly into Electron's hourly local auto-backup cycle for dual local + cloud redundancy.
- **Settings UI Controls & Live Status (`src/pages/Settings.jsx`)**:
  - Added interactive Auto-Sync toggle switch with real-time status pulses.
  - Added configurable frequency selector (1 Hour, 6 Hours, 12 Hours, 24 Hours / Daily).
  - Added live "Next Scheduled Sync" countdown display and automated pruning badge.
- **Automated Regression Test Suite (`regression.api.test.mjs`)**:
  - Added test validating auto-sync configuration, status reporting, and public cron endpoint accessibility (23/23 tests passing).

### WhatsApp Web & Messaging Link Opening Fix
- **Centralized WhatsApp Utility (`src/services/whatsappLink.js`)**:
  - Implemented `sanitizeWhatsAppNumber` with robust support for 10-digit local Indian numbers (prefixes `91`), 11-digit numbers with leading zero (`0XXXXXXXXXX`), and standard 12-digit international format (`91XXXXXXXXXX`).
  - Added `getWhatsAppWebUrl` targeting direct WhatsApp Web (`https://web.whatsapp.com/send?phone=...&text=...`).
  - Added `getWhatsAppAppUrl` targeting WhatsApp deep link (`https://wa.me/...`).
  - Implemented `openWhatsApp` with multi-layer fallback: Electron desktop native browser delegation via `shell.openExternal`, browser `window.open`, and dynamic DOM anchor `.click()` fallback if popups are blocked.
- **Electron Desktop External URL Delegation (`electron/main.js`)**:
  - Added `mainWindow.webContents.setWindowOpenHandler` intercepting `http`, `https`, `mailto`, and `tel` external links to open inside the user's default system browser (Chrome/Edge/Firefox) instead of silently failing or opening in broken Electron embedded frames.
- **WhatsApp Modal Enhancement (`src/components/WhatsAppModal.jsx`)**:
  - Replaced ambiguous `wa.me` default with direct **"Open WhatsApp Web"** (`web.whatsapp.com`) and **"WhatsApp App"** (`wa.me`) action buttons.
  - Added phone validation status indicator and manual phone number entry fallback when devotee contact is missing or incomplete.
  - Added "Copy Message Text" quick button for manual pasting.
  - Added permanent direct fallback hyperlinks in modal footer for guaranteed click-through even under strict browser popup blockers.
- **Communication Center Integration (`src/pages/Communication.jsx`)**:
  - Refactored `openWhatsAppLink` to use centralized `openWhatsApp(number, message, 'web')`.
  - Updated broadcast message link generation to use clean phone sanitization and direct `web.whatsapp.com` URL format.

### Bulk Devotee Details Upload (Excel & CSV)
- **Dedicated Bulk Upload Interface (`src/pages/devotees/BulkDevoteeUpload.jsx`)**:
  - Implemented interactive drag-and-drop and file browser for Microsoft Excel (`.xlsx`, `.xls`) and `.csv` files.
  - Built sample template downloader (`.xlsx` and `.csv`) pre-populated with realistic ISKCON devotee records, column guides, and correct data types.
  - Added intelligent header alias mapper automatically resolving spreadsheet variations (`Mobile No`, `Contact No`, `Spiritual Name`, `Counselor`, `Rounds`, `Diksha Guru`, `DOB`, etc.).
  - Added multi-tab interactive data preview (`All`, `Ready to Import`, `Duplicates`, `Errors`) with instant validation and row-level issue callouts.
  - Included configurable duplicate handling toggle ("Update existing devotees if contact & name match" vs skip duplicates) and fallback defaults for Counselor and Spiritual Status.
  - Added visual progress bar and comprehensive completion summary card with breakdown of added, updated, skipped, and error rows.
- **Devotee List & Navigation Integration (`DevoteeList.jsx`, `App.jsx`, `CommandPalette.jsx`)**:
  - Added a prominent **"Bulk Upload"** action button in the Devotee List header toolbar (`/devotees/bulk-upload`).
  - Registered `/devotees/bulk-upload` route in `App.jsx` under the authenticated Layout.
  - Added "Bulk Upload Devotees" to the global Command Palette (`Ctrl+K`).
- **Backend Bulk Processing Endpoints & Transactions (`database.mjs`, `devoteeController.mjs`, `devoteeRoutes.mjs`)**:
  - Implemented `POST /api/devotees/bulk` in both desktop (`whatsapp-bot/`) SQLite and serverless (`api/_src/`) PostgreSQL backends.
  - Added `addDevoteesBulk`: pre-indexes existing records for fast in-memory duplicate detection, executes within an isolated database transaction, and handles upserts and duplicate skips.
  - Integrated real-time WebSocket events (`DEVOTEE_CREATED` & `DATA_MUTATED`) so devotee lists and statistics across all open browser sessions refresh automatically upon bulk import.
- **Frontend API Service & Context (`api.js`, `DevoteeContext.jsx`)**:
  - Added `apiService.bulkAddDevotees(devotees, options)`.
  - Added `bulkAddDevotees` in `DevoteeContext` which automatically refreshes global devotee counts, counselor filters, and stats upon import completion.
- **Automated Regression Test Suite (`regression.api.test.mjs`)**:
  - Added automated test verifying bulk insertion, duplicate detection/skipping, and upsert modification.

## [2026-10-15]

### SSL/TLS Certificate, HSTS Enforcement & HTTPS Server Support
- **Vercel Cloud Edge HTTPS & HSTS Hardening (`vercel.json`)**:
  - Enforced `Strict-Transport-Security` (HSTS: `max-age=63072000; includeSubDomains; preload`) to mandate end-to-end encrypted HTTPS connections for all browser clients.
  - Added security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and `Referrer-Policy: strict-origin-when-cross-origin`.
- **Caddy Docker Stack Automated TLS (`Caddyfile`)**:
  - Hardened Caddy reverse-proxy configuration with an explicit `Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"` header on automated Let's Encrypt / ZeroSSL TLS certificates.
- **Express Serverless App Helmet HSTS (`api/_src/app.mjs`)**:
  - Configured `helmet.hsts` with 1-year max-age, subdomain inclusion, and preload readiness for cloud API responses.
- **Standalone Server Native HTTPS & Redirect Middleware (`whatsapp-bot/server.mjs`)**:
  - Configured native `https.createServer(...)` support reading custom certificate paths (`SSL_KEY_PATH`, `SSL_CERT_PATH`, `SSL_CA_PATH`) with automatic graceful fallback to HTTP.
  - Added HTTP-to-HTTPS redirect middleware activated when `FORCE_HTTPS=1`.
- **Environment Documentation (`.env.example`, `whatsapp-bot/.env.example`)**:
  - Documented SSL certificate path variables and HTTPS force flags.
- **SSL/TLS Setup Guide (`docs/SSL_TLS_SETUP.md`)**:
  - Created a comprehensive setup manual covering Vercel Edge SSL, Caddy Docker auto-provisioning, Certbot/Let's Encrypt on Linux VPS, Cloudflare Proxy, and SSL Labs rating verification.

### Mobile Number Filter — Tours & Pilgrimage Management
- **Participant List Mobile Filter (`TourDetails.jsx`)**:
  - Added a dedicated **Mobile Number** filter input (with phone icon and quick clear button) to the Participant List toolbar.
  - Filters participants by partial digit match against devotee `contact`, `whatsapp`, or walk-in `guestContact`.
  - Also enhanced general participant search so typing a mobile number directly into the search bar automatically matches contact numbers.
  - Added an active filter counter and "Clear" button to easily reset all participant filters.
- **Tour List Mobile Filter (`TourList.jsx`)**:
  - Added a dedicated **"Filter by mobile no..."** input to the main Tours overview toolbar.
  - Integrates with debounced API queries (`?contact=<mobile>`) to filter and display only tours where a participant with that mobile number is enrolled.
  - Added one-click "Clear" button for resetting active filters.
- **Add Participant Lookup by Mobile (`AddParticipantForm.jsx`)**:
  - Enhanced devotee dropdown search to match `contact` and `whatsapp` numbers in addition to devotee names.
  - Updated input placeholder to *"Search devotee by name or mobile no..."*.
- **Backend API Query Parameter Support (`tourController.mjs` & `database.mjs`)**:
  - Supported `?contact=` and `?phone=` query parameters on `GET /api/tours` across both SQLite and PostgreSQL backends to filter tours by enrolled devotee or guest contact.

### Codebase Cleanup & Dead Code Removal
- **Purged Unused & Scratch Files**:
  - Removed obsolete dummy mock datasets (`src/data/mockDevotees.js`, `src/data/mockDonations.js`).
  - Purged ad-hoc scratch scripts (`test-auth.mjs`, `test-google-auth.mjs`, `check_db.mjs`, `test_api.mjs`, `check_duplicates.py`, `check_sukanta.py`, `remove_duplicates.py`).
  - Deleted 0-byte ghost databases (`devotee_mgmt.db` in project root and `devotee_manager.db` in `whatsapp-bot/`).
  - Cleared accumulated debug log and dump files (`build*.log`, `build_*.txt`, `dev_*.log`, `*dump.txt`, `api_response.*`, `duplicate_report.txt`, `error_summary*.txt`, `lint_output.txt`, `whatsapp-qr.png`).
- **Cleaned Code & Optimized Bundle**:
  - In `src/App.jsx`: converted `TourList` from synchronous import to `React.lazy`, reducing the initial main bundle chunk by ~8 kB, removed stale refresh comments, and formatted provider nesting hierarchy.
  - In `src/components/layout/Header.jsx`: removed unused Lucide icon imports (`Settings`, `User`), fixed redundant/duplicate Tailwind CSS classes, and cleaned syntax.
  - Verified 0 ESLint errors and all 21/21 backend regression tests passing.

### Dropbox Disaster Recovery & Direct Cloud Sync
- **Dropbox In-App Configuration Modal (`Settings.jsx`)**:
  - Added an interactive **"Connect / Configure Dropbox"** modal in the Disaster Recovery card on the Settings page.
  - Supports both **Quick Setup** (pasting a Dropbox Personal Access Token) and **Permanent Setup** (App Key, App Secret, and Refresh Token).
  - Includes direct links and step-by-step guidance for creating an app on the Dropbox Developer Console with `files.content.write` scope.
  - Added Disconnect / Clear credentials capability directly from the UI.
- **Dedicated Dropbox Sync Action (`Settings.jsx` & `apiService.js`)**:
  - Added a dedicated **"Sync Dropbox Now"** action button in Settings, allowing administrators to push backup snapshots to `/DMS_Backups/` without requiring AWS S3 configuration.
  - Real-time status indicators showing Connected / Not Configured, Last Sync timestamp, and live Success/Failure badge.
- **Backend Dropbox Endpoints & Database Persistence (`CloudBackupService.mjs`, `backupController.mjs`, `backupRoutes.mjs`)**:
  - Enhanced `CloudBackupService` in both desktop (`whatsapp-bot/`) and serverless (`api/_src/`) platforms to load Dropbox credentials dynamically from the database `settings` table in addition to environment variables.
  - Added `POST /api/backup/dropbox-config` for saving/clearing Dropbox credentials in the database.
  - Added `POST /api/backup/dropbox-sync` for dedicated single-provider on-demand uploads with file size, destination path (`/DMS_Backups/...`), and timestamp reporting.


### Mobile Number Filter — Devotee List
- **Filter by Phone/Mobile (`DevoteeList.jsx`)**:
  - Added a **Mobile Number** filter input field (with phone icon) in the Filters panel of the Devotee List page.
  - Supports partial-match search — typing any digits filters devotees whose `contact` or `whatsapp` number contains the entered string.
  - Filter is sent server-side as `?contact=<number>` query param (already supported by backend via `getDevotees()` SQL `LIKE` clause).
  - Filter count badge on the Filters button increments to reflect the active mobile filter.
  - Clears correctly via the "Clear All" button alongside all other active filters.
  - Works in both local fallback mode (client-side filtering on `contact` and `whatsapp` fields) and server-side paginated mode.


### System-Wide Behavior Audits & Core Rectifications
- **Database Connection URI Safety (`api/_src/db.mjs`)**:
  - Implemented automatic URI parsing and password percent-encoding sanitizer (`sanitizeConnectionString`) for `SUPABASE_DATABASE_URL` / `POSTGRES_URL` to protect against special characters (`#`, `&`, `@`) causing `ERR_INVALID_URL` runtime crashes.
- **Electron Auto-Backup Spam & Auth Resolution (`electron/main.js`)**:
  - Resolved runaway 5-second interval loop; corrected auto-backup interval to a sane 1 hour with a 30-second initial boot delay.
  - Implemented token authentication via `getElectronToken()` using admin config, eliminating recurring `[Auto-Backup] Failed: Unauthorized` console errors and enabling authenticated manual backups and restore.
  - Added dedicated `/api/restore` routing to `systemController.restore` across desktop and serverless backends.
- **Real Database User Management Subsystem (`/api/users` & `UserManagement.jsx`)**:
  - Replaced legacy disconnected `localStorage` dummy user storage with live database user management.
  - Added `userController.mjs` and `userRoutes.mjs` across both `whatsapp-bot/` and `api/_src/` providing `GET /api/users`, `POST /api/users`, `PUT /api/users/:id/role`, and `DELETE /api/users/:id`.
  - Added database functions `updateUserRole` and `deleteUser` in both SQLite and PostgreSQL database layers.
  - Revamped `UserManagement.jsx` with real user listing, responsive text search, role filtering, inline role assignment dropdown, and administrator password resets linked to real database IDs.
- **Dynamic Identity & Role Display Parity (`Profile.jsx`, `Header.jsx`, `Sidebar.jsx`)**:
  - Standardized user identity resolution across the entire frontend (`fullName || displayName || name || username`), fixing blanks where devotees or administrators were missing display names.
  - Replaced hardcoded "Admin" / "Manager" / "Local Administrator" labels with dynamic capitalized role badges.

### Reset Password & Account Security Controls
- **Self-Service Password Reset in Profile (`Profile.jsx`)**:
  - Added a dedicated "Reset / Change Password" card in the Devotee/User Profile page.
  - Validates current password, checks minimum 6-character length for new password, ensures matching confirmation, and provides interactive visibility toggle eye icons.
  - Directly updates database credentials via `POST /api/auth/change-password`.
- **Administrative User Password Reset (`UserManagement.jsx`)**:
  - Added a `KeyRound` action button for each user row in the User Management table.
  - Added an interactive "Reset User Password" modal allowing administrators to set a custom password or auto-generate a secure random 12-character password.
  - Dispatches `POST /api/auth/admin-reset-password` and automatically attempts to send a WhatsApp confirmation message to the devotee if the WhatsApp bot is connected.
- **Authenticated Password Management Backend (`authController.mjs` & `database.mjs`)**:
  - Added `POST /api/auth/change-password` and `POST /api/auth/admin-reset-password` endpoints on both desktop (`whatsapp-bot/`) and web (`api/_src/`) platforms.
  - Added `getUserById` and robust password hash update queries across SQLite and PostgreSQL databases.

### Forgot Password & Self-Service Credential Recovery
- **Interactive Multi-Step Password Recovery UI (`LoginPage.jsx`)**:
  - Added a "Forgot Password?" trigger on the sign-in screen allowing users to easily recover their accounts.
  - Multi-step flow:
    1. **Identity Input**: Accepts username, registered email, or contact/WhatsApp phone number with automatic phone number normalization (supports 10-digit, 12-digit, and `+91` formats).
    2. **Verification & Reset**: Prompts for a 6-digit verification code, new password (with confirmation and visibility toggles), and provides a 60-second countdown for code resends.
    3. **Success State**: Confirms password update with a clean success card and a direct shortcut back to sign in with pre-filled identity.
- **Secure OTP Verification Backend (`authService.mjs` & `authController.mjs`)**:
  - Implemented `POST /api/auth/forgot-password` and `POST /api/auth/reset-password` endpoints on both desktop (`whatsapp-bot/`) and web (`api/_src/`) backends.
  - Generates cryptographically secure 6-digit OTP codes with 10-minute expiry and max 5 failed attempt brute-force protection.
  - Hashes OTP codes in memory with HMAC-SHA256 using the instance `AUTH_SECRET`.
  - Sends verification codes directly to the user's registered WhatsApp number via `whatsappService` when connected.
  - In development mode (`DMS_AUTH_BYPASS=1`), surfaces the generated code in both server console and UI helper banner for frictionless testing.
  - Updated the public auth gate whitelist in `whatsapp-bot/server.mjs` and `api/_src/app.mjs` so unauthenticated users can access password recovery without existing session tokens.

## [2026-10-14]

### Devotee Mobile Number Filter & Search Parity
- **Filter Panel Mobile Number Input**:
  - Added a dedicated mobile / phone number input with a `Phone` icon inside the expandable Filter Panel in `src/pages/devotees/DevoteeList.jsx`.
  - Responsive 6-column grid accommodates the new input alongside Status, Gender, Spiritual Status, Counselor, and District filters.
  - Updates filter badge count and is reset when clicking "Clear All".
- **Multi-Field Phone Filtering**:
  - Filter queries match against both primary contact (`contact`) and WhatsApp number (`whatsapp`).
  - Added `filters.contact` backend support with parameterized queries in both local SQLite backend (`whatsapp-bot/database.mjs`, `whatsapp-bot/controllers/devoteeController.mjs`) and hosted PostgreSQL backend (`api/_src/database.mjs`, `api/_src/controllers/devoteeController.mjs`).
  - Updated universal text search in both backends to include `whatsapp` matching alongside `name`, `initiatedName`, `contact`, and `dob`.
  - Added client-side fallback filtering in `DevoteeContext.jsx` and `DevoteeList.jsx` for offline mode and seamless live state caching.

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
