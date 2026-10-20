import React, { useState, useMemo } from 'react';
import {
    Calendar as CalendarIcon,
    Moon,
    Sun,
    Search,
    Share2,
    Check,
    Clock,
    Sparkles,
    BookOpen,
    Filter,
    ChevronLeft,
    ChevronRight,
    CalendarCheck,
    AlertCircle,
    Info,
    Utensils,
    X,
    Flame
} from 'lucide-react';
import clsx from 'clsx';
import {
    getAllEvents,
    getEventsByMonth,
    getNextEkadashi,
    searchVaishnavaEvents,
    FASTING_GUIDELINES
} from '../lib/vaishnavaCalendarUtils';
import EkadashiBroadcastModal from '../components/spiritual/EkadashiBroadcastModal';
import { useDevotees } from '../context/DevoteeContext';
import { useToast } from '../components/Toast';
import apiService from '../services/api';

const MONTHS = [
    { num: 1, nameEn: 'Jan', nameBn: 'জানুয়ারি' },
    { num: 2, nameEn: 'Feb', nameBn: 'ফেব্রুয়ারি' },
    { num: 3, nameEn: 'Mar', nameBn: 'মার্চ' },
    { num: 4, nameEn: 'Apr', nameBn: 'এপ্রিল' },
    { num: 5, nameEn: 'May', nameBn: 'মে' },
    { num: 6, nameEn: 'Jun', nameBn: 'জুন' },
    { num: 7, nameEn: 'Jul', nameBn: 'জুলাই' },
    { num: 8, nameEn: 'Aug', nameBn: 'আগস্ট' },
    { num: 9, nameEn: 'Sep', nameBn: 'সেপ্টেম্বর' },
    { num: 10, nameEn: 'Oct', nameBn: 'অক্টোবর' },
    { num: 11, nameEn: 'Nov', nameBn: 'নভেম্বর' },
    { num: 12, nameEn: 'Dec', nameBn: 'ডিসেম্বর' },
];

