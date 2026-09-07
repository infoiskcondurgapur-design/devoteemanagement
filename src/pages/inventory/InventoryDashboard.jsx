import React, { useState, useEffect, useMemo } from 'react';
import { 
    Package, Plus, Search, Filter, AlertTriangle, TrendingUp, 
    ArrowUpRight, ArrowDownRight, MoreVertical, Edit2, Trash2,
    RefreshCw, Layers, History, Box, Tag, Download
} from 'lucide-react';
import { Link } from 'react-router-dom';
import apiService from '../../services/api';
import { useToast } from '../../components/Toast';
import clsx from 'clsx';

const InventoryDashboard = () => {
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [stockFilter, setStockFilter] = useState('all'); // all, low, out
    const toast = useToast();

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const [itemRes, catRes] = await Promise.all([
                apiService.get('/api/inventory/items'),
                apiService.get('/api/inventory/categories')
            ]);
            if (itemRes.success) setItems(itemRes.data);
            if (catRes.success) setCategories(catRes.data);
        } catch {
            toast.error('Failed to load inventory');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                                 (item.sku && item.sku.toLowerCase().includes(search.toLowerCase()));
            const matchesCategory = selectedCategory === 'all' || item.categoryId === parseInt(selectedCategory);
            const matchesStock = stockFilter === 'all' || 
                                (stockFilter === 'low' && item.stockLevel <= item.reorderLevel && item.stockLevel > 0) ||
                                (stockFilter === 'out' && item.stockLevel <= 0);
            
            return matchesSearch && matchesCategory && matchesStock;
        });
    }, [items, search, selectedCategory, stockFilter]);

    const stats = useMemo(() => {
        const totalItems = items.length;
        const lowStock = items.filter(i => i.stockLevel <= i.reorderLevel && i.stockLevel > 0).length;
        const outOfStock = items.filter(i => i.stockLevel <= 0).length;
        const totalValue = items.reduce((sum, i) => sum + (i.stockLevel * i.unitPrice), 0);

        return { totalItems, lowStock, outOfStock, totalValue };
    }, [items]);

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
        try {
            const res = await apiService.delete(`/api/inventory/items/${id}`);
            if (res.success) {
                toast.success('Item deleted');
                fetchInventory();
            }
        } catch {
            toast.error('Failed to delete item');
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                        Temple Inventory
                        <Package className="w-8 h-8 text-corporate-600" />
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Manage assets, books, and temple supplies</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button onClick={fetchInventory} className="p-2.5 text-slate-400 dark:text-slate-500 hover:text-corporate-600 rounded-xl hover:bg-white dark:bg-slate-900 border border-transparent hover:border-slate-200 dark:border-slate-700 transition-all shadow-sm bg-white dark:bg-slate-900/50">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <Link to="/inventory/categories" className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-sm hover:bg-slate-50 dark:bg-slate-900/50 transition-all shadow-sm">
                        <Layers size={18} />
                        Categories
                    </Link>
                    <Link to="/inventory/new" className="flex items-center gap-2 px-5 py-2.5 bg-corporate-600 text-white rounded-xl font-bold text-sm hover:bg-corporate-700 transition-all shadow-lg shadow-corporate-600/20 active:scale-95">
                        <Plus size={18} />
                        Add Item
                    </Link>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Items', value: stats.totalItems, icon: Box, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Low Stock', value: stats.lowStock, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', alert: stats.lowStock > 0 },
                    { label: 'Out of Stock', value: stats.outOfStock, icon: Trash2, color: 'text-red-600', bg: 'bg-red-50', alert: stats.outOfStock > 0 },
                    { label: 'Total Value', value: `₹${stats.totalValue.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                ].map((s, i) => (
                    <div key={i} className="group bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                        {s.alert && <div className="absolute top-0 right-0 w-20 h-20 -mr-10 -mt-10 bg-red-500/10 rotate-45" />}
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-2xl ${s.bg} ${s.color}`}>
                                <s.icon size={24} />
                            </div>
                            <div className="p-1.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowUpRight size={14} className="text-slate-400 dark:text-slate-500" />
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{s.label}</p>
                            <h3 className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="bg-white dark:bg-slate-900/70 backdrop-blur-xl rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden min-h-[600px] flex flex-col">
                {/* Filters Bar */}
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row gap-6 items-center">
                    <div className="relative flex-1 w-full lg:max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5" />
                        <input 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by name or SKU..."
                            className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] focus:ring-4 focus:ring-corporate-500/10 focus:border-corporate-500 outline-none transition-all font-medium"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl">
                            <Filter size={16} className="text-slate-400 dark:text-slate-500" />
                            <select 
                                value={selectedCategory}
                                onChange={e => setSelectedCategory(e.target.value)}
                                className="bg-transparent border-none outline-none text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                            >
                                <option value="all">All Categories</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl gap-1">
                            {['all', 'low', 'out'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setStockFilter(f)}
                                    className={clsx(
                                        "px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-tighter transition-all",
                                        stockFilter === f 
                                            ? "bg-white dark:bg-slate-900 text-slate-900 shadow-sm" 
                                            : "text-slate-500 dark:text-slate-400 hover:bg-slate-200"
                                    )}
                                >
                                    {f === 'all' ? 'All' : f === 'low' ? 'Low Stock' : 'Out of Stock'}
                                </button>
                            ))}
                        </div>

                        <button className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 ml-auto">
                            <Download size={18} />
                        </button>
                    </div>
                </div>

                {/* Table Section */}
                <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50/50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Item Info</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Category</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Price</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Stock Level</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="py-20 text-center">
                                        <RefreshCw className="w-10 h-10 text-corporate-200 animate-spin mx-auto mb-4" />
                                        <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Inventory...</p>
                                    </td>
                                </tr>
                            ) : filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-20 text-center opacity-40">
                                        <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                        <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs">No items found matching your criteria</p>
                                    </td>
                                </tr>
                            ) : filteredItems.map((item) => (
                                <tr key={item.id} className="group hover:bg-slate-50 dark:bg-slate-900/50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-white dark:bg-slate-900 group-hover:shadow-md transition-all">
                                                <Box size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 group-hover:text-corporate-600 transition-colors">{item.name}</p>
                                                <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{item.sku || 'NO-SKU'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-2 w-fit">
                                            <Tag size={12} className="text-slate-400 dark:text-slate-500" />
                                            {item.categoryName}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <p className="font-bold text-slate-900">₹{item.unitPrice.toLocaleString('en-IN')}</p>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-tighter">per {item.unit}</p>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="inline-flex flex-col items-center gap-1">
                                            <p className={clsx(
                                                "text-lg font-black",
                                                item.stockLevel <= 0 ? "text-red-600" : 
                                                item.stockLevel <= item.reorderLevel ? "text-amber-600" : "text-emerald-600"
                                            )}>
                                                {item.stockLevel}
                                            </p>
                                            <div className="w-12 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div 
                                                    className={clsx(
                                                        "h-full rounded-full transition-all duration-500",
                                                        item.stockLevel <= 0 ? "bg-red-500 w-full" : 
                                                        item.stockLevel <= item.reorderLevel ? "bg-amber-500 w-1/2" : "bg-emerald-500 w-full"
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        {item.stockLevel <= 0 ? (
                                            <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100">Out of Stock</span>
                                        ) : item.stockLevel <= item.reorderLevel ? (
                                            <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100 animate-pulse">Low Stock</span>
                                        ) : (
                                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">In Stock</span>
                                        )}
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Link to={`/inventory/transactions?itemId=${item.id}`} className="p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Transactions">
                                                <History size={16} />
                                            </Link>
                                            <Link to={`/inventory/edit/${item.id}`} className="p-2 text-slate-400 dark:text-slate-500 hover:text-corporate-600 hover:bg-corporate-50 rounded-lg transition-all" title="Edit">
                                                <Edit2 size={16} />
                                            </Link>
                                            <button onClick={() => handleDelete(item.id, item.name)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InventoryDashboard;
