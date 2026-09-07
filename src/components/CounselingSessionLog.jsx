import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ChevronDown, Calendar, MessageSquare, Smile, Meh, Frown, Clock, RefreshCw } from 'lucide-react';
import { useToast } from './Toast';
import apiService from '../services/api';
import clsx from 'clsx';

const MOODS = [
    { label: 'Great', value: 'Great', icon: Smile, color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-200' },
    { label: 'Good', value: 'Good', icon: Smile, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200' },
    { label: 'Neutral', value: 'Neutral', icon: Meh, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200' },
    { label: 'Struggling', value: 'Struggling', icon: Frown, color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200' },
    { label: 'Needs Help', value: 'Needs Help', icon: Frown, color: 'text-red-500', bg: 'bg-red-50 border-red-200' },
];

const getMoodConfig = (mood) => MOODS.find(m => m.value === mood) || MOODS[1];

const today = () => new Date().toISOString().slice(0, 10);
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ─── Log Session Form ────────────────────────────────────────────────────────
const LogSessionForm = ({ devoteeId, devotee, onSaved, onCancel }) => {
    const toast = useToast();
    const [form, setForm] = useState({
        sessionDate: today(),
        mood: 'Good',
        notes: '',
        followUpDate: ''
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.notes.trim()) return toast.error('Please add session notes');
        setSaving(true);
        try {
            const data = await apiService.post('/api/counseling', {
                devoteeId,
                counselor: devotee?.counselor || '',
                ...form
            });
            if (!data.success) throw new Error(data.error);
            toast.success('Session logged!');
            onSaved();
        } catch (err) { toast.error(err.message); }
        finally { setSaving(false); }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Session Date</label>
                    <input type="date" value={form.sessionDate} onChange={e => setForm(f => ({ ...f, sessionDate: e.target.value }))}
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Follow-up Date</label>
                    <input type="date" value={form.followUpDate} onChange={e => setForm(f => ({ ...f, followUpDate: e.target.value }))}
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
            </div>

            <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Mood</label>
                <div className="flex flex-wrap gap-2">
                    {MOODS.map(m => (
                        <button type="button" key={m.value} onClick={() => setForm(f => ({ ...f, mood: m.value }))}
                            className={clsx('flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-xs font-semibold transition-all',
                                form.mood === m.value ? m.bg + ' ' + m.color : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-900/50')}>
                            <m.icon size={13} />{m.label}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Notes *</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    rows={4} placeholder="Session summary, spiritual progress, concerns discussed..."
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>

            <div className="flex gap-3 pt-1">
                <button type="button" onClick={onCancel} className="flex-1 border border-slate-200 dark:border-slate-700 rounded-lg py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900/50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
                    {saving ? 'Saving...' : 'Log Session'}
                </button>
            </div>
        </form>
    );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const CounselingSessionLog = ({ devoteeId, devotee }) => {
    const toast = useToast();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [expanded, setExpanded] = useState(new Set());

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const data = await apiService.get(`/api/counseling?devoteeId=${devoteeId}`);
            if (data.success) setSessions(data.data || []);
        } catch (err) { console.error('Failed to load sessions:', err); }
        finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this session?')) return;
        try {
            await apiService.delete(`/api/counseling/${id}`);
            toast.success('Session deleted');
            fetchSessions();
        } catch { toast.error('Failed to delete session'); }
    };

    useEffect(() => { fetchSessions(); }, [devoteeId]);

    const toggleExpand = (id) => setExpanded(prev => {
        const s = new Set(prev);
        s.has(id) ? s.delete(id) : s.add(id);
        return s;
    });

    return (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <MessageSquare size={18} className="text-slate-500 dark:text-slate-400" />
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">Counseling Sessions</h3>
                    {sessions.length > 0 && (
                        <span className="ml-1 text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{sessions.length}</span>
                    )}
                </div>
                <button onClick={() => setShowForm(v => !v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors">
                    <Plus size={13} /> Log Session
                </button>
            </div>

            {/* Add Session Form */}
            {showForm && (
                <div className="p-5 bg-blue-50/30 border-b border-blue-100">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">New Session</h4>
                    <LogSessionForm devoteeId={devoteeId} devotee={devotee}
                        onSaved={() => { setShowForm(false); fetchSessions(); }}
                        onCancel={() => setShowForm(false)} />
                </div>
            )}

            {/* Sessions Timeline */}
            {loading ? (
                <div className="p-8 flex justify-center"><RefreshCw size={22} className="text-slate-300 animate-spin" /></div>
            ) : sessions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500">
                    <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">No sessions logged yet</p>
                    <p className="text-xs mt-1">Click "Log Session" to add the first one</p>
                </div>
            ) : (
                <div className="divide-y divide-slate-50">
                    {sessions.map((session, i) => {
                        const moodCfg = getMoodConfig(session.mood);
                        const isExpanded = expanded.has(session.id);
                        return (
                            <div key={session.id} className="p-4 hover:bg-slate-50 dark:bg-slate-900/50/50 transition-colors">
                                <div className="flex items-start gap-3">
                                    {/* Timeline dot */}
                                    <div className="flex flex-col items-center">
                                        <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center border', moodCfg.bg)}>
                                            <moodCfg.icon size={16} className={moodCfg.color} />
                                        </div>
                                        {i < sessions.length - 1 && <div className="w-0.5 h-6 bg-slate-100 dark:bg-slate-800 mt-1" />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{formatDate(session.sessionDate)}</span>
                                            <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full border', moodCfg.bg, moodCfg.color)}>{session.mood}</span>
                                            {session.followUpDate && (
                                                <span className="flex items-center gap-1 text-xs text-amber-600">
                                                    <Clock size={11} /> Follow-up: {formatDate(session.followUpDate)}
                                                </span>
                                            )}
                                        </div>
                                        <div className={clsx('mt-2 text-sm text-slate-600 dark:text-slate-300 transition-all', isExpanded ? '' : 'line-clamp-2')}>
                                            {session.notes}
                                        </div>
                                        {session.notes?.length > 120 && (
                                            <button onClick={() => toggleExpand(session.id)}
                                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-1 font-medium">
                                                {isExpanded ? 'Show less' : 'Show more'}
                                                <ChevronDown size={12} className={clsx('transition-transform', isExpanded && 'rotate-180')} />
                                            </button>
                                        )}
                                    </div>

                                    <button onClick={() => handleDelete(session.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors shrink-0">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default CounselingSessionLog;
