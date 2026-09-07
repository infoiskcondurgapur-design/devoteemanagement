import React, { useState, useEffect, useMemo } from 'react';
import { formatDate } from '../lib/dateUtils';
import {
    Calendar, Users, CheckCircle2, Circle, Search, Plus, X,
    ChevronLeft, ChevronRight, Download, RefreshCw, BarChart3,
    Clock, AlertCircle, QrCode
} from 'lucide-react';
import { useDevotees } from '../context/DevoteeContext';
import { useToast } from '../components/Toast';
import clsx from 'clsx';
import QRScanner from '../components/QRScanner';
import apiService from '../services/api';
import ErrorBoundary from '../components/ErrorBoundary';

const EVENT_TYPES = ['Sunday Feast', 'Monday Seminar', 'Ekadashi', 'Festival', 'Retreat', 'Other'];

// ─── Helpers ────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().slice(0, 10);
// Centralized formatDate from dateUtils.js is used instead
// const formatDate = (d) => ...;

// ─── Create Event Modal ──────────────────────────────────────────────────────
const CreateEventModal = ({ onClose, onCreated }) => {
    const toast = useToast();
    const [form, setForm] = useState({ name: 'Sunday Feast', eventType: 'Sunday Feast', eventDate: today(), description: '', location: 'ISKCON Durgapur' });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.eventDate) return toast.error('Event name and date are required');
        setSaving(true);
        try {
            const data = await apiService.post('/api/events', form);
            if (!data.success) throw new Error(data.error);
            toast.success('Event created!');
            onCreated({ ...form, id: data.id });
            onClose();
        } catch (err) { toast.error(err.message); }
        finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-slate-900">Create New Event</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:text-slate-200" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Event Name *</label>
                        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Type</label>
                            <select value={form.eventType} onChange={e => setForm(f => ({ ...f, eventType: e.target.value }))}
                                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Date *</label>
                            <input type="date" value={form.eventDate} onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))}
                                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Location</label>
                        <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Description</label>
                        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            rows={2} className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900/50">Cancel</button>
                        <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
                            {saving ? 'Creating...' : 'Create Event'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── Mark Attendance Modal ───────────────────────────────────────────────────
const MarkAttendanceModal = ({ event, devotees, onClose, onSaved }) => {
    const toast = useToast();
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(new Set());
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // Pre-load already marked devotees
        apiService.get(`/api/attendance?eventName=${encodeURIComponent(event.name)}&eventDate=${event.eventDate}`)
            .then(data => {
                if (data.success) setSelected(new Set(data.data.map(x => x.devoteeId)));
            }).catch(() => { });
    }, [event]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return devotees.filter(d => d.name?.toLowerCase().includes(q) || d.initiatedName?.toLowerCase().includes(q) || d.counselor?.toLowerCase().includes(q));
    }, [devotees, search]);

    const toggle = (id) => {
        setSelected(prev => {
            const n = new Set(prev);
            n.has(id) ? n.delete(id) : n.add(id);
            return n;
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const data = await apiService.post('/api/attendance', { devoteeIds: [...selected], eventName: event.name, eventDate: event.eventDate });
            if (!data.success) throw new Error(data.error);
            toast.success(`Attendance saved — ${selected.size} devotees marked`);
            onSaved();
            onClose();
        } catch (err) { toast.error(err.message); }
        finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh]">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">{event.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formatDate(event.eventDate)} · {selected.size} selected</p>
                    </div>
                    <button onClick={onClose}><X size={20} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:text-slate-200" /></button>
                </div>
                <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="relative">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search devotees..."
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                    {filtered.map(dev => {
                        const isSelected = selected.has(dev.id);
                        return (
                            <button key={dev.id} onClick={() => toggle(dev.id)}
                                className={clsx('w-full flex items-center gap-3 p-2.5 rounded-lg transition-colors text-left', isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50 dark:bg-slate-900/50 border border-transparent')}>
                                {isSelected
                                    ? <CheckCircle2 size={18} className="text-blue-600 shrink-0" />
                                    : <Circle size={18} className="text-slate-300 shrink-0" />}
                                <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0">
                                    {dev.photo ? <img src={dev.photo} alt={dev.name} className="w-full h-full object-cover" /> : null}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{dev.initiatedName || dev.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{dev.counselor || dev.spiritualStatus}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                    <button onClick={() => setSelected(new Set(devotees.map(d => d.id)))}
                        className="text-xs font-medium text-blue-600 hover:underline">Select All ({devotees.length})</button>
                    <button onClick={() => setSelected(new Set())} className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:underline">Clear</button>
                    <div className="flex-1" />
                    <button onClick={onClose} className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900/50">Cancel</button>
                    <button onClick={handleSave} disabled={saving}
                        className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
                        {saving ? 'Saving...' : 'Save Attendance'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Main Attendance Page ────────────────────────────────────────────────────
const Attendance = () => {
    const { devotees } = useDevotees();
    const toast = useToast();
    const [tab, setTab] = useState('events');  // 'events' | 'summary'
    const [events, setEvents] = useState([]);
    const [recentEvents, setRecentEvents] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [showMark, setShowMark] = useState(null);    // event object
    const [activeScannerEvent, setActiveScannerEvent] = useState(null); // new
    const [summary, setSummary] = useState([]);
    const [loadingSum, setLoadingSum] = useState(false);
    const [search, setSearch] = useState('');

    const fetchAll = async () => {
        try {
            const [evRes, attRes] = await Promise.all([
                apiService.get('/api/events'),
                apiService.get('/api/attendance')
            ]);
            setEvents(evRes.data || []);
            setRecentEvents(attRes.data || []);
        } catch (err) {
            console.error('Failed to fetch attendance data:', err);
            setEvents([]);
            setRecentEvents([]);
        }
    };

    const handleScan = async (devoteeId) => {
        const devotee = devotees.find(d => d.id === devoteeId);
        if (!devotee) {
            toast.error('Invalid QR Code or Devotee Not Found');
            return;
        }
        
        try {
            const data = await apiService.post('/api/attendance', { 
                devoteeId,
                eventName: activeScannerEvent.name,
                eventDate: activeScannerEvent.eventDate
            });
            if (!data.success) throw new Error(data.error);
            
            toast.success(`✅ ${devotee.initiatedName || devotee.name} marked present!`);
            fetchAll(); // Refresh attendance count in background
        } catch (err) {
            toast.error(err.message);
        }
    };

    const fetchSummary = async () => {
        setLoadingSum(true);
        try {
            const res = await apiService.get('/api/attendance?summary=true');
            setSummary(res.data || []);
        } catch (err) {
            console.error('Failed to fetch summary:', err);
        } finally {
            setLoadingSum(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);
    useEffect(() => { if (tab === 'summary') fetchSummary(); }, [tab]);

    const handleDeleteEvent = async (id) => {
        if (!window.confirm('Delete this event?')) return;
        try {
            await apiService.delete(`/api/events/${id}`);
            toast.success('Event deleted');
            fetchAll();
        } catch {
            toast.error('Failed to delete event');
        }
    };

    const filteredSummary = summary.filter(d =>
        d.name?.toLowerCase().includes(search.toLowerCase()) ||
        d.initiatedName?.toLowerCase().includes(search.toLowerCase())
    );

    // Merge planned events with attendance events for the list
    const allEvents = useMemo(() => {
        const merged = [...events];
        recentEvents.forEach(re => {
            if (!merged.find(e => e.name === re.eventName && e.eventDate === re.eventDate)) {
                merged.push({ name: re.eventName, eventDate: re.eventDate, attendeeCount: re.attendeeCount, fromAttendance: true });
            }
        });
        return merged.sort((a, b) => b.eventDate?.localeCompare(a.eventDate));
    }, [events, recentEvents]);

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Track devotee attendance for all programs & events</p>
                </div>
                <button onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm">
                    <Plus size={16} /> New Event
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit">
                {[['events', Calendar, 'Events'], ['summary', BarChart3, 'Summary']].map(([id, Icon, label]) => (
                    <button key={id} onClick={() => setTab(id)}
                        className={clsx('flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all', tab === id ? 'bg-white dark:bg-slate-900 text-slate-900 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200')}>
                        <Icon size={15} /> {label}
                    </button>
                ))}
            </div>

            {/* Events Tab */}
            {tab === 'events' && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <h2 className="font-semibold text-slate-800 dark:text-slate-100">All Events</h2>
                        <button onClick={fetchAll} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:text-slate-200"><RefreshCw size={16} /></button>
                    </div>
                    {allEvents.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 dark:text-slate-500">
                            <Calendar size={40} className="mx-auto mb-3 opacity-40" />
                            <p className="font-medium">No events yet</p>
                            <p className="text-sm mt-1">Click "New Event" to create your first event</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {allEvents.map((event, i) => {
                                const att = recentEvents.find(r => r.eventName === event.name && r.eventDate === event.eventDate);
                                return (
                                    <div key={i} className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:bg-slate-900/50/60 transition-colors">
                                        <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                                            event.eventType === 'Sunday Feast' ? 'bg-amber-50 text-amber-600' :
                                                event.eventType === 'Ekadashi' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600')}>
                                            <Calendar size={18} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-slate-800 dark:text-slate-100">{event.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(event.eventDate)} {event.location ? `· ${event.location}` : ''}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200 lg:mr-4">
                                                <Users size={15} className="text-slate-400 dark:text-slate-500" />
                                                {att?.attendeeCount || 0}
                                            </span>
                                            <button onClick={() => setActiveScannerEvent(event)}
                                                className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-semibold hover:bg-green-100 transition-colors flex items-center gap-1.5">
                                                <QrCode size={14} /> <span className="hidden sm:inline">Scan</span>
                                            </button>
                                            <button onClick={() => setShowMark(event)}
                                                className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors">
                                                Manual
                                            </button>
                                            {!event.fromAttendance && (
                                                <button onClick={() => handleDeleteEvent(event.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors">
                                                    <X size={15} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Summary Tab */}
            {tab === 'summary' && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
                        <h2 className="font-semibold text-slate-800 dark:text-slate-100 flex-1">Devotee Attendance Summary</h2>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                                className="pl-8 pr-4 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48" />
                        </div>
                    </div>
                    {loadingSum ? (
                        <div className="p-12 text-center text-slate-400 dark:text-slate-500"><RefreshCw size={28} className="mx-auto animate-spin" /></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                    <tr>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Devotee</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Counselor</th>
                                        <th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Total</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Last Seen</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredSummary.map(d => (
                                        <tr key={d.id} className="hover:bg-slate-50 dark:bg-slate-900/50/50">
                                            <td className="px-4 py-3 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0">
                                                    {d.photo && <img src={d.photo} alt={d.name} className="w-full h-full object-cover" />}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800 dark:text-slate-100">{d.initiatedName || d.name}</p>
                                                    <p className="text-xs text-slate-400 dark:text-slate-500">{d.name}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{d.counselor || '—'}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={clsx('inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold',
                                                    d.totalAttendance >= 10 ? 'bg-green-100 text-green-700' :
                                                        d.totalAttendance >= 4 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400')}>
                                                    {d.totalAttendance}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{formatDate(d.lastSeen)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            <ErrorBoundary>
                {showCreate && <CreateEventModal onClose={() => setShowCreate(false)} onCreated={() => fetchAll()} />}
                {showMark && <MarkAttendanceModal event={showMark} devotees={devotees} onClose={() => setShowMark(null)} onSaved={fetchAll} />}
                {activeScannerEvent && <QRScanner onClose={() => setActiveScannerEvent(null)} onScan={handleScan} />}
            </ErrorBoundary>
        </div>
    );
};

export default Attendance;
