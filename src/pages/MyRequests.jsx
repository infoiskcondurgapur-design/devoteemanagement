import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import { CheckCircle2, Clock, XCircle, RefreshCw, ArrowLeft, FileEdit } from 'lucide-react';
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

const STATUS_LABELS = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    applied: 'Applied',
};

const MyRequests = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) { navigate('/login'); return; }
        fetchRequests();
    }, [isAuthenticated]);

    const fetchRequests = async () => {
        try {
            const res = await apiService.get('/api/change-requests/mine');
            setRequests(res.data || []);
        } catch {
            console.error('Failed to fetch my requests');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 text-slate-500 hover:text-orange-600 rounded-lg hover:bg-slate-100 dark:bg-slate-800 transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Change Requests</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Track the status of your submitted requests</p>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                </div>
            ) : requests.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                    <FileEdit size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="text-slate-400">No change requests submitted yet.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {requests.map(req => {
                        const StatusIcon = STATUS_ICONS[req.status] || Clock;
                        const changes = (() => {
                            try { return JSON.parse(req.changes || '{}'); } catch { return {}; }
                        })();
                        return (
                            <div key={req.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="font-bold text-slate-900 text-sm">
                                            {req.devoteeName || req.devoteeId}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1">
                                            {req.createdAt ? new Date(req.createdAt).toLocaleString() : '--'}
                                        </div>
                                    </div>
                                    <span className={clsx(
                                        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border shrink-0',
                                        STATUS_STYLES[req.status] || STATUS_STYLES.pending
                                    )}>
                                        <StatusIcon size={12} />
                                        {STATUS_LABELS[req.status] || req.status}
                                    </span>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {Object.entries(changes).map(([k, v]) => (
                                        <span key={k} className="inline-block bg-slate-100 dark:bg-slate-800 rounded px-2 py-0.5 text-xs text-slate-700 dark:text-slate-300">
                                            <span className="font-bold capitalize">{k}:</span> {v}
                                        </span>
                                    ))}
                                </div>

                                {req.reason && (
                                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 italic">
                                        "{req.reason}"
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MyRequests;