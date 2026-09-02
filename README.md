# Devotee Management Web Application

A pixel-perfect, responsive web application for **Devotee Management — Course Management**, built with React, TypeScript, Vite, Tailwind CSS, and Lucide icons.

---

## Features

- **Sidebar Navigation**: Complete menu matching the design (Dashboard, Devotees, Counseling, Attendance, Seva Board, Finance, Network, Live Map, Reports, Communication, Events, Courses, Tours, Users & Roles, Settings, Maintenance) with mobile drawer responsiveness.
- **Top Bar**: Breadcrumb trail (`App > Courses`), live global search, status indicator, dark/light theme switch, notifications bell, and user avatar.
- **KPI Metrics**: 4 dynamic metric summary cards (Total Courses, Upcoming, Ongoing, Completed). Clicking on cards filters the courses list.
- **Course Status Filter**: Toggle between `Upcoming & Ongoing` and `Completed` tabs.
- **Real-Time Search**: Search courses by title, instructor name, or description.
- **Create New Course Modal**: Interactive form allowing you to add new courses with title, instructor, date range, fees, status, and description. Counters and grid update automatically.
- **View Details & Participants Modal**: View course information and enrolled devotees, with ability to enroll new participants.

---

## Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Build for Production**:
   ```bash
   npm run build
   ```

---

## How to Deploy to Vercel via GitHub

### Step 1: Initialize Git and Commit Changes
Open your terminal in this directory and run:
```bash
git init
git add .
git commit -m "feat: initial Devotee Management website"
```

### Step 2: Create a New GitHub Repository
1. Go to [github.com/new](https://github.com/new).
2. Choose a repository name (e.g., `devotee-management-web`).
3. Set visibility to **Public** or **Private**.
4. Leave "Initialize this repository with a README" unchecked.
5. Click **Create repository**.

### Step 3: Push Your Code to GitHub
Copy the commands provided by GitHub (or run the following):
```bash
git branch -M main
git remote add origin https://github.com/<YOUR-GITHUB-USERNAME>/devotee-management-web.git
git push -u origin main
```

### Step 4: Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) and log in (sign in with your GitHub account).
2. Click **Add New...** > **Project**.
3. Under **Import Git Repository**, select your `devotee-management-web` repository and click **Import**.
4. Vercel will automatically detect:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Deploy**.
6. In ~30 seconds, your site will be live on a `*.vercel.app` URL with free SSL, CDN, and automatic continuous deployment every time you push to GitHub!

