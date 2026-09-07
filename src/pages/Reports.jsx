import React, { useMemo, useState } from 'react';
import { formatDate } from '../lib/dateUtils';
import { useDevotees } from '../context/DevoteeContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend
} from 'recharts';
import {
    Users, TrendingUp, Award, MapPin, Filter, Download, X, Calendar,
    BookOpen, GraduationCap, BrainCircuit, Activity, Star, AlertCircle,
    PieChart as PieIcon, Users as UsersIcon, BarChart3, Sparkles, Compass, CreditCard,
    DollarSign, Globe, Briefcase
} from 'lucide-react';
import clsx from 'clsx';
import * as XLSX from 'xlsx';

import apiService from '../services/api';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

const REPORTS_TABS = [
    { id: 'overview', label: 'Overview', icon: PieIcon },
    { id: 'demographics', label: 'Demographics', icon: UsersIcon },
    { id: 'courses', label: 'Courses & Reading', icon: BookOpen },
    { id: 'sadhana', label: 'Sadhana', icon: Activity },
    { id: 'tours', label: 'Tours & Yatra', icon: Compass }
];

const Reports = () => {
    const { devotees } = useDevotees();
    const [trendMonths, setTrendMonths] = useState(6);
    const [showFilter, setShowFilter] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [filterCounselor, setFilterCounselor] = useState('');
    const [filterDistrict, setFilterDistrict] = useState('');
    
    // Tours Data
    const [tours, setTours] = useState([]);
    const [, setToursLoading] = useState(false);

    // ✅ Apply optional filters to devotees
    const filteredDevotees = useMemo(() => {
        return devotees.filter(d => {
            if (filterCounselor && d.counselor !== filterCounselor) return false;
            if (filterDistrict && d.district !== filterDistrict) return false;
            return true;
        });
    }, [devotees, filterCounselor, filterDistrict]);

    const counselors = [...new Set(devotees.map(d => d.counselor).filter(Boolean))].sort();
    const districts = [...new Set(devotees.map(d => d.district).filter(Boolean))].sort();

    // Fetch tours only when tab changes or initially
    React.useEffect(() => {
        const fetchTours = async () => {
            setToursLoading(true);
            try {
                const res = await apiService.get('/api/tours');
                if (res.success) setTours(res.data);
            } catch (err) {
                console.error("Failed to fetch tours:", err);
            } finally {
                setToursLoading(false);
            }
        };
        fetchTours();
    }, []);

    // 1. Growth Data (configurable months)
    const growthData = useMemo(() => {
        const months = [];
        for (let i = trendMonths - 1; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthName = date.toLocaleString('default', { month: 'short' });
            const year = date.getFullYear();
            const monthIdx = date.getMonth();

            const count = filteredDevotees.filter(d => {
                const created = new Date(d.createdAt);
                return created.getMonth() === monthIdx && created.getFullYear() === year;
            }).length;

            months.push({ name: monthName, count });
        }
        return months;
    }, [filteredDevotees, trendMonths]);

    // 2. Spiritual Status Distribution
    const statusData = useMemo(() => {
        const counts = { Initiated: 0, Sheltered: 0, Aspiring: 0, Other: 0 };
        filteredDevotees.forEach(d => {
            const status = d.spiritualStatus || 'Aspiring';
            if (counts[status] !== undefined) counts[status]++;
            else counts.Other++;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [filteredDevotees]);

    // 3. District Distribution (Top 5)
    const districtData = useMemo(() => {
        const counts = {};
        filteredDevotees.forEach(d => {
            const district = d.district || 'Unknown';
            counts[district] = (counts[district] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [filteredDevotees]);

    // 4. Sadhana Analytics
    const sadhanaStats = useMemo(() => {
        const byCounselor = {};
        const topPerformers = [];
        const needsEncouragement = [];

        filteredDevotees.forEach(d => {
            const c = d.counselor || 'No Counselor';
            if (!byCounselor[c]) byCounselor[c] = { total: 0, count: 0 };
            const rounds = Number(d.rounds) || 0;
            byCounselor[c].total += rounds;
            byCounselor[c].count += 1;

            if (rounds >= 16) topPerformers.push(d);
            else if (rounds < 4) needsEncouragement.push(d);
        });

        const chartData = Object.entries(byCounselor).map(([name, data]) => ({
            name,
            avgRounds: Math.round((data.total / data.count) * 10) / 10
        })).sort((a, b) => b.avgRounds - a.avgRounds);

        return {
            chartData,
            topPerformers: topPerformers.slice(0, 6),
            needsEncouragement: needsEncouragement.slice(0, 6)
        };
    }, [filteredDevotees]);

    // 5. Demographics Analytics
    const demographicsData = useMemo(() => {
        const genderCounts = { Male: 0, Female: 0, Other: 0 };
        const maritalCounts = { Married: 0, Unmarried: 0, 'Separated/Divorced': 0, Widowed: 0 };
        const ageGroups = { '< 18': 0, '18-30': 0, '31-50': 0, '51+': 0, 'Unknown': 0 };

        filteredDevotees.forEach(d => {
            // Gender
            if (d.gender === 'Male' || d.gender === 'Female') genderCounts[d.gender]++;
            else genderCounts.Other++;

            // Marital
            if (Object.prototype.hasOwnProperty.call(maritalCounts, d.maritalStatus)) maritalCounts[d.maritalStatus]++;
            
            // Age
            let age = d.age;
            if (!age && d.dob) {
                const today = new Date();
                const birthDate = new Date(d.dob);
                age = today.getFullYear() - birthDate.getFullYear();
                const m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
            }
            if (age !== undefined && age !== null && age !== '') {
                const a = Number(age);
                if (a < 18) ageGroups['< 18']++;
                else if (a <= 30) ageGroups['18-30']++;
                else if (a <= 50) ageGroups['31-50']++;
                else ageGroups['51+']++;
            } else {
                ageGroups['Unknown']++;
            }
        });

        return {
            gender: Object.entries(genderCounts).filter(e => e[1] > 0).map(([name, value]) => ({ name, value })),
            marital: Object.entries(maritalCounts).filter(e => e[1] > 0).map(([name, value]) => ({ name, value })),
            age: Object.entries(ageGroups).map(([name, value]) => ({ name, value }))
        };
    }, [filteredDevotees]);

    // 6. Courses & Reading Analytics
    const readingData = useMemo(() => {
        const parseArrayStr = (str) => {
            if (!str) return [];
            try {
                const parsed = JSON.parse(str);
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return str.split(',').map(s => s.trim()).filter(Boolean);
            }
        };

        const booksCount = {};
        const coursesCount = {};
        const skillsCount = {};

        filteredDevotees.forEach(d => {
            parseArrayStr(d.booksRead).forEach(b => booksCount[b] = (booksCount[b] || 0) + 1);
            parseArrayStr(d.courses).forEach(c => coursesCount[c] = (coursesCount[c] || 0) + 1);
            
            // Skills might be comma separated or scalar
            if (d.skills) {
               d.skills.split(',').map(s => s.trim()).filter(Boolean).forEach(s => {
                   skillsCount[s] = (skillsCount[s] || 0) + 1;
               });
            }
        });

        const getTop = (obj, limit = 10) => Object.entries(obj)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, limit);

        return {
            books: getTop(booksCount),
            courses: getTop(coursesCount),
            skills: getTop(skillsCount)
        };
    }, [filteredDevotees]);

    // 7. Tour Analytics
    const tourAnalytics = useMemo(() => {
        if (!tours.length) return { overview: [], topTours: [], collections: [] };

        const totalRevenue = tours.reduce((sum, t) => sum + (t.fees * (t.enrollments?.length || 0)), 0);
        const totalCollected = tours.reduce((sum, t) => sum + (t.enrollments?.reduce((enSum, en) => enSum + (en.totalPaid || 0), 0) || 0), 0);
        
        const topTours = [...tours]
            .map(t => ({
                name: t.name,
                participants: t.enrollments?.length || 0,
                revenue: t.enrollments?.reduce((enSum, en) => enSum + (en.totalPaid || 0), 0) || 0
            }))
            .sort((a, b) => b.participants - a.participants)
            .slice(0, 5);

        const statusDistribution = {
            Upcoming: tours.filter(t => t.status === 'Upcoming').length,
            Ongoing: tours.filter(t => t.status === 'Ongoing').length,
            Completed: tours.filter(t => t.status === 'Completed').length
        };

        return {
            totalRevenue,
            totalCollected,
            topTours,
            statusDistribution: Object.entries(statusDistribution).map(([name, value]) => ({ name, value }))
        };
    }, [tours]);

    // 📊 Handle Export to Excel
    const handleExportExcel = () => {
        try {
            const exportData = filteredDevotees.map(d => ({
                'Name': d.name,
                'Initiated Name': d.initiatedName || 'N/A',
                'Spiritual Status': d.spiritualStatus,
                'Rounds': d.rounds || 0,
                'District': d.district,
                'Counselor': d.counselor || 'None',
                'Phone': d.phone,
                'WhatsApp': d.whatsapp,
                'Email': d.email,
                'Age': d.age,
                'Gender': d.gender,
                'Marital Status': d.maritalStatus,
                'Profession': d.profession,
                'Registration Date': formatDate(d.registrationDate)
            }));

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(exportData);
            
            // Add styling/headers could be done here if needed with sheetjs
            XLSX.utils.book_append_sheet(wb, ws, "Devotee List");
            
            // Generate Filename
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `Devotee_Report_${filterCounselor || 'Global'}_${timestamp}.xlsx`;
            
            XLSX.writeFile(wb, filename);
        } catch (error) {
            console.error("Export failed:", error);
            alert("Failed to export Excel file. Please try again.");
        }
    };

    const hasFilters = filterCounselor || filterDistrict;

    const COLORS = ['#f97316', '#ef4444', '#f59e0b', '#10b981', '#6366f1'];

    return (
        <div className="p-10 space-y-8 pb-20">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 relative">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                        Analytics Engine
                    </h1>
                    <div className="flex items-center gap-4 text-sm font-medium">
                        <p className="text-muted-foreground">Strategic community insights & growth metrics</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={handleExportExcel} 
                        className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 dark:bg-slate-900/50 transition-all shadow-sm active:scale-95"
                    >
                        <Download className="w-4 h-4" />
                        Export MS Excel
                    </button>
                    <button 
                        onClick={() => setShowFilter(v => !v)} 
                        className={clsx(
                            "flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-widest transition-all shadow-md active:scale-95",
                            showFilter || hasFilters ? "bg-corporate-600 text-white" : "bg-slate-800 text-white hover:bg-slate-900"
                        )}
                    >
                        <Filter className="w-4 h-4" />
                        Insights {hasFilters && "• Active"}
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-4 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 max-w-fit shadow-inner overflow-x-auto">
                {REPORTS_TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={clsx(
                            "px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-3 whitespace-nowrap",
                            activeTab === tab.id ? "bg-white dark:bg-slate-900 text-corporate-600 shadow-sm border border-slate-200 dark:border-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200"
                        )}
                    >
                        <tab.icon className={clsx("w-4 h-4", activeTab === tab.id ? "text-corporate-600" : "text-slate-400 dark:text-slate-500")} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Filter Panel Overlay */}
            {showFilter && (
                <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2">Spiritual Guide</label>
                            <select 
                                value={filterCounselor} 
                                onChange={e => setFilterCounselor(e.target.value)} 
                                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-corporate-600/20 transition-all cursor-pointer"
                            >
                                <option value="">Global Network</option>
                                {counselors.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2">Regional Sector</label>
                            <select 
                                value={filterDistrict} 
                                onChange={e => setFilterDistrict(e.target.value)} 
                                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-corporate-600/20 transition-all cursor-pointer"
                            >
                                <option value="">All Regions</option>
                                {districts.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center justify-between">
                            {hasFilters && (
                                <button 
                                    onClick={() => { setFilterCounselor(''); setFilterDistrict(''); }} 
                                    className="flex items-center gap-2 px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                >
                                    <X className="w-4 h-4" /> Reset Filters
                                </button>
                            )}
                            <div className="ml-auto text-right">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Dataset Scope</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{filteredDevotees.length} Active Records</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'overview' ? (
                <div className="space-y-8">
                    {/* Key Performance Indicators */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Total Ecosystem', val: filteredDevotees.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                            { label: 'Standard Bearers', val: statusData.find(d => d.name === 'Initiated')?.value || 0, icon: Award, color: 'text-primary', bg: 'bg-primary/10' },
                            { label: 'Velocity (30d)', val: growthData[growthData.length - 1]?.count ?? 0, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                            { label: 'Regional Nodes', val: districtData.length, icon: MapPin, color: 'text-rose-500', bg: 'bg-rose-500/10' },
                        ].map((s, i) => (
                            <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm group hover:shadow-md transition-all cursor-default">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-4 rounded-2xl ${s.bg} ${s.color} transition-all group-hover:rotate-6 shadow-inner`}>
                                        <s.icon className="w-6 h-6" />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1.5 opacity-60">{s.label}</p>
                                        <h4 className="text-2xl font-bold text-slate-900 tracking-tighter leading-none">{s.val}</h4>
                                    </div>
                                </div>
                                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div className={clsx("h-full rounded-full transition-all duration-1000", i === 0 ? "w-4/5 bg-blue-500" : i === 1 ? "w-1/2 bg-primary" : i === 2 ? "w-2/3 bg-emerald-500" : "w-1/3 bg-rose-500")} />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                        {/* Registration Velocity Chart */}
                        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md h-full">
                            <div className="flex items-center justify-between mb-10">
                                <div>
                                    <h3 className="text-xl font-black text-foreground tracking-tight flex items-center gap-3">
                                        Community Growth Velocity
                                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                                    </h3>
                                    <p className="text-sm text-muted-foreground font-medium">Monthly acquisition metrics</p>
                                </div>
                                <div className="flex bg-muted/50 p-1.5 rounded-2xl border border-border/50">
                                    <button 
                                        onClick={() => setTrendMonths(6)} 
                                        className={clsx(
                                            "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                                            trendMonths === 6 ? "bg-white dark:bg-slate-900 text-primary shadow-lg" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        6M
                                    </button>
                                    <button 
                                        onClick={() => setTrendMonths(12)} 
                                        className={clsx(
                                            "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                                            trendMonths === 12 ? "bg-white dark:bg-slate-900 text-primary shadow-lg" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        1Y
                                    </button>
                                </div>
                            </div>
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={growthData}>
                                        <defs>
                                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                                            dy={15}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                backdropFilter: 'blur(10px)',
                                                borderRadius: '20px',
                                                border: '1px solid white',
                                                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
                                                fontSize: '11px',
                                                fontWeight: '900',
                                                textTransform: 'uppercase',
                                                padding: '12px 20px'
                                            }}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="count" 
                                            stroke="#f97316" 
                                            strokeWidth={4} 
                                            fillOpacity={1} 
                                            fill="url(#colorCount)" 
                                            animationDuration={2000}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Spiritual Stratification */}
                        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md flex flex-col items-center">
                            <div className="text-center mb-8">
                                <h3 className="text-xl font-black text-foreground tracking-tight">Status Stratification</h3>
                                <p className="text-sm text-muted-foreground font-medium">Spiritual milestone distribution</p>
                            </div>
                            <div className="h-[280px] w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            innerRadius={75}
                                            outerRadius={95}
                                            paddingAngle={8}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {statusData.map((entry, index) => (
                                                <Cell 
                                                    key={`cell-${index}`} 
                                                    fill={COLORS[index % COLORS.length]} 
                                                    className="outline-none hover:opacity-80 transition-opacity"
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{
                                                borderRadius: '16px',
                                                border: 'none',
                                                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total</span>
                                    <span className="text-3xl font-black text-foreground">{filteredDevotees.length}</span>
                                </div>
                            </div>
                            <div className="w-full mt-6 space-y-3">
                                {statusData.map((entry, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm group hover:bg-slate-100 dark:bg-slate-800 transition-colors cursor-default">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full shadow-lg transition-transform group-hover:scale-125" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                            <span className="text-xs font-black text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-wider">{entry.name}</span>
                                        </div>
                                        <span className="text-sm font-black text-foreground">{entry.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top Geographic Nodes */}
                        <div className="lg:col-span-12 bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md">
                            <div className="mb-10">
                                <h3 className="text-xl font-black text-foreground tracking-tight flex items-center gap-3">
                                    Top Regional Clusters
                                    <MapPin className="text-rose-500 w-5 h-5 animate-bounce-slow" />
                                </h3>
                                <p className="text-sm text-muted-foreground font-medium">Density mapping by district</p>
                            </div>
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={districtData} layout="vertical" margin={{ left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.03)" />
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#475569', fontSize: 11, fontWeight: 900 }}
                                            width={120}
                                        />
                                        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                        <Bar dataKey="value" fill="#f43f5e" radius={[0, 12, 12, 0]} barSize={36}>
                                            {districtData.map((entry, index) => (
                                                <Cell 
                                                    key={`cell-${index}`} 
                                                    fill={COLORS[index % COLORS.length]} 
                                                    className="hover:opacity-80 transition-opacity"
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            ) : activeTab === 'demographics' ? (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Age Stratification */}
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md">
                            <div className="mb-8">
                                <h3 className="text-xl font-black text-foreground tracking-tight flex items-center gap-3">
                                    Age Stratification
                                    <BarChart3 className="text-blue-500 w-5 h-5" />
                                </h3>
                                <p className="text-sm text-muted-foreground font-medium">Demographic distribution by generation</p>
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={demographicsData.age} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                                        <XAxis 
                                            dataKey="name" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#475569', fontSize: 10, fontWeight: 800 }} 
                                            dy={15} 
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#475569', fontSize: 10, fontWeight: 800 }} 
                                        />
                                        <Tooltip 
                                            cursor={{ fill: 'rgba(0,0,0,0.02)' }} 
                                            contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)' }} 
                                        />
                                        <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={45}>
                                            {demographicsData.age.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[(index+1) % COLORS.length]} className="hover:opacity-80 transition-opacity" />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Gender Dynamics */}
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md flex flex-col items-center">
                            <div className="text-center mb-8">
                                <h3 className="text-xl font-black text-foreground tracking-tight">Gender Dynamics</h3>
                                <p className="text-sm text-muted-foreground font-medium">Community gender balance</p>
                            </div>
                            <div className="h-[300px] w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie 
                                            data={demographicsData.gender} 
                                            innerRadius={80} 
                                            outerRadius={100} 
                                            paddingAngle={8} 
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {demographicsData.gender.map((entry, index) => (
                                                <Cell 
                                                    key={`cell-${index}`} 
                                                    fill={entry.name === 'Male' ? '#3b82f6' : entry.name === 'Female' ? '#ec4899' : '#94a3b8'} 
                                                    className="outline-none"
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                                        <Legend 
                                            verticalAlign="bottom" 
                                            height={36} 
                                            iconType="circle" 
                                            wrapperStyle={{ fontWeight: "900", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", paddingTop: "20px" }} 
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        
                        {/* Marital Landscape */}
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md flex flex-col items-center lg:col-span-2">
                            <div className="text-center mb-8">
                                <h3 className="text-xl font-black text-foreground tracking-tight">Marital Landscape</h3>
                                <p className="text-sm text-muted-foreground font-medium">Ashram distribution metrics</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 w-full gap-10 items-center">
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={demographicsData.marital} innerRadius={65} outerRadius={85} paddingAngle={8} dataKey="value" stroke="none">
                                                {demographicsData.marital.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    {demographicsData.marital.map((entry, index) => (
                                        <div key={index} className="flex items-center justify-between p-5 bg-background/40 backdrop-blur-md rounded-[2rem] border border-white shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                                <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">{entry.name}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-lg font-black text-foreground">{entry.value}</span>
                                                <p className="text-[10px] text-muted-foreground font-medium">{Math.round((entry.value / filteredDevotees.length) * 100)}%</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : activeTab === 'courses' ? (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Literary Engagement */}
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md">
                            <div className="mb-8">
                                <h3 className="text-xl font-black text-foreground tracking-tight flex items-center gap-3">
                                    Literary Engagement
                                    <BookOpen className="text-orange-500 w-5 h-5" />
                                </h3>
                                <p className="text-sm text-muted-foreground font-medium">Most impactful Srila Prabhupada publications</p>
                            </div>
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={readingData.books} layout="vertical" margin={{ left: 10, right: 30 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.03)" />
                                        <XAxis type="number" hide />
                                        <YAxis 
                                            dataKey="name" 
                                            type="category" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#475569', fontSize: 10, fontWeight: 800 }} 
                                            width={140} 
                                        />
                                        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '16px', border: 'none' }} />
                                        <Bar dataKey="value" fill="#f97316" radius={[0, 10, 10, 0]} barSize={28}>
                                             {readingData.books.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Educational Milestones */}
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md">
                            <div className="mb-8">
                                <h3 className="text-xl font-black text-foreground tracking-tight flex items-center gap-3">
                                    Educational Milestones
                                    <GraduationCap className="text-indigo-500 w-5 h-5" />
                                </h3>
                                <p className="text-sm text-muted-foreground font-medium">Curriculum completion analytics</p>
                            </div>
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={readingData.courses} layout="vertical" margin={{ left: 10, right: 30 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.03)" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10, fontWeight: 800 }} width={140} />
                                        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '16px', border: 'none' }} />
                                        <Bar dataKey="value" fill="#6366f1" radius={[0, 10, 10, 0]} barSize={28}>
                                             {readingData.courses.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[(index+2) % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        
                        {/* Communal Competencies */}
                        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md">
                            <div className="mb-10">
                                <h3 className="text-xl font-black text-foreground tracking-tight flex items-center gap-3">
                                    Communal Competencies
                                    <BrainCircuit className="text-emerald-500 w-5 h-5 animate-pulse-slow" />
                                </h3>
                                <p className="text-sm text-muted-foreground font-medium">Available human capital & volunteer skills</p>
                            </div>
                            <div className="flex flex-wrap gap-4">
                                {readingData.skills.map((skill, i) => (
                                    <div key={i} className="flex items-center gap-3 bg-white dark:bg-slate-900/60 backdrop-blur-md border border-white rounded-2xl px-6 py-3 shadow-sm hover:shadow-md transition-all group cursor-default">
                                        <span className="font-black text-slate-700 dark:text-slate-200 text-xs uppercase tracking-widest">{skill.name}</span>
                                        <div className="w-1 h-4 bg-border group-hover:bg-primary transition-colors rounded-full" />
                                        <span className="text-primary text-xs font-black">{skill.value}</span>
                                    </div>
                                ))}
                                {readingData.skills.length === 0 && (
                                    <div className="w-full p-10 text-center bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl opacity-60">
                                        <p className="text-sm font-bold uppercase tracking-widest">No Competencies Cataloged</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : activeTab === 'sadhana' ? (
                <div className="space-y-8">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md">
                        <div className="mb-10 flex justify-between items-end">
                            <div>
                                <h3 className="text-xl font-black text-foreground tracking-tight flex items-center gap-3">
                                    Sadhana Velocity by Council
                                    <Activity className="text-blue-500 w-5 h-5 animate-pulse" />
                                </h3>
                                <p className="text-sm text-muted-foreground font-medium">Comparative spiritual practice across counseling nodes</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 opacity-60">Global Average</p>
                                <h4 className="text-3xl font-black text-foreground tracking-tighter leading-none">
                                    {Math.round((sadhanaStats.chartData.reduce((acc, curr) => acc + curr.avgRounds, 0) / sadhanaStats.chartData.length || 0) * 10) / 10}
                                    <span className="text-sm text-muted-foreground ml-2 font-black uppercase">Rounds</span>
                                </h4>
                            </div>
                        </div>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={sadhanaStats.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#475569', fontSize: 10, fontWeight: 900 }}
                                        dy={15}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#475569', fontSize: 10, fontWeight: 900 }}
                                        domain={[0, 16]}
                                    />
                                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)' }} />
                                    <Bar dataKey="avgRounds" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={50}>
                                        {sadhanaStats.chartData.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={entry.avgRounds >= 12 ? '#10b981' : entry.avgRounds >= 8 ? '#f59e0b' : '#ef4444'} 
                                                className="hover:opacity-80 transition-all cursor-crosshair"
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Top Performers */}
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md">
                            <div className="flex items-center justify-between mb-8 border-b border-border/20 pb-6">
                                <h3 className="text-xl font-black text-foreground tracking-tight flex items-center gap-3">
                                    16 Round Sentinels
                                    <Star className="text-emerald-500 w-5 h-5 fill-emerald-500" />
                                </h3>
                                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">{sadhanaStats.topPerformers.length} Active</span>
                            </div>
                            <div className="space-y-4">
                                {sadhanaStats.topPerformers.length > 0 ? sadhanaStats.topPerformers.map(d => (
                                    <div key={d.id} className="flex items-center justify-between p-5 bg-background/40 backdrop-blur-md rounded-[2rem] border border-white group hover:bg-white dark:bg-slate-900 transition-all shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-black">
                                                {d.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-black text-foreground text-sm uppercase tracking-tight">{d.initiatedName || d.name}</p>
                                                <p className="text-[10px] text-muted-foreground font-bold tracking-widest">{d.counselor || 'Independant'}</p>
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-full border-2 border-emerald-500/20 flex items-center justify-center">
                                            <span className="font-black text-emerald-600 text-sm">16</span>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-10 text-center bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl opacity-60">
                                        <p className="text-sm font-bold uppercase tracking-widest">No Sentinels Identified</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Encouragement Threshold */}
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md">
                            <div className="flex items-center justify-between mb-8 border-b border-border/20 pb-6">
                                <h3 className="text-xl font-black text-foreground tracking-tight flex items-center gap-3">
                                    Critical Awareness
                                    <AlertCircle className="text-rose-500 w-5 h-5" />
                                </h3>
                                <span className="px-3 py-1 bg-rose-500/10 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest">{sadhanaStats.needsEncouragement.length} Flagged</span>
                            </div>
                            <div className="space-y-4">
                                {sadhanaStats.needsEncouragement.length > 0 ? sadhanaStats.needsEncouragement.map(d => (
                                    <div key={d.id} className="flex items-center justify-between p-5 bg-background/40 backdrop-blur-md rounded-[2rem] border border-white group hover:bg-white dark:bg-slate-900 transition-all shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 font-black">
                                                {d.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-black text-foreground text-sm uppercase tracking-tight">{d.initiatedName || d.name}</p>
                                                <p className="text-[10px] text-muted-foreground font-bold tracking-widest">{d.counselor || 'Independant'}</p>
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-full border-2 border-rose-500/20 flex items-center justify-center">
                                            <span className="font-black text-rose-600 text-sm">{d.rounds || 0}</span>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-10 text-center bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl opacity-60">
                                        <div className="relative w-fit mx-auto mb-4">
                                            <Activity className="w-8 h-8 text-emerald-500" />
                                            <Star className="absolute -top-1 -right-1 w-4 h-4 text-amber-400 fill-amber-400" />
                                        </div>
                                        <p className="text-sm font-bold uppercase tracking-widest">Global Stability Maintained</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : activeTab === 'tours' ? (
                <div className="space-y-8 animate-in fade-in duration-500">
                    {/* Tour Financial Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Projected Revenue</p>
                            <h4 className="text-3xl font-black text-slate-900">₹{tourAnalytics.totalRevenue?.toLocaleString()}</h4>
                            <div className="mt-4 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-orange-500 w-full"></div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm border-l-4 border-l-emerald-500">
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Total Collections</p>
                            <h4 className="text-3xl font-black text-emerald-600">₹{tourAnalytics.totalCollected?.toLocaleString()}</h4>
                            <div className="mt-4 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: `${(tourAnalytics.totalCollected/tourAnalytics.totalRevenue)*100}%` }}></div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm border-l-4 border-l-rose-500">
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Outstanding Dues</p>
                            <h4 className="text-3xl font-black text-rose-600">₹{(tourAnalytics.totalRevenue - tourAnalytics.totalCollected)?.toLocaleString()}</h4>
                            <div className="mt-4 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-rose-500" style={{ width: `${((tourAnalytics.totalRevenue - tourAnalytics.totalCollected)/tourAnalytics.totalRevenue)*100}%` }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Most Popular Yatra Locations */}
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md">
                            <div className="mb-8">
                                <h3 className="text-xl font-black text-foreground tracking-tight flex items-center gap-3">
                                    Tour Popularity
                                    <TrendingUp className="text-orange-500 w-5 h-5" />
                                </h3>
                                <p className="text-sm text-muted-foreground font-medium">Participant distribution across pilgrimage sites</p>
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={tourAnalytics.topTours}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800 }} />
                                        <Tooltip />
                                        <Bar dataKey="participants" fill="#f97316" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Tour Lifecycle Progress */}
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md">
                            <div className="mb-8">
                                <h3 className="text-xl font-black text-foreground tracking-tight">Lifecycle Status</h3>
                                <p className="text-sm text-muted-foreground font-medium">Current stage of all planned expeditions</p>
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={tourAnalytics.statusDistribution} innerRadius={60} outerRadius={80} dataKey="value" stroke="none">
                                            {tourAnalytics.statusDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Legend />
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Financial Efficiency Table */}
                        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50/50">
                                <h4 className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest text-xs">Expedition Financial Performance</h4>
                            </div>
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-900/50/50">
                                    <tr>
                                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Expedition</th>
                                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Attendance</th>
                                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Revenue Impact</th>
                                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Efficiency</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {tourAnalytics.topTours.map((t, i) => (
                                        <tr key={i} className="hover:bg-slate-50 dark:bg-slate-900/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-900 text-sm">{t.name}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">{t.participants} Pilgrims</td>
                                            <td className="px-6 py-4 text-sm font-black text-emerald-600">₹{t.revenue.toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden max-w-[100px]">
                                                    <div className="h-full bg-orange-500" style={{ width: `${Math.min(100, (t.participants / 50) * 100)}%` }}></div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : ( <div>{/* Other tabs */}</div> )}
        </div>
    );
};

export default Reports;