const VaishnavaCalendar = () => {
    const toast = useToast();
    const { events: existingDmsEvents, fetchEvents } = useDevotees();

    const [selectedYear, setSelectedYear] = useState(2026);
    const [selectedMonth, setSelectedMonth] = useState(10); // Default to October
    const [filterCategory, setFilterCategory] = useState('all'); // 'all' | 'ekadashi' | 'appearance' | 'festival'
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEventForModal, setSelectedEventForModal] = useState(null);
    const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    const ekadashiInfo = useMemo(() => getNextEkadashi(), []);

    // Filter events
    const filteredEvents = useMemo(() => {
        let list = getAllEvents();

        // If search query is entered, search across the whole dataset
        if (searchQuery.trim()) {
            list = searchVaishnavaEvents(searchQuery);
        } else {
            // Filter by year
            list = list.filter(e => e.date.startsWith(`${selectedYear}-`));

            // Filter by month (if not all months selected)
            if (selectedMonth !== 0) {
                const monthStr = String(selectedMonth).padStart(2, '0');
                list = list.filter(e => e.date.startsWith(`${selectedYear}-${monthStr}`));
            }
        }

        // Filter by category
        if (filterCategory !== 'all') {
            if (filterCategory === 'ekadashi') {
                list = list.filter(e => e.type === 'ekadashi');
            } else if (filterCategory === 'appearance') {
                list = list.filter(e => e.type === 'appearance' || e.type === 'disappearance');
            } else if (filterCategory === 'festival') {
                list = list.filter(e => e.type === 'festival');
            }
        }

        return list;
    }, [selectedYear, selectedMonth, filterCategory, searchQuery]);

    // Format date string to display
    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
        const dayNamesBn = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
        const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const monthNamesBn = ['', 'জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];

        return {
            day: Number(d),
            dayNameBn: dayNamesBn[dateObj.getDay()],
            dayNameEn: dayNamesEn[dateObj.getDay()],
            monthBn: monthNamesBn[Number(m)],
            year: y
        };
    };

    // Check if event already exists in DMS Events
    const isEventSynced = (event) => {
        if (!existingDmsEvents || !Array.isArray(existingDmsEvents)) return false;
        return existingDmsEvents.some(dmsE => {
            const dateMatch = (dmsE.eventDate || '').startsWith(event.date);
            const nameMatch = (dmsE.name || '').toLowerCase().includes(event.name.toLowerCase().split(' ')[0]);
            return dateMatch && nameMatch;
        });
    };

    // Sync a single event to DMS events table
    const handleSyncSingleEvent = async (event) => {
        try {
            const payload = {
                name: `${event.bengaliName} (${event.name})`,
                eventDate: event.date,
                eventType: event.type === 'ekadashi' ? 'Ekadashi' : 'Festival',
                location: 'Sri Sri Radha Govinda Temple',
                description: event.mahatmyaBn || event.mahatmyaEn || 'Vaishnava Observance'
            };
            const res = await apiService.post('/api/events', payload);
            if (res.success) {
                toast.success(`'${event.name}' ইভেন্ট সফলভাবে মন্দিরের তালিকায় যোগ হয়েছে!`);
                if (fetchEvents) fetchEvents();
            } else {
                toast.error(res.error || 'Failed to sync event');
            }
        } catch (err) {
            console.error('Failed to sync event:', err);
            toast.error('ইভেন্ট যুক্ত করতে সমস্যা হয়েছে');
        }
    };

    // Bulk sync upcoming 10 events to DMS
    const handleBulkSync = async () => {
        setIsSyncing(true);
        try {
            const todayStr = new Date().toISOString().split('T')[0];
            const upcoming = getAllEvents().filter(e => e.date >= todayStr).slice(0, 10);
            let count = 0;

            for (const event of upcoming) {
                if (!isEventSynced(event)) {
                    await apiService.post('/api/events', {
                        name: `${event.bengaliName} (${event.name})`,
                        eventDate: event.date,
                        eventType: event.type === 'ekadashi' ? 'Ekadashi' : 'Festival',
                        location: 'Sri Sri Radha Govinda Temple',
                        description: event.mahatmyaBn || event.mahatmyaEn
                    });
                    count++;
                }
            }

            if (fetchEvents) await fetchEvents();
            toast.success(`${count}টি আসন্ন একাদশী ও উৎসব মন্দিরের ইভেন্ট তালিকায় সিঙ্ক হয়েছে!`);
        } catch (err) {
            console.error('Bulk sync failed:', err);
            toast.error('সিঙ্ক প্রক্রিয়া ব্যর্থ হয়েছে');
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Top Header Card */}
            <div className="bg-gradient-to-r from-[#3e2417] via-[#2f241a] to-[#1c3031] rounded-2xl p-6 sm:p-8 text-[#cde0dc] border border-[#4d3826] shadow-xl relative overflow-hidden">
                {/* Background decorative subtle warm blur circles */}
                <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-amber-600/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-orange-600/10 rounded-full blur-xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-0.5 rounded-full bg-[#1e2f30]/80 text-amber-300 text-[11px] font-black uppercase tracking-widest border border-amber-900/40 flex items-center gap-1.5 shadow-sm">
                                <Sparkles className="w-3 h-3 text-amber-400" />
                                শ্রীমায়াপুর ধাম সময়ভিত্তিক ক্যালেন্ডার
                            </span>
                            <span className="text-[11px] font-bold text-amber-200/80">
                                IST (UTC+05:30)
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#edd8bd] flex items-center gap-3 font-bangla">
                            <span>বৈষ্ণব ক্যালেন্ডার ও উৎসব হাব</span>
                            <span className="text-2xl">📿</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-[#9db7b1] max-w-2xl font-medium leading-relaxed font-bangla">
                            শ্রীশ্রী চৈতন্য মহাপ্রভু ও শ্রীল প্রভুপাদের পদাঙ্ক অনুসরণে একাদশী উপবাস, পারণ সময়সূচী, আবির্ভাব-তিরোভাব তিথি এবং হোয়াটসঅ্যাপ নোটিফিকেশন সমন্বিত কেন্দ্র।
                        </p>
                    </div>

                    {/* Top Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={() => setShowGuidelinesModal(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-[#1d3032]/80 hover:bg-[#253e40] text-[#cde0dc] rounded-xl text-xs font-bold border border-[#385c5e] transition-all shadow-sm"
                        >
                            <Utensils className="w-4 h-4 text-amber-400" />
                            <span>অনুকূল ও প্রতিকূল খাদ্য বিধি</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleBulkSync}
                            disabled={isSyncing}
                            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600/90 hover:bg-amber-600 text-amber-50 rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all border border-amber-500/50 disabled:opacity-50"
                        >
                            <CalendarCheck className={clsx("w-4 h-4", isSyncing && "animate-spin")} />
                            <span>{isSyncing ? 'সিঙ্ক হচ্ছে...' : 'ইভেন্টে যোগ করুন (Sync)'}</span>
                        </button>
                    </div>
                </div>

                {/* Live Countdown Mini Banner inside Header */}
                <div className="mt-6 pt-5 border-t border-[#3a4e50] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-[#cde0dc]">
                    <div className="bg-[#142324]/80 p-3.5 rounded-xl border border-[#274143] flex items-center gap-3 shadow-sm">
                        <div className="w-10 h-10 rounded-lg bg-amber-950/50 border border-amber-900/50 flex items-center justify-center text-lg font-bold text-amber-300">
                            🌸
                        </div>
                        <div>
                            <span className="text-[10px] uppercase font-bold text-amber-300/80 block">
                                {ekadashiInfo.isTodayEkadashi ? 'আজ একাদশী ব্রত' : 'পরবর্তী একাদশী'}
                            </span>
                            <p className="font-bold text-sm text-[#edd8bd]">
                                {ekadashiInfo.nextEkadashi?.bengaliName}
                            </p>
                            <p className="text-[11px] text-[#8faea8] font-medium">
                                {ekadashiInfo.nextEkadashi?.date} ({ekadashiInfo.daysRemaining === 0 ? 'আজ' : `${ekadashiInfo.daysRemaining} দিন বাকি`})
                            </p>
                        </div>
                    </div>

                    <div className="bg-[#142324]/80 p-3.5 rounded-xl border border-[#274143] flex items-center gap-3 shadow-sm">
                        <div className="w-10 h-10 rounded-lg bg-amber-950/50 border border-amber-900/50 flex items-center justify-center text-lg font-bold text-amber-300">
                            ⏰
                        </div>
                        <div>
                            <span className="text-[10px] uppercase font-bold text-amber-300/80 block">
                                পারণ সময়সূচী (Fast Breaking)
                            </span>
                            <p className="font-bold text-sm text-[#edd8bd]">
                                {ekadashiInfo.nextEkadashi?.paranaTime || 'শাস্ত্রীয় সময় অনুযায়ী'}
                            </p>
                            <p className="text-[11px] text-[#8faea8] font-medium">
                                {ekadashiInfo.nextEkadashi?.paranaDate} (মায়াপুর সময়)
                            </p>
                        </div>
                    </div>

                    <div className="bg-[#142324]/80 p-3.5 rounded-xl border border-[#274143] flex items-center justify-between sm:col-span-2 lg:col-span-1 shadow-sm">
                        <div>
                            <span className="text-[10px] uppercase font-bold text-amber-300/80 block">
                                হোয়াটসঅ্যাপ রিমাইন্ডার
                            </span>
                            <p className="text-xs text-[#8faea8] font-medium">
                                ভক্তদের মাঝে বার্তা পাঠান
                            </p>
                        </div>
                        <button
                            onClick={() => setSelectedEventForModal(ekadashiInfo.nextEkadashi)}
                            className="px-3 py-1.5 bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors border border-emerald-700/50"
                        >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>নোটিফিকেশন</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Navigation & Filters Bar */}
            <div className="bg-card p-5 rounded-2xl border border-border shadow-sm space-y-4">
                
                {/* Year Selector & Search */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    {/* Year Selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            বর্ষপঞ্জি:
                        </span>
                        <div className="flex bg-[#182a2b] border border-border p-1 rounded-xl">
                            {[2026, 2027].map(yr => (
                                <button
                                    key={yr}
                                    type="button"
                                    onClick={() => setSelectedYear(yr)}
                                    className={clsx(
                                        "px-4 py-1.5 rounded-lg text-xs font-black transition-all",
                                        selectedYear === yr
                                            ? "bg-amber-600 text-amber-50 shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {yr}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Search Input */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="একাদশী, উৎসব বা মাহাত্ম্য খুঁজুন (বাংলা / English)..."
                            className="w-full text-xs pl-9 pr-4 py-2.5 bg-[#1a2c2d] border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-foreground placeholder:text-muted-foreground"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Month Navigator Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 custom-scrollbar">
                    <button
                        type="button"
                        onClick={() => setSelectedMonth(0)}
                        className={clsx(
                            "px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all border",
                            selectedMonth === 0 && !searchQuery
                                ? "bg-amber-600 text-amber-50 border-amber-500 shadow-sm"
                                : "bg-[#182a2b] text-muted-foreground hover:text-foreground border-border/60"
                        )}
                    >
                        সব মাস (Full Year)
                    </button>
                    {MONTHS.map(m => (
                        <button
                            key={m.num}
                            type="button"
                            onClick={() => { setSelectedMonth(m.num); setSearchQuery(''); }}
                            className={clsx(
                                "px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all border",
                                selectedMonth === m.num && !searchQuery
                                    ? "bg-amber-600 text-amber-50 border-amber-500 shadow-sm"
                                    : "bg-[#182a2b] text-muted-foreground hover:text-foreground border-border/60"
                            )}
                        >
                            {m.nameBn} ({m.nameEn})
                        </button>
                    ))}
                </div>

                {/* Category Filters */}
                <div className="flex items-center gap-2 pt-2 border-t border-border overflow-x-auto">
                    {[
                        { id: 'all', label: 'সব তিথি ও উৎসব' },
                        { id: 'ekadashi', label: 'একাদশী ব্রত 📿' },
                        { id: 'appearance', label: 'আবির্ভাব ও তিরোভাব 🙏' },
                        { id: 'festival', label: 'প্রধান মহোৎসব 🪔' }
                    ].map(cat => (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => setFilterCategory(cat.id)}
                            className={clsx(
                                "px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all border",
                                filterCategory === cat.id
                                    ? "bg-amber-950/60 text-amber-300 border-amber-800 shadow-sm"
                                    : "border-border text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {cat.label}
                        </button>
                    ))}
                    <span className="text-xs text-muted-foreground ml-auto shrink-0 font-medium">
                        মোট {filteredEvents.length} টি অনুষ্ঠান
                    </span>
                </div>
            </div>

            {/* Events List / Grid */}
            {filteredEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredEvents.map(event => {
                        const dateInfo = formatDisplayDate(event.date);
                        const isSynced = isEventSynced(event);
                        const isEkadashi = event.type === 'ekadashi';

                        return (
                            <div
                                key={event.id}
                                className={clsx(
                                    "bg-card rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between overflow-hidden group",
                                    isEkadashi
                                        ? "border-amber-900/50 hover:border-amber-700/80"
                                        : "border-border hover:border-[#385c5e]"
                                )}
                            >
                                <div className="p-5 space-y-4">
                                    {/* Top Row: Date Badge & Event Type */}
                                    <div className="flex items-start justify-between gap-3">
                                        {/* Date Block */}
                                        <div className="flex items-center gap-3">
                                            <div className={clsx(
                                                "w-12 h-12 rounded-xl flex flex-col items-center justify-center shadow-sm shrink-0 border",
                                                isEkadashi
                                                    ? "bg-[#1d3334] text-amber-300 border-[#2e5052]"
                                                    : "bg-[#182a2b] text-[#cde0dc] border-[#274345]"
                                            )}>
                                                <span className="text-lg font-black leading-none">{dateInfo.day}</span>
                                                <span className="text-[10px] font-bold uppercase tracking-wider">{dateInfo.monthBn}</span>
                                            </div>
                                            <div>
                                                <span className="text-xs font-bold text-foreground block">
                                                    {dateInfo.dayNameBn} ({dateInfo.dayNameEn})
                                                </span>
                                                <span className="text-[11px] text-muted-foreground font-medium">
                                                    {event.date}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Paksha Badge */}
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={clsx(
                                                "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border",
                                                event.paksha === 'Gaura'
                                                    ? "bg-amber-950/60 text-amber-300 border-amber-900/40"
                                                    : "bg-indigo-950/60 text-indigo-300 border-indigo-900/40"
                                            )}>
                                                {event.paksha === 'Gaura' ? 'গৌর পক্ষ 🌕' : 'কৃষ্ণ পক্ষ 🌑'}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground capitalize">
                                                {event.type}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Event Title */}
                                    <div>
                                        <h3 className="text-base font-bold text-foreground leading-snug group-hover:text-amber-300 transition-colors font-bangla">
                                            {event.bengaliName}
                                        </h3>
                                        <p className="text-xs text-muted-foreground font-medium italic mt-0.5">
                                            {event.name}
                                        </p>
                                    </div>

                                    {/* Fasting & Rules Banner */}
                                    {event.fasting && (
                                        <div className="bg-amber-950/30 border border-amber-900/40 p-2.5 rounded-xl space-y-1.5 text-xs">
                                            <div className="flex items-center justify-between font-bold text-amber-300">
                                                <span className="flex items-center gap-1.5 font-bangla">
                                                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                                                    {event.fastingType || 'উপবাস ব্রত'}
                                                </span>
                                            </div>
                                            {event.paranaTime && (
                                                <div className="text-[11px] text-amber-300/80 font-medium flex items-center gap-1 pt-1 border-t border-amber-900/40">
                                                    <Clock className="w-3 h-3 text-amber-400" />
                                                    <span className="font-bangla">পারণ: {event.paranaTime}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Mahatmya Preview */}
                                    {event.mahatmyaBn && (
                                        <div className="text-xs text-muted-foreground line-clamp-3 bg-[#18292a] p-2.5 rounded-xl border border-border/60 italic font-bangla">
                                            "{event.mahatmyaBn}"
                                        </div>
                                    )}
                                </div>

                                {/* Card Footer Actions */}
                                <div className="p-3 bg-[#18292a] border-t border-border flex items-center justify-between gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedEventForModal(event)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-900/50 transition-colors shadow-sm"
                                    >
                                        <Share2 className="w-3.5 h-3.5" />
                                        <span>WhatsApp</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleSyncSingleEvent(event)}
                                        disabled={isSynced}
                                        className={clsx(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm",
                                            isSynced
                                                ? "text-muted-foreground bg-[#1a2c2d] border border-border/60 cursor-default"
                                                : "text-amber-300 bg-amber-950/50 hover:bg-amber-900/60 border border-amber-900/50"
                                        )}
                                    >
                                        {isSynced ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <CalendarCheck className="w-3.5 h-3.5 text-amber-400" />}
                                        <span>{isSynced ? 'সিঙ্ককৃত' : 'ইভেন্টে যোগ'}</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 space-y-3">
                    <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 text-2xl">
                        🔍
                    </div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                        কোনো তিথি বা অনুষ্ঠান পাওয়া যায়নি
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        অন্য কোনো মাস, বছর বা অনুসন্ধান শব্দ লিখে চেষ্টা করুন।
                    </p>
                    <button
                        type="button"
                        onClick={() => { setSearchQuery(''); setSelectedMonth(0); setFilterCategory('all'); }}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all"
                    >
                        ফিল্টার রিসেট করুন
                    </button>
                </div>
            )}

            {/* Fasting Guidelines Modal */}
            {showGuidelinesModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="px-6 py-5 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent dark:from-orange-500/20 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xl">
                                    🌾
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                        একাদশী উপবাস ব্রতের খাদ্য বিধি
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        অনুকূল ও প্রতিকূল খাদ্য তালিকা এবং পারণ বিধি
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowGuidelinesModal(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1 text-xs">
                            {/* Scriptural Quote */}
                            <div className="bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/60 p-4 rounded-xl space-y-1">
                                <p className="font-bold text-orange-900 dark:text-orange-200">
                                    📖 শাস্ত্রমহিমা ও মহাপ্রভুর উপদেশ:
                                </p>
                                <p className="text-orange-800 dark:text-orange-300 leading-relaxed italic">
                                    "{FASTING_GUIDELINES.spiritualSignificance}"
                                </p>
                            </div>

                            {/* Prohibited Items */}
                            <div className="space-y-3">
                                <h4 className="font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-2">
                                    <span>🚫 একাদশীতে বর্জনীয় সামগ্রী (Prohibited Items)</span>
                                </h4>
                                <div className="space-y-2">
                                    {FASTING_GUIDELINES.prohibitedItems.map((item, i) => (
                                        <div key={i} className="p-3 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-xl">
                                            <p className="font-bold text-rose-900 dark:text-rose-200">{item.nameBn}</p>
                                            <p className="text-rose-600 dark:text-rose-400 text-[11px]">{item.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Permitted Items */}
                            <div className="space-y-3">
                                <h4 className="font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                                    <span>✅ একাদশীতে গ্রহণীয় / অনুকল্প সামগ্রী (Permitted Items)</span>
                                </h4>
                                <div className="space-y-2">
                                    {FASTING_GUIDELINES.permittedItems.map((item, i) => (
                                        <div key={i} className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl">
                                            <p className="font-bold text-emerald-900 dark:text-emerald-200">{item.nameBn}</p>
                                            <p className="text-emerald-600 dark:text-emerald-400 text-[11px]">{item.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setShowGuidelinesModal(false)}
                                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-xs font-bold transition-all"
                            >
                                ঠিক আছে, বুঝেছি
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* WhatsApp Broadcast Modal */}
            <EkadashiBroadcastModal
                isOpen={!!selectedEventForModal}
                onClose={() => setSelectedEventForModal(null)}
                event={selectedEventForModal}
            />
        </div>
    );
};

export default VaishnavaCalendar;
