import React, { useState, useEffect } from 'react';
import { useSadhana } from '../context/SadhanaContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Plus, Trash, Sun, CheckCircle } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

const SadhanaLog = ({ devoteeId }) => {
    const { addEntry, fetchSadhanaByDevotee, getEntriesByDevotee, deleteEntry } = useSadhana();
    
    useEffect(() => {
        if (devoteeId) {
            fetchSadhanaByDevotee(devoteeId);
        }
    }, [devoteeId, fetchSadhanaByDevotee]);

    const entries = getEntriesByDevotee(devoteeId);

    // Sort entries by date (ascending for chart)
    const chartData = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-7); // Last 7 entries

    const [newEntry, setNewEntry] = useState({
        date: new Date().toISOString().split('T')[0],
        roundsChanted: '',
        readingTime: '',
        lectureTime: '',
        bhagavatamClass: false,
        mangalaArati: false,
        notes: ''
    });

    const [isConfirming, setIsConfirming] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsConfirming(true);
    };

    const confirmSubmit = () => {
        addEntry({ ...newEntry, devoteeId });
        setNewEntry({
            date: new Date().toISOString().split('T')[0],
            roundsChanted: '',
            readingTime: '',
            lectureTime: '',
            bhagavatamClass: false,
            mangalaArati: false,
            notes: ''
        });
        setIsConfirming(false);
    };

    return (
        <div className="space-y-8">
            {/* 1. Add Entry Form */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Daily Sadhana Log
                </h3>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Date</label>
                        <input
                            type="date"
                            required
                            value={newEntry.date}
                            onChange={e => setNewEntry({ ...newEntry, date: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Rounds (1-64)</label>
                        <input
                            type="number"
                            required
                            min="0"
                            max="64"
                            placeholder="e.g. 16"
                            value={newEntry.roundsChanted}
                            onChange={e => setNewEntry({ ...newEntry, roundsChanted: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Reading (Mins)</label>
                        <input
                            type="number"
                            min="0"
                            placeholder="Mins"
                            value={newEntry.readingTime}
                            onChange={e => setNewEntry({ ...newEntry, readingTime: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Lecture (Mins)</label>
                        <input
                            type="number"
                            min="0"
                            placeholder="Mins"
                            value={newEntry.lectureTime}
                            onChange={e => setNewEntry({ ...newEntry, lectureTime: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                        />
                    </div>

                    {/* Checkboxes Group */}
                    <div className="flex flex-col gap-2 pb-2">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-orange-600 focus:ring-orange-500"
                                checked={newEntry.mangalaArati}
                                onChange={e => setNewEntry({ ...newEntry, mangalaArati: e.target.checked })}
                            />
                            <label className="text-xs font-medium text-slate-700 dark:text-slate-200">Mangala Arati</label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-orange-600 focus:ring-orange-500"
                                checked={newEntry.bhagavatamClass}
                                onChange={e => setNewEntry({ ...newEntry, bhagavatamClass: e.target.checked })}
                            />
                            <label className="text-xs font-medium text-slate-700 dark:text-slate-200">SB Class</label>
                        </div>
                    </div>

                    <button type="submit" className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-medium text-sm h-10">
                        Submit
                    </button>
                </form>
            </div>

            {/* 2. Visualization & List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                    <h4 className="text-sm font-bold text-slate-900 mb-6">Activity Trends (Last 7 Logs)</h4>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(val) => new Date(val).getDate()}
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                <Bar name="Rounds" dataKey="roundsChanted" fill="#f97316" radius={[4, 4, 0, 0]} />
                                <Bar name="Reading (min)" dataKey="readingTime" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar name="Hearing (min)" dataKey="lectureTime" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent History */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col">
                    <h4 className="text-sm font-bold text-slate-900 mb-4">Recent Logs</h4>
                    <div className="flex-1 overflow-y-auto max-h-64 space-y-3 pr-2">
                        {entries.length === 0 && <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-8">No logs yet.</p>}
                        {entries.map(entry => (
                            <div key={entry.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 group hover:border-orange-200 transition-colors">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{entry.date}</span>
                                        {entry.mangalaArati && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-bold">MA</span>}
                                        {entry.bhagavatamClass && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">SB</span>}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
                                        <span>📿 {entry.roundsChanted} rds</span>
                                        {entry.readingTime > 0 && <span>📖 {entry.readingTime}m Read</span>}
                                        {entry.lectureTime > 0 && <span>🎧 {entry.lectureTime}m Listen</span>}
                                    </div>
                                </div>
                                <button
                                    onClick={() => deleteEntry(entry.id)}
                                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Trash className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={isConfirming}
                onClose={() => setIsConfirming(false)}
                onConfirm={confirmSubmit}
                title="Confirm Submission"
                message="Are you sure you want to submit this sadhana entry?"
                confirmText="Yes"
                cancelText="No"
                variant="primary"
            />
        </div>
    );
};

export default SadhanaLog;
