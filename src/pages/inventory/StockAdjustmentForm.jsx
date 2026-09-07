import React, { useState, useEffect } from 'react';
import { 
    RefreshCw, Save, ArrowLeft, History, 
    ArrowUpCircle, ArrowDownCircle, Settings,
    Calendar, FileText, Tag, Box
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiService from '../../services/api';
import { useToast } from '../../components/Toast';
import clsx from 'clsx';

const StockAdjustmentForm = () => {
    const [searchParams] = useSearchParams();
    const itemIdFromQuery = searchParams.get('itemId');
    
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        itemId: itemIdFromQuery || '',
        type: 'Stock In',
        quantity: '',
        date: new Date().toISOString().slice(0, 10),
        reason: '',
        reference: ''
    });

    const navigate = useNavigate();
    const toast = useToast();

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const res = await apiService.get('/api/inventory/items');
                if (res.success) setItems(res.data);
            } catch {
                toast.error('Failed to load items');
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.itemId || !formData.quantity) {
            return toast.error('Please fill in all required fields');
        }

        setSaving(true);
        try {
            const payload = {
                ...formData,
                quantity: parseFloat(formData.quantity)
            };
            const res = await apiService.post('/api/inventory/transactions', payload);
            if (res.success) {
                toast.success('Stock updated successfully');
                navigate('/inventory');
            }
        } catch (error) {
            toast.error(error.message || 'Failed to update stock');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <RefreshCw className="w-10 h-10 text-corporate-200 animate-spin mb-4" />
                <p className="text-slate-400 dark:text-slate-500 font-bold tracking-widest uppercase text-xs">Loading...</p>
            </div>
        );
    }

    const selectedItem = items.find(i => i.id === parseInt(formData.itemId));

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button onClick={() => navigate('/inventory')} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 transition-colors group">
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 group-hover:border-slate-300 dark:border-slate-600 shadow-sm transition-all">
                        <ArrowLeft size={18} />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-wider">Inventory</span>
                </button>
                <div className="text-right">
                    <h1 className="text-2xl font-black text-slate-900">Stock Adjustment</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Update item quantity and log movement</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
                <div className="p-10 space-y-10">
                    {/* Transaction Type Toggle */}
                    <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-[2rem] gap-2">
                        {[
                            { id: 'Stock In', label: 'Stock In', icon: ArrowUpCircle, color: 'text-emerald-600', activeBg: 'bg-emerald-500 text-white' },
                            { id: 'Stock Out', label: 'Stock Out', icon: ArrowDownCircle, color: 'text-red-600', activeBg: 'bg-red-500 text-white' },
                            { id: 'Adjustment', label: 'Manual Adjustment', icon: Settings, color: 'text-blue-600', activeBg: 'bg-blue-500 text-white' }
                        ].map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setFormData({ ...formData, type: t.id })}
                                className={clsx(
                                    "flex-1 flex items-center justify-center gap-3 py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-xs transition-all duration-300",
                                    formData.type === t.id ? t.activeBg + " shadow-lg" : "text-slate-500 dark:text-slate-400 hover:bg-slate-200"
                                )}
                            >
                                <t.icon size={18} />
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Select Item *</label>
                            <div className="relative">
                                <Box size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                                <select 
                                    name="itemId"
                                    value={formData.itemId}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-corporate-500/10 focus:border-corporate-500 transition-all font-bold text-slate-700 dark:text-slate-200 appearance-none"
                                >
                                    <option value="">Select an Item</option>
                                    {items.map(i => (
                                        <option key={i.id} value={i.id}>
                                            {i.name} ({i.sku || 'No SKU'}) - Current: {i.stockLevel} {i.unit}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Quantity *</label>
                            <div className="relative">
                                <Tag size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                                <input 
                                    type="number"
                                    name="quantity"
                                    value={formData.quantity}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter amount..."
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-corporate-500/10 focus:border-corporate-500 transition-all font-bold text-slate-700 dark:text-slate-200"
                                />
                                {selectedItem && (
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                        {selectedItem.unit}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Date</label>
                            <div className="relative">
                                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                                <input 
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-corporate-500/10 focus:border-corporate-500 transition-all font-bold text-slate-700 dark:text-slate-200"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Reference / Bill #</label>
                            <div className="relative">
                                <FileText size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                                <input 
                                    name="reference"
                                    value={formData.reference}
                                    onChange={handleChange}
                                    placeholder="e.g. INV-12345"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-corporate-500/10 focus:border-corporate-500 transition-all font-bold text-slate-700 dark:text-slate-200"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Reason / Notes</label>
                            <textarea 
                                name="reason"
                                value={formData.reason}
                                onChange={handleChange}
                                rows="3"
                                placeholder="Explain why you are adjusting the stock..."
                                className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-corporate-500/10 focus:border-corporate-500 transition-all font-medium text-slate-700 dark:text-slate-200 resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex gap-4">
                    <button 
                        type="button" 
                        onClick={() => navigate('/inventory')}
                        className="flex-1 px-6 py-4 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-white dark:bg-slate-900 transition-all active:scale-95"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        disabled={saving}
                        className="flex-2 flex items-center justify-center gap-3 px-12 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 disabled:opacity-50 active:scale-95"
                    >
                        {saving ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Save size={18} />
                                Process Transaction
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Quick Preview */}
            {selectedItem && (
                <div className="bg-blue-50 border border-blue-100 p-6 rounded-[2rem] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                            <Box size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Selected Item</p>
                            <h4 className="font-black text-blue-900">{selectedItem.name}</h4>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Resulting Stock</p>
                        <h4 className="text-xl font-black text-blue-900">
                            {(() => {
                                const current = selectedItem.stockLevel;
                                const change = parseFloat(formData.quantity) || 0;
                                let result = current;
                                if (formData.type === 'Stock In') result += change;
                                else if (formData.type === 'Stock Out') result -= change;
                                else result += change; // Adjustment is signed
                                return result;
                            })()} {selectedItem.unit}
                        </h4>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockAdjustmentForm;
