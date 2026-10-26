import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { formatDateRange } from '../../lib/dateUtils';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    GraduationCap, Calendar, Users, CreditCard, Award, 
    Plus, Trash2, Edit, CheckCircle, X, Search, 
    ArrowLeft, MoreVertical, IndianRupee, FileText,
    History, Check, Download, ExternalLink, QrCode,
    MessageSquare, RotateCcw, Phone
} from 'lucide-react';
import { useDevotees } from '../../context/DevoteeContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import apiService from '../../services/api';
import QRScanner from '../../components/QRScanner';
import CancelRefundModal from '../../components/CancelRefundModal';
import WhatsAppModal from '../../components/WhatsAppModal';
import { openWhatsApp, sanitizeWhatsAppNumber } from '../../services/whatsappLink';
import { searchDevoteesByName } from '../../lib/searchUtils';

const CourseDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { devotees } = useDevotees();
    const { isAdmin } = useAuth();
    const toast = useToast();

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [enrollments, setEnrollments] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modals
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedEnrollment, setSelectedEnrollment] = useState(null);
    const [paymentForm, setPaymentForm] = useState({ amount: 0, mode: 'Cash', reference: '' });
    const [enrollSearch, setEnrollSearch] = useState('');

    // Cancel & Refund Modal State
    const [showCancelRefundModal, setShowCancelRefundModal] = useState(false);
    const [cancelTargetEnrollment, setCancelTargetEnrollment] = useState(null);
    const [isRefundOnlyAction, setIsRefundOnlyAction] = useState(false);

    // WhatsApp Modal State
    const [whatsAppParticipant, setWhatsAppParticipant] = useState(null);
    const [whatsAppMessage, setWhatsAppMessage] = useState('');
    const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
    
    // Attendance State
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const [showQRScanner, setShowQRScanner] = useState(false);
    const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0, 10));
    const [attendedDevotees, setAttendedDevotees] = useState(new Set());
    const attendedDevoteesRef = useRef(new Set());
    const [savingAttendance, setSavingAttendance] = useState(false);

    const fetchCourseData = useCallback(async () => {
        try {
            const response = await apiService.get(`/api/courses/${id}`);
            if (response && response.success && response.data) {
                setCourse(response.data);
                setEnrollments(Array.isArray(response.data.enrollments) ? response.data.enrollments : []);
            } else {
                toast.error('Failed to fetch course details');
                setCourse(null);
            }
        } catch (err) {
            console.error('Failed to fetch course data:', err);
            toast.error('Server error');
            setCourse(null);
        } finally {
            setLoading(false);
        }
    }, [id, toast]);

    useEffect(() => {
        fetchCourseData();
    }, [fetchCourseData]);

    const handleSendWhatsAppReceipt = (en, openDirect = true) => {
        const dev = Array.isArray(devotees) ? devotees.find(d => String(d.id) === String(en.devoteeId)) : null;

        const name = en.initiatedName || en.devoteeName || dev?.initiatedName || dev?.name || 'Devotee';
        const rawPhone = en.whatsapp || en.contact || dev?.whatsapp || dev?.contact || '';

        const courseFee = Number(course?.fees || 0);
        const totalPaid = Number(en.totalPaid || 0);
        const totalRefunded = Number(en.totalRefunded || 0);
        const totalReceived = Number(en.totalReceived || (totalPaid + totalRefunded));
        const isCancelled = en.status === 'Cancelled' || en.status === 'Dropped';

        let message;
        if (isCancelled) {
            message = 
                `Hare Krishna ${name}! 🙏\n\n` +
                `This is an update regarding your course enrollment:\n` +
                `• Course: ${course?.name || 'Spiritual Course'}\n` +
                `• Status: *${(en.status || 'Cancelled').toUpperCase()}*\n\n` +
                `*Financial & Refund Summary:*\n` +
                `• Course Fee: ₹${courseFee.toLocaleString('en-IN')}\n` +
                `• Total Paid Initially: ₹${totalReceived.toLocaleString('en-IN')}\n` +
                `• Amount Refunded: ₹${totalRefunded.toLocaleString('en-IN')}\n` +
                `• Balance Retained: ₹${totalPaid.toLocaleString('en-IN')}\n` +
                `• Refund Status: ${en.paymentStatus || 'Processed'}\n\n` +
                `For any queries, please contact the course coordinator.\n\n` +
                `*ISKCON DURGAPUR*`;
        } else {
            const dueAmount = courseFee - totalPaid;
            message = 
                `Hare Krishna ${name}! 🙏\n\n` +
                `Here are your course enrollment details:\n` +
                `• Course: ${course?.name || 'Spiritual Course'}\n` +
                `• Duration: ${formatDateRange(course?.startDate, course?.endDate)}\n` +
                `• Instructor: ${course?.instructor || 'ISKCON'}\n` +
                `• Status: ${en.status || 'Enrolled'}\n` +
                `• Sessions Attended: ${en.attendedSessions || 0}\n` +
                `• Course Fees: ₹${courseFee.toLocaleString('en-IN')}\n` +
                `• Total Paid: ₹${totalPaid.toLocaleString('en-IN')}\n` +
                `• Balance Due: ₹${(dueAmount > 0 ? dueAmount : 0).toLocaleString('en-IN')}\n\n` +
                `*ISKCON DURGAPUR*`;
        }

        const cleanPhone = sanitizeWhatsAppNumber(rawPhone);

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

        setWhatsAppParticipant({
            name,
            contact: rawPhone,
            whatsapp: rawPhone,
            photo: en.photo || dev?.photo || '',
            subtitle: `Course: ${course?.name || 'Spiritual Course'}`
        });
        setWhatsAppMessage(message);
        setShowWhatsAppModal(true);
    };

    const handleConfirmCancelRefund = async ({ enrollmentId, refundAmount, refundMode, reason, newStatus }) => {
        try {
            if (refundAmount > 0) {
                const payRes = await apiService.post('/api/courses/payments', {
                    enrollmentId,
                    amount: -refundAmount,
                    paymentMode: `Refund (${refundMode})`,
                    reference: reason || 'Course Cancellation Refund'
                });
                if (!payRes.success) {
                    throw new Error(payRes.error || 'Failed to record refund');
                }
            }

            if (newStatus && (!cancelTargetEnrollment || cancelTargetEnrollment.status !== newStatus)) {
                const statRes = await apiService.put(`/api/courses/enroll/${enrollmentId}`, { status: newStatus });
                if (!statRes.success) {
                    throw new Error(statRes.error || 'Failed to update enrollment status');
                }
            }

            toast.success(refundAmount > 0 ? `Successfully refunded ₹${refundAmount.toLocaleString('en-IN')}` : 'Status updated successfully');
            fetchCourseData();

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

    const handleEnroll = async (devoteeId) => {
        try {
            const response = await apiService.post('/api/courses/enroll', {
                courseId: id,
                devoteeId,
                enrollmentDate: new Date().toISOString().slice(0, 10)
            });
            if (response.success) {
                toast.success('Devotee enrolled successfully');
                fetchCourseData();
                setShowEnrollModal(false);
            } else {
                toast.error(response.error || 'Enrollment failed');
            }
        } catch {
            toast.error('Connection error');
        }
    };

    const handleAddPayment = async (e) => {
        e.preventDefault();
        try {
            const response = await apiService.post('/api/courses/payments', {
                enrollmentId: selectedEnrollment.id,
                ...paymentForm
            });
            if (response.success) {
                toast.success('Payment recorded');
                const prevPaid = Number(selectedEnrollment.totalPaid || 0);
                const addedAmount = parseFloat(paymentForm.amount) || 0;
                const updatedEn = { ...selectedEnrollment, totalPaid: prevPaid + addedAmount };

                fetchCourseData();
                setShowPaymentModal(false);
                setPaymentForm({ amount: 0, mode: 'Cash', reference: '' });

                handleSendWhatsAppReceipt(updatedEn, false);
            } else {
                toast.error(response.error || 'Failed to record payment');
            }
        } catch {
            toast.error('Connection error');
        }
    };

    const toggleCertificate = async (enrollment) => {
        try {
            const response = await apiService.put(`/api/courses/enroll/${enrollment.id}`, {
                certificateIssued: enrollment.certificateIssued ? 0 : 1
            });
            if (response.success) {
                toast.success(enrollment.certificateIssued ? 'Certificate unmarked' : 'Certificate marked as issued');
                fetchCourseData();
            }
        } catch {
            toast.error('Failed to update status');
        }
    };

    const updateEnrollmentStatus = async (enrollmentId, status) => {
        try {
            const response = await apiService.put(`/api/courses/enroll/${enrollmentId}`, { status });
            if (response.success) {
                toast.success('Status updated');
                fetchCourseData();
            }
        } catch {
            toast.error('Update failed');
        }
    };

    const handleDeleteEnrollment = async (enrollmentId, devoteeName) => {
        if (!window.confirm(`Are you sure you want to remove ${devoteeName} from this course? This will also delete their payment records.`)) return;
        try {
            const response = await apiService.delete(`/api/courses/enroll/${enrollmentId}`);
            if (response.success) {
                toast.success('Participant removed');
                fetchCourseData();
            } else {
                toast.error(response.error || 'Failed to remove participant');
            }
        } catch {
            toast.error('Connection error');
        }
    };

    const fetchAttendanceForSession = async (date) => {
        try {
            const response = await apiService.get(`/api/courses/${id}/attendance?sessionDate=${date}`);
            if (response.success) {
                const attendedIds = new Set(response.data.map(item => item.devoteeId));
                setAttendedDevotees(attendedIds);
                attendedDevoteesRef.current = attendedIds;
            }
        } catch {
            toast.error('Failed to load attendance for this date');
        }
    };

    const handleSaveAttendance = async () => {
        setSavingAttendance(true);
        try {
            const response = await apiService.post(`/api/courses/${id}/attendance`, {
                sessionDate,
                devoteeIds: Array.from(attendedDevotees)
            });
            if (response.success) {
                toast.success('Attendance saved!');
                fetchCourseData();
                setShowAttendanceModal(false);
            } else {
                toast.error(response.error || 'Failed to save attendance');
            }
        } catch {
            toast.error('Connection error');
        } finally {
            setSavingAttendance(false);
        }
    };

    const handleOpenAttendanceModal = () => {
        setShowAttendanceModal(true);
        fetchAttendanceForSession(sessionDate);
    };

    const handleOpenQRScanner = () => {
        fetchAttendanceForSession(sessionDate);
        setShowQRScanner(true);
    };

    const handleScan = async (devoteeId) => {
        const devotee = devotees.find(d => String(d.id) === String(devoteeId));
        if (!devotee) {
            toast.error('Invalid QR Code or Devotee Not Found');
            return;
        }

        if (!enrollments.some(e => String(e.devoteeId) === String(devoteeId))) {
            toast.error(`${devotee.initiatedName || devotee.name} is not enrolled in this course.`);
            return;
        }

        const currentSet = attendedDevoteesRef.current;
        if (currentSet.has(devoteeId)) {
            toast.error(`${devotee.initiatedName || devotee.name} is already marked present today!`);
            return;
        }
        
        const newSet = new Set(currentSet);
        newSet.add(devoteeId);
        
        setAttendedDevotees(newSet);
        attendedDevoteesRef.current = newSet;

        try {
            const response = await apiService.post(`/api/courses/${id}/attendance`, {
                sessionDate,
                devoteeIds: Array.from(newSet)
            });
            if (response.success) {
                const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                toast.success(`Hare Krishna, ${devotee.initiatedName || devotee.name} Your attendance done. (${course.name} - ${sessionDate} ${time})`);
                fetchCourseData(); 
            } else {
                toast.error(response.error || 'Failed to save attendance');
                const rollbackSet = new Set(attendedDevoteesRef.current);
                rollbackSet.delete(devoteeId);
                setAttendedDevotees(rollbackSet);
                attendedDevoteesRef.current = rollbackSet;
            }
        } catch {
            toast.error('Connection error');
            const rollbackSet = new Set(attendedDevoteesRef.current);
            rollbackSet.delete(devoteeId);
            setAttendedDevotees(rollbackSet);
            attendedDevoteesRef.current = rollbackSet;
        }
    };

    const handleDeleteCourse = async () => {
        if (!window.confirm('Delete this course and all related enrollment data? This cannot be undone.')) return;
        try {
            const response = await apiService.delete(`/api/courses/${id}`);
            if (response.success) {
                toast.success('Course deleted');
                navigate('/courses');
            }
        } catch {
            toast.error('Failed to delete course');
        }
    };

    const safeEnrollments = useMemo(() => Array.isArray(enrollments) ? enrollments : [], [enrollments]);

    const filteredEnrollments = safeEnrollments.filter(e => {
        if (!e) return false;
        const search = searchTerm.toLowerCase().trim();
        if (!search) return true;
        const tokens = search.split(/\s+/).filter(Boolean);
        const name = String(e.devoteeName || '').toLowerCase();
        const initName = String(e.initiatedName || '').toLowerCase();
        const contact = String(e.whatsapp || e.contact || '');
        return tokens.every(tok => name.includes(tok) || initName.includes(tok) || contact.includes(tok));
    });

    const activeEnrollments = filteredEnrollments.filter(e => e && e.status !== 'Cancelled' && e.status !== 'Dropped');
    const cancelledEnrollments = filteredEnrollments.filter(e => e && (e.status === 'Cancelled' || e.status === 'Dropped'));

    const availableDevotees = useMemo(() => {
        const safeDevotees = Array.isArray(devotees) ? devotees : [];
        const unenrolled = safeDevotees.filter(d => d && !safeEnrollments.some(e => e && String(e.devoteeId) === String(d.id)));
        if (!enrollSearch.trim()) return unenrolled.slice(0, 10);
        return searchDevoteesByName(unenrolled, enrollSearch, { limit: 10 });
    }, [devotees, safeEnrollments, enrollSearch]);

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-corporate-600"></div></div>;

    if (!course) {
        return (
            <div className="p-8 max-w-7xl mx-auto text-center py-20">
                <GraduationCap className="mx-auto h-16 w-16 text-slate-300 dark:text-slate-600 mb-4" />
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Course Not Found</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">The requested course could not be loaded or may have been deleted.</p>
                <button
                    onClick={() => navigate('/courses')}
                    className="mt-6 inline-flex items-center gap-2 bg-corporate-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-corporate-700 transition-all"
                >
                    <ArrowLeft size={16} /> Back to Courses
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Navigation Header */}
            <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 hover:text-corporate-600 transition-colors cursor-pointer w-fit" onClick={() => navigate('/courses')}>
                <ArrowLeft size={18} />
                <span className="text-sm font-bold">Back to Courses</span>
            </div>

            {/* Main Details Card */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="p-8 md:p-10">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${
                                    course.status === 'Upcoming' ? 'bg-amber-50 text-amber-600' :
                                    course.status === 'Ongoing' ? 'bg-emerald-50 text-emerald-600' :
                                    'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                }`}>
                                    {course.status}
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-blue-50 text-blue-600">
                                    {activeEnrollments.length} Active Participants
                                </span>
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 leading-tight">{course.name}</h1>
                            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl font-medium leading-relaxed">{course.description || 'No description available for this course.'}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-50 dark:bg-slate-900/50 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500">
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Duration</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatDateRange(course.startDate, course.endDate)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-50 dark:bg-slate-900/50 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500">
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Instructor</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{course.instructor || 'Guest Speaker'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-corporate-50 rounded-xl flex items-center justify-center text-corporate-500">
                                        <IndianRupee size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-corporate-400 uppercase tracking-widest">Fees</p>
                                        <p className="text-lg font-black text-corporate-600">₹{course.fees || 0}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {isAdmin && (
                            <div className="flex flex-row md:flex-col gap-2">
                                <button 
                                    onClick={() => navigate(`/courses/${id}/edit`)}
                                    className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 dark:text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm"
                                    title="Edit Course"
                                >
                                    <Edit size={20} />
                                </button>
                                <button 
                                    onClick={handleDeleteCourse}
                                    className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 dark:text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all shadow-sm"
                                    title="Delete Course"
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
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Active Enrolled</p>
                    </div>
                    <div className="p-6 text-center text-emerald-600">
                        <p className="text-2xl font-black">₹{activeEnrollments.reduce((sum, e) => sum + (e.totalPaid || 0), 0)}</p>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Total Collected</p>
                    </div>
                    <div className="p-6 text-center text-rose-600">
                        <p className="text-2xl font-black">₹{activeEnrollments.reduce((sum, e) => sum + Math.max(0, (course.fees || 0) - (e.totalPaid || 0)), 0)}</p>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Total Due</p>
                    </div>
                    <div className="p-6 text-center text-blue-600">
                        <p className="text-2xl font-black">{activeEnrollments.filter(e => e.certificateIssued).length}</p>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Certificates Issued</p>
                    </div>
                </div>
            </div>

            {/* Participants Section */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <Users className="text-blue-500" /> Active Participants
                    </h2>
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                            <input 
                                type="text" 
                                placeholder="Filter participants..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-corporate-500 outline-none transition-all w-64"
                            />
                        </div>
                        {isAdmin && (
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={handleOpenQRScanner}
                                    className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
                                >
                                    <QrCode size={16} /> Scan QR
                                </button>
                                <button 
                                    onClick={handleOpenAttendanceModal}
                                    className="flex items-center gap-2 bg-white dark:bg-slate-900 text-corporate-600 border border-corporate-200 px-5 py-2 rounded-xl font-bold text-sm hover:bg-corporate-50 transition-all shadow-sm"
                                >
                                    <CheckCircle size={16} /> Mark Attendance
                                </button>
                                <button 
                                    onClick={() => setShowEnrollModal(true)}
                                    className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
                                >
                                    <Plus size={16} /> Enroll Devotee
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {activeEnrollments.length > 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Participant</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Payment</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Attendance</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Certificate</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {activeEnrollments.map((en) => (
                                        <tr key={en.id} className="hover:bg-slate-50 dark:bg-slate-900/50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border-2 border-white shadow-sm">
                                                        {en.photo ? <img src={en.photo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500 font-bold">{(en.initiatedName || en.devoteeName || '?').charAt(0).toUpperCase()}</div>}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 text-sm leading-tight">{en.initiatedName || en.devoteeName}</p>
                                                        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{en.whatsapp || en.contact || 'No Contact'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select 
                                                    value={en.status} 
                                                    onChange={(e) => {
                                                        if (e.target.value === 'Cancelled' || e.target.value === 'Dropped') {
                                                            setCancelTargetEnrollment(en);
                                                            setIsRefundOnlyAction(false);
                                                            setShowCancelRefundModal(true);
                                                        } else {
                                                            updateEnrollmentStatus(en.id, e.target.value);
                                                        }
                                                    }}
                                                    disabled={!isAdmin}
                                                    className={`text-xs font-black uppercase tracking-widest px-2 py-1 rounded-lg outline-none border border-transparent focus:border-slate-200 dark:border-slate-700 transition-all ${
                                                        !isAdmin ? 'cursor-default opacity-85' : 'cursor-pointer'
                                                    } ${
                                                        en.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                                                        en.status === 'Dropped' ? 'bg-amber-50 text-amber-600' :
                                                        en.status === 'Cancelled' ? 'bg-rose-50 text-rose-600' :
                                                        'bg-blue-50 text-blue-600'
                                                    }`}
                                                >
                                                    <option value="Participated">Participated</option>
                                                    <option value="Completed">Completed</option>
                                                    <option value="Dropped">Dropped</option>
                                                    <option value="Cancelled">Cancelled</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div 
                                                    className={`flex items-center justify-between gap-4 group/pay bg-slate-50 dark:bg-slate-900/50/50 p-2 rounded-xl border border-transparent transition-all ${
                                                        isAdmin ? 'cursor-pointer hover:border-slate-200 dark:border-slate-700' : 'cursor-default'
                                                    }`}
                                                    onClick={() => { if (isAdmin) { setSelectedEnrollment(en); setShowPaymentModal(true); } }}
                                                >
                                                    <div>
                                                        <p className="text-xs font-black text-slate-900">₹{en.totalPaid} / ₹{course.fees}</p>
                                                        <span className={`text-[9px] font-black uppercase tracking-tight ${
                                                            en.paymentStatus === 'Completed' ? 'text-emerald-500' :
                                                            en.paymentStatus === 'Partial' ? 'text-amber-500' :
                                                            'text-rose-500'
                                                        }`}>
                                                            {en.paymentStatus}
                                                        </span>
                                                    </div>
                                                    {isAdmin && (
                                                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover/pay:text-emerald-500 transition-colors shadow-sm">
                                                            <Plus size={16} />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800 inline-block">
                                                    <p className="text-xs font-black text-slate-600 dark:text-slate-300">{en.attendedSessions || 0} Sessions</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button 
                                                    disabled={!isAdmin}
                                                    onClick={() => isAdmin && toggleCertificate(en)}
                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                                                        !isAdmin ? 'cursor-default' : 'cursor-pointer'
                                                    } ${
                                                        en.certificateIssued 
                                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-200'
                                                    }`}
                                                >
                                                    <Award size={14} />
                                                    {en.certificateIssued ? 'Issued' : 'Issue'}
                                                </button>
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
                                                        title="Cancel & Refund Enrollment"
                                                    >
                                                        <RotateCcw size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => navigate(`/devotees/${en.devoteeId}`)}
                                                        className="p-2 text-slate-400 dark:text-slate-500 hover:text-corporate-600 transition-colors"
                                                        title="View Profile"
                                                    >
                                                        <ExternalLink size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleSendWhatsAppReceipt(en)}
                                                        className="p-2 text-slate-400 dark:text-slate-500 hover:text-emerald-600 transition-colors"
                                                        title="Send WhatsApp Receipt"
                                                    >
                                                        <MessageSquare size={16} />
                                                    </button>
                                                    {isAdmin && (
                                                        <button 
                                                            onClick={() => handleDeleteEnrollment(en.id, en.initiatedName || en.devoteeName)}
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
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Enroll devotees to start tracking their progress and payments.</p>
                        {isAdmin && (
                            <button 
                                onClick={() => setShowEnrollModal(true)}
                                className="mt-6 text-corporate-600 font-bold hover:underline"
                            >
                                Enroll your first participant
                            </button>
                        )}
                    </div>
                )}

                {/* Cancelled / Dropped Participants Section */}
                {cancelledEnrollments.length > 0 && (
                    <div className="mt-12 space-y-4">
                        <h3 className="text-xl font-black text-slate-400 dark:text-slate-500 flex items-center gap-3">
                            <History size={20} /> Cancelled &amp; Dropped Participants
                        </h3>
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden opacity-85">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Participant</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Payment &amp; Refund</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Attendance</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {cancelledEnrollments.map((en) => (
                                            <tr key={en.id} className="hover:bg-slate-50 dark:bg-slate-900/50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border-2 border-white shadow-sm opacity-50">
                                                            {en.photo ? <img src={en.photo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500 font-bold">{(en.initiatedName || en.devoteeName || '?').charAt(0).toUpperCase()}</div>}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-400 dark:text-slate-500 text-sm leading-tight line-through">{en.initiatedName || en.devoteeName}</p>
                                                            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">{en.whatsapp || en.contact || 'No Contact'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${
                                                        en.status === 'Dropped' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
                                                    }`}>
                                                        {en.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                                                                ₹{en.totalPaid || 0}
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
                                                                Paid: ₹{en.totalReceived || en.totalPaid || 0} &bull; Refunded: ₹{en.totalRefunded || 0}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-xs font-bold text-slate-400">{en.attendedSessions || 0} Sessions</p>
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
                                                            onClick={() => navigate(`/devotees/${en.devoteeId}`)}
                                                            className="p-2 text-slate-400 hover:text-corporate-600 transition-colors"
                                                            title="View Profile"
                                                        >
                                                            <ExternalLink size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleSendWhatsAppReceipt(en)}
                                                            className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
                                                            title="Send WhatsApp Receipt"
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

            {/* Enroll Modal */}
            {showEnrollModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="text-xl font-black text-slate-900">Enroll Devotee</h3>
                            <button onClick={() => setShowEnrollModal(false)} className="p-2 hover:bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                                <input 
                                    className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-corporate-500 font-medium"
                                    placeholder="Search by name or spiritual name..."
                                    value={enrollSearch}
                                    onChange={(e) => setEnrollSearch(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {availableDevotees.map(d => (
                                    <div 
                                        key={d.id}
                                        onClick={() => handleEnroll(d.id)}
                                        className="flex items-center justify-between p-3 rounded-2xl hover:bg-corporate-50 border border-transparent hover:border-corporate-100 transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-400 dark:text-slate-500">
                                                {(d.initiatedName || d.name || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 group-hover:text-corporate-700">{d.initiatedName || d.name}</p>
                                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{d.whatsapp || d.contact}</p>
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center text-slate-300 group-hover:text-corporate-600 transition-colors shadow-sm">
                                            <Plus size={16} />
                                        </div>
                                    </div>
                                ))}
                                {availableDevotees.length === 0 && (
                                    <div className="text-center py-10 text-slate-400 dark:text-slate-500 font-medium">No available devotees found.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
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
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">For {selectedEnrollment.initiatedName || selectedEnrollment.devoteeName}</p>
                                    </div>
                                    <button type="button" onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors"><X size={20} /></button>
                                </div>

                                <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Balance Remaining</p>
                                        <p className="text-2xl font-black text-emerald-700">₹{course.fees - selectedEnrollment.totalPaid}</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-emerald-500 shadow-sm">
                                        <IndianRupee size={24} />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Payment Amount (₹)</label>
                                        <input 
                                            required
                                            type="number" 
                                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                            value={paymentForm.amount}
                                            onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Payment Method</label>
                                        <select 
                                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all appearance-none"
                                            value={paymentForm.mode}
                                            onChange={(e) => setPaymentForm({...paymentForm, mode: e.target.value})}
                                        >
                                            <option>Cash</option>
                                            <option>Bank Transfer</option>
                                            <option>UPI / GPay</option>
                                            <option>Check</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Reference / Note</label>
                                        <input 
                                            type="text" 
                                            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                            placeholder="Txn ID or month..."
                                            value={paymentForm.reference}
                                            onChange={(e) => setPaymentForm({...paymentForm, reference: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <button 
                                    type="submit"
                                    className="w-full py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black text-lg shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3"
                                >
                                    <Check size={24} /> Confirm Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Attendance Modal */}
            {showAttendanceModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                    <CheckCircle className="text-corporate-600" size={24} /> 
                                    Mark Attendance
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Select date and mark present devotees</p>
                            </div>
                            <button onClick={() => setShowAttendanceModal(false)} className="p-2 hover:bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors"><X size={20} /></button>
                        </div>
                        
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Session Date</label>
                            <input 
                                type="date" 
                                className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-corporate-500 outline-none w-full md:w-auto"
                                value={sessionDate}
                                onChange={(e) => {
                                    setSessionDate(e.target.value);
                                    fetchAttendanceForSession(e.target.value);
                                }}
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4">
                                {enrollments.map(en => (
                                    <div 
                                        key={en.devoteeId}
                                        onClick={() => {
                                            const newSet = new Set(attendedDevotees);
                                            if (newSet.has(en.devoteeId)) {
                                                newSet.delete(en.devoteeId);
                                            } else {
                                                newSet.add(en.devoteeId);
                                            }
                                            setAttendedDevotees(newSet);
                                        }}
                                        className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all border-2 ${
                                            attendedDevotees.has(en.devoteeId) 
                                            ? 'bg-corporate-50 border-corporate-500 shadow-md shadow-corporate-500/10' 
                                            : 'bg-white dark:bg-slate-900 border-transparent hover:border-slate-200 dark:border-slate-700 shadow-sm'
                                        }`}
                                    >
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                            attendedDevotees.has(en.devoteeId) ? 'bg-corporate-500 border-corporate-500 text-white' : 'border-slate-300 dark:border-slate-600'
                                        }`}>
                                            {attendedDevotees.has(en.devoteeId) && <Check size={14} strokeWidth={4} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-bold truncate ${attendedDevotees.has(en.devoteeId) ? 'text-corporate-900' : 'text-slate-700 dark:text-slate-200'}`}>
                                                {en.initiatedName || en.devoteeName}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {enrollments.length === 0 && (
                                    <div className="col-span-2 text-center py-10 text-slate-400 dark:text-slate-500 font-medium">
                                        No devotees enrolled yet.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center">
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                                <span className="text-corporate-600 font-black">{attendedDevotees.size}</span> / {enrollments.length} Present
                            </p>
                            <button 
                                onClick={handleSaveAttendance}
                                disabled={savingAttendance}
                                className="bg-corporate-600 text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-corporate-600/20 hover:bg-corporate-700 transition-all disabled:opacity-50"
                            >
                                {savingAttendance ? 'Saving...' : 'Save Attendance'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* QR Scanner */}
            {showQRScanner && (
                <QRScanner 
                    onScan={handleScan}
                    onClose={() => setShowQRScanner(false)}
                />
            )}

            {/* WhatsApp Modal for Course Receipts & Communications */}
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
                itemType="Course"
                itemTitle={course?.name || 'Spiritual Course'}
                onConfirm={handleConfirmCancelRefund}
                isExistingCancelled={isRefundOnlyAction}
            />
        </div>
    );
};

export default CourseDetails;
