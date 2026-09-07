import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, IndianRupee, Search, Phone, FileText, MessageSquare, CheckCircle2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import MoneyReceipt from '../../components/finance/MoneyReceipt';
import { useDevotees } from '../../context/DevoteeContext';
import { useToast } from '../../components/Toast';
import apiService from '../../services/api';
import clsx from 'clsx';

const PURPOSES = ['Deity Worship', 'Festival', 'Annadan', 'Construction', 'Spiritual Retreat', 'General', 'Book Distribution', 'Prasad', 'Other'];
const EXPENSE_CATEGORIES = [
    'Temple Construction', 'Deity Worship', 'Kitchen & Feast', 
    'Book Distribution', 'Festival Fund', 'Maintenance', 'Staff Salary', 'Other'
];
const MODES = ['Cash', 'UPI', 'Bank Transfer', 'Cheque'];

const FinanceForm = () => {
    const navigate = useNavigate();
    const { devotees } = useDevotees();
    const toast = useToast();

    const [activeTab, setActiveTab] = useState('income'); // 'income' or 'expense'
    const [formData, setFormData] = useState({
        // Common
        amount: '',
        date: new Date().toISOString().split('T')[0],
        mode: 'Cash',
        reference: '',
        
        // Income specific
        devoteeId: '',
        devoteeName: '',
        totalAmount: '',
        dueAmount: 0,
        purpose: 'General',
        otherPurpose: '',
        mobile: '',
        
        // Expense specific
        title: '',
        category: '',
        notes: ''
    });
    const [savedRecord, setSavedRecord] = useState(null);
    const receiptRef = React.useRef(null);
    const [devoteeSearch, setDevoteeSearch] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isWalkin, setIsWalkin] = useState(false);
    const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
    const [whatsappSent, setWhatsappSent] = useState(false);

    const filteredDevotees = useMemo(() => {
        const q = devoteeSearch.toLowerCase();
        if (!q) return devotees.slice(0, 20);
        return devotees.filter(d =>
            d.name?.toLowerCase().includes(q) || d.initiatedName?.toLowerCase().includes(q)
        ).slice(0, 20);
    }, [devotees, devoteeSearch]);

    // Auto-calculate Due Amount (for income)
    React.useEffect(() => {
        if (activeTab === 'income') {
            const total = parseFloat(formData.totalAmount) || 0;
            const advance = parseFloat(formData.amount) || 0;
            setFormData(prev => ({ ...prev, dueAmount: Math.max(0, total - advance) }));
        }
    }, [formData.totalAmount, formData.amount, activeTab]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectDevotee = (dev) => {
        setFormData(prev => ({
            ...prev,
            devoteeId: dev.id,
            devoteeName: dev.initiatedName || dev.name,
            mobile: dev.contact || dev.whatsapp || ''
        }));
        setDevoteeSearch(dev.initiatedName || dev.name);
        setShowDropdown(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.amount || !formData.date) {
            return toast.error('Amount and date are required');
        }

        if (activeTab === 'income') {
            if (!formData.purpose) return toast.error('Purpose is required');
            if (!isWalkin && !formData.devoteeId) return toast.error('Please select a devotee or mark as Walk-in');
        } else {
            if (!formData.title) return toast.error('Expense title is required');
            if (!formData.category) return toast.error('Expense category is required');
        }

        setSaving(true);
        try {
            if (activeTab === 'income') {
                const body = {
                    amount: parseFloat(formData.amount),
                    totalAmount: parseFloat(formData.totalAmount) || parseFloat(formData.amount),
                    dueAmount: parseFloat(formData.dueAmount),
                    purpose: formData.purpose === 'Other' ? formData.otherPurpose : formData.purpose,
                    devoteeId: isWalkin ? null : formData.devoteeId,
                    devoteeName: isWalkin ? (formData.devoteeName || 'Walk-in Donor') : formData.devoteeName,
                    mobile: formData.mobile,
                    date: formData.date,
                    mode: formData.mode,
                    reference: formData.reference
                };
                const data = await apiService.post('/api/finance/donations', body);
                toast.success('Donation recorded!');
                setSavedRecord({ ...body, id: data.id, type: 'income' });
            } else {
                const body = {
                    title: formData.title,
                    category: formData.category,
                    amount: parseFloat(formData.amount),
                    date: formData.date,
                    mode: formData.mode,
                    reference: formData.reference,
                    notes: formData.notes
                };
                const data = await apiService.post('/api/finance/expenses', body);
                toast.success('Expense recorded!');
                setSavedRecord({ ...body, id: data.id, type: 'expense' });
            }
        } catch(err) {
            toast.error(err.message || 'Failed to save record');
        } finally {
            setSaving(false);
        }
    };

    const handleSendWhatsApp = async () => {
        if (!savedRecord || !receiptRef.current) return;

        if (savedRecord.type === 'income') {
            setSendingWhatsApp(true);
            try {
                const dataUrl = await htmlToImage.toPng(receiptRef.current, { pixelRatio: 2, backgroundColor: '#fff' });
                const link = document.createElement('a');
                link.download = `receipt_${savedRecord.id}.png`;
                link.href = dataUrl;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                let waNumber = (savedRecord.mobile || '').replace(/[^0-9]/g, '');
                if (waNumber.length === 10) waNumber = '91' + waNumber;
                if (waNumber) {
                    const waMessage = `Hare Krishna ${savedRecord.devoteeName}!\n\nThank you for your donation.\n\nReceipt Number: #REC-${savedRecord.id}\nDate: ${savedRecord.date}\nPurpose: ${savedRecord.purpose}\nAmount: INR ${savedRecord.amount.toLocaleString()}\n\nISKCON DURGAPUR`;
                    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`, '_blank', 'noopener,noreferrer');
                }
                toast.success('Receipt downloaded!');
                setWhatsappSent(true);
            } catch {
                toast.error('Failed to generate receipt image');
            } finally {
                setSendingWhatsApp(false);
            }
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Record Transaction</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Log income or expense</p>
                </div>
                <button type="button" onClick={() => navigate('/finance')}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900/50 transition-colors text-sm font-medium">
                    <X className="w-4 h-4" /> Cancel
                </button>
            </div>

            {/* Type Toggle */}
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex gap-1">
                <button 
                    onClick={() => { setActiveTab('income'); setSavedRecord(null); }}
                    className={clsx("flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all", activeTab === 'income' ? "bg-white dark:bg-slate-900 text-emerald-600 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:bg-slate-200")}
                >
                    <ArrowUpCircle size={16} /> Income (Donation)
                </button>
                <button 
                    onClick={() => { setActiveTab('expense'); setSavedRecord(null); }}
                    className={clsx("flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all", activeTab === 'expense' ? "bg-white dark:bg-slate-900 text-red-600 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:bg-slate-200")}
                >
                    <ArrowDownCircle size={16} /> Expense
                </button>
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
                {activeTab === 'income' ? (
                    <>
                        <div className="flex items-center gap-3">
                            <input id="walkin" type="checkbox" checked={isWalkin} onChange={e => { setIsWalkin(e.target.checked); }}
                                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 accent-corporate-600" />
                            <label htmlFor="walkin" className="text-sm font-medium text-slate-700 dark:text-slate-200">Walk-in / Anonymous Donor</label>
                        </div>

                        {isWalkin ? (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Donor Name (Optional)</label>
                                <input name="devoteeName" value={formData.devoteeName} onChange={handleChange} placeholder="e.g. Anonymous"
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm" />
                            </div>
                        ) : (
                            <div className="relative">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Select Devotee <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                                    <input
                                        value={devoteeSearch}
                                        onChange={e => { setDevoteeSearch(e.target.value); setShowDropdown(true); }}
                                        onFocus={() => setShowDropdown(true)}
                                        placeholder="Search devotee..."
                                        className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm"
                                    />
                                </div>
                                {showDropdown && filteredDevotees.length > 0 && !formData.devoteeId && (
                                    <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                                        {filteredDevotees.map(dev => (
                                            <button key={dev.id} type="button" onClick={() => handleSelectDevotee(dev)}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-corporate-50 text-left">
                                                <div className="w-7 h-7 rounded-full bg-slate-200 overflow-hidden shrink-0">
                                                    {dev.photo && <img src={dev.photo} alt="" className="w-full h-full object-cover" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{dev.initiatedName || dev.name}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{dev.contact}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {formData.devoteeId && <p className="mt-1 text-xs text-emerald-600 font-medium">✓ {formData.devoteeName} selected</p>}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Total Amount</label>
                                <input type="number" name="totalAmount" value={formData.totalAmount} onChange={handleChange} placeholder="0"
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Paid Amount <span className="text-red-500">*</span></label>
                                <input type="number" name="amount" value={formData.amount} onChange={handleChange} placeholder="0"
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Due Amount</label>
                                <input type="number" value={formData.dueAmount} readOnly
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-sm font-bold text-red-600" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Purpose <span className="text-red-500">*</span></label>
                                <select name="purpose" value={formData.purpose} onChange={handleChange}
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm">
                                    {PURPOSES.map(p => <option key={p}>{p}</option>)}
                                </select>
                            </div>
                            {formData.purpose === 'Other' && (
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Specific Purpose</label>
                                    <input name="otherPurpose" value={formData.otherPurpose} onChange={handleChange} placeholder="Enter purpose..."
                                        className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Mobile (WhatsApp)</label>
                                <input name="mobile" value={formData.mobile} onChange={handleChange} placeholder="Phone number"
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Expense Title / Description <span className="text-red-500">*</span></label>
                                <input name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Electric bill for April"
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" required />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Expense Purpose <span className="text-red-500">*</span></label>
                                    <select name="category" value={formData.category} onChange={handleChange}
                                        className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" required>
                                        <option value="">Select Category</option>
                                        {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Amount <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                                        <input type="number" name="amount" value={formData.amount} onChange={handleChange} placeholder="0"
                                            className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium" required />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Internal Notes</label>
                                <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2}
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm resize-none" placeholder="Additional details..." />
                            </div>
                        </div>
                    </>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Date <span className="text-red-500">*</span></label>
                        <input type="date" name="date" value={formData.date} onChange={handleChange}
                            className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Payment Mode</label>
                        <select name="mode" value={formData.mode} onChange={handleChange}
                            className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm">
                            {MODES.map(m => <option key={m}>{m}</option>)}
                        </select>
                    </div>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Reference (Transaction ID / Cheque #)</label>
                    <input name="reference" value={formData.reference} onChange={handleChange} placeholder="Optional"
                        className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
                </div>

                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => navigate('/finance')}
                        className="flex-1 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900/50 transition-colors">Cancel</button>
                    <button type="submit" disabled={saving}
                        className={clsx("flex-1 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-60", activeTab === 'income' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700")}>
                        <Save className="w-4 h-4" /> {saving ? 'Saving...' : `Save ${activeTab === 'income' ? 'Donation' : 'Expense'}`}
                    </button>
                </div>
            </form>

            {savedRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col items-center p-8">
                        <div className={clsx("w-16 h-16 rounded-full flex items-center justify-center mb-4", savedRecord.type === 'income' ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600")}>
                            <Save className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-1">{savedRecord.type === 'income' ? 'Donation' : 'Expense'} Recorded Successfully!</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 text-center">Reference ID: <span className="font-mono font-bold text-slate-700 dark:text-slate-200">#{savedRecord.id}</span></p>

                        {savedRecord.type === 'income' && <MoneyReceipt ref={receiptRef} donation={savedRecord} />}
                        
                        {savedRecord.type === 'income' && savedRecord.mobile && !whatsappSent && (
                            <div className="w-full mb-6 p-5 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-center gap-2 text-emerald-700 font-bold">
                                    <MessageSquare className="w-5 h-5" /> 
                                    <span>Send receipt on WhatsApp?</span>
                                </div>
                                <p className="text-[11px] text-emerald-700/70 text-center -mt-1">
                                    Downloads the receipt and opens a WhatsApp message with the number on file.
                                </p>
                                <div className="flex gap-2 w-full">
                                    <button onClick={() => setWhatsappSent(true)} className="flex-1 py-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 text-emerald-600 font-bold text-sm hover:bg-emerald-100">Skip</button>
                                    <button onClick={handleSendWhatsApp} disabled={sendingWhatsApp} className="flex-1 py-2 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 shadow-sm disabled:opacity-50">
                                        {sendingWhatsApp ? 'Preparing...' : 'Download & Share'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col w-full gap-3">
                            {savedRecord.type === 'income' && (
                                <button onClick={async () => {
                                    const dataUrl = await htmlToImage.toPng(receiptRef.current, { pixelRatio: 2, backgroundColor: '#fff' });
                                    const link = document.createElement('a');
                                    link.download = `receipt_${savedRecord.id}.png`; link.href = dataUrl; link.click();
                                    toast.success('Receipt downloaded!');
                                }} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg flex items-center justify-center gap-2">
                                    <IndianRupee className="w-5 h-5" /> Download Money Receipt
                                </button>
                            )}
                            <button onClick={() => navigate('/finance')} className="w-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-50 dark:bg-slate-900/50 transition-colors">
                                Back to Finance Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinanceForm;
