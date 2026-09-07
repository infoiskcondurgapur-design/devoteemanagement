import React, { useState, useMemo } from 'react';
import { formatDate } from '../lib/dateUtils';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, Plus, Crown, Shield, User, Heart, Cake, Download, TrendingUp, Sparkles, Activity, RefreshCw, ChevronRight, MapPin } from 'lucide-react';
import clsx from 'clsx';
import { useDevotees } from '../context/DevoteeContext';
import { useToast } from '../components/Toast';
import ErrorBoundary from '../components/ErrorBoundary';
import WhatsAppModal from '../components/WhatsAppModal';
import { MessageSquare } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

const StatCard = ({ title, value, label, icon: Icon, _delay }) => {
    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">{title}</p>
                    <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
                        {value}
                    </h3>
                    {label && <p className="text-slate-500 dark:text-slate-400 text-[11px] font-medium leading-tight max-w-[140px]">{label}</p>}
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 group-hover:text-corporate-600 transition-colors">
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const navigate = useNavigate();
    const { getDashboardStats, fetchStats, lastUpdated, googleSheetsStatus, events, fetchEvents: fetchDashboardEvents } = useDevotees();
    const toast = useToast();
    const statsData = getDashboardStats();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeDevotee, setActiveDevotee] = useState(null);
    const [showWhatsApp, setShowWhatsApp] = useState(false);

    const upcomingBirthdays = (() => {
        const today = new Date();
        const results = [];
        for (let i = 1; i <= 7; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            const month = d.getMonth() + 1;
            const day = d.getDate();
            const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
            (statsData.allDevotees || []).filter(dev => {
                if (!dev.dob) return false;
                const parts = dev.dob.split('-');
                if (parts.length !== 3) return false;
                return parseInt(parts[1]) === month && parseInt(parts[2]) === day;
            }).forEach(dev => results.push({ ...dev, upcomingLabel: label }));
        }
        return results;
    })();

    const upcomingEventsList = useMemo(() => {
        return events
            .filter(event => new Date(event.eventDate) >= new Date().setHours(0,0,0,0))
            .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))
            .slice(0, 3);
    }, [events]);

    const stats = [
        { title: 'Total Devotees', value: statsData.totalDevotees, label: 'Consolidated community reach', icon: Users, delay: 0 },
        { title: 'Initiated', value: statsData.initiatedCount, label: 'Dedicated practitioners', icon: Crown, delay: 100 },
        { title: 'Sheltered', value: statsData.shelteredCount, label: 'Official members', icon: Shield, delay: 200 },
        { title: 'Aspiring', value: statsData.aspiringCount, label: 'New spiritual seekers', icon: User, delay: 300 },
    ];

    return (
        <div className="space-y-8 pb-16">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                        Overview
                    </h1>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-medium">
                        <Activity className="w-4 h-4 text-corporate-600" />
                        <span>System synchronized {lastUpdated.toLocaleTimeString()}</span>
                    </div>
                </div>
                
                <div className="flex gap-3">
                    <button
                        onClick={async () => {
                            setIsRefreshing(true);
                            await Promise.all([fetchStats(), fetchDashboardEvents()]);
                            setTimeout(() => setIsRefreshing(false), 800);
                            toast.success('System Refreshed');
                        }}
                        className={clsx(
                            "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-5 py-2.5 rounded-lg flex items-center gap-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:bg-slate-900/50 transition-all shadow-sm",
                            isRefreshing && "opacity-50 pointer-events-none"
                        )}
                    >
                        <RefreshCw className={clsx("w-4 h-4 text-corporate-600", isRefreshing && "animate-spin")} />
                        {isRefreshing ? 'Updating...' : 'Refresh'}
                    </button>
                    
                    <button 
                        onClick={() => navigate('/devotees/new')} 
                        className="bg-corporate-600 px-6 py-2.5 rounded-lg flex items-center gap-2.5 text-sm font-bold text-white shadow-md hover:bg-corporate-700 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        New Devotee
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <ErrorBoundary>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {stats.map((stat, index) => (
                        <StatCard key={index} {...stat} />
                    ))}
                </div>
            </ErrorBoundary>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Occasions Panel */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50/50">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                                <div className="p-2 bg-pink-50 rounded-lg">
                                    <Calendar className="w-5 h-5 text-pink-500" />
                                </div>
                                Occasions & Today's Events
                            </h2>
                        </div>

                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Birthdays Section */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                        <Cake className="w-4 h-4 text-pink-500" /> Birthdays
                                    </h3>
                                    <span className="bg-pink-500/10 text-pink-600 text-[11px] font-black px-2.5 py-1 rounded-full border border-pink-500/20">
                                        {statsData.birthdaysToday.length}
                                    </span>
                                </div>

                                {statsData.birthdaysToday.length > 0 ? (
                                    <div className="space-y-4 max-h-[340px] overflow-y-auto pr-3 custom-scrollbar">
                                        {statsData.birthdaysToday.map((d) => (
                                            <div key={d.id} className="group flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-pink-200 transition-all">
                                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm">
                                                    <img src={d.photo || '/default-avatar.png'} alt="" className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{d.name}</p>
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate italic">{d.initiatedName || 'Aspirant'}</p>
                                                </div>
                                                <button
                                                    onClick={() => { setActiveDevotee(d); setShowWhatsApp(true); }}
                                                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                >
                                                    <MessageSquare className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/50 rounded-xl border-dashed border-2 border-slate-200 dark:border-slate-700">
                                        <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">No birthdays today</p>
                                    </div>
                                )}
                            </div>

                            {/* Anniversaries Section */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                        <Heart className="w-4 h-4 text-rose-500" /> Anniversaries
                                    </h3>
                                    <span className="bg-rose-500/10 text-rose-600 text-[11px] font-black px-2.5 py-1 rounded-full border border-rose-500/20">
                                        {statsData.anniversariesToday.length}
                                    </span>
                                </div>

                                {statsData.anniversariesToday.length > 0 ? (
                                    <div className="space-y-4 max-h-[340px] overflow-y-auto pr-3 custom-scrollbar">
                                        {statsData.anniversariesToday.map((d) => (
                                            <div key={d.id} className="group flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-rose-200 transition-all">
                                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm">
                                                    <img src={d.photo || '/default-avatar.png'} alt="" className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{d.name}</p>
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate italic">{d.initiatedName || 'Devotee'}</p>
                                                </div>
                                                <button
                                                    onClick={() => { setActiveDevotee(d); setShowWhatsApp(true); }}
                                                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                >
                                                    <Heart className="w-5 h-5 fill-current" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/50 rounded-xl border-dashed border-2 border-slate-200 dark:border-slate-700">
                                        <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">No anniversaries today</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Upcoming Events Section */}
                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50/30">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                                        <Calendar className="w-4 h-4 text-indigo-600" />
                                    </div>
                                    Upcoming Major Events
                                </h3>
                                <button onClick={() => navigate('/events')} className="text-[11px] font-black text-corporate-600 hover:underline transition-all uppercase tracking-wider">
                                    View Schedule &rarr;
                                </button>
                            </div>
                            
                            {upcomingEventsList.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {upcomingEventsList.map(event => (
                                        <div key={event.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5 rounded-xl shadow-sm hover:shadow-md transition-all">
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                                                    {event.eventType}
                                                </span>
                                            </div>
                                            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-3 truncate leading-tight">{event.name}</h4>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                                                    {formatDate(event.eventDate)}
                                                </div>
                                                {event.location && (
                                                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                                                        <span className="truncate">{event.location}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-slate-50 dark:bg-slate-900/50 rounded-xl border-dashed border-2 border-slate-200 dark:border-slate-700">
                                    <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">No upcoming events found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Info Side Panel */}
                <div className="lg:col-span-4 space-y-8">

                    {/* System Status Panel */}
                    <ErrorBoundary>
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md">
                            <div className="flex items-center justify-between mb-8">
                                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-[10px] uppercase tracking-widest">Connective Services</h4>
                                <div className="flex items-center gap-2 px-2 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                    <span className="text-[9px] text-emerald-600 font-bold uppercase">Live</span>
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                {/* Cloud Sync Integration Status */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Cloud Sync (Sheets)</span>
                                            <span className={clsx(
                                                "text-sm font-black tracking-tight",
                                                googleSheetsStatus.authenticated ? "text-blue-600" : "text-amber-600"
                                            )}>
                                                {googleSheetsStatus.authenticated ? 'Cloud Linked' : 'Not Integrated'}
                                            </span>
                                        </div>
                                        {googleSheetsStatus.lastSync && (
                                            <span className="text-[10px] font-bold text-muted-foreground italic">
                                                {new Date(googleSheetsStatus.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                        <div className={clsx(
                                            "h-full rounded-full transition-all duration-1000 ease-out",
                                            googleSheetsStatus.authenticated ? "bg-blue-500 w-full shadow-[0_0_10px_rgba(59,130,246,0.3)]" : "bg-amber-500 w-1/4"
                                        )}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ErrorBoundary>

                    {/* Upcoming Birthdays Weekly Tracker */}
                    <ErrorBoundary>
                        {upcomingBirthdays.length > 0 && (
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md">
                                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-[10px] uppercase tracking-widest mb-6 flex items-center gap-3">
                                    <Cake className="w-4 h-4 text-indigo-500" />
                                    Weekly Calendar
                                </h4>
                                <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2">
                                    {upcomingBirthdays.map((dev, i) => (
                                        <div key={i} className="group flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-corporate-200 transition-all">
                                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shrink-0 shadow-sm border border-slate-200 dark:border-slate-700">
                                                <img src={dev.photo || '/default-avatar.png'} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[12px] font-bold text-slate-800 dark:text-slate-100 truncate">{dev.name}</p>
                                                <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">{dev.upcomingLabel}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </ErrorBoundary>
                </div>
            </div>

            <WhatsAppModal
                isOpen={showWhatsApp}
                onClose={() => setShowWhatsApp(false)}
                devotee={activeDevotee}
            />
        </div>
    );
};

export default Dashboard;
