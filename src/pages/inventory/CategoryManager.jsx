import React, { useState, useEffect } from 'react';
import { 
    Layers, Plus, Edit2, Trash2, Save, X, 
    ArrowLeft, Hash, AlignLeft, RefreshCw 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import { useToast } from '../../components/Toast';
import clsx from 'clsx';

const CategoryManager = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const navigate = useNavigate();
    const toast = useToast();

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await apiService.get('/api/inventory/categories');
            if (res.success) setCategories(res.data);
        } catch {
            toast.error('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleEdit = (cat) => {
        setEditingId(cat.id);
        setFormData({ name: cat.name, description: cat.description || '' });
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData({ name: '', description: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name) return toast.error('Name is required');

        setSaving(true);
        try {
            const endpoint = editingId ? `/api/inventory/categories/${editingId}` : '/api/inventory/categories';
            const method = editingId ? 'put' : 'post';
            
            const res = await apiService[method](endpoint, formData);
            if (res.success) {
                toast.success(`Category ${editingId ? 'updated' : 'added'}`);
                handleCancel();
                fetchCategories();
            }
        } catch (error) {
            toast.error(error.message || 'Failed to save category');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete category "${name}"? This will fail if items are assigned to it.`)) return;
        try {
            const res = await apiService.delete(`/api/inventory/categories/${id}`);
            if (res.success) {
                toast.success('Category deleted');
                fetchCategories();
            }
        } catch (error) {
            toast.error(error.message || 'Failed to delete category');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button onClick={() => navigate('/inventory')} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 transition-colors group">
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 group-hover:border-slate-300 dark:border-slate-600 shadow-sm transition-all">
                        <ArrowLeft size={18} />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-wider">Inventory</span>
                </button>
                <div className="text-right">
                    <h1 className="text-2xl font-black text-slate-900">Category Manager</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Organize your temple assets</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Form Column */}
                <div className="md:col-span-5">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden sticky top-8">
                        <div className="p-8 border-b border-slate-50 flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                {editingId ? <Edit2 size={18} /> : <Plus size={18} />}
                            </div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">{editingId ? 'Edit Category' : 'New Category'}</h3>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Category Name</label>
                                <div className="relative">
                                    <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                                    <input 
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Groceries, Books"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-corporate-500/10 focus:border-corporate-500 transition-all font-bold text-slate-700 dark:text-slate-200"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Description</label>
                                <div className="relative">
                                    <AlignLeft size={16} className="absolute left-4 top-4 text-slate-400 dark:text-slate-500" />
                                    <textarea 
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        rows="3"
                                        placeholder="What does this category include?"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-corporate-500/10 focus:border-corporate-500 transition-all font-medium text-slate-700 dark:text-slate-200 resize-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                {editingId && (
                                    <button 
                                        type="button" 
                                        onClick={handleCancel}
                                        className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 dark:bg-slate-900/50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button 
                                    type="submit" 
                                    disabled={saving}
                                    className="flex-2 flex items-center justify-center gap-2 px-6 py-3 bg-corporate-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-corporate-700 transition-all shadow-lg shadow-corporate-600/20 disabled:opacity-50"
                                >
                                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : editingId ? <Save size={16} /> : <Plus size={16} />}
                                    {editingId ? 'Update' : 'Add Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* List Column */}
                <div className="md:col-span-7 space-y-4">
                    {loading ? (
                        <div className="bg-white dark:bg-slate-900 p-12 rounded-[2rem] border border-slate-200 dark:border-slate-700 text-center">
                            <RefreshCw className="w-8 h-8 text-corporate-200 animate-spin mx-auto mb-4" />
                            <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-[10px]">Loading Categories...</p>
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 p-12 rounded-[2rem] border border-slate-200 dark:border-slate-700 text-center opacity-40 border-dashed">
                            <Layers className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px]">No Categories Yet</p>
                        </div>
                    ) : (
                        categories.map((cat) => (
                            <div 
                                key={cat.id} 
                                className={clsx(
                                    "group bg-white dark:bg-slate-900 p-6 rounded-[1.5rem] border transition-all flex items-center justify-between",
                                    editingId === cat.id ? "border-corporate-500 ring-4 ring-corporate-500/10" : "border-slate-200 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={clsx(
                                        "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                                        editingId === cat.id ? "bg-corporate-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600"
                                    )}>
                                        <Layers size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">{cat.name}</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-1">{cat.description || 'No description'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => handleEdit(cat)}
                                        className="p-2 text-slate-400 dark:text-slate-500 hover:text-corporate-600 hover:bg-corporate-50 rounded-lg transition-all"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(cat.id, cat.name)}
                                        className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default CategoryManager;
