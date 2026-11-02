import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, ArrowLeft, CheckCircle2, Layers, Sparkles, Heart, Shield, Database, Cloud, Radio } from 'lucide-react';

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Info className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              About Devotee Management System
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Comprehensive platform for ISKCON devotee community, services, and administrative care
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-muted hover:bg-muted/80 text-foreground transition-all border border-border hover:shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      {/* Hero Card */}
      <div className="rounded-2xl bg-gradient-to-br from-card to-muted/40 border border-border p-6 sm:p-8 relative overflow-hidden shadow-sm">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Version 0.0.7 • Production Ready</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            Dedicated to Serving Devotees with Digital Excellence
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Designed to seamlessly organize devotee records, spiritual progress (Sadhana), services (Seva),
            course enrollments, spiritual tours (Yatras), and temple accounts while prioritizing eye comfort,
            data security, and real-time synchronization.
          </p>
        </div>
      </div>

      {/* 3 Column Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Core Features */}
        <div className="bg-card text-card-foreground rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-4 text-foreground font-semibold text-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>Core Features</span>
            </div>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Full devotee profiling, initiation details & family links</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Yatra (tour) & Bhakti Vriksha / Course management</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Seva scheduling, attendance logs & ID card generation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Role-based access: Admin, Counselor, and Viewer devotee</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Eye-protective dark theme with contrast tuning</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Realtime & Tech Stack */}
        <div className="bg-card text-card-foreground rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-4 text-foreground font-semibold text-lg">
              <Layers className="w-5 h-5 text-cyan-500" />
              <span>Technology Architecture</span>
            </div>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Radio className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span><strong>Real-time:</strong> Live WebSocket synchronization engine</span>
              </li>
              <li className="flex items-start gap-2">
                <Database className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span><strong>Data Store:</strong> SQLite local & Hosted PostgreSQL serverless</span>
              </li>
              <li className="flex items-start gap-2">
                <Cloud className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span><strong>Disaster Recovery:</strong> AWS S3 & Dropbox auto-backup</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span><strong>Security:</strong> Parameterized queries, RBAC, input sanitization</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Release History */}
        <div className="bg-card text-card-foreground rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-4 text-foreground font-semibold text-lg">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Changelog Highlights</span>
            </div>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li className="text-xs">
                <span className="font-semibold text-foreground">v0.0.7:</span> Dedicated About Hub, Command Palette quick jump & Eye-Comfort dark layout.
              </li>
              <li className="text-xs">
                <span className="font-semibold text-foreground">v0.0.6:</span> Read-only Devotee Viewer mode & secure self-profile restriction.
              </li>
              <li className="text-xs">
                <span className="font-semibold text-foreground">v0.0.5:</span> Real-time live status indicator in Header & instant multi-tab sync.
              </li>
              <li className="text-xs">
                <span className="font-semibold text-foreground">v0.0.4:</span> Dropbox disaster recovery, auto-sync scheduling & gzip snapshots.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Devotional Footer Card */}
      <div className="rounded-2xl border border-border bg-card p-6 text-center space-y-2 shadow-sm">
        <div className="flex items-center justify-center gap-2 text-rose-500">
          <Heart className="w-5 h-5 fill-rose-500" />
          <span className="font-semibold text-sm">Hare Krishna • Dedicated in Service</span>
        </div>
        <p className="text-xs text-muted-foreground max-w-xl mx-auto">
          &ldquo;Whatever you do, whatever you eat, whatever you offer or give away, and whatever austerities you perform—do that, O son of Kunti, as an offering to Me.&rdquo; — Bhagavad Gita 9.27
        </p>
      </div>
    </div>
  );
};

export default About;
