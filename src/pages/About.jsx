import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Info, ArrowLeft, CheckCircle2, Layers, Sparkles, Heart, Shield,
  Database, Cloud, Radio, Calendar, Search, Tag, Bug, Wrench,
  Palette, UserCheck, Flame, ChevronRight, Filter
} from 'lucide-react';

const SYSTEM_UPDATES = [
  {
    version: 'v1.2.0',
    date: '2026-11-02',
    dateFormatted: '০২ নভেম্বর, ২০২৬ (2 November 2026)',
    isLatest: true,
    titleBn: 'About পেজ সরাসরি অ্যাক্সেস, বিস্তারিত আপডেট হিস্ট্রি ও ক্লাউড ব্যাকআপ ডিডুপ্লিকেশন',
    titleEn: 'About Page Direct Access, System Changelog Timeline & Cloud Backup Deduplication',
    type: 'feature',
    tags: ['Features', 'Fixes', 'Reliability'],
    highlights: [
      {
        badge: 'New Feature',
        color: 'emerald',
        textBn: 'About পেজ সরাসরি নেভিগেশনে যুক্ত: সাইডবার মেনু, টপ হেডার (ℹ️ আইকন) এবং Command Palette (Ctrl+K)-এ সরাসরি About অপশন যুক্ত করা হয়েছে।',
        textEn: 'Added direct About navigation across Left Sidebar, Top Header (ℹ️ icon), and Command Palette (Ctrl+K).'
      },
      {
        badge: 'New Feature',
        color: 'emerald',
        textBn: 'লাইভ আপডেট ও পরিবর্তন ইতিহাস (Changelog): কবে কোন নতুন ফিচার বা পরিবর্তন এসেছে তা সরাসরি About পেজে তারিখ ও ক্যাটাগরি অনুযায়ী দেখার সুবিধা।',
        textEn: 'Live Changelog & Update History: View all system modifications, additions, and enhancements sorted chronologically.'
      },
      {
        badge: 'Optimization',
        color: 'amber',
        textBn: 'ড্রপবক্স ব্যাকআপ ডিডুপ্লিকেশন ও শিডিউলিং ব্যাকঅফ: এক্সেস টোকেন এক্সপায়ার হলেও বারবার ডুপ্লিকেট এরর লগ জমা হওয়া বন্ধ এবং নিরাপদ বিরতিতে রিট্রাই মেকানিজম যুক্ত।',
        textEn: 'Cloud backup deduplication & backoff: Prevents redundant error log spamming in system_logs when access tokens expire.'
      },
      {
        badge: 'Bug Fix',
        color: 'blue',
        textBn: 'ব্ল্যাঙ্ক স্ক্রিন ক্র্যাশ সমাধান: About পেজের মিসিং লেজি ইমপোর্ট ও রুট আর্কিটেকচার পুরোপুরি সুরক্ষিত করা হয়েছে।',
        textEn: 'Crash Prevention: Fixed lazy import in App.jsx to prevent ReferenceError during route initialization.'
      },
      {
        badge: 'Performance',
        color: 'cyan',
        textBn: 'Vite ওয়াচার অপ্টিমাইজেশন: ব্যাকগ্রাউন্ড বট ফাইল ও ডেটাবেস পরিবর্তনের কারণে অযাচিত পেজ রিলোড বন্ধ করা হয়েছে।',
        textEn: 'Vite Watcher Optimization: Ignored background whatsapp-bot and SQLite files from triggering unnecessary hot-reloads.'
      }
    ]
  },
  {
    version: 'v1.1.5',
    date: '2026-11-01',
    dateFormatted: '০১ নভেম্বর, ২০২৬ (1 November 2026)',
    titleBn: 'সিকিউরিটি ভার্নারেবিলিটি প্যাচ, নিরাপদ ডেটা ব্যাকআপ ও ইলেকট্রন অফলাইন সেটআপ',
    titleEn: 'Security Vulnerability Patches, Safe Backup Rollback & Electron NSIS Setup',
    type: 'security',
    tags: ['Security', 'Backup', 'Desktop'],
    highlights: [
      {
        badge: 'Security',
        color: 'rose',
        textBn: 'ডিপেন্ডেন্সি সিকিউরিটি আপডেট: body-parser 2.4.0, zod 4.6.7, এবং @grpc/grpc-js 1.14.5 আপডেট করে গুরুত্বপূর্ণ CVE ঝুঁকি দূর করা হয়েছে।',
        textEn: 'Patched critical CVE vulnerabilities across body-parser (GHSA-27r3), zod (GHSA-mrhx), and grpc-js (4 CVEs resolved).'
      },
      {
        badge: 'Data Safety',
        color: 'emerald',
        textBn: 'ডেটা-সেফ ব্যাকআপ ও রেস্টোর ভ্যালিডেশন: অসম্পূর্ণ বা খালি ব্যাকআপ ফাইল দিয়ে ডেটা মুছে যাওয়া প্রতিরোধে ট্রানজ্যাকশন রোলব্যাক ও স্কিমা ভ্যালিডেশন যুক্ত।',
        textEn: 'Zero-data-loss restore safeguard: Validates JSON structure before executing restore; rolls back transaction on empty payloads.'
      },
      {
        badge: 'Desktop App',
        color: 'cyan',
        textBn: 'উইন্ডোজ অফলাইন ইনস্টলার: Electron 39.2.7 এবং electron-builder সহ Windows 32-bit একক সেটআপ ইনস্টলার (Setup 0.0.0.exe) প্রস্তুত।',
        textEn: 'Generated standalone Windows 32-bit NSIS setup installer with automated offline database synchronization.'
      },
      {
        badge: 'Real-Time',
        color: 'emerald',
        textBn: 'লাইভ সংযোগ নির্দেশক: হেডারে পালসিং গ্রিন/রেড ডট এবং "Live" নির্দেশকের মাধ্যমে রিয়েল-টাইম WebSocket কানেকশন স্ট্যাটাস প্রদর্শন।',
        textEn: 'Live WebSocket connection indicator in Top Header using real-time isLiveConnected state.'
      }
    ]
  },
  {
    version: 'v1.1.0',
    date: '2026-10-28',
    dateFormatted: '২৮ অক্টোবর, ২০২৬ (28 October 2026)',
    titleBn: 'ভারী লাইভ ম্যাপ অপসারণ ও অ্যাপের গতি বৃদ্ধি',
    titleEn: 'Live Map Decommissioning & Performance Optimization',
    type: 'improvement',
    tags: ['Performance', 'Clean-up'],
    highlights: [
      {
        badge: 'Performance',
        color: 'cyan',
        textBn: 'অ্যাপের লোডিং গতি বৃদ্ধি: মোবাইল ও কম গতির ডিভাইসে অ্যাপ দ্রুত চালু করতে ভারী লাইভ ম্যাপ অপশন ও রাউট সম্পূর্ণ অপসারণ করা হয়েছে।',
        textEn: 'Removed heavy Leaflet Map components and dependencies, significantly reducing initial bundle size and memory usage.'
      },
      {
        badge: 'Clean Navigation',
        color: 'blue',
        textBn: 'সাইডবার ও মেনু পরিচ্ছন্নকরণ: শুধুমাত্র প্রয়োজনীয় প্রশাসনিক ও সেবা সংক্রান্ত অপশনগুলোকে অগ্রাধিকার দিয়ে ইউজার ইন্টারফেস সহজ করা হয়েছে।',
        textEn: 'Streamlined sidebar navigation for focused spiritual management workflows.'
      }
    ]
  },
  {
    version: 'v1.0.5',
    date: '2026-10-26',
    dateFormatted: '২৬ অক্টোবর, ২০২৬ (26 October 2026)',
    titleBn: 'সাধারণ ভক্তদের জন্য শুধুমাত্র নিজস্ব প্রোফাইল ভিউ (Read-Only) ও রোল-ভিত্তিক অ্যাক্সেস কন্ট্রোল (RBAC)',
    titleEn: 'Strict Read-Only Personal Profile for Devotees & RBAC Hardening',
    type: 'security',
    tags: ['Security', 'RBAC', 'Devotee Care'],
    highlights: [
      {
        badge: 'Privacy & Security',
        color: 'rose',
        textBn: 'ভক্তদের নিজস্ব প্রোফাইল সুরক্ষা: সাধারণ ভক্ত ইউজাররা শুধুমাত্র তাদের নিজস্ব প্রোফাইল ("আমার প্রোফাইল") দেখতে পারবেন; অন্যের তথ্য দেখা ও এডিটিং সম্পূর্ণ বন্ধ।',
        textEn: 'Strict personal profile boundary: Devotee accounts (viewer) are restricted exclusively to their own profile.'
      },
      {
        badge: 'RBAC',
        color: 'amber',
        textBn: 'কঠোর রাউট গার্ডস: অ্যাডমিন ও কাউন্সেলর ছাড়া ড্যাশবোর্ড, উপস্থিতি, অর্থ বা অন্যান্য সংরক্ষিত পেজে সরাসরি ব্রাউজিং অ্যাক্সেস ব্লক।',
        textEn: 'Enforced RequireAdmin and RequireCounselorOrAdmin guards preventing unauthorized URL navigation.'
      },
      {
        badge: 'Bug Fix',
        color: 'blue',
        textBn: 'কোর্স মডিউল ক্র্যাশ ফিক্স (useMemo): কোর্স ভিউ ও শিডিউলার পেজে useMemo সহ আনডিফাইন্ড ভ্যারিয়েবলের ক্র্যাশ সমাধান।',
        textEn: 'Resolved useMemo ReferenceError in CourseDetails and added defensive handling for null student profiles.'
      }
    ]
  },
  {
    version: 'v1.0.0',
    date: '2026-10-20',
    dateFormatted: '২০ অক্টোবর, ২০২৬ (20 October 2026)',
    titleBn: 'আই-কমফোর্ট ডার্ক থিম (#213738) ও ডায়নামিক ট্যুর/কোর্স এক্সপেন্সেস',
    titleEn: 'Eye-Comfort Dark Spruce Theme (#213738) & Dynamic Tour/Course Expenses',
    type: 'feature',
    tags: ['Theme', 'Finance', 'Tours'],
    highlights: [
      {
        badge: 'Eye Comfort',
        color: 'emerald',
        textBn: 'চোখের সুরক্ষায় ডার্ক স্প্রুস থিম (#213738): সাদা উগ্র আলোর ঝলকানি দূর করে শান্ত পাইন-স্প্রুস ব্যাকগ্রাউন্ড ও সেইজ মিস্ট কালার আর্কিটেকচার প্রয়োগ।',
        textEn: 'Universal anti-glare #213738 pine-spruce background with soothing sage mist typography (WCAG AAA contrast).'
      },
      {
        badge: 'Finance',
        color: 'amber',
        textBn: 'ডায়নামিক খরচ ক্যাটাগরি: পুরনো ফিক্সড ক্যাটাগরির বদলে রেজিস্টার্ড ট্যুর ও কোর্স থেকে স্বয়ংক্রিয়ভাবে খরচের পারপাস লোড হওয়ার ব্যবস্থা।',
        textEn: 'Eliminated hardcoded expense categories; expenses now dynamically ingest registered Tours and Courses.'
      },
      {
        badge: 'Tour Management',
        color: 'cyan',
        textBn: 'ট্যুর যাত্রী জন্মতারিখ (DOB) ও দলনেতা (Leader) কলাম: ট্যুর বুকিংয়ে ভক্তদের জন্মতারিখ ও গাইড/কাউন্সেলর লিডার নির্ধারণের পূর্ণাঙ্গ ফিচার।',
        textEn: 'Integrated Date of Birth (DOB) and Group Leader assignment columns into Tour participant management.'
      }
    ]
  },
  {
    version: 'v0.9.0',
    date: '2026-10-17',
    dateFormatted: '১৭ অক্টোবর, ২০২৬ (17 October 2026)',
    titleBn: 'বৈষ্ণব ক্যালেন্ডার, একাদশী উপবাস ও পারণ সময় গণনা এবং স্বয়ংক্রিয় রিমাইন্ডার',
    titleEn: 'Vaishnava Calendar Integration & Ekadashi WhatsApp Broadcast Engine',
    type: 'feature',
    tags: ['Calendar', 'Vedic', 'WhatsApp'],
    highlights: [
      {
        badge: 'Calendar',
        color: 'amber',
        textBn: 'বৈষ্ণব পঞ্জিকা ও তিথি: শ্রী শ্রী রাধাগোবিন্দ মন্দিরের স্থানীয় সময় অনুযায়ী একাদশী, পারণ সময় ও বৈষ্ণব উৎসবের সঠিক হিসাব।',
        textEn: 'Full Vaishnava calendar with localized Ekadashi fasting and Parana timings calculation.'
      },
      {
        badge: 'WhatsApp Bot',
        color: 'emerald',
        textBn: 'একাদশী নোটিফিকেশন ইঞ্জিন: একাদশীর পূর্বাহ্ণে সকল ভক্তদের হোয়াটসঅ্যাপে শুভেচ্ছা ও পারণ নির্দেশিকা প্রেরণের ব্যবস্থা।',
        textEn: 'One-click automated WhatsApp Ekadashi reminder dispatch with customizable devotional templates.'
      }
    ]
  },
  {
    version: 'v0.8.0',
    date: '2026-10-15',
    dateFormatted: '১৫ অক্টোবর, ২০২৬ (15 October 2026)',
    titleBn: 'স্মার্ট ভক্ত অনুসন্ধান, ফোন নম্বর ফরম্যাটিং ও ক্যানসেল-রিফান্ড সিস্টেম',
    titleEn: 'Smart Multi-Token Search, Phone Normalization & Cancellation/Refund Ledger',
    type: 'feature',
    tags: ['Search', 'Tours', 'Courses'],
    highlights: [
      {
        badge: 'Search Engine',
        color: 'cyan',
        textBn: 'স্মার্ট নাম সার্চ: নামের আংশিক অক্ষর, দীক্ষানাম, পদবী বা এলোমেলো শব্দ লিখলেও নির্ভুল ভক্ত আইডি ও রেকর্ড খুঁজে পাওয়ার অ্যালগরিদম।',
        textEn: 'Multi-token prefix and substring search prioritizing initiates, counselors, and phonetic variations.'
      },
      {
        badge: 'Refunds',
        color: 'rose',
        textBn: 'ট্যুর ও কোর্স ক্যান্সেলেশন লেজার: অংশগ্রহণকারী বাতিল করলে আংশিক বা পূর্ণ রিফান্ড হিসাব এবং আর্থিক প্রতিবেদনে স্বয়ংক্রিয় সমন্বয়।',
        textEn: 'Integrated cancellation and partial/full refund ledger with automated transaction logging.'
      }
    ]
  }
];

