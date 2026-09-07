import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { formatDate, formatDateRange } from '../../lib/dateUtils';
import { useParams, useNavigate } from 'react-router-dom';
import {
    MapPin, Calendar, Users, CreditCard, Compass,
    Plus, Trash2, Edit, CheckCircle, X, Search,
    ArrowLeft, MoreVertical, IndianRupee, Plane,
    History, Check, ExternalLink, PersonStanding,
    MessageSquare, Download, Filter as FilterIcon, Printer
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import apiService from '../../services/api';
import AddParticipantForm from '../../components/tours/AddParticipantForm';
import * as XLSX from 'xlsx';

const TourDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAdmin } = useAuth();
    const toast = useToast();

    const [tour, setTour] = useState(null);
    const [loading, setLoading] = useState(true);
    const [enrollments, setEnrollments] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Modals
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedEnrollment, setSelectedEnrollment] = useState(null);
    const [paymentForm, setPaymentForm] = useState({ amount: 0, mode: 'Cash', reference: '' });

    // Filters
    const [statusFilter, setStatusFilter] = useState('All');
    const [paymentFilter, setPaymentFilter] = useState('All');

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

    const handleAddPayment = async (e) => {
        e.preventDefault();
        try {
            const response = await apiService.post('/api/tours/payments', {
                enrollmentId: selectedEnrollment.id,
                ...paymentForm
            });
            if (response.success) {
                toast.success('Payment recorded');
                fetchTourData();
                setShowPaymentModal(false);
                setPaymentForm({ amount: 0, mode: 'Cash', reference: '' });
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

    const handleSendWhatsAppReceipt = async (en) => {
        try {
            toast.info('Initiating WhatsApp...');
            const waNumber = ((en.devoteeId && !en.devoteeId.startsWith('GUEST_')) ? (en.whatsapp || en.contact) : en.guestContact || '').replace(/[^0-9]/g, '');
            if (!waNumber) return toast.error('No contact number available');

            const name = (en.devoteeId && !en.devoteeId.startsWith('GUEST_')) ? (en.initiatedName || en.devoteeName) : en.guestName;
            const message = `Hare Krishna ${name}! Thank you for your payment of Rs.${en.totalPaid} for the ${tour.name} tour. Balance due: Rs.${tour.fees - en.totalPaid}.`;

            window.open(`https://wa.me/${waNumber.length === 10 ? '91' + waNumber : waNumber}?text=${encodeURIComponent(message)}`, '_blank');
        } catch {
            toast.error('WhatsApp failed');
        }
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

    const filteredEnrollments = useMemo(() => {
        return enrollments.filter(e => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm ||
                (e.devoteeName && e.devoteeName.toLowerCase().includes(searchLower)) ||
                (e.initiatedName && e.initiatedName.toLowerCase().includes(searchLower)) ||
                (e.guestName && e.guestName.toLowerCase().includes(searchLower)) ||
                (e.devoteeId && e.devoteeId.toString().toLowerCase().includes(searchLower) && !e.devoteeId.toString().startsWith('GUEST_'));

            if (!matchesSearch) return false;
            if (statusFilter !== 'All' && e.status !== statusFilter) return false;
            if (paymentFilter !== 'All') {
                if (paymentFilter === 'Paid' && e.paymentStatus !== 'Completed') return false;
                if (paymentFilter === 'Partial' && e.paymentStatus !== 'Partial') return false;
                if (paymentFilter === 'Nil' && e.paymentStatus !== 'Pending') return false;
            }
            return true;
        });
    }, [enrollments, searchTerm, statusFilter, paymentFilter]);

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
                                className="pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all w-56"
                            />
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
                                            <td className="px-6 py-4">
                                                <select
                                                    value={en.status}
                                                    onChange={(e) => updateEnrollmentStatus(en.id, e.target.value)}
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
                                                    <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/50/50 p-2 rounded-xl border border-transparent">
                                                        <div>
                                                            <p className="text-xs font-black text-slate-400 dark:text-slate-500">Rs.{en.totalPaid || 0}</p>
                                                            <span className="text-[9px] font-black uppercase tracking-tight text-slate-400 dark:text-slate-500">Cancelled</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-bold text-slate-400 dark:text-slate-500">{en.whatsapp || en.contact || 'No Contact'}</p>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => en.devoteeId && !en.devoteeId.startsWith('GUEST_') && navigate(`/devotees/${en.devoteeId}`)}
                                                        disabled={!en.devoteeId || en.devoteeId.startsWith('GUEST_')}
                                                        className="p-2 text-slate-300 hover:text-slate-500 dark:text-slate-400"
                                                    >
                                                        <ExternalLink size={16} />
                                                    </button>
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
        </div>
    );
};

export default TourDetails;
