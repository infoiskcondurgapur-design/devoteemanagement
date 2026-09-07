import React, { useState, useEffect } from 'react';
import {
    FiTool, FiCheckCircle, FiAlertCircle, FiActivity,
    FiRefreshCcw, FiTrash2, FiFileText, FiShield
} from 'react-icons/fi';
import apiService from '../../services/api';

const AutoRepairHub = () => {
    const [health, setHealth] = useState({ status: 'loading', robot: 'unknown' });
    const [logs, setLogs] = useState([]);
    const [repairing, setRepairing] = useState(false);
    const [loadingLogs, setLoadingLogs] = useState(true);

    useEffect(() => {
        fetchHealth();
        fetchLogs();
    }, []);

    const fetchHealth = async () => {
        try {
            const data = await apiService.get('/api/system/health');
            setHealth(data);
        } catch (err) {
            setHealth({ status: 'unhealthy', error: err.message });
        }
    };

    const fetchLogs = async () => {
        setLoadingLogs(true);
        try {
            const data = await apiService.get('/api/system/logs');
            if (data.success) setLogs(data.data || []);
        } catch (err) {
            console.error("Failed to fetch logs:", err);
        } finally {
            setLoadingLogs(false);
        }
    };

    const handleRepair = async () => {
        setRepairing(true);
        try {
            const data = await apiService.post('/api/system/repair', {});
            if (data.success) {
                alert("Repair routines completed successfully!");
                fetchHealth();
                fetchLogs();
            }
        } catch (err) {
            alert("Repair failed: " + err.message);
        } finally {
            setRepairing(false);
        }
    };

    const resolveLog = async (id) => {
        try {
            await apiService.put(`/api/system/logs/${id}/resolve`, {});
            fetchLogs();
        } catch (err) {
            console.error("Resolve failed:", err);
        }
    };

    const handleClearLogs = async () => {
        if (!window.confirm("Are you sure you want to clear ALL logs? This cannot be undone.")) return;
        try {
            const data = await apiService.delete('/api/system/logs');
            if (data.success) {
                setLogs([]);
                fetchHealth();
            }
        } catch (err) {
            alert("Failed to clear logs: " + err.message);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <FiShield className="text-orange-600" />
                        System Maintenance & Auto-Repair
                    </h1>
                    <p className="text-gray-500 mt-2">Monitor system health and resolve automated bug reports.</p>
                </div>
                <button
                    onClick={handleRepair}
                    disabled={repairing}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all shadow-lg ${repairing
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-orange-600 text-white hover:bg-orange-700 active:scale-95'
                        }`}
                >
                    <FiRefreshCcw className={repairing ? 'animate-spin' : ''} />
                    {repairing ? 'Repairing...' : 'Run Auto-Repair Now'}
                </button>
            </div>

            {/* Health Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className={`p-3 rounded-full ${health.status === 'healthy' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {health.status === 'healthy' ? <FiCheckCircle size={24} /> : <FiAlertCircle size={24} />}
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">System Core</p>
                        <h3 className="text-xl font-bold text-gray-800 capitalize">{health.status}</h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className={`p-3 rounded-full ${health.robot === 'ready' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                        <FiActivity size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">WhatsApp Robot</p>
                        <h3 className="text-xl font-bold text-gray-800 capitalize">{health.robot}</h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                        <FiTool size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Inventory & Seva</p>
                        <h3 className="text-xl font-bold text-gray-800">Operational</h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                        <FiFileText size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">System Logs</p>
                        <h3 className="text-xl font-bold text-gray-800">{logs.length} Entries</h3>
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FiTool className="text-gray-400" />
                        Bug Finder & Activity Log
                    </h2>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handleClearLogs}
                            className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors border border-red-100"
                            title="Clear All Logs"
                        >
                            <FiTrash2 />
                            <span className="text-sm font-semibold">Clear All</span>
                        </button>
                        <button onClick={fetchLogs} className="text-orange-600 hover:bg-orange-50 p-2 rounded-lg transition-colors border border-orange-100">
                            <FiRefreshCcw />
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-sm font-semibold uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Source</th>
                                <th className="px-6 py-4">Message</th>
                                <th className="px-6 py-4">Time</th>
                                <th className="px-6 py-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loadingLogs ? (
                                <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400">Loading logs...</td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400">No issues found. System is clean!</td></tr>
                            ) : logs.map(log => (
                                <tr key={log.id} className={`hover:bg-gray-50 transition-colors ${log.resolved ? 'opacity-50' : ''}`}>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${log.type === 'error' ? 'bg-red-100 text-red-600' :
                                                log.type === 'repair' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {log.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-600 capitalize">{log.source}</td>
                                    <td className="px-6 py-4">
                                        <div className="max-w-md">
                                            <p className="font-semibold text-gray-800 truncate">{log.message}</p>
                                            {log.stack && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{log.stack}</p>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        {!log.resolved && (
                                            <button
                                                onClick={() => resolveLog(log.id)}
                                                className="text-green-600 hover:bg-green-50 p-2 rounded-lg transition-colors"
                                                title="Mark as Resolved"
                                            >
                                                <FiCheckCircle size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Planned Improvements Section */}
            <div className="mt-8 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-xl border border-slate-700 overflow-hidden text-white">
                <div className="p-6 border-b border-slate-700/50 flex items-center gap-3">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                        <FiShield className="text-orange-400" />
                    </div>
                    <h2 className="text-xl font-bold">Planned System Improvements</h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        { title: 'Advanced QR Engine', desc: 'Migrate to core Html5Qrcode for custom-branded UI and extreme stability.', icon: '⚡' },
                        { title: 'Access Control (RBAC)', desc: 'Multi-user authentication with Role-Based permissions (Admin, Counselor).', icon: '👤' },
                        { title: 'Real-Time Sync', desc: 'WebSocket integration for instant dashboard updates across all users.', icon: '🔄' },
                        { title: 'Data Scaling', desc: 'Server-side pagination and virtual lists for datasets > 10,000 devotees.', icon: '📈' },
                        { title: 'Cloud Resilience', desc: 'Automated multi-cloud backups (Dropbox/S3) for disaster recovery.', icon: '☁️' },
                        { title: 'Mobile PWA', desc: 'Progressive Web App support for offline access and home screen install.', icon: '📱' }
                    ].map((item, idx) => (
                        <div key={idx} className="bg-slate-700/30 p-4 rounded-xl border border-slate-600/50 hover:border-orange-500/50 transition-all group">
                            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform inline-block">{item.icon}</div>
                            <h4 className="font-bold text-orange-400 text-sm uppercase tracking-wider mb-1">{item.title}</h4>
                            <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AutoRepairHub;
