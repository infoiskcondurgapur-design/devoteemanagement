import React from 'react';
import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            About Devotee Management System
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            A comprehensive management system for ISKCON devotee organizations.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              <span className="text-amber-500">✨</span> Key Features
            </h2>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300">
              <li>Devotee database management with full profile details</li>
              <li>Tour and course enrollment tracking</li>
              <li>Financial management with donation tracking</li>
              <li>WebSocket real-time updates across sessions</li>
              <li>Backup and restore with data validation</li>
              <li>WhatsApp integration for devotional communications</li>
              <li>Role-based access control (admin/counselor/viewer)</li>
              <li>Eye-protective dark theme with customization</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              <span className="text-amber-500">📦</span> Technology Stack
            </h2>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300">
              <li>Frontend: React 19 + Vite + Tailwind CSS</li>
              <li>State Management: React Context API</li>
              <li>Real-time: WebSocket (WSService)</li>
              <li>Backend: Node.js + Express + SQLite/PostgreSQL</li>
              <li>Database: SQLite (local) + PostgreSQL (Vercel serverless)</li>
              <li>Cloud Services: Cloudinary (media), Firebase (auth/analytics)</li>
              <li>Build: Vite + Electron (desktop) + Vercel (web)</li>
              <li>Styling: Custom CSS variables, eye-protective color palette</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              <span className="text-amber-500">📋</span> Updates
            </h2>
            <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300">
              <li>v0.0.1 — Initial release with devotee management, WhatsApp integration, and WebSocket real-time updates</li>
              <li>v0.0.2 — Added backup/restore with JSON schema validation and 30-day cleanup</li>
              <li>v0.0.3 — Enhanced NotificationContext with auto-removal, type support, and persistent options</li>
              <li>v0.0.4 — WS connection status indicator in Header using isLiveConnected state</li>
              <li>v0.0.5 — Security patches: body-parser 2.4.0, zod 4.6.7, grpc-js 1.14.5 (CVEs fixed)</li>
              <li>v0.0.6 — Data-safe fixes: restore JSON schema, cron-sync auth guard with CRON_SECRET</li>
              <li>v0.0.7 — About page added with features, tech stack, and platform information</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-300/20 dark:border-slate-700/20">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
            <span className="text-amber-500">🙏</span> Built with Devotion
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Developed with care for ISKCON communities to manage devotee records,
            events, courses, tours, and financial transactions. This system aims
            to simplify administrative tasks while keeping the focus on devotional
            service and community building.
          </p>
          <p className="text-slate-500 dark:text-slate-400 mt-4 small">
            Version 0.0.1 · Built with ❤️ for the devotee community
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;