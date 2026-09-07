import React, { useState, useEffect, useMemo } from 'react';
import { 
    TrendingUp, TrendingDown, Target, 
    ArrowUpRight, ArrowDownRight, Info,
    Calendar, IndianRupee, PieChart as PieIcon,
    BarChart as BarIcon, RefreshCw, Save
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, LineChart, Line,
    AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';
import apiService from '../../services/api';
import { useToast } from '../../components/Toast';
import clsx from 'clsx';

const DEPARTMENTS = [
    'Temple Construction', 'Deity Worship', 'Kitchen & Feast', 
    'Book Distribution', 'Festival Fund', 'Maintenance', 'Staff Salary'
];

const FinancialAnalytics = () => {
    const [history, setHistory] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [performance, setPerformance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    
    const toast = useToast();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [histRes, budgRes, perfRes] = await Promise.all([
                apiService.get('/api/finance/analytics/history?months=12'),
                apiService.get(`/api/finance/budgets?month=${selectedMonth}&year=${selectedYear}`),
                apiService.get(`/api/finance/analytics/budget-performance?month=${selectedMonth}&year=${selectedYear}`)
            ]);
            if (histRes.success) setHistory(histRes.data.reverse());
            if (budgRes.success) setBudgets(budgRes.data);
            if (perfRes.success) setPerformance(perfRes.data);
        } catch {
            toast.error('Failed to load financial data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedMonth, selectedYear]);

    const forecast = useMemo(() => {
        if (history.length < 2) return 0;
        const recent = history.slice(-3);
        const avg = recent.reduce((acc, curr) => acc + curr.income, 0) / recent.length;
        const growth = (recent[recent.length-1].income - recent[0].income) / recent.length;
        return Math.max(0, avg + growth);
    }, [history]);

    const handleSaveBudget = async (dept, amount) => {
        if (saving) return;
        setSaving(true);
        try {
            const res = await apiService.post('/api/finance/budgets', {
                department: dept,
                amount: parseFloat(amount) || 0,
                month: selectedMonth,
                year: selectedYear
            });
            if (res.success) {
                toast.success(`Budget updated for ${dept}`);
                // Refresh performance data too
                const perfRes = await apiService.get(`/api/finance/analytics/budget-performance?month=${selectedMonth}&year=${selectedYear}`);
                if (perfRes.success) setPerformance(perfRes.data);
            }
        } catch {
            toast.error('Failed to update budget');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <RefreshCw className="w-10 h-10 text-corporate-200 animate-spin mb-4" />
                <p className="text-slate-400 dark:text-slate-500 font-bold tracking-widest uppercase text-xs">Analyzing Finances...</p>
            </div>
        );
    }

    const currentMonthData = history.find(h => h.month === `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`) || { income: 0, expense: 0 };
    const netSavings = currentMonthData.income - currentMonthData.expense;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Year/Month Selector */}
            <div className="flex justify-end gap-3">
                <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-corporate-500/20">
                    {Array.from({ length: 12 }, (_, i) => (
                        <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                    ))}
                </select>
                <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-corporate-500/20">
                    {[selectedYear - 1, selectedYear, selectedYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            {/* Top Stats & Forecast */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp size={80} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Projected Income (Next Month)</p>
                    <div className="flex items-end gap-2">
                        <h3 className="text-3xl font-black text-slate-900">₹{forecast.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
                        <div className="flex items-center text-emerald-500 font-bold text-xs mb-1">
                            <ArrowUpRight size={14} />
                            <span>Estimated</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Target size={80} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Net Savings ({new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'short' })})</p>
                    <div className="flex items-end gap-2">
                        <h3 className={clsx("text-3xl font-black", netSavings >= 0 ? "text-emerald-600" : "text-red-600")}>
                            ₹{netSavings.toLocaleString('en-IN')}
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase">Cash Flow</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Active Sevaks Count</p>
                        <h3 className="text-xl font-black text-slate-900">Health Indicator</h3>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight">Based on financial stability</p>
                    </div>
                    <div className={clsx("p-3 rounded-2xl", netSavings > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                        <TrendingUp size={24} className={netSavings < 0 ? "rotate-180" : ""} />
                    </div>
                </div>
            </div>

            {/* Performance Comparison */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-lg font-black text-slate-900">Budget vs Actual Performance</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">How well each department is following the allocated budget</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-slate-200 rounded-full" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Budget</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-corporate-600 rounded-full" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Actual</span>
                        </div>
                    </div>
                </div>

                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={performance}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="department" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                dy={10}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                            />
                            <Tooltip 
                                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="budgetAmount" name="Budget" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={40} />
                            <Bar dataKey="actualAmount" name="Actual" fill="#ea580c" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Income vs Expense Chart */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-lg font-black text-slate-900">Growth Velocity</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">12-month income vs expenses trend</p>
                    </div>
                </div>
                
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={history}>
                            <defs>
                                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ea580c" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="month" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                            />
                            <Tooltip 
                                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                            />
                            <Area type="monotone" dataKey="income" stroke="#ea580c" strokeWidth={4} fillOpacity={1} fill="url(#colorIncome)" />
                            <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorExpense)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Budget Management */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-black text-slate-900">Allocation Table</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Define budgets for {new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'long' })}</p>
                        </div>
                    </div>

                    <div className="divide-y divide-slate-50">
                        {DEPARTMENTS.map(dept => {
                            const budget = budgets.find(b => b.department === dept);
                            const perf = performance.find(p => p.department === dept) || { actualAmount: 0, utilization: 0 };
                            return (
                                <div key={dept} className="p-6 flex items-center justify-between hover:bg-slate-50 dark:bg-slate-900/50/50 transition-colors group">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-corporate-50 group-hover:text-corporate-600 transition-colors">
                                            <Target size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 dark:text-slate-100">{dept}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div className={clsx("h-full rounded-full transition-all", perf.utilization > 100 ? "bg-rose-500" : "bg-emerald-500")} style={{ width: `${Math.min(100, perf.utilization)}%` }} />
                                                </div>
                                                <span className={clsx("text-[10px] font-black", perf.utilization > 100 ? "text-rose-600" : "text-emerald-600")}>{perf.utilization}% Used</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Spent</p>
                                            <p className="text-sm font-black text-slate-700 dark:text-slate-200">₹{perf.actualAmount.toLocaleString()}</p>
                                        </div>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                defaultValue={budget?.amount || ''}
                                                onBlur={(e) => handleSaveBudget(dept, e.target.value)}
                                                placeholder="0.00"
                                                className="w-32 px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-right font-black text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-corporate-500/10 focus:border-corporate-500 outline-none transition-all"
                                            />
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">₹</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white dark:bg-slate-900/5 rounded-full blur-3xl" />
                        <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Info size={14} /> Strategic Insight
                        </h4>
                        <p className="text-sm font-medium leading-relaxed text-slate-300 mb-6">
                            Total utilization is currently at <span className="text-emerald-400 font-bold">{performance.length > 0 ? Math.round(performance.reduce((s,p) => s+p.utilization, 0) / performance.length) : 0}%</span>. 
                            {performance.some(p => p.utilization > 100) ? " One or more departments have exceeded their budget. Review expenditures immediately." : " All departments are within their allocated budget limits."}
                        </p>
                        <button className="w-full py-4 bg-white dark:bg-slate-900/10 hover:bg-white dark:bg-slate-900/20 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">
                            Audit Expenditures
                        </button>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">Budget Health Monitor</h4>
                        <div className="space-y-6">
                            {performance.slice(0, 3).map((p, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-slate-500 dark:text-slate-400 truncate mr-2">{p.department}</span>
                                        <span className={clsx(p.utilization > 100 ? "text-rose-600" : "text-slate-900")}>{p.utilization}%</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className={clsx("h-full rounded-full", p.utilization > 100 ? "bg-rose-500" : "bg-corporate-600")} style={{ width: `${Math.min(100, p.utilization)}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinancialAnalytics;
