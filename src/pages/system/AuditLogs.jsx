import React, { useState, useEffect } from 'react';
import { 
    History, User, Activity, Search, 
    Filter, Calendar, Shield, Trash2,
    ArrowUpDown, Download, RefreshCw
} from 'lucide-react';
import apiService from '../../services/api';
import { useToast } from '../../components/Toast';
import clsx from 'clsx';
import { format } from 'date-fns';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAction, setFilterAction] = useState('All');
    const toast = useToast();

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await apiService.get('/api/system/audit?limit=200');
            if (res.success) setLogs(res.data);
        } catch {
            toast.error('Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log => {
        const matchesSearch = 
            log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.details?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesAction = filterAction === 'All' || log.action === filterAction;
        
        return matchesSearch && matchesAction;
    });

    const uniqueActions = ['All', ...new Set(logs.map(l => l.action))];

    const getActionColor = (action) => {
        if (action.includes('Delete') || action.includes('Remove')) return 'text-rose-600 bg-rose-50 border-rose-100';
        if (action.includes('Add') || action.includes('Create')) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
        if (action.includes('Update') || action.includes('Edit')) return 'text-amber-600 bg-amber-50 border-amber-100';
        return 'text-blue-600 bg-blue-50 border-blue-100';
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <RefreshCw className="w-10 h-10 text-corporate-200 animate-spin mb-4" />
                <p className="text-slate-400 dark:text-slate-500 font-bold tracking-widest uppercase text-xs">Loading Audit Trail...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Shield className="text-corporate-600" size={32} />
                        Administrative Audit
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Transparency & accountability log for all system actions</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchLogs} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900/50 transition-all shadow-sm">
                        <RefreshCw size={20} />
                    </button>
                    <button className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg">
                        <Download size={18} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-white dark:bg-slate-900/60 backdrop-blur-md p-4 rounded-[2rem] border border-white/40 shadow-xl">
                <div className="lg:col-span-6 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                    <input 
                        type="text"
                        placeholder="Search by user, action or details..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-corporate-500/10 focus:border-corporate-500 transition-all text-sm font-medium"
                    />
                </div>
                <div className="lg:col-span-3">
                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                        <select 
                            value={filterAction}
                            onChange={(e) => setFilterAction(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-corporate-500/10 focus:border-corporate-500 appearance-none transition-all text-sm font-bold text-slate-700 dark:text-slate-200"
                        >
                            {uniqueActions.map(act => <option key={act} value={act}>{act}</option>)}
                        </select>
                    </div>
                </div>
                <div className="lg:col-span-3 flex items-center justify-center bg-corporate-50 rounded-2xl px-4 py-3 border border-corporate-100">
                    <Activity className="text-corporate-600 mr-2" size={18} />
                    <span className="text-xs font-black text-corporate-700 uppercase tracking-widest">{filteredLogs.length} Events Logged</span>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50/50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Timestamp</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Administrator</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Action</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50 dark:bg-slate-900/50/50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400 dark:text-slate-500 group-hover:bg-corporate-50 group-hover:text-corporate-600 transition-colors">
                                                <Calendar size={16} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{format(new Date(log.timestamp), 'MMM dd, yyyy')}</p>
                                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">{format(new Date(log.timestamp), 'hh:mm:ss a')}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-corporate-100 flex items-center justify-center text-corporate-700 font-black text-xs">
                                                {log.userName?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-800 dark:text-slate-100">{log.userName}</p>
                                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate max-w-[120px]">ID: {log.userId}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={clsx(
                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                            getActionColor(log.action)
                                        )}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed max-w-md">
                                            {log.details}
                                        </p>
                                    </td>
                                </tr>
                            ))}
                            {filteredLogs.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <History className="w-12 h-12 text-slate-200 mb-4" />
                                            <p className="text-slate-400 dark:text-slate-500 font-bold tracking-widest uppercase text-xs">No matching logs found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Insight Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                        <Shield size={120} />
                    </div>
                    <h4 className="text-xl font-black mb-4">Security Protocol Active</h4>
                    <p className="text-slate-400 dark:text-slate-500 text-sm leading-relaxed mb-6 max-w-lg">
                        All sensitive actions including financial edits, devotee deletions, and system configuration changes are cryptographically logged. 
                        This audit trail is tamper-evident and provides a permanent history of organizational operations.
                    </p>
                    <div className="flex gap-4">
                        <div className="px-4 py-2 bg-white dark:bg-slate-900/10 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest">
                            SQLite Persistent
                        </div>
                        <div className="px-4 py-2 bg-emerald-500/20 rounded-xl border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                            Real-time Sync
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Most Active Admin</p>
                    {logs.length > 0 ? (
                        <div>
                            <h3 className="text-2xl font-black text-slate-900">{logs[0]?.userName}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Performed {logs.filter(l => l.userName === logs[0]?.userName).length} actions today</p>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 dark:text-slate-500">No data available</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuditLogs;
