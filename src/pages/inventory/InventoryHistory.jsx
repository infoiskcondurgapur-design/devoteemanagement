import React, { useState, useEffect } from 'react';
import { 
    History, Search, Filter, Download, ArrowLeft,
    ArrowUpCircle, ArrowDownCircle, Settings,
    Calendar, Package, User, RefreshCw
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiService from '../../services/api';
import { useToast } from '../../components/Toast';
import { formatDate } from '../../lib/dateUtils';
import clsx from 'clsx';

const InventoryHistory = () => {
    const [searchParams] = useSearchParams();
    const itemIdFromQuery = searchParams.get('itemId');

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(itemIdFromQuery || 'all');
    const [limit, setLimit] = useState(50);
    
    const navigate = useNavigate();
    const toast = useToast();

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const query = `?limit=${limit}${selectedItem !== 'all' ? `&itemId=${selectedItem}` : ''}`;
            const [transRes, itemsRes] = await Promise.all([
                apiService.get(`/api/inventory/transactions${query}`),
                apiService.get('/api/inventory/items')
            ]);
            if (transRes.success) setTransactions(transRes.data);
            if (itemsRes.success) setItems(itemsRes.data);
        } catch {
            toast.error('Failed to load history');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [selectedItem, limit]);

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/inventory')} className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:border-slate-600 shadow-sm transition-all">
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                            Movement History
                            <History className="w-6 h-6 text-blue-600" />
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Track every item entry and exit</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={fetchHistory} className="p-2.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 transition-all shadow-sm">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg">
                        <Download size={18} />
                        Export Log
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <Package size={18} className="text-slate-400 dark:text-slate-500" />
                    <select 
                        value={selectedItem}
                        onChange={e => setSelectedItem(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none font-bold text-slate-700 dark:text-slate-200 text-sm cursor-pointer"
                    >
                        <option value="all">All Items</option>
                        {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.sku || 'No SKU'})</option>)}
                    </select>
                </div>

                <div className="flex items-center gap-2 border-l border-slate-100 dark:border-slate-800 pl-4">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Show:</span>
                    <select 
                        value={limit}
                        onChange={e => setLimit(e.target.value)}
                        className="bg-transparent border-none outline-none font-bold text-slate-700 dark:text-slate-200 text-sm cursor-pointer"
                    >
                        <option value="50">Last 50</option>
                        <option value="100">Last 100</option>
                        <option value="500">Last 500</option>
                    </select>
                </div>
            </div>

            {/* Timeline Area */}
            <div className="space-y-4">
                {loading ? (
                    <div className="py-20 text-center">
                        <RefreshCw className="w-10 h-10 text-blue-200 animate-spin mx-auto mb-4" />
                        <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-[10px]">Fetching History...</p>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="py-20 text-center opacity-40">
                        <History className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px]">No transaction history found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {transactions.map((t) => (
                            <div key={t.id} className="group bg-white dark:bg-slate-900 p-6 rounded-[1.5rem] border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all flex items-center gap-6 relative overflow-hidden">
                                <div className={clsx(
                                    "absolute left-0 top-0 bottom-0 w-1",
                                    t.type === 'Stock In' ? "bg-emerald-500" : t.type === 'Stock Out' ? "bg-red-500" : "bg-blue-500"
                                )} />
                                
                                <div className={clsx(
                                    "p-3 rounded-2xl shrink-0",
                                    t.type === 'Stock In' ? "bg-emerald-50 text-emerald-600" : 
                                    t.type === 'Stock Out' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                                )}>
                                    {t.type === 'Stock In' ? <ArrowUpCircle size={24} /> : 
                                     t.type === 'Stock Out' ? <ArrowDownCircle size={24} /> : <Settings size={24} />}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-black text-slate-900 group-hover:text-blue-600 transition-colors truncate">{t.itemName}</h4>
                                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded text-[10px] font-black uppercase tracking-widest">
                                            {t.type}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium line-clamp-1 italic">
                                        "{t.reason || 'No notes provided'}"
                                    </p>
                                </div>

                                <div className="text-right shrink-0">
                                    <p className={clsx(
                                        "text-xl font-black",
                                        t.type === 'Stock In' ? "text-emerald-600" : t.type === 'Stock Out' ? "text-red-600" : "text-blue-600"
                                    )}>
                                        {t.type === 'Stock In' ? '+' : t.type === 'Stock Out' ? '-' : ''}{t.quantity}
                                    </p>
                                    <div className="flex items-center gap-2 justify-end text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                                        <Calendar size={12} />
                                        {formatDate(t.date)}
                                    </div>
                                </div>

                                {t.reference && (
                                    <div className="hidden lg:flex items-center gap-2 px-4 border-l border-slate-100 dark:border-slate-800 h-10 ml-4">
                                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Ref:</p>
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{t.reference}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InventoryHistory;
