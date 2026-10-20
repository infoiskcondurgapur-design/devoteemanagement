import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { formatDate, formatDateRange } from '../../lib/dateUtils';
import { useParams, useNavigate } from 'react-router-dom';
import {
    MapPin, Calendar, Users, CreditCard, Compass,
    Plus, Trash2, Edit, CheckCircle, X, Search,
    ArrowLeft, MoreVertical, IndianRupee, Plane,
    History, Check, ExternalLink, PersonStanding,
    MessageSquare, Download, Filter as FilterIcon, Printer, Phone, RotateCcw, Crown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDevotees } from '../../context/DevoteeContext';
import { useToast } from '../../components/Toast';
import apiService from '../../services/api';
import AddParticipantForm from '../../components/tours/AddParticipantForm';
import CancelRefundModal from '../../components/CancelRefundModal';
import WhatsAppModal from '../../components/WhatsAppModal';
import { openWhatsApp, sanitizeWhatsAppNumber } from '../../services/whatsappLink';
import * as XLSX from 'xlsx';

const TourDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAdmin } = useAuth();
    const { devotees } = useDevotees();
    const toast = useToast();

    const [tour, setTour] = useState(null);
    const [loading, setLoading] = useState(true);
    const [enrollments, setEnrollments] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [mobileFilter, setMobileFilter] = useState('');

    // Modals
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedEnrollment, setSelectedEnrollment] = useState(null);
    const [paymentForm, setPaymentForm] = useState({ amount: 0, mode: 'Cash', reference: '' });

    // WhatsApp Modal State
    const [whatsAppParticipant, setWhatsAppParticipant] = useState(null);
    const [whatsAppMessage, setWhatsAppMessage] = useState('');
    const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

    // Cancel & Refund Modal State
    const [showCancelRefundModal, setShowCancelRefundModal] = useState(false);
    const [cancelTargetEnrollment, setCancelTargetEnrollment] = useState(null);
    const [isRefundOnlyAction, setIsRefundOnlyAction] = useState(false);

    // Filters
    const [statusFilter, setStatusFilter] = useState('All');
    const [paymentFilter, setPaymentFilter] = useState('All');
    const [leaderFilter, setLeaderFilter] = useState('All');

    // Inline Leader Editing State
    const [editingLeaderId, setEditingLeaderId] = useState(null);
    const [editingLeaderValue, setEditingLeaderValue] = useState('');

    const fetchTourData = useCallback(async () => {
        try {
            const response = await apiService.get(`/api/tours/${id}`);
            if (response.success) {
                setTour(response.data);
                setEnrollments(response.data.enrollments || []);
            } else {
                toast.error('Failed to fetch tour details');
                navigate('/tours');
            }
        } catch {
            toast.error('Server error');
        } finally {
            setLoading(false);
        }
    }, [id, navigate, toast]);

    useEffect(() => {
        fetchTourData();
    }, [fetchTourData]);

    const updateEnrollmentStatus = async (enrollmentId, status) => {
        try {
            const response = await apiService.put(`/api/tours/enroll/${enrollmentId}`, { status });
            if (response.success) {
                toast.success('Status updated');
                fetchTourData();
            }
        } catch {
            toast.error('Update failed');
        }
    };

    const updateEnrollmentLeader = async (enrollmentId, leader) => {
        try {
            const response = await apiService.put(`/api/tours/enroll/${enrollmentId}`, { leader: leader?.trim() || null });
            if (response.success) {
                toast.success('Leader updated');
                fetchTourData();
            } else {
                toast.error(response.error || 'Failed to update leader');
            }
        } catch {
            toast.error('Update failed');
        }
    };

    const handleConfirmCancelRefund = async ({ enrollmentId, refundAmount, refundMode, reason, newStatus }) => {
        try {
            if (refundAmount > 0) {
                const payRes = await apiService.post('/api/tours/payments', {
                    enrollmentId,
                    amount: -refundAmount,
                    paymentMode: `Refund (${refundMode})`,
                    reference: reason || 'Cancellation Refund'
                });
                if (!payRes.success) {
                    throw new Error(payRes.error || 'Failed to record refund');
                }
            }

            if (newStatus && (!cancelTargetEnrollment || cancelTargetEnrollment.status !== newStatus)) {
                const statRes = await apiService.put(`/api/tours/enroll/${enrollmentId}`, { status: newStatus });
                if (!statRes.success) {
                    throw new Error(statRes.error || 'Failed to update enrollment status');
                }
            }

            toast.success(refundAmount > 0 ? `Successfully refunded ₹${refundAmount.toLocaleString('en-IN')}` : 'Cancellation recorded');
            fetchTourData();

            const currentPaid = Number(cancelTargetEnrollment?.totalPaid || 0);
            const currentRefunded = Number(cancelTargetEnrollment?.totalRefunded || 0);
            const currentReceived = Number(cancelTargetEnrollment?.totalReceived || currentPaid);
            const updatedEn = {
                ...cancelTargetEnrollment,
                status: newStatus || 'Cancelled',
                totalPaid: Math.max(0, currentPaid - refundAmount),
                totalRefunded: currentRefunded + refundAmount,
                totalReceived: currentReceived,
                paymentStatus: (currentPaid - refundAmount <= 0) ? 'Refunded' : 'Partial Refund'
            };

            handleSendWhatsAppReceipt(updatedEn, false);
        } catch (err) {
            toast.error(err.message || 'Failed to process refund');
            throw err;
        }
    };

    const handleAddPayment = async (e) => {
        e.preventDefault();
        try {
            const response = await apiService.post('/api/tours/payments', {
                enrollmentId: selectedEnrollment.id,
                ...paymentForm
            });
            if (response.success) {
                toast.success('Payment recorded');
                const prevPaid = Number(selectedEnrollment.totalPaid || 0);
                const addedAmount = parseFloat(paymentForm.amount) || 0;
                const updatedEn = { ...selectedEnrollment, totalPaid: prevPaid + addedAmount };

                fetchTourData();
                setShowPaymentModal(false);
                setPaymentForm({ amount: 0, mode: 'Cash', reference: '' });

                // Open WhatsApp modal with receipt
                handleSendWhatsAppReceipt(updatedEn, false);
            } else {
                toast.error(response.error || 'Failed to record payment');
            }
        } catch {
            toast.error('Connection error');
        }
    };

    const handleExportExcel = () => {
        try {
            const data = activeEnrollments.map(en => ({
                'Name': (en.devoteeId && !en.devoteeId.startsWith('GUEST_')) ? (en.initiatedName || en.devoteeName) : en.guestName,
                'Leader': en.leader || en.devoteeCounselor || '—',
                'Status': en.status,
                'Payment': en.paymentStatus,
                'Paid (Rs.)': en.totalPaid,
                'Pending (Rs.)': tour.fees - en.totalPaid,
                'Contact': (en.devoteeId && !en.devoteeId.startsWith('GUEST_')) ? (en.whatsapp || en.contact) : (en.guestContact || ''),
                'Booking Date': en.bookingDate
            }));
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Participants");
            XLSX.writeFile(wb, `${tour.name.replace(/\s+/g, '_')}_Participants.xlsx`);
            toast.success('Exported to Excel');
        } catch {
            toast.error('Export failed');
        }
    };

    const handleSendWhatsAppReceipt = (en, openDirect = true) => {
        const isGuest = !en.devoteeId || en.devoteeId.startsWith('GUEST_');
        const dev = !isGuest && Array.isArray(devotees) ? devotees.find(d => String(d.id) === String(en.devoteeId)) : null;

        const name = isGuest 
            ? (en.guestName || 'Pilgrim') 
            : (en.initiatedName || en.devoteeName || dev?.initiatedName || dev?.name || 'Devotee');

        const rawPhone = isGuest 
            ? (en.guestContact || '') 
            : (en.whatsapp || en.contact || dev?.whatsapp || dev?.contact || '');

        const tourFee = Number(tour?.fees || 0);
        const totalPaid = Number(en.totalPaid || 0);
        const totalRefunded = Number(en.totalRefunded || 0);
        const totalReceived = Number(en.totalReceived || (totalPaid + totalRefunded));
        const isCancelled = en.status === 'Cancelled';

        let message;
        if (isCancelled) {
            message = 
                `Hare Krishna ${name}! 🙏\n\n` +
                `This is an update regarding your Yatra booking:\n` +
                `• Tour: ${tour?.name || 'Spiritual Yatra'}\n` +
                `• Destination: ${tour?.destination || '—'}\n` +
                `• Dates: ${formatDateRange(tour?.startDate, tour?.endDate)}\n` +
                `• Status: *CANCELLED*\n\n` +
                `*Financial & Refund Summary:*\n` +
                `• Tour Fee: ₹${tourFee.toLocaleString('en-IN')}\n` +
                `• Total Paid Initially: ₹${totalReceived.toLocaleString('en-IN')}\n` +
                `• Amount Refunded: ₹${totalRefunded.toLocaleString('en-IN')}\n` +
                `• Balance Retained: ₹${totalPaid.toLocaleString('en-IN')}\n` +
                `• Status: ${en.paymentStatus || 'Processed'}\n\n` +
                `For any questions or clarification, please reach out to the Yatra coordinator.\n\n` +
                `*ISKCON DURGAPUR*`;
        } else {
            const dueAmount = tourFee - totalPaid;
            message = 
                `Hare Krishna ${name}! 🙏\n\n` +
                `Here are your Yatra booking details:\n` +
                `• Tour: ${tour?.name || 'Spiritual Yatra'}\n` +
                `• Destination: ${tour?.destination || '—'}\n` +
                `• Dates: ${formatDateRange(tour?.startDate, tour?.endDate)}\n` +
                `• Booking Status: ${en.status}\n` +
                (en.leader ? `• Leader / Guide: ${en.leader}\n` : '') +
                `• Tour Fees: ₹${tourFee.toLocaleString('en-IN')}\n` +
                `• Total Paid: ₹${totalPaid.toLocaleString('en-IN')}\n` +
                `• Balance Due: ₹${(dueAmount > 0 ? dueAmount : 0).toLocaleString('en-IN')}\n\n` +
                `For any assistance, please contact the Yatra coordinator.\n\n` +
                `*ISKCON DURGAPUR*`;
        }

        const cleanPhone = sanitizeWhatsAppNumber(rawPhone);

        // If phone is valid and direct open is requested, open WhatsApp Web immediately on user click
        if (openDirect && cleanPhone && cleanPhone.length >= 10) {
            try {
                openWhatsApp(cleanPhone, message, 'web');
                const webUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
                toast.success(
                    <span>Opening WhatsApp Web for {name}... <a href={webUrl} target="_blank" rel="noopener noreferrer" className="underline font-bold text-emerald-800 ml-1">Click if not opened</a></span>
                );
                return;
            } catch (err) {
                console.warn('Direct openWhatsApp failed, falling back to modal:', err);
            }
        }

        // Otherwise open the modal for user review or to enter missing phone number
        setWhatsAppParticipant({
            name,
            contact: rawPhone,
            whatsapp: rawPhone,
            photo: en.photo || dev?.photo || '',
            subtitle: `Tour: ${tour?.name || 'Yatra'}`
        });
        setWhatsAppMessage(message);
        setShowWhatsAppModal(true);
    };

    const handleDeleteTour = async () => {
        if (!window.confirm('Delete this tour and all related booking data? This cannot be undone.')) return;
        try {
            const response = await apiService.delete(`/api/tours/${id}`);
            if (response.success) {
                toast.success('Tour deleted');
                navigate('/tours');
            }
        } catch {
            toast.error('Failed to delete tour');
        }
    };

    const handleDeleteParticipant = async (enrollmentId, name) => {
        if (!window.confirm(`Remove ${name} from this tour? This will also delete their payment records.`)) return;
        try {
            const response = await apiService.delete(`/api/tours/enroll/${enrollmentId}`);
            if (response.success) {
                toast.success('Participant removed');
                fetchTourData();
            } else {
                toast.error(response.error || 'Failed to remove participant');
            }
        } catch {
            toast.error('Connection error');
        }
    };

    const uniqueLeaders = useMemo(() => {
        const set = new Set();
        enrollments.forEach(e => {
            if (e.leader && typeof e.leader === 'string' && e.leader.trim()) {
                set.add(e.leader.trim());
            }
        });
        return Array.from(set).sort();
    }, [enrollments]);

    const allLeaderOptions = useMemo(() => {
        const set = new Set(uniqueLeaders);
        (devotees || []).forEach(d => {
            if (d.counselor && typeof d.counselor === 'string') {
                const c = d.counselor.trim();
                if (c) set.add(c);
            }
        });
        return Array.from(set).sort();
    }, [uniqueLeaders, devotees]);

    const filteredEnrollments = useMemo(() => {
        return enrollments.filter(e => {
            const searchLower = searchTerm.toLowerCase().trim();
            const tokens = searchLower.split(/\s+/).filter(Boolean);
            const contactStr = String(
                (e.devoteeId && !e.devoteeId.startsWith('GUEST_')) 
                    ? (e.whatsapp || e.contact || '') 
                    : (e.guestContact || '')
            ).trim().toLowerCase();

            const devName = (e.devoteeName || '').toLowerCase();
            const initName = (e.initiatedName || '').toLowerCase();
            const guestName = (e.guestName || '').toLowerCase();
            const devId = String(e.devoteeId || '').toLowerCase();
            const leaderName = (e.leader || '').toLowerCase();
            const counselorName = (e.devoteeCounselor || '').toLowerCase();

            const matchesSearch = !searchTerm || tokens.every(tok => 
                devName.includes(tok) || 
                initName.includes(tok) || 
                guestName.includes(tok) || 
                (devId.includes(tok) && !devId.startsWith('guest_')) || 
                contactStr.includes(tok) ||
                leaderName.includes(tok) ||
                counselorName.includes(tok)
            );

            if (!matchesSearch) return false;

            if (mobileFilter) {
                const cleanFilter = mobileFilter.replace(/\D/g, '');
                const cleanContact = contactStr.replace(/\D/g, '');
                if (!cleanContact.includes(cleanFilter)) return false;
            }

            if (leaderFilter !== 'All') {
                if (leaderFilter === 'Unassigned') {
                    if (e.leader && e.leader.trim()) return false;
                } else {
                    if ((e.leader || '').trim().toLowerCase() !== leaderFilter.trim().toLowerCase()) return false;
                }
            }

            if (statusFilter !== 'All' && e.status !== statusFilter) return false;
            if (paymentFilter !== 'All') {
                if (paymentFilter === 'Paid' && e.paymentStatus !== 'Completed') return false;
                if (paymentFilter === 'Partial' && e.paymentStatus !== 'Partial') return false;
                if (paymentFilter === 'Nil' && e.paymentStatus !== 'Pending') return false;
            }
            return true;
        });
    }, [enrollments, searchTerm, mobileFilter, leaderFilter, statusFilter, paymentFilter]);

    const hasActiveFilters = !!(searchTerm || mobileFilter || leaderFilter !== 'All' || statusFilter !== 'All' || paymentFilter !== 'All');

    const handleClearFilters = () => {
        setSearchTerm('');
        setMobileFilter('');
        setLeaderFilter('All');
        setStatusFilter('All');
        setPaymentFilter('All');
    };

    const activeEnrollments = useMemo(() =>
        filteredEnrollments.filter(e => e.status !== 'Cancelled'),
        [filteredEnrollments]);

    const cancelledEnrollments = useMemo(() =>
        filteredEnrollments.filter(e => e.status === 'Cancelled'),
        [filteredEnrollments]);

    const Skeleton = () => (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
            <div className="h-4 w-32 bg-slate-200 rounded mb-6"></div>
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] h-64 border border-slate-200 dark:border-slate-700"></div>
            <div className="flex justify-between">
                <div className="h-8 w-48 bg-slate-200 rounded"></div>
                <div className="h-10 w-64 bg-slate-200 rounded"></div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-3xl h-96 border border-slate-200 dark:border-slate-700"></div>
        </div>
    );

    if (loading) return <Skeleton />;

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">

            {/* Navigation Header */}
            <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 hover:text-orange-600 transition-colors cursor-pointer w-fit" onClick={() => navigate('/tours')}>
                <ArrowLeft size={18} />
                <span className="text-sm font-bold">Back to Tours</span>
            </div>

            {/* Main Details Card */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-xl shadow-orange-200/20 overflow-hidden">
                <div className="p-8 md:p-10">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${tour.status === 'Upcoming' ? 'bg-blue-50 text-blue-600' :
                                        tour.status === 'Ongoing' ? 'bg-emerald-50 text-emerald-600' :
                                            'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                    }`}>
                                    {tour.status}
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-orange-50 text-orange-600">
                                    {tour.destination}
                                </span>
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 leading-tight">{tour.name}</h1>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-50 dark:bg-slate-900/50 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500">
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Duration</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatDateRange(tour.startDate, tour.endDate)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-50 dark:bg-slate-900/50 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500">
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Organizer</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{tour.organizer || 'Internal'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500">
                                        <IndianRupee size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Fees</p>
                                        <p className="text-lg font-black text-orange-600">Rs.{tour.fees || 0}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                                        <PersonStanding size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Capacity</p>
                                        <p className="text-sm font-bold text-blue-700">{enrollments.length} / {tour.maxParticipants || '\u221e'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {isAdmin && (
                            <div className="flex flex-row md:flex-col gap-2">
                                <button
                                    onClick={() => navigate(`/tours/${id}/edit`)}
                                    className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 dark:text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm"
                                    title="Edit Tour"
                                >
                                    <Edit size={20} />
                                </button>
                                <button
                                    onClick={handleDeleteTour}
                                    className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 dark:text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all shadow-sm"
                                    title="Delete Tour"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 divide-x divide-slate-200">
                    <div className="p-6 text-center">
                        <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{activeEnrollments.length}</p>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Active Bookings</p>
                    </div>
                    <div className="p-6 text-center text-emerald-600">
                        <p className="text-2xl font-black">Rs.{activeEnrollments.reduce((sum, e) => sum + (e.totalPaid || 0), 0)}</p>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Collection</p>
                    </div>
                    <div className="p-6 text-center text-rose-600">
                        <p className="text-2xl font-black">Rs.{activeEnrollments.reduce((sum, e) => sum + ((tour.fees || 0) - (e.totalPaid || 0)), 0)}</p>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Outstanding</p>
                    </div>
                    <div className="p-6 text-center text-orange-600">
                        <p className="text-2xl font-black">{Math.round((activeEnrollments.length / (tour.maxParticipants || 1)) * 100)}%</p>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Fill Rate</p>
                    </div>
                </div>
            </div>

            {/* Participants Section */}
            <div className="space-y-4">
                {/* Toolbar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <Users className="text-orange-500" /> Participant List
                    </h2>
                    <div className="flex flex-wrap gap-2 items-center">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                            <input
                                type="text"
                                placeholder="Filter participants..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all w-48"
                            />
                        </div>

                        {/* Mobile Number Filter */}
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
                            <input
                                type="text"
                                placeholder="Mobile No..."
                                value={mobileFilter}
                                onChange={(e) => setMobileFilter(e.target.value)}
                                className="pl-8 pr-7 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all w-36"
                            />
                            {mobileFilter && (
                                <button
                                    onClick={() => setMobileFilter('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    title="Clear mobile filter"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                        >
                            <option value="All">All Status</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Reserved">Reserved</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                        <select
                            value={paymentFilter}
                            onChange={(e) => setPaymentFilter(e.target.value)}
                            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                        >
                            <option value="All">All Payments</option>
                            <option value="Paid">Fully Paid</option>
                            <option value="Partial">Partial Pay</option>
                            <option value="Nil">Unpaid / Nil</option>
                        </select>
                        <select
                            value={leaderFilter}
                            onChange={(e) => setLeaderFilter(e.target.value)}
                            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500 transition-all max-w-[150px] truncate"
                            title="Filter by Leader"
                        >
                            <option value="All">All Leaders</option>
                            <option value="Unassigned">Without Leader</option>
                            {uniqueLeaders.map(l => (
                                <option key={l} value={l}>Leader: {l}</option>
                            ))}
                        </select>

                        {hasActiveFilters && (
                            <button
                                onClick={handleClearFilters}
                                className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/30 px-3 py-2 rounded-xl border border-orange-200 dark:border-orange-900/50 transition-colors"
                            >
                                Clear
                            </button>
                        )}

                        {isAdmin && activeEnrollments.length > 0 && (
                            <button
                                onClick={handleExportExcel}
                                className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 hover:text-emerald-600 transition-all shadow-sm"
                                title="Export to Excel"
                            >
                                <Download size={18} />
                            </button>
                        )}
                        <button
                            onClick={() => setShowEnrollModal(true)}
                            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
                        >
                            <Plus size={16} /> Add Participant
                        </button>
                    </div>
                </div>

                {/* Active Participants Table */}
                {activeEnrollments.length > 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Devotee</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Leader</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Booking Status</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Payments</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Contact</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {activeEnrollments.map((en) => (
                                        <tr key={en.id} className="hover:bg-slate-50 dark:bg-slate-900/50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border-2 border-white shadow-sm">
                                                        {en.photo
                                                            ? <img src={en.photo} alt="" className="w-full h-full object-cover" />
                                                            : <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500 font-bold">{(en.guestName || en.devoteeName || '?').charAt(0).toUpperCase()}</div>
                                                        }
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 text-sm leading-tight">
                                                             {(en.devoteeId && !en.devoteeId.startsWith('GUEST_')) ? (en.initiatedName || en.devoteeName) : en.guestName}
                                                             {(!en.devoteeId || en.devoteeId.startsWith('GUEST_')) && (
                                                                 <span className="ml-2 px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-[8px] font-black uppercase tracking-widest">Walk-in</span>
                                                             )}
                                                         </p>
                                                         <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Booked: {formatDate(en.bookingDate)}</p>
                                                     </div>
                                                 </div>
                                            </td>
                                            {/* Leader Column */}
                                            <td className="px-6 py-4">
                                                {editingLeaderId === en.id ? (
                                                    <div className="flex items-center gap-1.5 min-w-[170px]">
                                                        <input
                                                            list="tour-leader-options"
                                                            autoFocus
                                                            value={editingLeaderValue}
                                                            onChange={(e) => setEditingLeaderValue(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    updateEnrollmentLeader(en.id, editingLeaderValue);
                                                                    setEditingLeaderId(null);
                                                                } else if (e.key === 'Escape') {
                                                                    setEditingLeaderId(null);
                                                                }
                                                            }}
                                                            placeholder="Leader name..."
                                                            className="px-2.5 py-1 text-xs border border-orange-300 dark:border-orange-700 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 w-36 shadow-sm"
                                                        />
                                                        <button
                                                            onClick={() => {
                                                                updateEnrollmentLeader(en.id, editingLeaderValue);
                                                                setEditingLeaderId(null);
                                                            }}
                                                            className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded transition-colors"
                                                            title="Save"
                                                        >
                                                            <Check size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingLeaderId(null)}
                                                            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                                                            title="Cancel"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ) : en.leader ? (
                                                    <div className="inline-flex items-center gap-1.5 group/leader">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200/70 dark:border-orange-800/60 text-xs font-bold shadow-xs">
                                                            <Crown size={12} className="text-orange-500 shrink-0" />
                                                            <span className="truncate max-w-[130px]" title={en.leader}>{en.leader}</span>
                                                        </span>
                                                        {isAdmin && (
                                                            <button
                                                                onClick={() => {
                                                                    setEditingLeaderId(en.id);
                                                                    setEditingLeaderValue(en.leader || '');
                                                                }}
                                                                className="opacity-0 group-hover/leader:opacity-100 p-1 text-slate-400 hover:text-orange-600 transition-all rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                                                                title="Change Leader"
                                                            >
                                                                <Edit size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5">
                                                        {isAdmin ? (
                                                            <button
                                                                onClick={() => {
                                                                    setEditingLeaderId(en.id);
                                                                    setEditingLeaderValue(en.devoteeCounselor || '');
                                                                }}
                                                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-orange-600 border border-dashed border-slate-300 dark:border-slate-700 hover:border-orange-400 px-2 py-0.5 rounded-lg transition-colors"
                                                                title={en.devoteeCounselor ? `Quick assign Counselor (${en.devoteeCounselor})` : "Assign a Leader"}
                                                            >
                                                                <Plus size={11} /> {en.devoteeCounselor ? en.devoteeCounselor : 'Assign Leader'}
                                                            </button>
                                                        ) : (
                                                            <span className="text-slate-300 text-xs font-medium">—</span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={en.status}
                                                    onChange={(e) => {
                                                        if (e.target.value === 'Cancelled') {
                                                            setCancelTargetEnrollment(en);
                                                            setIsRefundOnlyAction(false);
                                                            setShowCancelRefundModal(true);
                                                        } else {
                                                            updateEnrollmentStatus(en.id, e.target.value);
                                                        }
                                                    }}
                                                    className={`text-xs font-black uppercase tracking-widest px-2 py-1 rounded-lg outline-none border border-transparent focus:border-slate-200 dark:border-slate-700 transition-all cursor-pointer ${en.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600' :
                                                            en.status === 'Cancelled' ? 'bg-rose-50 text-rose-600' :
                                                                'bg-blue-50 text-blue-600'
                                                        }`}
                                                >
                                                    <option value="Reserved">Reserved</option>
                                                    <option value="Confirmed">Confirmed</option>
                                                    <option value="Cancelled">Cancelled</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div
                                                    className="flex items-center justify-between gap-4 group/pay cursor-pointer bg-slate-50 dark:bg-slate-900/50/50 p-2 rounded-xl border border-transparent hover:border-slate-200 dark:border-slate-700 transition-all"
                                                    onClick={() => {
                                                        setSelectedEnrollment(en);
                                                        setPaymentForm({ amount: (tour.fees || 0) - (en.totalPaid || 0), mode: 'Cash', reference: '' });
                                                        setShowPaymentModal(true);
                                                    }}
                                                >
                                                    <div>
                                                        <p className="text-xs font-black text-slate-900">Rs.{en.totalPaid || 0} / Rs.{tour.fees || 0}</p>
                                                        <span className={`text-[9px] font-black uppercase tracking-tight ${en.paymentStatus === 'Completed' ? 'text-emerald-500' :
                                                                en.paymentStatus === 'Partial' ? 'text-amber-500' :
                                                                    'text-rose-500'
                                                            }`}>
                                                            {en.paymentStatus}
                                                        </span>
                                                    </div>
                                                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover/pay:text-emerald-500 transition-colors shadow-sm">
                                                        <Plus size={16} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                                    {(en.devoteeId && !en.devoteeId.startsWith('GUEST_')) ? (en.whatsapp || en.contact) : (en.guestContact || 'No Contact')}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setCancelTargetEnrollment(en);
                                                            setIsRefundOnlyAction(false);
                                                            setShowCancelRefundModal(true);
                                                        }}
                                                        className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 transition-colors"
                                                        title="Cancel & Refund Booking"
                                                    >
                                                        <RotateCcw size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => en.devoteeId && !en.devoteeId.startsWith('GUEST_') && navigate(`/devotees/${en.devoteeId}`)}
                                                        disabled={!en.devoteeId || en.devoteeId.startsWith('GUEST_')}
                                                        className={`p-2 transition-colors ${en.devoteeId && !en.devoteeId.startsWith('GUEST_') ? 'text-slate-400 dark:text-slate-500 hover:text-orange-600' : 'text-slate-200 cursor-not-allowed'}`}
                                                        title={(en.devoteeId && !en.devoteeId.startsWith('GUEST_')) ? 'View Profile' : 'Walk-in Participant'}
                                                    >
                                                        <ExternalLink size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleSendWhatsAppReceipt(en)}
                                                        className="p-2 text-slate-400 dark:text-slate-500 hover:text-emerald-600 transition-colors"
                                                        title="Send WhatsApp"
                                                    >
                                                        <MessageSquare size={16} />
                                                    </button>
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => handleDeleteParticipant(en.id, en.guestName || en.initiatedName || en.devoteeName)}
                                                            className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 transition-colors"
                                                            title="Remove Participant"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[2rem] p-20 text-center">
                        <Users className="mx-auto text-slate-200 mb-4" size={48} />
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">No active participants found</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Start adding devotees to this pilgrimage.</p>
                        {isAdmin && (
                            <button
                                onClick={() => setShowEnrollModal(true)}
                                className="mt-6 text-orange-600 font-bold hover:underline"
                            >
                                Book your first participant
                            </button>
                        )}
                    </div>
                )}

                {/* Empty state for active filters */}
                {activeEnrollments.length === 0 && searchTerm && (
                    <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[2rem] p-12 text-center">
                        <Search className="mx-auto text-slate-200 mb-4" size={32} />
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">No participants match your filters</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Try clearing your search or status filters.</p>
                        <button
                            onClick={() => { setSearchTerm(''); setStatusFilter('All'); setPaymentFilter('All'); }}
                            className="mt-4 text-xs text-orange-600 font-bold hover:underline"
                        >
                            Clear all filters
                        </button>
                    </div>
                )}

                {/* Cancelled Participants Section */}
                {cancelledEnrollments.length > 0 && (
                    <div className="mt-12 space-y-4">
                        <h3 className="text-xl font-black text-slate-400 dark:text-slate-500 flex items-center gap-3">
                            <History size={20} /> Cancelled Participants
                        </h3>
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden opacity-75">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Devotee</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Leader</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Booking Status</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Payments</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Contact</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {cancelledEnrollments.map((en) => (
                                            <tr key={en.id} className="hover:bg-slate-50 dark:bg-slate-900/50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border-2 border-white shadow-sm opacity-50">
                                                            {en.photo
                                                                ? <img src={en.photo} alt="" className="w-full h-full object-cover" />
                                                                : <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500 font-bold">{(en.guestName || en.devoteeName || '?').charAt(0).toUpperCase()}</div>
                                                            }
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-400 dark:text-slate-500 text-sm leading-tight line-through">
                                                                {(en.devoteeId && !en.devoteeId.startsWith('GUEST_')) ? (en.initiatedName || en.devoteeName) : en.guestName}
                                                            </p>
                                                            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Booked: {formatDate(en.bookingDate)}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                                        {en.leader || en.devoteeCounselor || '—'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <select
                                                        value={en.status}
                                                        onChange={(e) => updateEnrollmentStatus(en.id, e.target.value)}
                                                        className="text-xs font-black uppercase tracking-widest px-2 py-1 rounded-lg outline-none border border-transparent focus:border-slate-200 dark:border-slate-700 transition-all cursor-pointer bg-rose-50 text-rose-600"
                                                    >
                                                        <option value="Reserved">Reserved</option>
                                                        <option value="Confirmed">Confirmed</option>
                                                        <option value="Cancelled">Cancelled</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                                                                Rs.{en.totalPaid || 0}
                                                            </span>
                                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                                                                en.paymentStatus === 'Refunded' ? 'bg-emerald-50 text-emerald-600' :
                                                                en.paymentStatus === 'Partial Refund' ? 'bg-amber-50 text-amber-600' :
                                                                'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                                            }`}>
                                                                {en.paymentStatus || 'Cancelled'}
                                                            </span>
                                                        </div>
                                                        {(Number(en.totalRefunded) > 0 || Number(en.totalReceived) > 0) && (
                                                            <p className="text-[10px] text-slate-400">
                                                                Paid: Rs.{en.totalReceived || en.totalPaid || 0} &bull; Refunded: Rs.{en.totalRefunded || 0}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-bold text-slate-400 dark:text-slate-500">{en.whatsapp || en.contact || 'No Contact'}</p>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {Number(en.totalPaid || 0) > 0 && (
                                                            <button
                                                                onClick={() => {
                                                                    setCancelTargetEnrollment(en);
                                                                    setIsRefundOnlyAction(true);
                                                                    setShowCancelRefundModal(true);
                                                                }}
                                                                className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-300 text-xs font-bold hover:bg-amber-100 transition-colors shadow-sm"
                                                                title="Process Remaining Refund"
                                                            >
                                                                <RotateCcw size={13} />
                                                                <span>Refund</span>
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => en.devoteeId && !en.devoteeId.startsWith('GUEST_') && navigate(`/devotees/${en.devoteeId}`)}
                                                            disabled={!en.devoteeId || en.devoteeId.startsWith('GUEST_')}
                                                            className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-400"
                                                            title="View Profile"
                                                        >
                                                            <ExternalLink size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleSendWhatsAppReceipt(en)}
                                                            className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
                                                            title="Send WhatsApp Message"
                                                        >
                                                            <MessageSquare size={16} />
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
                )}
            </div>

            {/* Add Participant Modal */}
            {showEnrollModal && (
                <AddParticipantForm
                    tour={tour}
                    onClose={() => setShowEnrollModal(false)}
                    onSuccess={() => { fetchTourData(); }}
                />
            )}

            {/* Payment Modal */}
            {showPaymentModal && selectedEnrollment && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                        <form onSubmit={handleAddPayment}>
                            <div className="p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 leading-tight">Record Payment</h3>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                                            For {selectedEnrollment.initiatedName || selectedEnrollment.devoteeName || selectedEnrollment.guestName}
                                        </p>
                                    </div>
                                    <button type="button" onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="p-5 bg-orange-50 rounded-2xl border border-orange-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Balance To Pay</p>
                                        <p className="text-2xl font-black text-orange-700">
                                            Rs.{(tour.fees || 0) - (selectedEnrollment.totalPaid || 0)}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-orange-500 shadow-sm">
                                        <IndianRupee size={24} />
                                    </div>
                                </div>

                                {selectedEnrollment.payments?.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Previous Payments</p>
                                        <div className="max-h-32 overflow-y-auto space-y-2 pr-1">
                                            {selectedEnrollment.payments.map((p, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                                                    <div>
                                                        <p className="font-bold text-slate-700 dark:text-slate-200">Rs.{p.amount}</p>
                                                        <p className="text-[10px] text-slate-400 dark:text-slate-500">{p.paymentDate || 'No date'}</p>
                                                    </div>
                                                    <span className="px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">{p.paymentMode || 'Cash'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Payment Amount (Rs.)</label>
                                        <input
                                            required
                                            type="number"
                                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                            value={paymentForm.amount}
                                            placeholder={(tour.fees || 0) - (selectedEnrollment.totalPaid || 0)}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Method</label>
                                        <select
                                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-orange-500 outline-none transition-all appearance-none"
                                            value={paymentForm.mode}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, mode: e.target.value })}
                                        >
                                            <option>Cash</option>
                                            <option>PhonePe / GPay</option>
                                            <option>Bank Transfer</option>
                                            <option>Cheque</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Reference / Note</label>
                                        <input
                                            type="text"
                                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                            placeholder="Transaction ID..."
                                            value={paymentForm.reference}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-5 bg-orange-600 text-white rounded-[1.5rem] font-black text-lg shadow-xl shadow-orange-600/20 hover:bg-orange-700 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3"
                                >
                                    <Check size={24} /> Confirm Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* WhatsApp Modal for Yatra Receipts & Communications */}
            <WhatsAppModal
                isOpen={showWhatsAppModal}
                onClose={() => setShowWhatsAppModal(false)}
                devotee={whatsAppParticipant}
                initialMessage={whatsAppMessage}
            />

            {/* Cancel & Refund Modal */}
            <CancelRefundModal
                isOpen={showCancelRefundModal}
                onClose={() => {
                    setShowCancelRefundModal(false);
                    setCancelTargetEnrollment(null);
                }}
                participant={cancelTargetEnrollment}
                itemType="Tour"
                itemTitle={tour?.name || 'Spiritual Yatra'}
                onConfirm={handleConfirmCancelRefund}
                isExistingCancelled={isRefundOnlyAction}
            />

            {/* Datalist for Leader autocomplete suggestions */}
            <datalist id="tour-leader-options">
                {allLeaderOptions.map(l => (
                    <option key={l} value={l} />
                ))}
            </datalist>
        </div>
    );
};

export default TourDetails;
