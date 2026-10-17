import React, { useState, useEffect, useRef } from 'react';
import { formatDate } from '../../lib/dateUtils';
import { useParams, useNavigate } from 'react-router-dom';
import { useDevotees } from '../../context/DevoteeContext';
import { useAuth } from '../../context/AuthContext';
import {
    Edit, Trash, Phone, Mail, MapPin, Calendar, Heart, Award,
    ChevronLeft, BookOpen, User, MessageSquare,
    Activity, CheckCircle2, LayoutDashboard, Fingerprint, Download, Sparkles, FileEdit, Maximize2,
    Briefcase, GraduationCap, Home, Droplet, ShieldCheck, Users
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import SadhanaLog from '../../components/SadhanaLog';
import ConfirmationModal from '../../components/ConfirmationModal';
import WhatsAppModal from '../../components/WhatsAppModal';
import ImageModal from '../../components/ImageModal';
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
    <div className="grid grid-cols-12 gap-4 items-center py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors px-2 rounded-lg">
        <div className="col-span-5 md:col-span-4 text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
            {Icon && <Icon size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />}
            <span>{label}</span>
        </div>
        <div className="col-span-7 md:col-span-8 text-sm font-semibold text-slate-900 dark:text-slate-100 break-words">{value || '--'}</div>
    </div>
);

const formatList = (val) => {
    if (!val) return '--';
    if (Array.isArray(val)) return val.filter(Boolean).join(', ') || '--';
    if (typeof val === 'string') {
        const trimmed = val.trim();
        if (!trimmed || trimmed === '[]' || trimmed === '""') return '--';
        try {
            if (trimmed.startsWith('[')) {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) return parsed.filter(Boolean).join(', ') || '--';
            }
        } catch { }
        return trimmed;
    }
    return String(val);
};

const DevoteeProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { devotees, deleteDevotee, getDevoteeById, updateDevotee } = useDevotees();
    const { isAdmin, canRequestChanges } = useAuth();
    const toast = useToast();
    const idCardRef = useRef(null);

    const [activeSection, setActiveSection] = useState('overview');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showWhatsApp, setShowWhatsApp] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [devotee, setDevotee] = useState(null);
    const [loading, setLoading] = useState(true);

    // ✅ Effect 1: Immediately resolve from local context list (handles both string and numeric IDs)
    useEffect(() => {
        const found = devotees.find(d => String(d.id) === String(id));
        if (found) {
            setDevotee(found);
            setLoading(false);
        }
    }, [devotees, id]);

    // ✅ Effect 2: Also fetch fresh/authoritative data from the API (runs in background)
    useEffect(() => {
        let cancelled = false;
        if (getDevoteeById) {
            getDevoteeById(id).then(fresh => {
                if (!cancelled && fresh) {
                    setDevotee(fresh);
                    setLoading(false);
                }
            }).catch(() => {
                if (!cancelled) setLoading(false);
            }).finally(() => {
                if (!cancelled) setLoading(false);
            });
        }
        return () => { cancelled = true; };
    }, [id, getDevoteeById]);

    if (!devotee) {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mb-4" />
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading devotee details...</p>
                </div>
            );
        }
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="text-slate-400 dark:text-slate-500 mb-4"><User size={48} /></div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Devotee Not Found</h3>
                <button onClick={() => navigate('/devotees')} className="mt-4 text-blue-600 dark:text-blue-400 hover:underline">Go Back to Devotees</button>
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
            await document.fonts.ready;
            
            const options = {
                pixelRatio: 3,
                quality: 1.0,
                backgroundColor: '#ffffff',
                style: {
                    transform: 'scale(1)',
                }
            };
            
            const dataUrl = await toPng(idCardRef.current, options);
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `ID_Card_${(devotee.name || 'devotee').replace(/\s+/g, '_')}.png`;
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

    const safeIdStr = String(devotee.id || id || '');

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">

            {/* Header */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                    <div className="shrink-0">
                        <div 
                            onClick={() => devotee.photo && setShowImageModal(true)}
                            className={`w-32 h-32 rounded-full border-4 border-slate-50 dark:border-slate-800 shadow-md overflow-hidden bg-slate-100 dark:bg-slate-800 relative group ${devotee.photo ? 'cursor-pointer' : ''}`}
                            title={devotee.photo ? 'Click to view original image' : ''}
                        >
                            {devotee.photo ? (
                                <>
                                    <img 
                                        src={devotee.photo} 
                                        alt={devotee.name} 
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                                    />
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                        <Maximize2 size={24} className="drop-shadow" />
                                    </div>
                                </>
                            ) : (
                                <User className="w-full h-full p-6 text-slate-300 dark:text-slate-600" />
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
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                {devotee.name}
                                {devotee.status === 'Active' && (
                                    <span className="px-2.5 py-0.5 rounded-full bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 text-xs font-bold border border-green-200 dark:border-green-800">Active</span>
                                )}
                                {devotee.status === 'Pending' && (
                                    <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-bold border border-amber-200 dark:border-amber-800">Pending Approval</span>
                                )}
                                {(devotee.spiritualStatus === 'Initiated' || devotee.initiatedDate1 || devotee.initiatedName || devotee.spiritualName) && (
                                    <span className="px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 text-xs font-bold border border-purple-200 dark:border-purple-800">Initiated</span>
                                )}
                            </h1>
                            <div className="flex items-center gap-6 mt-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                <div className="flex items-center gap-1.5">
                                    <span className="uppercase tracking-wider text-slate-400 dark:text-slate-500">ID:</span>
                                    <span className="font-mono text-slate-700 dark:text-slate-200">{safeIdStr.length > 8 ? `${safeIdStr.slice(0, 8)}...` : safeIdStr}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="uppercase tracking-wider text-slate-400 dark:text-slate-500">Created:</span>
                                    <span>{devotee.createdAt ? formatDate(devotee.createdAt) : new Date().toLocaleDateString('en-GB')}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 self-start md:self-center">
                            {/* WhatsApp button */}
                            <button
                                onClick={() => setShowWhatsApp(true)}
                                className={clsx(
                                    'p-2.5 rounded-xl border transition-colors font-medium text-sm flex items-center gap-2',
                                    'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                                )}
                                title="Send WhatsApp Message"
                            >
                                <MessageSquare size={16} />
                                <span className="hidden sm:inline">WhatsApp</span>
                            </button>
                            {isAdmin ? (
                                <>
                                    {devotee.status === 'Pending' && (
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await updateDevotee(id, { status: 'Active' });
                                                    toast.success(`${devotee.name} approved and activated.`);
                                                } catch (err) {
                                                    toast.error('Approve failed: ' + err.message);
                                                }
                                            }}
                                            className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 flex items-center gap-2 shadow-sm"
                                        >
                                            <CheckCircle2 size={16} /> Approve
                                        </button>
                                    )}
                                    <button
                                        onClick={() => navigate(`/devotees/${id}/edit`)}
                                        className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors shadow-sm"
                                    >
                                        <Edit size={16} /> Edit
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-700 rounded-lg hover:bg-red-700 dark:hover:bg-red-800 flex items-center gap-2 shadow-sm transition-colors"
                                    >
                                        <Trash size={16} /> Delete
                                    </button>
                                </>
                            ) : canRequestChanges && (
                                <button
                                    onClick={() => navigate(`/change-request/${id}`)}
                                    className="px-4 py-2 text-sm font-medium text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/40 border border-orange-300 dark:border-orange-800 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/40 flex items-center gap-2"
                                >
                                    <FileEdit size={16} /> Request Changes
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Navigation & Quick Stats */}
                <div className="w-full lg:w-64 shrink-0 space-y-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden py-2">
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
                                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400'
                                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                    )}
                                >
                                    {isActive && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r"></div>
                                    )}
                                    <Icon size={18} className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'} />
                                    {item.label}
                                    {isActive && <CheckCircle2 size={16} className="ml-auto text-blue-600 dark:text-blue-400" />}
                                </button>
                            );
                        })}
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                    {devotee.initiatedName || devotee.spiritualName || (devotee.spiritualStatus === 'Initiated' ? 'Initiated Devotee' : (devotee.spiritualStatus ? `${devotee.spiritualStatus} Devotee` : 'Devotee'))}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {devotee.counselor ? `Counselor: ${devotee.counselor}` : (devotee.occupation || 'DMS Member')}
                                </p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500 dark:text-slate-400">Daily Rounds</span>
                                <span className="font-bold text-slate-900 dark:text-slate-100">{devotee.rounds || devotee.japaRounds || 0} / 16</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min((((devotee.rounds || devotee.japaRounds || 0) / 16) * 100), 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8 min-h-[500px]">
                    {activeSection === 'overview' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            
                            {/* Personal & Demographics */}
                            <section>
                                <SectionHeader title="Personal Information" subtitle="Basic identity, demographics, and contact details" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                                    <InfoRow icon={User} label="Full Name" value={devotee.name} />
                                    <InfoRow icon={Award} label="Initiated Name" value={devotee.initiatedName || devotee.spiritualName} />
                                    <InfoRow icon={User} label="Gender" value={devotee.gender} />
                                    <InfoRow icon={Calendar} label="Date of Birth" value={devotee.dob ? `${formatDate(devotee.dob)}${devotee.age ? ` (${devotee.age} yrs)` : ''}` : (devotee.age ? `${devotee.age} yrs` : '--')} />
                                    <InfoRow icon={Droplet} label="Blood Group" value={devotee.bloodGroup} />
                                    <InfoRow icon={Heart} label="Marital Status" value={devotee.maritalStatus} />
                                    <InfoRow icon={Calendar} label="Anniversary" value={formatDate(devotee.anniversary)} />
                                    <InfoRow icon={User} label="Guardian / Father" value={devotee.guardianName ? `${devotee.guardianName}${devotee.relationType ? ` (${devotee.relationType})` : ''}` : (devotee.relationType ? `Relationship: ${devotee.relationType}` : '--')} />
                                    
                                    {/* Contact Number with WhatsApp link */}
                                    <div className="grid grid-cols-12 gap-4 items-center py-3 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors px-2 rounded-lg">
                                        <div className="col-span-5 md:col-span-4 text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                            <Phone size={14} className="text-slate-400 dark:text-slate-500 shrink-0" /> Contact Number
                                        </div>
                                        <div className="col-span-7 md:col-span-8 flex items-center justify-between">
                                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{devotee.contact || '--'}</span>
                                            {devotee.contact && (
                                                <button
                                                    onClick={() => setShowWhatsApp(true)}
                                                    className="p-1.5 rounded-lg transition-all bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                                                    title="Open WhatsApp Web"
                                                >
                                                    <MessageSquare size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <InfoRow icon={Phone} label="WhatsApp Number" value={devotee.whatsapp} />
                                    <InfoRow icon={Mail} label="Email Address" value={devotee.email} />
                                </div>
                            </section>

                            {/* Education & Profession */}
                            <section>
                                <SectionHeader title="Education & Profession" subtitle="Academic background and professional occupation" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                                    <InfoRow icon={GraduationCap} label="Education" value={devotee.education} />
                                    <InfoRow icon={Briefcase} label="Occupation" value={devotee.occupation} />
                                    <InfoRow icon={Sparkles} label="Special Skills" value={devotee.skills} />
                                    <InfoRow icon={Activity} label="Current Seva" value={devotee.currentService} />
                                </div>
                            </section>

                            {/* Residential Address */}
                            <section>
                                <SectionHeader title="Residential Address" subtitle="Location and physical address coordinates" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                                    <InfoRow icon={Home} label="Street / Address" value={devotee.address} />
                                    <InfoRow icon={MapPin} label="Village / Town" value={devotee.village} />
                                    <InfoRow icon={MapPin} label="District" value={devotee.district} />
                                    <InfoRow icon={MapPin} label="State" value={devotee.state} />
                                    <InfoRow icon={MapPin} label="PIN Code" value={devotee.pinCode} />
                                </div>
                            </section>

                            {/* Spiritual Journey */}
                            <section>
                                <SectionHeader title="Spiritual Journey" subtitle="Details regarding initiation, counselor, and spiritual practices" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                                    <InfoRow icon={ShieldCheck} label="Spiritual Status" value={devotee.spiritualStatus || 'Aspiring'} />
                                    <InfoRow icon={User} label="Counselor" value={devotee.counselor} />
                                    <InfoRow icon={BookOpen} label="Spiritual Master" value={devotee.spiritualMaster} />
                                    <InfoRow icon={Activity} label="Daily Japa Rounds" value={devotee.rounds ? `${devotee.rounds} rounds` : (devotee.japaRounds ? `${devotee.japaRounds} rounds` : '--')} />
                                    <InfoRow icon={Calendar} label="Following Principles" value={devotee.followingPrinciplesSince ? `Since ${formatDate(devotee.followingPrinciplesSince)}` : '--'} />
                                    <InfoRow icon={Calendar} label="Date of Shelter" value={formatDate(devotee.shelterDate)} />
                                    <InfoRow icon={Award} label="1st Initiation" value={formatDate(devotee.initiatedDate1 || devotee.initiationDate)} />
                                    <InfoRow icon={Award} label="2nd Initiation" value={formatDate(devotee.initiatedDate2 || devotee.secondInitiationDate)} />
                                    <InfoRow icon={BookOpen} label="Books Read" value={formatList(devotee.booksRead)} />
                                    <InfoRow icon={BookOpen} label="Currently Reading" value={devotee.booksReading} />
                                    <InfoRow icon={GraduationCap} label="Courses Completed" value={formatList(devotee.courses)} />
                                </div>
                            </section>

                            {/* Family Details (rendered if any exist) */}
                            {(devotee.child1Name || devotee.child2Name || devotee.child3Name || devotee.otherFamilyMembers || devotee.shraddhaName) && (
                                <section>
                                    <SectionHeader title="Family & Commemorative Dates" subtitle="Household members and special observances" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                                        {devotee.child1Name && <InfoRow icon={Users} label="Child 1" value={`${devotee.child1Name}${devotee.child1Dob ? ` (${formatDate(devotee.child1Dob)})` : ''}`} />}
                                        {devotee.child2Name && <InfoRow icon={Users} label="Child 2" value={`${devotee.child2Name}${devotee.child2Dob ? ` (${formatDate(devotee.child2Dob)})` : ''}`} />}
                                        {devotee.child3Name && <InfoRow icon={Users} label="Child 3" value={`${devotee.child3Name}${devotee.child3Dob ? ` (${formatDate(devotee.child3Dob)})` : ''}`} />}
                                        {devotee.otherFamilyMembers && <InfoRow icon={Users} label="Other Family Members" value={devotee.otherFamilyMembers} />}
                                        {devotee.shraddhaName && <InfoRow icon={Calendar} label="Shraddha Ceremony" value={`${devotee.shraddhaName}${devotee.shraddhaDate ? ` (${formatDate(devotee.shraddhaDate)})` : ''}`} />}
                                    </div>
                                </section>
                            )}

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
                                <div className="relative mt-20 w-32 h-32 rounded-full border-[6px] border-white dark:border-slate-900 shadow-xl bg-white dark:bg-slate-900 overflow-hidden shrink-0 z-10">
                                    <img src={devotee.photo || '/default-avatar.png'} alt="Profile" className="w-full h-full object-cover" />
                                </div>

                                <div className="mt-6 px-6 w-full flex-1 flex flex-col items-center">
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-tight">{devotee.name}</h2>
                                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-1 mb-4">{devotee.initiatedName || devotee.spiritualName || 'ISKCON DURGAPUR MEMBER'}</p>

                                    <div className="my-4 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
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
                                className="mt-8 px-6 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-full font-medium shadow-lg hover:shadow-xl hover:bg-slate-800 dark:hover:bg-white transition-all flex items-center gap-2"
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

            {/* ✅ Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Delete Devotee"
                message={`Are you sure you want to permanently delete "${devotee.name}"? This cannot be undone.`}
            />

            {/* ✅ WhatsApp Modal */}
            <WhatsAppModal
                isOpen={showWhatsApp}
                onClose={() => setShowWhatsApp(false)}
                devotee={devotee}
            />

            {/* ✅ Original Profile Picture Modal */}
            <ImageModal
                isOpen={showImageModal}
                onClose={() => setShowImageModal(false)}
                imageUrl={devotee.photo}
                title={devotee.name}
                subtitle={devotee.initiatedName || devotee.spiritualName || 'ISKCON Devotee'}
            />
        </div>
    );
};

export default DevoteeProfile;
