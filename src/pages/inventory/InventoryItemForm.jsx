import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    Save, X, Package, Tag, Info, IndianRupee, 
    Box, AlertTriangle, ArrowLeft, ChevronDown 
} from 'lucide-react';
import apiService from '../../services/api';
import { useToast } from '../../components/Toast';
import clsx from 'clsx';

const UNITS = ['pcs', 'kg', 'ltr', 'mtr', 'box', 'pkt', 'set', 'gm', 'ml'];

const InventoryItemForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const isEdit = !!id;

    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        categoryId: '',
        name: '',
        sku: '',
        description: '',
        unit: 'pcs',
        unitPrice: '',
        stockLevel: 0,
        reorderLevel: 5
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const catRes = await apiService.get('/api/inventory/categories');
                if (catRes.success) setCategories(catRes.data);

                if (isEdit) {
                    const itemRes = await apiService.get(`/api/inventory/items/${id}`);
                    if (itemRes.success) {
                        setFormData(itemRes.data);
                    }
                }
            } catch {
                toast.error('Failed to load data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, isEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: name === 'categoryId' ? parseInt(value) : value 
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.categoryId || !formData.name) {
            return toast.error('Category and Name are required');
        }

        setSaving(true);
        try {
            const endpoint = isEdit ? `/api/inventory/items/${id}` : '/api/inventory/items';
            const method = isEdit ? 'put' : 'post';
            
            const payload = {
                ...formData,
                unitPrice: parseFloat(formData.unitPrice) || 0,
                stockLevel: parseFloat(formData.stockLevel) || 0,
                reorderLevel: parseFloat(formData.reorderLevel) || 0
            };

            const res = await apiService[method](endpoint, payload);
            if (res.success) {
                toast.success(`Item ${isEdit ? 'updated' : 'added'} successfully`);
                navigate('/inventory');
            }
        } catch (error) {
            toast.error(error.message || 'Failed to save item');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Package className="w-12 h-12 text-corporate-200 animate-pulse mb-4" />
                <p className="text-slate-400 dark:text-slate-500 font-bold tracking-widest uppercase text-xs">Preparing Form...</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 transition-colors group">
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 group-hover:border-slate-300 dark:border-slate-600 shadow-sm transition-all">
                        <ArrowLeft size={18} />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-wider">Back</span>
                </button>
                <div className="text-right">
                    <h1 className="text-2xl font-black text-slate-900">{isEdit ? 'Edit Item' : 'Add New Item'}</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{isEdit ? 'Update inventory details' : 'List a new temple asset'}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
                <div className="p-10 space-y-10">
                    {/* Basic Info Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <Info size={18} />
                            </div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Basic Information</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Item Category *</label>
                                <div className="relative">
                                    <select 
                                        name="categoryId"
                                        value={formData.categoryId}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-corporate-500/10 focus:border-corporate-500 transition-all appearance-none font-bold text-slate-700 dark:text-slate-200"
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Item SKU / ID</label>
                                <input 
                                    name="sku"
                                    value={formData.sku}
                                    onChange={handleChange}
                                    placeholder="e.g. BOOK-BG-001"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-corporate-500/10 focus:border-corporate-500 transition-all font-bold text-slate-700 dark:text-slate-200"
                                />
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Item Name *</label>
                                <input 
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g. Bhagavad Gita As It Is"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-corporate-500/10 focus:border-corporate-500 transition-all font-bold text-slate-700 dark:text-slate-200"
                                />
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Description</label>
                                <textarea 
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="Add any additional details..."
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-corporate-500/10 focus:border-corporate-500 transition-all font-medium text-slate-700 dark:text-slate-200 resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Stock & Pricing Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                <Box size={18} />
                            </div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Stock & Pricing</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Unit of Measure</label>
                                <div className="relative">
                                    <select 
                                        name="unit"
                                        value={formData.unit}
                                        onChange={handleChange}
                                        className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-corporate-500/10 focus:border-corporate-500 transition-all appearance-none font-bold text-slate-700 dark:text-slate-200"
                                    >
                                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Unit Price (₹)</label>
                                <div className="relative">
                                    <IndianRupee size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                                    <input 
                                        type="number"
                                        name="unitPrice"
                                        value={formData.unitPrice}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-corporate-500/10 focus:border-corporate-500 transition-all font-bold text-slate-700 dark:text-slate-200"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Initial Stock</label>
                                <input 
                                    type="number"
                                    name="stockLevel"
                                    value={formData.stockLevel}
                                    onChange={handleChange}
                                    disabled={isEdit} // Disable direct stock update in edit mode, use transactions instead
                                    placeholder="0"
                                    className={clsx(
                                        "w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none transition-all font-bold text-slate-700 dark:text-slate-200",
                                        isEdit ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed" : "bg-slate-50 dark:bg-slate-900/50 focus:ring-4 focus:ring-corporate-500/10 focus:border-corporate-500"
                                    )}
                                />
                                {isEdit && <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 italic">* Use Stock Adjustments for updates</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Reorder Level</label>
                                <div className="relative">
                                    <AlertTriangle size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" />
                                    <input 
                                        type="number"
                                        name="reorderLevel"
                                        value={formData.reorderLevel}
                                        onChange={handleChange}
                                        placeholder="5"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-corporate-500/10 focus:border-corporate-500 transition-all font-bold text-slate-700 dark:text-slate-200"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer / Actions */}
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
                        className="flex-3 flex items-center justify-center gap-3 px-12 py-4 bg-corporate-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-corporate-700 transition-all shadow-xl shadow-corporate-600/20 disabled:opacity-50 active:scale-95"
                    >
                        {saving ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Save size={18} />
                                {isEdit ? 'Update Item' : 'Save Item'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default InventoryItemForm;
