import React, { useState, useMemo, useRef } from 'react';
import { X, Search, IndianRupee, Save, MessageSquare, CheckCircle2, UserCheck, User } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import TourReceipt from '../tours/TourReceipt';
import { useDevotees } from '../../context/DevoteeContext';
import { useToast } from '../Toast';
import apiService from '../../services/api';

const MODES = ['Cash', 'UPI / PhonePe / GPay', 'Bank Transfer', 'Cheque'];

const AddParticipantForm = ({ tour, onClose, onSuccess }) => {
    const { devotees } = useDevotees();
    const toast = useToast();
    const receiptRef = useRef(null);

    const [isWalkin, setIsWalkin] = useState(false);
    const [devoteeSearch, setDevoteeSearch] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savedBooking, setSavedBooking] = useState(null);
    const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
    const [whatsappSent, setWhatsappSent] = useState(false);

    const [formData, setFormData] = useState({
        devoteeId: '',
        devoteeName: '',
        guestName: '',
        guestContact: '',
        mobile: '',
        paidAmount: '',
        dueAmount: 0,
        bookingDate: new Date().toISOString().split('T')[0],
        mode: 'Cash',
        reference: '',
    });

    const tourFees = Number(tour?.fees || 0);

    // Auto-calc due amount
    React.useEffect(() => {
        const paid = parseFloat(formData.paidAmount) || 0;
        setFormData(prev => ({ ...prev, dueAmount: Math.max(0, tourFees - paid) }));
    }, [formData.paidAmount, tourFees]);

    const isAlreadyEnrolled = useMemo(() => {
        if (isWalkin || !formData.devoteeId || !tour?.enrollments) return false;
        return tour.enrollments.some(en => String(en.devoteeId) === String(formData.devoteeId));
    }, [isWalkin, formData.devoteeId, tour?.enrollments]);

    const filteredDevotees = useMemo(() => {
        const q = devoteeSearch.toLowerCase();
        if (!q) return devotees.slice(0, 20);
        return devotees.filter(d =>
            d.name?.toLowerCase().includes(q) || d.initiatedName?.toLowerCase().includes(q)
        ).slice(0, 20);
    }, [devotees, devoteeSearch]);

    const handleSelectDevotee = (dev) => {
        setFormData(prev => ({
            ...prev,
            devoteeId: dev.id,
            devoteeName: dev.initiatedName || dev.name,
            mobile: dev.contact || dev.whatsapp || '',
        }));
        setDevoteeSearch(dev.initiatedName || dev.name);
        setShowDropdown(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isWalkin && !formData.devoteeId) {
            return toast.error('Please select a devotee or use Walk-in');
        }
        if (isWalkin && !formData.guestName.trim()) {
            return toast.error('Please enter a name for the walk-in participant');
        }

        setSaving(true);
        try {
            // 1. Enroll participant
            const enrollPayload = {
                tourId: tour.id,
                bookingDate: formData.bookingDate,
                ...(isWalkin
                    ? { guestName: formData.guestName, guestContact: formData.guestContact }
                    : { devoteeId: formData.devoteeId }
                ),
            };
            const enrollRes = await apiService.post('/api/tours/enroll', enrollPayload);
            if (!enrollRes.success) throw new Error(enrollRes.error || 'Enrollment failed');

            const enrollmentId = enrollRes.id;

            // 2. Record initial payment if paidAmount > 0
            const paidAmount = parseFloat(formData.paidAmount) || 0;
            if (paidAmount > 0) {
                const payRes = await apiService.post('/api/tours/payments', {
                    enrollmentId,
                    amount: paidAmount,
                    paymentDate: formData.bookingDate,
                    paymentMode: formData.mode,
                    reference: formData.reference,
                });
                if (!payRes.success) throw new Error(payRes.error || 'Payment recording failed');
            }

            toast.success('Participant booked successfully!');
            const bookingDetails = {
                enrollmentId,
                tourName: tour.name,
                destination: tour.destination,
                tourFees,
                paidAmount,
                dueAmount: formData.dueAmount,
                bookingDate: formData.bookingDate,
                mode: formData.mode,
                reference: formData.reference,
                mobile: isWalkin ? formData.guestContact : formData.mobile,
                devoteeName: isWalkin ? null : formData.devoteeName,
                guestName: isWalkin ? formData.guestName : null,
            };
            setSavedBooking(bookingDetails);
            onSuccess?.();
        } catch (err) {
            let errorMsg = err.message || 'Failed to save booking';
            if (errorMsg.includes('UNIQUE constraint failed')) {
                errorMsg = 'This devotee is already enrolled in this tour.';
            }
            toast.error(errorMsg);
        } finally {
            setSaving(false);
        }
    };

    const handleDownloadReceipt = async () => {
        if (!receiptRef.current) return;
        try {
            toast.info('Generating receipt...');
            const dataUrl = await htmlToImage.toPng(receiptRef.current, {
                pixelRatio: 2,
                backgroundColor: '#fff',
                cacheBust: true,
            });
            const link = document.createElement('a');
            link.download = `TourReceipt_YATRA-${String(savedBooking.enrollmentId).padStart(5, '0')}.png`;
            link.href = dataUrl;
            link.click();
            toast.success('Receipt downloaded!');
        } catch (err) {
            toast.error('Failed to generate receipt: ' + err.message);
        }
    };

    const handleSendWhatsApp = async () => {
        if (!savedBooking?.mobile || !receiptRef.current) return;
        setSendingWhatsApp(true);
        try {
            toast.info('Generating receipt image...');
            const dataUrl = await htmlToImage.toPng(receiptRef.current, {
                pixelRatio: 2,
                backgroundColor: '#fff',
                cacheBust: true,
            });
            const link = document.createElement('a');
            link.download = `TourReceipt_${savedBooking.enrollmentId}.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            let waNumber = savedBooking.mobile.replace(/[^0-9]/g, '');
            if (waNumber.length === 10) waNumber = '91' + waNumber;

            const displayName = savedBooking.guestName || savedBooking.devoteeName || 'Pilgrim';
            const waMessage =
                `Hare Krishna ${displayName}!\n\n` +
                `Thank you for booking your Yatra with us.\n\n` +
                `Booking #YATRA-${String(savedBooking.enrollmentId).padStart(5, '0')}\n` +
                `Tour: ${savedBooking.tourName}\n` +
                `Destination: ${savedBooking.destination || '—'}\n` +
                `Date: ${savedBooking.bookingDate}\n\n` +
                `Payment Summary:\n` +
                `- Tour Fees: INR ${Number(savedBooking.tourFees).toLocaleString()}\n` +
                `- Paid: INR ${Number(savedBooking.paidAmount).toLocaleString()}\n` +
                `- Balance Due: INR ${Number(savedBooking.dueAmount).toLocaleString()}\n\n` +
                `ISKCON DURGAPUR`;

            window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`, '_blank', 'noopener,noreferrer');
            setWhatsappSent(true);
        } catch (err) {
            toast.error('Failed to generate receipt: ' + err.message);
        } finally {
            setSendingWhatsApp(false);
        }
    };

    // ─── Success Screen ──────────────────────────────────────────────────────
    if (savedBooking) {
        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col items-center p-8 relative max-h-[90vh] overflow-y-auto">
                    <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4">
                        <UserCheck className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">Participant Booked!</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 text-center">
                        Receipt: <span className="font-mono font-bold text-slate-700 dark:text-slate-200">#YATRA-{String(savedBooking.enrollmentId).padStart(5, '0')}</span>
                    </p>

                    <TourReceipt ref={receiptRef} booking={savedBooking} />

                    {savedBooking.mobile && !whatsappSent && (
                        <div className="w-full mb-4 p-5 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-2 text-emerald-700 font-bold">
                                <MessageSquare className="w-5 h-5" />
                                <span>Share confirmation on WhatsApp?</span>
                            </div>
                            <div className="flex gap-2 w-full">
                                <button
                                    onClick={() => setWhatsappSent(true)}
                                    className="flex-1 py-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 text-emerald-600 font-bold text-sm hover:bg-emerald-100 transition-colors"
                                >
                                    No, Skip
                                </button>
                                <button
                                    disabled={sendingWhatsApp}
                                    onClick={handleSendWhatsApp}
                                    className="flex-1 py-2 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                                >
                                    {sendingWhatsApp ? 'Preparing...' : 'Download & Share'}
                                </button>
                            </div>
                        </div>
                    )}

                    {whatsappSent && savedBooking.mobile && (
                        <div className="w-full mb-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center gap-2 text-emerald-700 font-bold text-sm">
                            <CheckCircle2 className="w-5 h-5" />
                            <span>Receipt ready to share!</span>
                        </div>
                    )}

                    <div className="flex flex-col w-full gap-3">
                        <button
                            onClick={handleDownloadReceipt}
                            className="w-full bg-orange-600 text-white font-bold py-3 rounded-xl hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
                        >
                            <IndianRupee className="w-5 h-5" /> Download Receipt
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-50 dark:bg-slate-900/50 transition-colors"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Form ────────────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[95vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Add Participant</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{tour?.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors text-slate-500 dark:text-slate-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
                    {/* Walk-in toggle */}
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                        <button
                            type="button"
                            onClick={() => { setIsWalkin(false); setFormData(f => ({ ...f, guestName: '', guestContact: '' })); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-sm transition-all ${!isWalkin ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'}`}
                        >
                            <User className="w-4 h-4" /> Existing Devotee
                        </button>
                        <button
                            type="button"
                            onClick={() => { setIsWalkin(true); setFormData(f => ({ ...f, devoteeId: '', devoteeName: '' })); setDevoteeSearch(''); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-sm transition-all ${isWalkin ? 'bg-white dark:bg-slate-900 text-orange-600 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'}`}
                        >
                            <UserCheck className="w-4 h-4" /> Walk-in / Anonymous
                        </button>
                    </div>

                    {isWalkin ? (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Participant Name <span className="text-red-500">*</span></label>
                                <input
                                    name="guestName"
                                    value={formData.guestName}
                                    onChange={handleChange}
                                    placeholder="e.g. Anonymous"
                                    autoFocus
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Mobile Number</label>
                                <input
                                    name="guestContact"
                                    value={formData.guestContact}
                                    onChange={handleChange}
                                    placeholder="WhatsApp number"
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-sm"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="relative">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Select Devotee <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                                <input
                                    value={devoteeSearch}
                                    onChange={e => { setDevoteeSearch(e.target.value); setShowDropdown(true); setFormData(f => ({ ...f, devoteeId: '', devoteeName: '' })); }}
                                    onFocus={() => setShowDropdown(true)}
                                    placeholder="Search devotee by name..."
                                    className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-sm"
                                />
                            </div>
                            {showDropdown && filteredDevotees.length > 0 && !formData.devoteeId && (
                                <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-52 overflow-y-auto">
                                    {filteredDevotees.map(dev => (
                                        <button key={dev.id} type="button" onClick={() => handleSelectDevotee(dev)}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 text-left transition-colors">
                                            <div className="w-7 h-7 rounded-full bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-slate-400 dark:text-slate-500 font-bold text-xs">
                                                {dev.photo ? <img src={dev.photo} alt="" className="w-full h-full object-cover" /> : (dev.name?.charAt(0) || '?')}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{dev.initiatedName || dev.name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{dev.contact || dev.whatsapp || 'No contact'}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {formData.devoteeId && !isAlreadyEnrolled && <p className="mt-1 text-xs text-emerald-600 font-medium tracking-wide flex items-center gap-1 animate-in zoom-in-95 duration-200">
                                <CheckCircle2 size={12} /> {formData.devoteeName} selected
                            </p>}
                            {isAlreadyEnrolled && (
                                <div className="mt-2 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2.5 animate-in slide-in-from-top-1 duration-200">
                                    <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-rose-700">Already Enrolled</p>
                                        <p className="text-[10px] text-rose-600 font-medium leading-relaxed">This devotee is already registered for this tour. You cannot add them again.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Mobile for devotee mode */}
                    {!isWalkin && formData.devoteeId && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Mobile Number</label>
                            <input
                                name="mobile"
                                value={formData.mobile}
                                onChange={handleChange}
                                placeholder="WhatsApp number"
                                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-sm"
                            />
                        </div>
                    )}

                    {/* Payment fields */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Tour Fees</label>
                            <div className="relative">
                                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                                <input
                                    type="number"
                                    value={tourFees}
                                    readOnly
                                    className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-xl outline-none text-sm font-medium text-slate-500 dark:text-slate-400"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Advance Paid <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                                <input
                                    type="number"
                                    name="paidAmount"
                                    value={formData.paidAmount}
                                    onChange={handleChange}
                                    placeholder="0"
                                    className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-sm font-medium"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Due Amount</label>
                            <div className="relative">
                                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                                <input
                                    type="number"
                                    value={formData.dueAmount}
                                    readOnly
                                    className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-xl outline-none text-sm font-bold text-red-600"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Booking Date <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                name="bookingDate"
                                value={formData.bookingDate}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Payment Mode</label>
                            <select
                                name="mode"
                                value={formData.mode}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-sm"
                            >
                                {MODES.map(m => <option key={m}>{m}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Reference / Note</label>
                        <input
                            name="reference"
                            value={formData.reference}
                            onChange={handleChange}
                            placeholder="Transaction ID, Cheque number, or notes..."
                            className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-sm"
                        />
                    </div>

                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900/50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving || isAlreadyEnrolled}
                            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all shadow-lg flex items-center justify-center gap-2 ${
                                isAlreadyEnrolled 
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none' 
                                : 'bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60'
                            }`}
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Saving...' : isAlreadyEnrolled ? 'Already Enrolled' : 'Save Booking'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddParticipantForm;
