import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import apiService from '../services/api';
import { CheckCircle2, XCircle, Clock, ArrowLeft, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

const STATUS_STYLES = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    approved: 'bg-green-100 text-green-800 border-green-300',
    rejected: 'bg-red-100 text-red-800 border-red-300',
    applied: 'bg-blue-100 text-blue-800 border-blue-300',
};

const STATUS_ICONS = {
    pending: Clock,
    approved: CheckCircle2,
    rejected: XCircle,
    applied: RefreshCw,
};

const AdminChangeRequests = () => {
    const { isAdmin, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');

    useEffect(() => {
        if (!isAuthenticated) { navigate('/login'); return; }
        fetchRequests();
    }, [activeTab]);

    const fetchRequests = async () => {
        try {
            const url = activeTab === 'pending' ? '/api/change-requests/pending' : '/api/change-requests/history';
            const res = await apiService.get(url);
            setRequests(res.data || []);
        } catch (err) {
            console.error('Failed to fetch requests:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        if (!window.confirm('Approve this change request? Changes will be applied to the devotee profile.')) return;
        try {
            await apiService.put(`/api/change-requests/${id}/approve`);
            toast.success('Change request approved and applied!');
            fetchRequests();
        } catch {
            toast.error('Failed to approve');
        }
    };

    const handleReject = async (id) => {
        if (!window.confirm('Reject this change request?')) return;
        try {
            await apiService.put(`/api/change-requests/${id}/reject`);
            toast.success('Change request rejected.');
            fetchRequests();
        } catch {
            toast.error('Failed to reject');
        }
    };

    if (!isAdmin) {
        navigate('/');
        return null;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 text-slate-500 hover:text-orange-600 rounded-lg hover:bg-slate-100 dark:bg-slate-800 transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Change Requests</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Review and approve/reject devotee change requests</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                {[
                    { key: 'pending', label: 'Pending', icon: Clock },
                    { key: 'history', label: 'All History', icon: RefreshCw },
                ].map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={clsx(
                            'px-4 py-2 rounded-lg text-sm font-bold transition-colors',
                            activeTab === key
                                ? 'bg-orange-600 text-white'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        )}
                    >
                        <Icon size={14} className="inline mr-1" /> {label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                </div>
            ) : requests.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                    <p className="text-slate-400">No {activeTab} change requests found.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Devotee</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Changes</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Requested By</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Date</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Status</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {requests.map(req => {
                                const StatusIcon = STATUS_ICONS[req.status] || Clock;
                                return (
                                    <tr key={req.id} className="hover:bg-slate-50 dark:bg-slate-900/50/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-slate-900 text-sm">{req.devoteeName || req.devoteeId}</div>
                                            <div className="text-xs text-slate-500">{req.devoteeContact}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm text-slate-700 dark:text-slate-300 max-w-xs">
                                                {Object.keys(JSON.parse(req.changes || '{}')).map(k => (
                                                    <div key={k} className="inline-block bg-slate-100 dark:bg-slate-800 rounded px-2 py-0.5 text-xs m-0.5">
                                                        {k}: {JSON.parse(req.changes || '{}')[k]}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{req.requestedByName || req.requestedBy}</td>
                                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                                            {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : '--'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={clsx(
                                                'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border',
                                                STATUS_STYLES[req.status] || STATUS_STYLES.pending
                                            )}>
                                                <StatusIcon size={12} />
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {req.status === 'pending' && (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleApprove(req.id)}
                                                        className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(req.id)}
                                                        className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminChangeRequests;