const About = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('changelog'); // 'changelog' | 'overview'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');

  const filteredUpdates = useMemo(() => {
    return SYSTEM_UPDATES.filter(item => {
      const matchesTag = selectedTag === 'All' || item.tags.includes(selectedTag);
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesTag;

      const inVersion = item.version.toLowerCase().includes(query);
      const inDate = item.date.toLowerCase().includes(query) || item.dateFormatted.toLowerCase().includes(query);
      const inTitleBn = item.titleBn.toLowerCase().includes(query);
      const inTitleEn = item.titleEn.toLowerCase().includes(query);
      const inHighlights = item.highlights.some(h =>
        h.textBn.toLowerCase().includes(query) ||
        h.textEn.toLowerCase().includes(query) ||
        h.badge.toLowerCase().includes(query)
      );

      return matchesTag && (inVersion || inDate || inTitleBn || inTitleEn || inHighlights);
    });
  }, [searchQuery, selectedTag]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-fadeIn">
      {/* Top Header Bar */}
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
              সিস্টেম পরিচিতি, সর্বশেষ আপডেট ও পরিবর্তন বিবরণী (Changelog)
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

      {/* Hero Badge Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-card via-card to-muted/40 border border-border p-6 sm:p-7 relative overflow-hidden shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Version 1.2.0 • প্রোডাকশনে লাইভ (Active)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              ডিজিটাল সেবায় সার্বক্ষণিক নির্ভরযোগ্য বৈষ্ণব তথ্য ও সেবা প্ল্যাটফর্ম
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              ভক্তদের ডেটাবেস, সাধনা ট্র্যাকিং, সেবা বণ্টন, যাত্রা ও কোর্স ব্যবস্থাপনা এবং আর্থিক হিসাবের
              স্বচ্ছতা বজায় রেখে প্রতিটি আপডেটের পুঙ্খানুপুঙ্খ রেকর্ড নিচে লিপিবদ্ধ রয়েছে।
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2 bg-muted/60 p-1.5 rounded-2xl border border-border shrink-0">
            <button
              onClick={() => setActiveTab('changelog')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'changelog'
                  ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>আপডেট ইতিহাস (Changelog)</span>
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'overview'
                  ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>ফিচার ও আর্কিটেকচার</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CHANGELOG & UPDATES TIMELINE */}
      {/* ========================================================================= */}
      {activeTab === 'changelog' && (
        <div className="space-y-6">
          {/* Search & Tag Filter Bar */}
          <div className="bg-card text-card-foreground border border-border rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="আপডেট বা পরিবর্তন খুঁজুন (যেমন: backup, profile, map, calendar, useMemo)..."
                  className="w-full pl-10 pr-4 py-2 text-sm bg-muted/60 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>

              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-primary hover:underline self-end sm:self-center"
                >
                  ক্লিয়ার সার্চ
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap text-xs pt-1 border-t border-border/60">
              <div className="flex items-center gap-1.5 text-muted-foreground mr-1">
                <Filter className="w-3.5 h-3.5" />
                <span>ফিল্টার:</span>
              </div>
              {['All', 'Features', 'Security', 'Fixes', 'Theme', 'Performance', 'Backup'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    selectedTag === tag
                      ? 'bg-primary/20 text-primary font-semibold border border-primary/30'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border/60'
                  }`}
                >
                  {tag}
                </button>
              ))}
              <span className="text-muted-foreground ml-auto text-xs">
                মোট পাওয়া গেছে: <strong>{filteredUpdates.length}</strong> টি রিলিজ
              </span>
            </div>
          </div>

          {/* Timeline List */}
          <div className="space-y-6">
            {filteredUpdates.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-border p-6 text-muted-foreground">
                <p className="text-base font-semibold">কোনো আপডেট মেলেনি!</p>
                <p className="text-xs mt-1">অন্য কোনো কি-ওয়ার্ড দিয়ে সার্চ করুন অথবা ফিল্টার রিসেট করুন।</p>
              </div>
            ) : (
              filteredUpdates.map((release) => (
                <div
                  key={release.version}
                  className="bg-card text-card-foreground rounded-2xl border border-border p-6 sm:p-7 shadow-sm transition-all hover:border-primary/40 relative overflow-hidden"
                >
                  {/* Top Badge & Date Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/70">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="px-3 py-1 rounded-xl bg-primary/15 text-primary text-sm font-bold border border-primary/25">
                        {release.version}
                      </span>
                      {release.isLatest && (
                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-semibold animate-pulse">
                          সর্বশেষ আপডেট (Latest)
                        </span>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="font-medium text-foreground">{release.dateFormatted}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {release.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-xs font-medium border border-border/60"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Title & Overview */}
                  <div className="mt-4 mb-4">
                    <h3 className="text-lg font-bold text-foreground">
                      {release.titleBn}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                      {release.titleEn}
                    </p>
                  </div>

                  {/* Highlights Bullet Cards */}
                  <div className="space-y-2.5 mt-3">
                    {release.highlights.map((h, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-muted/40 border border-border/70 hover:bg-muted/70 transition-colors flex items-start gap-3"
                      >
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold shrink-0 mt-0.5 ${
                            h.color === 'emerald'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : h.color === 'amber'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : h.color === 'rose'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : h.color === 'blue'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          }`}
                        >
                          {h.badge}
                        </span>
                        <div className="text-xs leading-relaxed space-y-0.5">
                          <p className="text-foreground font-medium">{h.textBn}</p>
                          <p className="text-muted-foreground">{h.textEn}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SYSTEM OVERVIEW & ARCHITECTURE */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fadeIn">
          {/* 3 Column Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Core Features */}
            <div className="bg-card text-card-foreground rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-4 text-foreground font-semibold text-lg">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span>মূল মডিউলসমূহ (Core Modules)</span>
                </div>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span><strong>ভক্ত প্রোফাইল:</strong> দীক্ষা, পরিবার, বৈষ্ণব রক্তের গ্রুপ ও সেবা বিবরণী।</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span><strong>যাত্রা ও কোর্স:</strong> ট্রিপ বুকিং, কিস্তি পেমেন্ট ও সার্টিফিকেট ম্যানেজমেন্ট।</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span><strong>সেবা ও উপস্থিতি:</strong> কিউআর কোড স্ক্যানার ও রিয়েল-টাইম উপস্থিতি লগ।</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span><strong>বৈষ্ণব পঞ্জিকা:</strong> একাদশী ও পারণ সময় গণনা এবং নোটিফিকেশন।</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span><strong>হোয়াটসঅ্যাপ ইন্টিগ্রেশন:</strong> সরাসরি বার্তা ও একাদশী ব্রডকাস্ট।</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Realtime & Tech Stack */}
            <div className="bg-card text-card-foreground rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-4 text-foreground font-semibold text-lg">
                  <Layers className="w-5 h-5 text-cyan-500" />
                  <span>প্রযুক্তিগত কাঠামো (Architecture)</span>
                </div>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Radio className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span><strong>Frontend:</strong> React 19 + Vite 7 + Tailwind CSS (PWA)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Database className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span><strong>Database:</strong> SQLite (লোকাল) + Serverless PostgreSQL (ওয়েব)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Radio className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span><strong>Real-time:</strong> WebSocket সিঙ্ক্রোনাইজেশন ইঞ্জিন</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Cloud className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span><strong>ক্লাউড ব্যাকআপ:</strong> AWS S3 & Dropbox অটোমেটেড স্ন্যাপশট</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span><strong>নিরাপত্তা:</strong> RBAC, Parameterized Queries ও ইনপুট স্যানিটাইজেশন</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Design & Accessibility */}
            <div className="bg-card text-card-foreground rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-4 text-foreground font-semibold text-lg">
                  <Palette className="w-5 h-5 text-amber-500" />
                  <span>চোখের সুরক্ষা (Eye Comfort)</span>
                </div>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span><strong>স্প্রুস ক্যানভাস (#213738):</strong> রাত বা দীর্ঘক্ষণ ব্যবহারের জন্য বিশেষ ডার্ক থিম।</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span><strong>অ্যান্টি-গ্লেয়ার টেক্সট:</strong> চরম সাদা দূর করে নরম সেইজ মিস্ট কালার।</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span><strong>WCAG AAA কনট্রাস্ট:</strong> চোখের ওপর চাপ না ফেলে চমৎকার পাঠযোগ্যতা।</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span><strong>ওয়ান-ক্লিক টগল:</strong> হেডারের চশমা আইকন দিয়ে চোখের আরাম মোড সক্রিয়।</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Devotional Footer Card */}
      <div className="rounded-2xl border border-border bg-card p-6 text-center space-y-2 shadow-sm">
        <div className="flex items-center justify-center gap-2 text-rose-500">
          <Heart className="w-5 h-5 fill-rose-500" />
          <span className="font-semibold text-sm">হরে কৃষ্ণ • ভক্তদের সেবায় নিবেদিত</span>
        </div>
        <p className="text-xs text-muted-foreground max-w-xl mx-auto leading-relaxed">
          &ldquo;যৎ করোষি যদশ্নাসি যজ্জুহোষি দদাসি যৎ। যত্তপস্যসি কৌন্তেয় তৎ কুরুষ্ব মদর্পণম্॥&rdquo; — ভগবদ্গীতা ৯.২৭
        </p>
        <p className="text-[11px] text-muted-foreground/80 mt-2">
          শ্রী শ্রী রাধাগোবিন্দ মন্দির, ইস্কন দুর্গাপুর • সর্বস্বত্ব সংরক্ষিত © ২০২৬
        </p>
      </div>
    </div>
  );
};

export default About;
