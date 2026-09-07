import React, { useState, useMemo } from 'react';
import { useDevotees } from '../../context/DevoteeContext';
import { useSadhana } from '../../context/SadhanaContext';
import { Search, User, ChevronRight, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { COUNSELORS_LIST } from '../../data/counselors';

const CounselorDashboard = () => {
    const { devotees } = useDevotees();
    const { getEntriesByDevotee } = useSadhana();

    // extract unique counselors
    const counselors = useMemo(() => {
        // Merge used counselors with static list to ensure coverage
        const used = new Set(devotees.map(d => d.counselor).filter(c => c));
        const all = new Set([...COUNSELORS_LIST, ...used]);
        return Array.from(all).sort();
    }, [devotees]);

    const [selectedCounselor, setSelectedCounselor] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Filter devotees by counselor
    const myCounselees = useMemo(() => {
        if (!selectedCounselor) return [];
        return devotees.filter(d =>
            d.counselor === selectedCounselor &&
            d.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [selectedCounselor, devotees, searchTerm]);

    // Analyze sadhana status
    const getSadhanaStatus = (devoteeId) => {
        const entries = getEntriesByDevotee(devoteeId);
        if (entries.length === 0) return { status: 'none', label: 'No Data' };

        const lastEntry = new Date(entries[0].date);
        const today = new Date();
        const diffDays = Math.floor((today - lastEntry) / (1000 * 60 * 60 * 24));

        if (diffDays > 3) return { status: 'alert', label: 'Inactive (>3 days)' };
        if (diffDays > 1) return { status: 'warning', label: 'Missed Yesterday' };
        return { status: 'good', label: 'Active' };
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between gap-4 items-end md:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Counselor Portal</h1>
                    <p className="text-slate-500 dark:text-slate-400">Monitor spiritual progress of your group.</p>
                </div>

                {/* Counselor Selector (Simulating Logic) */}
                <div className="w-full md:w-72">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">View As Counselor</label>
                    <select
                        value={selectedCounselor}
                        onChange={e => setSelectedCounselor(e.target.value)}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20"
                    >
                        <option value="">-- Select Your Name --</option>
                        {counselors.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            {!selectedCounselor ? (
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 border-dashed rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400">
                    <User className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <h3 className="text-lg font-medium text-slate-900">Select Identity</h3>
                    <p>Please select your name from the dropdown to view your group.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <div className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Total Counselees</div>
                            <div className="text-3xl font-bold text-slate-900">{myCounselees.length}</div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <div className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Needs Attention</div>
                            <div className="text-3xl font-bold text-red-600">
                                {myCounselees.filter(d => getSadhanaStatus(d.id).status === 'alert').length}
                            </div>
                        </div>
                    </div>

                    {/* List */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="font-bold text-slate-900">My Group</h3>
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none"
                                />
                            </div>
                        </div>
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Devotee</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Sadhana Check</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {myCounselees.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">No devotees found assigned to you.</td>
                                    </tr>
                                ) : myCounselees.map(devotee => {
                                    const sadhana = getSadhanaStatus(devotee.id);
                                    return (
                                        <tr key={devotee.id} className="hover:bg-slate-50 dark:bg-slate-900/50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <img src={devotee.photo || '/default-avatar.png'} alt={devotee.name} className="w-10 h-10 rounded-full object-cover" />
                                                    <div>
                                                        <div className="font-medium text-slate-900">{devotee.name}</div>
                                                        <div className="text-xs text-orange-600">{devotee.initiatedName || 'Uninitiated'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${devotee.spiritualStatus === 'Initiated' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100'}`}>
                                                    {devotee.spiritualStatus}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`flex items-center gap-2 text-sm font-medium
                                                    ${sadhana.status === 'alert' ? 'text-red-600' :
                                                        sadhana.status === 'warning' ? 'text-amber-600' : 'text-green-600'}
                                                `}>
                                                    {sadhana.status === 'alert' && <AlertTriangle className="w-4 h-4" />}
                                                    {sadhana.status === 'warning' && <Clock className="w-4 h-4" />}
                                                    {sadhana.status === 'good' && <CheckCircle className="w-4 h-4" />}
                                                    {sadhana.label}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link to={`/devotees/${devotee.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700">
                                                    View Profile <ChevronRight className="w-4 h-4" />
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CounselorDashboard;
