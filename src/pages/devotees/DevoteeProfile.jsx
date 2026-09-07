import React, { useState, useEffect, useRef } from 'react';
import { formatDate } from '../../lib/dateUtils';
import { useParams, useNavigate } from 'react-router-dom';
import { useDevotees } from '../../context/DevoteeContext';
import { useAuth } from '../../context/AuthContext';
import {
    Edit, Trash, Phone, Mail, MapPin, Calendar, Heart, Award,
    ChevronLeft, QrCode, BookOpen, User, MessageSquare,
    Activity, CheckCircle2, LayoutDashboard, Fingerprint, Download, Sparkles
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import SadhanaLog from '../../components/SadhanaLog';
import ConfirmationModal from '../../components/ConfirmationModal';
import WhatsAppModal from '../../components/WhatsAppModal';
import CounselingSessionLog from '../../components/CounselingSessionLog';
import JourneyTimeline from '../../components/JourneyTimeline';
import { useToast } from '../../components/Toast';
import { toPng } from 'html-to-image';
import clsx from 'clsx';

const SectionHeader = ({ title, subtitle }) => (
    <div className="mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
    </div>
);

const InfoRow = ({ label, value, icon: Icon }) => (
    <div className="grid grid-cols-12 gap-4 items-center py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 dark:bg-slate-900/50/50 transition-colors px-2 rounded-lg">
        <div className="col-span-4 text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
            {Icon && <Icon size={14} className="text-slate-400 dark:text-slate-500" />}
            {label}
        </div>
        <div className="col-span-8 text-sm font-semibold text-slate-900">{value || '--'}</div>
    </div>
);

const DevoteeProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { devotees, deleteDevotee, getDevoteeById } = useDevotees();
    const { isAdmin } = useAuth();
    const toast = useToast();
    const idCardRef = useRef(null);

    const [activeSection, setActiveSection] = useState('overview');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showWhatsApp, setShowWhatsApp] = useState(false);
    const [devotee, setDevotee] = useState(null);

    // ✅ Effect 1: Immediately resolve from local context list (instant, no spinner)
    useEffect(() => {
        const found = devotees.find(d => d.id === id);
        if (found) setDevotee(found);
        else setDevotee(null);
    }, [devotees, id]);

    // ✅ Effect 2: Also fetch fresh/authoritative data from the API (runs in background)
    useEffect(() => {
        let cancelled = false;
        getDevoteeById(id).then(fresh => {
            if (!cancelled && fresh) setDevotee(fresh);
        }).catch(() => { }); // silent — context list is already the fallback
        return () => { cancelled = true; };
    }, [id]);

    if (!devotee) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="text-slate-400 dark:text-slate-500 mb-4"><User size={48} /></div>
                <h3 className="text-lg font-medium text-slate-900">Devotee Not Found</h3>
                <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:underline">Go Back</button>
            </div>
        );
    }

    // ✅ handleDelete
    const handleDelete = async () => {
        await deleteDevotee(id);
        toast.success('Devotee deleted successfully.');
        navigate('/devotees');
    };

    const handleDownloadCard = async () => {
        if (!idCardRef.current) return;
        
        try {
            toast.info('Preparing your high-quality ID card...');
            
            // Wait a tiny bit for fonts to be ready
            await document.fonts.ready;
            
            // Options for html-to-image to ensure good quality
            const options = {
                pixelRatio: 3, // High resolution
                quality: 1.0,
                backgroundColor: '#ffffff', // Ensures no transparency issues
                style: {
                    transform: 'scale(1)', // Ensure no scaling artifacts
                }
            };
            
            const dataUrl = await toPng(idCardRef.current, options);
            
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `ID_Card_${devotee.name.replace(/\s+/g, '_')}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast.success('ID Card downloaded successfully!');
        } catch (error) {
            console.error('Download failed:', error);
            toast.error('Failed to download ID card. Please try again.');
        }
    };

    const navigationItems = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'sadhana', label: 'Sadhana', icon: Activity },
        { id: 'counseling', label: 'Counseling', icon: MessageSquare },
        { id: 'timeline', label: 'My Journey', icon: Sparkles },
        { id: 'idcard', label: 'ID Card', icon: Fingerprint },
    ];

    // Moved to central utility in dateUtils.js
    // const formatDate = (dateString) => { ... }

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">

            {/* Header */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                    <div className="shrink-0">
                        <div className="w-32 h-32 rounded-full border-4 border-slate-50 shadow-md overflow-hidden bg-slate-100 dark:bg-slate-800">
                            {devotee.photo ? (
                                <img src={devotee.photo} alt={devotee.name} className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-full h-full p-6 text-slate-300" />
                            )}
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col md:flex-row justify-between w-full gap-4">
                        <div>
                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
                                <span onClick={() => navigate('/devotees')} className="cursor-pointer hover:text-blue-600 transition-colors">Devotees</span>
                                <ChevronLeft size={10} className="rotate-180" />
                                <span className="font-semibold text-slate-800 dark:text-slate-100">{devotee.name}</span>
                            </div>
                            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                                {devotee.name}
                                {devotee.status === 'Active' && (
                                    <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-100">Active</span>
                                )}
                                {devotee.spiritualStatus === 'Initiated' && (
                                    <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-100">Initiated</span>
                                )}
                            </h1>
                            <div className="flex items-center gap-6 mt-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                <div className="flex items-center gap-1.5">
                                    <span className="uppercase tracking-wider text-slate-400 dark:text-slate-500">ID:</span>
                                    <span className="font-mono text-slate-700 dark:text-slate-200">{devotee.id.slice(0, 8)}...</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="uppercase tracking-wider text-slate-400 dark:text-slate-500">Created:</span>
                                    <span>{devotee.createdAt ? formatDate(devotee.createdAt) : new Date().toLocaleDateString('en-GB')}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 self-start md:self-center">
                            {/* WhatsApp button — opens WhatsApp Web modal */}
                            <button
                                onClick={() => setShowWhatsApp(true)}
                                className={clsx(
                                    'p-2.5 rounded-xl border transition-colors font-medium text-sm flex items-center gap-2',
                                    'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                )}
                                title="Send WhatsApp Message"
                            >
                                <MessageSquare size={16} />
                                <span className="hidden sm:inline">WhatsApp</span>
                            </button>
                            {isAdmin && (
                                <>
                                    <button
                                        onClick={() => navigate(`/devotees/${id}/edit`)}
                                        className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:bg-slate-900/50 flex items-center gap-2"
                                    >
                                        <Edit size={16} /> Edit
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-900 rounded-md hover:bg-blue-800 flex items-center gap-2 shadow-sm"
                                    >
                                        <Trash size={16} /> Delete
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Navigation */}
                <div className="w-full lg:w-64 shrink-0 space-y-4">
                    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden py-2">
                        {navigationItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeSection === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveSection(item.id)}
                                    className={clsx(
                                        'w-full text-left px-4 py-3 flex items-center gap-3 text-sm font-medium transition-all duration-200 relative',
                                        isActive
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900/50 hover:text-slate-900'
                                    )}
                                >
                                    {isActive && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r"></div>
                                    )}
                                    <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-400 dark:text-slate-500'} />
                                    {item.label}
                                    {isActive && <CheckCircle2 size={16} className="ml-auto text-blue-600" />}
                                </button>
                            );
                        })}
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div>
                                <p className="text-sm font-bold text-slate-900">{devotee.initiatedName || 'Uninitiated'}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{devotee.occupation || 'Devotee'}</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500 dark:text-slate-400">Daily Rounds</span>
                                <span className="font-bold text-slate-900">{devotee.rounds || 0} / 16</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                                <div
                                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(((devotee.rounds || 0) / 16) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-8 min-h-[500px]">
                    {activeSection === 'overview' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <section>
                                <SectionHeader title="Personal Information" subtitle="Basic contact and identification details" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                                    <InfoRow icon={User} label="Full Name" value={devotee.name} />
                                    <InfoRow icon={User} label="Gender" value={devotee.gender} />
                                    <InfoRow icon={User} label="Initiated Name" value={devotee.initiatedName} />
                                    <InfoRow icon={Calendar} label="Date of Birth" value={formatDate(devotee.dob)} />
                                    {/* ✅ Contact row — now clean, no inline prompt/alert */}
                                    <div className="grid grid-cols-12 gap-4 items-center py-3 border-b border-slate-50 hover:bg-slate-50 dark:bg-slate-900/50/50 transition-colors px-2 rounded-lg">
                                        <div className="col-span-4 text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                            <Phone size={14} className="text-slate-400 dark:text-slate-500" /> Contact Number
                                        </div>
                                        <div className="col-span-8 flex items-center justify-between">
                                            <span className="text-sm font-semibold text-slate-900">{devotee.contact || '--'}</span>
                                            <button
                                                onClick={() => setShowWhatsApp(true)}
                                                className={clsx(
                                                    'p-1.5 rounded-lg transition-all bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                )}
                                                title="Open WhatsApp Web"
                                            >
                                                <MessageSquare size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <InfoRow icon={Mail} label="Email Address" value={devotee.email} />
                                    <InfoRow icon={MapPin} label="Address" value={devotee.address} />
                                    <InfoRow icon={Heart} label="Marital Status" value={devotee.maritalStatus} />
                                    <InfoRow icon={Calendar} label="Anniversary" value={formatDate(devotee.anniversary)} />
                                </div>
                            </section>

                            <section>
                                <SectionHeader title="Spiritual Journey" subtitle="Details regarding initiation and counseling" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                                    <InfoRow icon={User} label="Counselor" value={devotee.counselor} />
                                    <InfoRow icon={Calendar} label="Date of Shelter" value={formatDate(devotee.shelterDate)} />
                                    <InfoRow icon={Award} label="1st Initiation" value={formatDate(devotee.initiatedDate1 || devotee.initiationDate)} />
                                    <InfoRow icon={Award} label="2nd Initiation" value={formatDate(devotee.initiatedDate2 || devotee.secondInitiationDate)} />
                                    <InfoRow icon={BookOpen} label="Spiritual Master" value={devotee.spiritualMaster} />
                                </div>
                            </section>
                        </div>
                    )}

                    {activeSection === 'sadhana' && (
                        <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                            <SectionHeader title="Sadhana Report" subtitle="Daily spiritual practice tracking" />
                            <SadhanaLog devoteeId={id} />
                        </div>
                    )}

                    {activeSection === 'counseling' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <CounselingSessionLog devoteeId={id} devotee={devotee} />
                        </div>
                    )}

                    {activeSection === 'idcard' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col items-center justify-center pt-8">
                            <div 
                                ref={idCardRef}
                                className="relative w-80 h-[500px] bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col items-center text-center print:shadow-none print:border-black"
                            >
                                <div className="absolute top-0 w-full h-40 bg-gradient-to-b from-blue-900 to-blue-800"></div>
                                <div className="relative mt-20 w-32 h-32 rounded-full border-[6px] border-white shadow-xl bg-white dark:bg-slate-900 overflow-hidden shrink-0 z-10">
                                    <img src={devotee.photo || '/default-avatar.png'} alt="Profile" className="w-full h-full object-cover" />
                                </div>

                                <div className="mt-6 px-6 w-full flex-1 flex flex-col items-center">
                                    <h2 className="text-2xl font-black text-slate-900 leading-tight">{devotee.name}</h2>
                                    <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mt-1 mb-4">{devotee.initiatedName || 'ISKCON DURGAPUR MEMBER'}</p>

                                    <div className="my-4 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                        <QRCodeCanvas value={`DMS:${devotee.id}`} size={130} />
                                    </div>

                                    <div className="mt-auto mb-8 w-full">
                                        <div className="w-12 h-1 bg-slate-100 dark:bg-slate-800 mx-auto mb-4 rounded-full"></div>
                                        <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500 font-black">ISKCON Durgapur</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleDownloadCard}
                                className="mt-8 px-6 py-2 bg-slate-900 text-white rounded-full font-medium shadow-lg hover:shadow-xl hover:bg-slate-800 transition-all flex items-center gap-2"
                            >
                                <Download size={18} /> Download ID Card
                            </button>
                        </div>
                    )}

                    {activeSection === 'timeline' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <SectionHeader title="Spiritual Journey" subtitle="Timeline of your devotional milestones" />
                            <div className="pt-8">
                                <JourneyTimeline devotee={devotee} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ✅ Delete Confirmation Modal (replaces window.confirm) */}
            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Delete Devotee"
                message={`Are you sure you want to permanently delete "${devotee.name}"? This cannot be undone.`}
            />

            {/* ✅ WhatsApp Modal (replaces window.prompt/alert inline logic) */}
            <WhatsAppModal
                isOpen={showWhatsApp}
                onClose={() => setShowWhatsApp(false)}
                devotee={devotee}
            />
        </div>
    );
};

export default DevoteeProfile;
