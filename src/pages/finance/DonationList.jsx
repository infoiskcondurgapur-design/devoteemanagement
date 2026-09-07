import React, { useState, useEffect, useMemo } from 'react';
import { formatDate } from '../../lib/dateUtils';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { Search, Plus, Download, Trash2, IndianRupee, TrendingUp, Calendar, PackageOpen, RefreshCw, Filter, X as CloseIcon, ArrowUpCircle, ArrowDownCircle, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '../../components/Toast';
import apiService from '../../services/api';
import clsx from 'clsx';
import * as htmlToImage from 'html-to-image';
import MoneyReceipt from '../../components/finance/MoneyReceipt';
import FinancialAnalytics from './FinancialAnalytics';

const MODE_COLORS = {
    Cash: 'bg-emerald-100 text-emerald-700',
    UPI: 'bg-blue-100 text-blue-700',
    'Bank Transfer': 'bg-violet-100 text-violet-700',
    Cheque: 'bg-amber-100 text-amber-700',
};

const FinanceDashboard = () => {
    const toast = useToast();
    const [donations, setDonations] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [stats, setStats] = useState({ 
        totalIncome: 0, 
        totalIncomeThisMonth: 0, 
        totalExpenses: 0, 
        totalExpensesThisMonth: 0, 
        netBalance: 0,
        byPurpose: [],
        expenseByCategory: []
    });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterMode, setFilterMode] = useState('');
    const [activeTab, setActiveTab] = useState('income'); // 'income' or 'expense'
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showCharts, setShowCharts] = useState(true);
    const [receiptDonation, setReceiptDonation] = useState(null);
    const receiptRef = React.useRef(null);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [donRes, expRes, statRes] = await Promise.all([
                apiService.get('/api/finance/donations'),
                apiService.get('/api/finance/expenses'),
                apiService.get('/api/finance/stats'),
            ]);
            if (donRes.success) setDonations(donRes.data || []);
            if (expRes.success) setExpenses(expRes.data || []);
            if (statRes.success) setStats(statRes.data || {});
        } catch { toast.error('Failed to load finance data'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchAll(); }, []);

    const handleDelete = async (id, type) => {
        const entityName = type === 'income' ? 'donation' : 'expense';
        if (!window.confirm(`Delete this ${entityName} record?`)) return;
        try {
            const endpoint = type === 'income' ? `/api/finance/donations/${id}` : `/api/finance/expenses/${id}`;
            const data = await apiService.delete(endpoint);
            if (data.success) {
                toast.success(`${entityName} deleted`);
                if (type === 'income') setDonations(prev => prev.filter(d => d.id !== id));
                else setExpenses(prev => prev.filter(e => e.id !== id));
                // Refresh stats
                const statRes = await apiService.get('/api/finance/stats');
                if (statRes.success) setStats(statRes.data);
            }
        } catch {
            toast.error(`Failed to delete ${entityName}`);
        }
    };

    const currentData = activeTab === 'income' ? donations : expenses;

    const filtered = useMemo(() => currentData.filter(d => {
        const q = search.toLowerCase();
        const textToSearch = activeTab === 'income' 
            ? `${d.devoteeNameFull || d.devoteeName || ''} ${d.initiatedName || ''} ${d.purpose || ''} ${d.reference || ''}`
            : `${d.title || ''} ${d.category || ''} ${d.reference || ''} ${d.notes || ''}`;
            
        const textMatch = textToSearch.toLowerCase().includes(q);
        const modeMatch = filterMode ? d.mode === filterMode : true;
        
        let dateMatch = true;
        if (startDate || endDate) {
            const dDate = new Date(d.date);
            if (startDate && dDate < new Date(startDate)) dateMatch = false;
            if (endDate && dDate > new Date(endDate)) dateMatch = false;
        }
        
        return textMatch && modeMatch && dateMatch;
    }), [currentData, search, filterMode, startDate, endDate, activeTab]);

    const chartData = useMemo(() => {
        const monthly = {};
        const categories = {};
        
        filtered.forEach(d => {
            const date = new Date(d.date);
            const month = date.toLocaleString('default', { month: 'short', year: '2-digit' });
            monthly[month] = (monthly[month] || 0) + (d.amount || 0);
            
            const catName = activeTab === 'income' ? d.purpose : d.category;
            categories[catName] = (categories[catName] || 0) + (d.amount || 0);
        });

        const trend = Object.entries(monthly).map(([name, amount]) => ({ name, amount })).reverse().slice(0, 6).reverse();
        const pie = Object.entries(categories).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 5);
        
        return { trend, pie };
    }, [filtered, activeTab]);

    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

    const handleDownloadReceipt = async (donation) => {
        setReceiptDonation(donation);
        setTimeout(async () => {
            if (receiptRef.current) {
                try {
                    const dataUrl = await htmlToImage.toPng(receiptRef.current, { quality: 1.0, pixelRatio: 2 });
                    const link = document.createElement('a');
                    link.download = `receipt_${donation.id}.png`;
                    link.href = dataUrl;
                    link.click();
                    toast.success('Receipt downloaded');
                } catch {
                    toast.error('Failed to generate receipt');
                }
            }
        }, 100);
    };

    const totalFiltered = filtered.reduce((s, d) => s + (d.amount || 0), 0);

    const handleExportCSV = () => {
        const headers = activeTab === 'income' 
            ? ['Name', 'Purpose', 'Date', 'Mode', 'Amount', 'Reference']
            : ['Title', 'Category', 'Date', 'Mode', 'Amount', 'Reference', 'Notes'];
            
        const rows = activeTab === 'income'
            ? filtered.map(d => [d.initiatedName || d.devoteeNameFull || d.devoteeName || 'Walk-in', d.purpose, formatDate(d.date), d.mode, d.amount, d.reference])
            : filtered.map(e => [e.title, e.category, formatDate(e.date), e.mode, e.amount, e.reference, e.notes]);
            
        const csv = [headers, ...rows].map(r => r.map(v => `"${v || ''}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `${activeTab}_records.csv`; a.click();
        URL.revokeObjectURL(url);
        toast.success('CSV downloaded');
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Finance & Expenses</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Track all temple transactions</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowCharts(!showCharts)} className={clsx("p-2.5 border rounded-lg transition-colors", showCharts ? "bg-corporate-50 border-corporate-200 text-corporate-600" : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-900/50")}>
                        <TrendingUp size={15} />
                    </button>
                    <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:bg-slate-900/50 transition-colors">
                        <Download size={15} /> Export
                    </button>
                    <button onClick={fetchAll} className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-900/50 transition-colors">
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <Link to="/finance/new" className="flex items-center gap-2 px-4 py-2 bg-corporate-600 text-white rounded-lg text-sm font-semibold hover:bg-corporate-700 transition-colors shadow-sm">
                        <Plus size={15} /> New Transaction
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Total Income', value: `₹${(stats.totalIncome || 0).toLocaleString('en-IN')}`, icon: ArrowUpCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Total Expense', value: `₹${(stats.totalExpenses || 0).toLocaleString('en-IN')}`, icon: ArrowDownCircle, color: 'text-red-600', bg: 'bg-red-50' },
                    { label: 'Net Balance', value: `₹${(stats.netBalance || 0).toLocaleString('en-IN')}`, icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Income (Month)', value: `₹${(stats.totalIncomeThisMonth || 0).toLocaleString('en-IN')}`, icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                ].map((s, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg ${s.bg} ${s.color} shrink-0`}><s.icon size={18} /></div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate">{s.label}</p>
                            <p className={`text-lg font-bold ${s.color} truncate`}>{s.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700">
                <button 
                    onClick={() => setActiveTab('income')}
                    className={clsx("px-8 py-3 font-bold text-sm transition-all relative", activeTab === 'income' ? "text-corporate-600" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200")}
                >
                    Income (Donations)
                    {activeTab === 'income' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-corporate-600" />}
                </button>
                <button 
                    onClick={() => setActiveTab('expense')}
                    className={clsx("px-8 py-3 font-bold text-sm transition-all relative", activeTab === 'expense' ? "text-corporate-600" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200")}
                >
                    Expenses
                    {activeTab === 'expense' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-corporate-600" />}
                </button>
                <button 
                    onClick={() => setActiveTab('analytics')}
                    className={clsx("px-8 py-3 font-bold text-sm transition-all relative", activeTab === 'analytics' ? "text-corporate-600" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200")}
                >
                    Analytics & Forecasting
                    {activeTab === 'analytics' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-corporate-600" />}
                </button>
            </div>

            {activeTab === 'analytics' ? (
                <FinancialAnalytics />
            ) : (
                <>
                    {/* Table Area */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                {/* Filters */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-4">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${activeTab}...`}
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-corporate-500" />
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1">
                            <Calendar size={14} className="text-slate-400 dark:text-slate-500" />
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-xs outline-none" />
                            <span className="text-slate-300">to</span>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-xs outline-none" />
                        </div>
                        
                        <select value={filterMode} onChange={e => setFilterMode(e.target.value)}
                            className="border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-corporate-500">
                            <option value="">All Modes</option>
                            {['Cash', 'UPI', 'Bank Transfer', 'Cheque'].map(m => <option key={m}>{m}</option>)}
                        </select>
                    </div>

                    <div className={clsx("ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg border", activeTab === 'income' ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100")}>
                        <p className={clsx("text-[10px] font-black uppercase tracking-widest", activeTab === 'income' ? "text-emerald-600" : "text-red-600")}>Total</p>
                        <div className={clsx("w-px h-3 mx-1", activeTab === 'income' ? "bg-emerald-200" : "bg-red-200")}></div>
                        <p className={clsx("text-sm font-black", activeTab === 'income' ? "text-emerald-700" : "text-red-700")}>₹{totalFiltered.toLocaleString('en-IN')}</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                            {activeTab === 'income' ? (
                                <tr>
                                    <th className="px-5 py-3 text-left">Devotee</th>
                                    <th className="px-5 py-3 text-left">Purpose</th>
                                    <th className="px-5 py-3 text-left">Date</th>
                                    <th className="px-5 py-3 text-left">Mode</th>
                                    <th className="px-5 py-3 text-right">Amount</th>
                                    <th className="px-5 py-3 text-center">Action</th>
                                </tr>
                            ) : (
                                <tr>
                                    <th className="px-5 py-3 text-left">Title / Category</th>
                                    <th className="px-5 py-3 text-left">Reference</th>
                                    <th className="px-5 py-3 text-left">Date</th>
                                    <th className="px-5 py-3 text-left">Mode</th>
                                    <th className="px-5 py-3 text-right">Amount</th>
                                    <th className="px-5 py-3 text-center">Action</th>
                                </tr>
                            )}
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan={6} className="py-16 text-center text-slate-400 dark:text-slate-500"><RefreshCw size={24} className="mx-auto animate-spin" /></td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6} className="py-16 text-center text-slate-400 dark:text-slate-500">
                                    <PackageOpen size={32} className="mx-auto mb-2 opacity-40" />
                                    <p className="font-medium">No records found</p>
                                </td></tr>
                            ) : filtered.map(d => (
                                <tr key={d.id} className="hover:bg-slate-50 dark:bg-slate-900/50/50 transition-colors">
                                    {activeTab === 'income' ? (
                                        <>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0">
                                                        {d.photo && <img src={d.photo} alt="" className="w-full h-full object-cover" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800 dark:text-slate-100">{d.initiatedName || d.devoteeNameFull || d.devoteeName || 'Walk-in'}</p>
                                                        <button onClick={() => handleDownloadReceipt(d)} className="text-[10px] text-emerald-600 font-bold hover:underline">Receipt</button>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{d.purpose}</td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="px-5 py-3">
                                                <p className="font-semibold text-slate-800 dark:text-slate-100">{d.title}</p>
                                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">{d.category}</p>
                                            </td>
                                            <td className="px-5 py-3 text-slate-600 dark:text-slate-300 text-xs">{d.reference || '—'}</td>
                                        </>
                                    )}
                                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">{formatDate(d.date)}</td>
                                    <td className="px-5 py-3">
                                        <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full', MODE_COLORS[d.mode] || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300')}>{d.mode}</span>
                                    </td>
                                    <td className={clsx("px-5 py-3 text-right font-bold", activeTab === 'income' ? "text-emerald-600" : "text-red-600")}>
                                        ₹{(d.amount || 0).toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        <button onClick={() => handleDelete(d.id, activeTab)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Charts Section */}
            {showCharts && filtered.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <TrendingUp size={14} className="text-blue-500" /> {activeTab === 'income' ? 'Collection' : 'Expense'} Trend
                        </h3>
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData.trend}>
                                    <defs>
                                        <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={activeTab === 'income' ? "#10b981" : "#ef4444"} stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor={activeTab === 'income' ? "#10b981" : "#ef4444"} stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="amount" stroke={activeTab === 'income' ? "#10b981" : "#ef4444"} strokeWidth={2} fillOpacity={1} fill="url(#colorAmt)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <PackageOpen size={14} className="text-emerald-500" /> {activeTab === 'income' ? 'Purpose' : 'Category'} Distribution
                        </h3>
                        <div className="h-[200px] w-full flex items-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={chartData.pie} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                                        {chartData.pie.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="middle" align="right" layout="vertical" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
                </>
            )}

            <MoneyReceipt ref={receiptRef} donation={receiptDonation} />
        </div>
    );
};

export default FinanceDashboard;
