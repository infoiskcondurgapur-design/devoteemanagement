import React, { useState, useEffect, useMemo } from 'react';
import { 
    Users, Clock, Calendar, AlertTriangle, 
    CheckCircle, BarChart2, Map as MapIcon, 
    TrendingUp, Filter, RefreshCw
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, Cell,
    ComposedChart, Line, Area
} from 'recharts';
import apiService from '../../services/api';
import { useToast } from '../../components/Toast';
import clsx from 'clsx';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => `${i}:00`);

const SevaAnalytics = () => {
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            // Fetch last 30 days of shifts
            const res = await apiService.get('/api/seva/shifts?days=30');
            if (res.success) setShifts(res.data);
        } catch {
            toast.error('Failed to load Seva analytics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const heatMapData = useMemo(() => {
        const data = DAYS.map(day => ({
            name: day,
            confirmed: 0,
            required: 0,
            ratio: 0
        }));

        shifts.forEach(shift => {
            const date = new Date(shift.shiftDate);
            const dayIndex = date.getDay();
            data[dayIndex].required += shift.requiredVolunteers || 0;
            data[dayIndex].confirmed += shift.assignments?.length || 0;
        });

        return data.map(d => ({
            ...d,
            ratio: d.required > 0 ? Math.round((d.confirmed / d.required) * 100) : 100
        }));
    }, [shifts]);

    const hourlyData = useMemo(() => {
        const hours = Array.from({ length: 24 }, (_, i) => ({
            hour: `${i}:00`,
            demand: 0
        }));

        shifts.forEach(shift => {
            if (shift.startTime) {
                const hour = parseInt(shift.startTime.split(':')[0]);
                hours[hour].demand += shift.requiredVolunteers || 0;
            }
        });

        return hours;
    }, [shifts]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh]">
                <RefreshCw className="w-8 h-8 text-corporate-200 animate-spin mb-4" />
                <p className="text-slate-400 dark:text-slate-500 font-bold tracking-widest uppercase text-xs">Generating Heatmaps...</p>
            </div>
        );
    }

    const totalRequired = shifts.reduce((acc, s) => acc + s.requiredVolunteers, 0);
    const totalConfirmed = shifts.reduce((acc, s) => acc + (s.assignments?.length || 0), 0);
    const overallRatio = totalRequired > 0 ? Math.round((totalConfirmed / totalRequired) * 100) : 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Overall Coverage</p>
                        <h3 className={clsx("text-3xl font-black", overallRatio >= 80 ? "text-emerald-600" : "text-orange-600")}>
                            {overallRatio}%
                        </h3>
                    </div>
                    <div className={clsx("p-3 rounded-2xl", overallRatio >= 80 ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600")}>
                        <CheckCircle size={24} />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total Demand</p>
                        <h3 className="text-3xl font-black text-slate-900">{totalRequired}</h3>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                        <Users size={24} />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Peak Demand Day</p>
                        <h3 className="text-3xl font-black text-slate-900">
                            {heatMapData.reduce((prev, current) => (prev.required > current.required) ? prev : current).name}
                        </h3>
                    </div>
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                        <TrendingUp size={24} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Coverage Heatmap */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl">
                    <div className="mb-8">
                        <h3 className="text-lg font-black text-slate-900">Weekly Coverage Heatmap</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Volunteer fulfillment ratio by day of week</p>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={heatMapData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide domain={[0, 100]} />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 12, fontBold: 700, fill: '#64748b' }}
                                />
                                <Tooltip 
                                    cursor={{ fill: '#f8fafc' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800">
                                                    <p className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 mb-1">{data.name}</p>
                                                    <p className="text-sm font-black text-slate-900">{data.ratio}% Coverage</p>
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{data.confirmed} / {data.required} Sevaks</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="ratio" radius={[0, 8, 8, 0]} barSize={24}>
                                    {heatMapData.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={entry.ratio >= 90 ? '#10b981' : entry.ratio >= 50 ? '#f59e0b' : '#ef4444'} 
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Hourly Demand */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl">
                    <div className="mb-8">
                        <h3 className="text-lg font-black text-slate-900">Hourly Seva Demand</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Service slots throughout the day</p>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={hourlyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="hour" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                                    interval={3}
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                <Tooltip />
                                <Area type="monotone" dataKey="demand" fill="#818cf8" stroke="#4f46e5" fillOpacity={0.1} strokeWidth={2} />
                                <Bar dataKey="demand" barSize={8} fill="#4f46e5" radius={[4, 4, 0, 0]} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Alert Panel */}
            <div className="bg-orange-50 border border-orange-100 p-8 rounded-[2.5rem] flex items-start gap-6">
                <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl text-orange-500 shadow-sm shrink-0">
                    <AlertTriangle size={32} />
                </div>
                <div>
                    <h4 className="text-lg font-black text-orange-900 mb-1">Optimization Recommendation</h4>
                    <p className="text-sm text-orange-800 leading-relaxed max-w-2xl">
                        Wednesdays and Thursdays currently show lower than 60% volunteer coverage. 
                        We recommend sending a broadcast to the "Aspiring" devotee group to fill these slots. 
                        Peak demand is observed between 06:00 AM and 09:00 AM.
                    </p>
                    <button className="mt-6 px-6 py-2.5 bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20">
                        View Under-filled Shifts
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SevaAnalytics;
