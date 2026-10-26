import React, { useState, useMemo } from 'react';
import { formatDate } from '../lib/dateUtils';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, Plus, Crown, Shield, User, Heart, Cake, Download, TrendingUp, Sparkles, Activity, RefreshCw, ChevronRight, MapPin, Maximize2, Glasses, MessageSquare } from 'lucide-react';
import clsx from 'clsx';
import { useDevotees } from '../context/DevoteeContext';
import { useToast } from '../components/Toast';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import ErrorBoundary from '../components/ErrorBoundary';
import WhatsAppModal from '../components/WhatsAppModal';
import ImageModal from '../components/ImageModal';
import EkadashiWidget from '../components/dashboard/EkadashiWidget';

const StatCard = ({ title, value, label, icon: Icon, _delay }) => {
    return (
        <div className="bg-card text-card-foreground p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">{title}</p>
                    <h3 className="text-3xl font-bold text-[#c7ded9] tracking-tight">
                        {value}
                    </h3>
                    {label && <p className="text-muted-foreground text-[11px] font-medium leading-tight max-w-[140px]">{label}</p>}
                </div>
                <div className="p-3 rounded-lg bg-[#1d3233] text-[#86a09c] border border-[#2d4d4f] group-hover:text-amber-500 transition-colors">
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const navigate = useNavigate();
    const { isAdmin } = useAuth();
    const { getDashboardStats, fetchStats, lastUpdated, events, fetchEvents: fetchDashboardEvents } = useDevotees();
    const { eyeProtectMode, toggleEyeProtect } = useTheme();
    const toast = useToast();
    const statsData = getDashboardStats();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeDevotee, setActiveDevotee] = useState(null);
    const [showWhatsApp, setShowWhatsApp] = useState(false);
    const [selectedImageDevotee, setSelectedImageDevotee] = useState(null);

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
                    <h1 className="text-3xl font-bold tracking-tight text-[#c7ded9] flex items-center gap-3">
                        Overview
                    </h1>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        <span>System synchronized {lastUpdated.toLocaleTimeString()}</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                    {/* Eye Comfort Quick Toggle */}
                    <button
                        onClick={toggleEyeProtect}
                        className={clsx(
                            "px-3.5 py-2.5 rounded-lg flex items-center gap-2 text-sm font-bold border transition-all shadow-sm",
                            eyeProtectMode
                                ? "bg-amber-500/20 text-amber-300 border-amber-400/40 ring-1 ring-amber-400/30 shadow-sm"
                                : "bg-card text-muted-foreground border-border hover:bg-muted/60 hover:text-[#c7ded9]"
                        )}
                        title={eyeProtectMode ? "চোখের সুরক্ষা মোড সক্রিয় (Eye Comfort ON - Click to disable)" : "চোখের সুরক্ষা অন করুন (Enable Eye Comfort Mode)"}
                    >
                        <Glasses className={clsx("w-4 h-4", eyeProtectMode ? "text-amber-400" : "text-muted-foreground")} />
                        <span className="hidden sm:inline">{eyeProtectMode ? 'Eye Comfort ON' : 'Eye Comfort'}</span>
                    </button>

                    <button
                        onClick={async () => {
                            setIsRefreshing(true);
                            await Promise.all([fetchStats(), fetchDashboardEvents()]);
                            setTimeout(() => setIsRefreshing(false), 800);
                            toast.success('System Refreshed');
                        }}
                        className={clsx(
                            "bg-card border border-border px-4 sm:px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm font-bold text-[#c7ded9] hover:bg-muted/60 transition-all shadow-sm",
                            isRefreshing && "opacity-50 pointer-events-none"
                        )}
                    >
                        <RefreshCw className={clsx("w-4 h-4 text-emerald-400", isRefreshing && "animate-spin")} />
                        <span>{isRefreshing ? 'Updating...' : 'Refresh'}</span>
                    </button>
                    
                    {isAdmin && (
                        <button 
                            onClick={() => navigate('/devotees/new')} 
                            className="bg-corporate-600 hover:bg-corporate-700 px-5 sm:px-6 py-2.5 rounded-lg flex items-center gap-2 text-sm font-bold text-[#e0edeb] shadow-md transition-all"
                        >
                            <Plus className="w-5 h-5" />
                            <span>New Devotee</span>
                        </button>
                    )}
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
                    <div className="bg-card text-card-foreground rounded-xl border border-border shadow-md overflow-hidden">
                        <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
                            <h2 className="text-lg font-bold text-[#c7ded9] flex items-center gap-3">
                                <div className="p-2 bg-pink-950/40 border border-pink-900/50 rounded-lg text-pink-300">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                Occasions & Today's Events
                            </h2>
                        </div>

                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Birthdays Section */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                        <Cake className="w-4 h-4 text-pink-400" /> Birthdays
                                    </h3>
                                    <span className="bg-pink-950/40 text-pink-300 text-[11px] font-black px-2.5 py-1 rounded-full border border-pink-900/50">
                                        {statsData.birthdaysToday.length}
                                    </span>
                                </div>

                                {statsData.birthdaysToday.length > 0 ? (
                                    <div className="space-y-4 max-h-[340px] overflow-y-auto pr-3 custom-scrollbar">
                                        {statsData.birthdaysToday.map((d) => (
                                            <div key={d.id} className="group flex items-center gap-4 p-3 bg-muted/40 rounded-xl border border-border hover:border-pink-300 dark:hover:border-pink-800/80 transition-all">
                                                <div 
                                                    onClick={() => d.photo && setSelectedImageDevotee(d)}
                                                    className={`w-10 h-10 rounded-lg overflow-hidden bg-[#1d3334] shrink-0 border border-border shadow-sm relative group/img ${d.photo ? 'cursor-pointer' : ''}`}
                                                    title={d.photo ? "Click to view original image" : ""}
                                                >
                                                    {d.photo ? (
                                                        <img src={d.photo} alt="" className="w-full h-full object-cover transition-transform group-hover/img:scale-105" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[#8fa8a4]">
                                                            <User className="w-5 h-5" />
                                                        </div>
                                                    )}
                                                    {d.photo && (
                                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-[#c7ded9]">
                                                            <Maximize2 className="w-3.5 h-3.5 drop-shadow" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-[#c7ded9] text-sm truncate">{d.name}</p>
                                                    <p className="text-[10px] text-muted-foreground font-medium truncate italic">{d.initiatedName || 'Aspirant'}</p>
                                                </div>
                                                <button
                                                    onClick={() => { setActiveDevotee(d); setShowWhatsApp(true); }}
                                                    className="p-2 text-muted-foreground hover:text-emerald-400 hover:bg-emerald-950/40 rounded-lg transition-all"
                                                >
                                                    <MessageSquare className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 bg-muted/20 rounded-xl border-dashed border-2 border-border">
                                        <p className="text-xs text-muted-foreground font-bold">No birthdays today</p>
                                    </div>
                                )}
                            </div>

                            {/* Anniversaries Section */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                        <Heart className="w-4 h-4 text-rose-400" /> Anniversaries
                                    </h3>
                                    <span className="bg-rose-950/40 text-rose-300 text-[11px] font-black px-2.5 py-1 rounded-full border border-rose-900/50">
                                        {statsData.anniversariesToday.length}
                                    </span>
                                </div>

                                {statsData.anniversariesToday.length > 0 ? (
                                    <div className="space-y-4 max-h-[340px] overflow-y-auto pr-3 custom-scrollbar">
                                        {statsData.anniversariesToday.map((d) => (
                                            <div key={d.id} className="group flex items-center gap-4 p-3 bg-muted/40 rounded-xl border border-border hover:border-rose-300 dark:hover:border-rose-800/80 transition-all">
                                                <div 
                                                    onClick={() => d.photo && setSelectedImageDevotee(d)}
                                                    className={`w-10 h-10 rounded-lg overflow-hidden bg-[#1d3334] shrink-0 border border-border shadow-sm relative group/img ${d.photo ? 'cursor-pointer' : ''}`}
                                                    title={d.photo ? "Click to view original image" : ""}
                                                >
                                                    {d.photo ? (
                                                        <img src={d.photo} alt="" className="w-full h-full object-cover transition-transform group-hover/img:scale-105" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[#8fa8a4]">
                                                            <User className="w-5 h-5" />
                                                        </div>
                                                    )}
                                                    {d.photo && (
                                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-[#c7ded9]">
                                                            <Maximize2 className="w-3.5 h-3.5 drop-shadow" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-[#c7ded9] text-sm truncate">{d.name}</p>
                                                    <p className="text-[10px] text-muted-foreground font-medium truncate italic">{d.initiatedName || 'Devotee'}</p>
                                                </div>
                                                <button
                                                    onClick={() => { setActiveDevotee(d); setShowWhatsApp(true); }}
                                                    className="p-2 text-rose-400 hover:bg-rose-950/40 rounded-lg transition-all"
                                                >
                                                    <Heart className="w-5 h-5 fill-current" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 bg-muted/20 rounded-xl border-dashed border-2 border-border">
                                        <p className="text-xs text-muted-foreground font-bold">No anniversaries today</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Upcoming Events Section */}
                        <div className="p-6 border-t border-border bg-muted/20">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-sm font-bold text-[#c7ded9] flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-950/50 border border-indigo-900/50 flex items-center justify-center text-indigo-300">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    Upcoming Major Events
                                </h3>
                                <button onClick={() => navigate('/events')} className="text-[11px] font-black text-corporate-400 hover:underline transition-all uppercase tracking-wider">
                                    View Schedule &rarr;
                                </button>
                            </div>
                            
                            {upcomingEventsList.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {upcomingEventsList.map(event => (
                                        <div key={event.id} className="bg-card border border-border p-5 rounded-xl shadow-sm hover:shadow-md transition-all">
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-300 bg-indigo-950/50 px-2.5 py-1 rounded-full border border-indigo-900/60">
                                                    {event.eventType}
                                                </span>
                                            </div>
                                            <h4 className="font-bold text-[#c7ded9] text-sm mb-3 truncate leading-tight">{event.name}</h4>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
                                                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                                                    {formatDate(event.eventDate)}
                                                </div>
                                                {event.location && (
                                                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
                                                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                                                        <span className="truncate">{event.location}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-muted/20 rounded-xl border-dashed border-2 border-border">
                                    <p className="text-xs text-muted-foreground font-bold">No upcoming events found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Info Side Panel */}
                <div className="lg:col-span-4 space-y-8">

                    {/* Vaishnava Calendar & Ekadashi Live Hub */}
                    <ErrorBoundary>
                        <EkadashiWidget />
                    </ErrorBoundary>

                    {/* Upcoming Birthdays Weekly Tracker */}
                    <ErrorBoundary>
                        {upcomingBirthdays.length > 0 && (
                            <div className="bg-card text-card-foreground p-6 rounded-xl border border-border shadow-md">
                                <h4 className="font-bold text-[#c7ded9] text-[10px] uppercase tracking-widest mb-6 flex items-center gap-3">
                                    <Cake className="w-4 h-4 text-indigo-400" />
                                    Weekly Calendar
                                </h4>
                                <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2">
                                    {upcomingBirthdays.map((dev, i) => (
                                        <div key={i} className="group flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-border hover:border-amber-300 dark:hover:border-amber-800/80 transition-all">
                                            <div 
                                                onClick={() => dev.photo && setSelectedImageDevotee(dev)}
                                                className={`w-10 h-10 rounded-lg overflow-hidden bg-[#1d3334] shrink-0 shadow-sm border border-border relative group/img ${dev.photo ? 'cursor-pointer' : ''}`}
                                                title={dev.photo ? "Click to view original image" : ""}
                                            >
                                                {dev.photo ? (
                                                    <img src={dev.photo} alt="" className="w-full h-full object-cover transition-transform group-hover/img:scale-105" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[#8fa8a4]">
                                                        <User className="w-5 h-5" />
                                                    </div>
                                                )}
                                                {dev.photo && (
                                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-[#c7ded9]">
                                                        <Maximize2 className="w-3.5 h-3.5 drop-shadow" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[12px] font-bold text-[#c7ded9] truncate">{dev.name}</p>
                                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">{dev.upcomingLabel}</p>
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

            {/* Original Profile Picture Modal */}
            <ImageModal
                isOpen={!!selectedImageDevotee}
                onClose={() => setSelectedImageDevotee(null)}
                imageUrl={selectedImageDevotee?.photo}
                title={selectedImageDevotee?.name}
                subtitle={selectedImageDevotee?.initiatedName || 'Devotee'}
            />
        </div>
    );
};

export default Dashboard;
