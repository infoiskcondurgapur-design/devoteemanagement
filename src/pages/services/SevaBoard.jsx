import React, { useState, useEffect, useMemo } from 'react';
import {
    Briefcase, Plus, Trash2, Search, RefreshCw, X,
    ChevronDown, Users, CheckCircle, Clock, UserPlus
} from 'lucide-react';
import { useDevotees } from '../../context/DevoteeContext';
import { useToast } from '../../components/Toast';
import apiService from '../../services/api';
import SevaScheduler from './SevaScheduler';
import SevaAnalytics from './SevaAnalytics';
import clsx from 'clsx';

const DEPARTMENTS = [
    'Deity Worship', 'Kitchen', 'Book Distribution', 'Preaching',
    'IT & Media', 'Accounts', 'Security', 'Education', 'Counseling', 'Other'
];

const DEPT_COLORS = {
    'Deity Worship':    { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', dot: 'bg-orange-500' },
    'Kitchen':          { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  dot: 'bg-amber-500' },
    'Book Distribution':{ bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   dot: 'bg-blue-500' },
    'Preaching':        { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', dot: 'bg-indigo-500' },
    'IT & Media':       { bg: 'bg-cyan-50',   border: 'border-cyan-200',   text: 'text-cyan-700',   dot: 'bg-cyan-500' },
    'Accounts':         { bg: 'bg-emerald-50',border: 'border-emerald-200',text: 'text-emerald-700',dot: 'bg-emerald-500' },
    'Security':         { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    dot: 'bg-red-500' },
    'Education':        { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', dot: 'bg-violet-500' },
    'Counseling':       { bg: 'bg-rose-50',   border: 'border-rose-200',   text: 'text-rose-700',   dot: 'bg-rose-500' },
    'Other':            { bg: 'bg-slate-50 dark:bg-slate-900/50',  border: 'border-slate-200 dark:border-slate-700',  text: 'text-slate-700 dark:text-slate-200',  dot: 'bg-slate-400' },
};

const AssignModal = ({ devotees, existingIds, onClose, onAssign }) => {
    const [search, setSearch] = useState('');
    const [dept, setDept] = useState(DEPARTMENTS[0]);
    const [role, setRole] = useState('');
    const [selected, setSelected] = useState(null);
    const [saving, setSaving] = useState(false);
    const toast = useToast();

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return devotees.filter(d =>
            !existingIds.has(d.id) &&
            (d.name?.toLowerCase().includes(q) || d.initiatedName?.toLowerCase().includes(q))
        ).slice(0, 30);
    }, [devotees, search, existingIds]);

    const handleSave = async () => {
        if (!selected) return toast.error('Please select a devotee');
        setSaving(true);
        try {
            await onAssign({ devoteeId: selected.id, department: dept, role });
            onClose();
        } catch(e) { toast.error(e.message); }
        finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[85vh]">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">Assign Seva</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:text-slate-200" /></button>
                </div>

                <div className="p-4 space-y-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Department</label>
                            <select value={dept} onChange={e => setDept(e.target.value)}
                                className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Role (Optional)</label>
                            <input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Head Cook"
                                className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                        </div>
                    </div>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search devotee..."
                            className="w-full pl-8 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    {filtered.length === 0 && <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-8">No devotees found</p>}
                    {filtered.map(dev => (
                        <button key={dev.id} onClick={() => setSelected(dev)}
                            className={clsx('w-full flex items-center gap-3 p-2.5 rounded-lg transition-colors text-left',
                                selected?.id === dev.id ? 'bg-orange-50 border border-orange-200' : 'hover:bg-slate-50 dark:bg-slate-900/50 border border-transparent')}>
                            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0">
                                {dev.photo && <img src={dev.photo} alt="" className="w-full h-full object-cover" />}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{dev.initiatedName || dev.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{dev.counselor || dev.spiritualStatus}</p>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                    <button onClick={onClose} className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900/50">Cancel</button>
                    <button onClick={handleSave} disabled={saving || !selected}
                        className="flex-1 bg-orange-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-orange-700 disabled:opacity-60">
                        {saving ? 'Assigning...' : 'Assign Seva'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const SevaBoard = () => {
    const { devotees } = useDevotees();
    const toast = useToast();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAssign, setShowAssign] = useState(false);
    const [filterDept, setFilterDept] = useState('All');
    const [filterStatus, setFilterStatus] = useState('Active');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('board'); // 'board', 'scheduler', or 'analytics'

    const fetchAll = async () => {
        setLoading(true);
        try {
            const data = await apiService.get('/api/seva');
            if (data.success) setAssignments(data.data || []);
        } catch { toast.error('Failed to load seva assignments'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchAll(); }, []);

    const handleAssign = async (body) => {
        try {
            const data = await apiService.post('/api/seva', body);
            if (!data.success) throw new Error(data.error);
            toast.success('Seva assigned!');
            fetchAll();
        } catch (err) {
            toast.error(err.message || 'Failed to assign seva');
        }
    };

    const handleToggleStatus = async (a) => {
        const newStatus = a.status === 'Active' ? 'On Leave' : 'Active';
        try {
            await apiService.put(`/api/seva/${a.id}`, { status: newStatus });
            setAssignments(prev => prev.map(x => x.id === a.id ? { ...x, status: newStatus } : x));
        } catch {
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Remove this seva assignment?')) return;
        try {
            await apiService.delete(`/api/seva/${id}`);
            toast.success('Assignment removed');
            setAssignments(prev => prev.filter(x => x.id !== id));
        } catch {
            toast.error('Failed to remove assignment');
        }
    };

    const existingIds = useMemo(() => new Set(assignments.map(a => a.devoteeId)), [assignments]);

    const filtered = useMemo(() => assignments.filter(a => {
        if (filterDept !== 'All' && a.department !== filterDept) return false;
        if (filterStatus !== 'All' && a.status !== filterStatus) return false;
        if (searchTerm) {
            const q = searchTerm.toLowerCase();
            return (a.devoteeName || '').toLowerCase().includes(q) || 
                   (a.initiatedName || '').toLowerCase().includes(q) ||
                   (a.role || '').toLowerCase().includes(q);
        }
        return true;
    }), [assignments, filterDept, filterStatus, searchTerm]);

    const grouped = useMemo(() => {
        const g = {};
        filtered.forEach(a => {
            if (!g[a.department]) g[a.department] = [];
            g[a.department].push(a);
        });
        return g;
    }, [filtered]);

    const activeDepts = filterDept === 'All' ? Object.keys(grouped) : [filterDept];

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Seva Management</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{assignments.filter(a => a.status === 'Active').length} active sevaks across {new Set(assignments.map(a => a.department)).size} departments</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchAll} className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-900/50 transition-colors">
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={() => setShowAssign(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-corporate-600 text-white rounded-lg text-sm font-semibold hover:bg-corporate-700 transition-colors shadow-sm">
                        <UserPlus size={16} /> Assign Seva
                    </button>
                </div>
            </div>

            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
                <button onClick={() => setActiveTab('board')} className={clsx("px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all", activeTab === 'board' ? "bg-white dark:bg-slate-900 text-slate-900 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:bg-slate-200")}>Seva Board</button>
                <button onClick={() => setActiveTab('scheduler')} className={clsx("px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all", activeTab === 'scheduler' ? "bg-white dark:bg-slate-900 text-slate-900 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:bg-slate-200")}>Scheduler</button>
                <button onClick={() => setActiveTab('analytics')} className={clsx("px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all", activeTab === 'analytics' ? "bg-white dark:bg-slate-900 text-slate-900 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:bg-slate-200")}>Analytics</button>
            </div>

            {activeTab === 'scheduler' ? (
                <SevaScheduler />
            ) : activeTab === 'analytics' ? (
                <SevaAnalytics />
            ) : (
                <>
                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Total Sevaks', value: assignments.length, color: 'text-slate-800 dark:text-slate-100' },
                    { label: 'Active', value: assignments.filter(a => a.status === 'Active').length, color: 'text-emerald-600' },
                    { label: 'On Leave', value: assignments.filter(a => a.status === 'On Leave').length, color: 'text-amber-600' },
                    { label: 'Departments', value: new Set(assignments.map(a => a.department)).size, color: 'text-blue-600' },
                ].map((s, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{s.label}</p>
                        <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex flex-wrap gap-2">
                    <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
                        className="border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-corporate-500">
                        <option value="All">All Departments</option>
                        {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                    </select>
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                        {['All', 'Active', 'On Leave'].map(s => (
                            <button key={s} onClick={() => setFilterStatus(s)}
                                className={clsx('px-3 py-1 text-sm font-bold rounded-md transition-all uppercase tracking-wider', 
                                    filterStatus === s ? 'bg-white dark:bg-slate-900 text-corporate-600 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200')}>
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="relative w-full md:w-64">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input 
                        type="text" 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        placeholder="Search sevaks..."
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-corporate-500"
                    />
                </div>
            </div>

            {/* Department Groups */}
            {loading ? (
                <div className="text-center py-20 text-slate-400 dark:text-slate-500">
                    <RefreshCw size={32} className="mx-auto animate-spin mb-3" />
                    <p className="text-sm">Loading assignments...</p>
                </div>
            ) : activeDepts.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                    <Briefcase size={40} className="mx-auto mb-3 text-slate-300" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">No seva assignments yet</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Click "Assign Seva" to get started</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {activeDepts.sort().map(dept => {
                        const color = DEPT_COLORS[dept] || DEPT_COLORS['Other'];
                        const members = grouped[dept] || [];
                        return (
                            <div key={dept} className={`bg-white dark:bg-slate-900 rounded-xl border ${color.border} shadow-sm overflow-hidden`}>
                                <div className={`${color.bg} px-5 py-3 flex items-center gap-3 border-b ${color.border}`}>
                                    <div className={`w-2.5 h-2.5 rounded-full ${color.dot}`} />
                                    <h3 className={`text-sm font-bold ${color.text}`}>{dept}</h3>
                                    <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-900/70 ${color.text}`}>{members.length} sevak{members.length !== 1 ? 's' : ''}</span>
                                </div>
                                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {members.map(a => (
                                        <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:border-slate-700 transition-colors">
                                            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
                                                {a.photo && <img src={a.photo} alt="" className="w-full h-full object-cover" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{a.initiatedName || a.devoteeName}</p>
                                                {a.role && <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{a.role}</p>}
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                <button onClick={() => handleToggleStatus(a)}
                                                    className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors',
                                                        a.status === 'Active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200')}>
                                                    {a.status}
                                                </button>
                                                <button onClick={() => handleDelete(a.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

                </>
            )}

            {showAssign && (
                <AssignModal devotees={devotees} existingIds={existingIds} onClose={() => setShowAssign(false)} onAssign={handleAssign} />
            )}
        </div>
    );
};

export default SevaBoard;
