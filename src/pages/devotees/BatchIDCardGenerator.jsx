import React, { useRef, useState } from 'react';
import { Download, Printer, X, FileText, Layout, Grid3X3, ArrowLeft } from 'lucide-react';
import { toPng } from 'html-to-image';
import { QRCodeCanvas } from 'qrcode.react';
import { useToast } from '../../components/Toast';
import { useNavigate, useLocation } from 'react-router-dom';
import clsx from 'clsx';

const BatchIDCardGenerator = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const toast = useToast();
    const containerRef = useRef(null);
    const [generating, setGenerating] = useState(false);
    const [layout, setLayout] = useState('grid'); // 'grid' (2x5) or 'list'

    const devotees = location.state?.selectedDevotees || [];

    if (devotees.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Layout size={48} className="text-slate-300" />
                <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs">No devotees selected</p>
                <button onClick={() => navigate('/devotees')} className="text-corporate-600 font-black text-sm uppercase">Back to List</button>
            </div>
        );
    }

    const handleDownloadAll = async () => {
        setGenerating(true);
        toast.info('Generating ID Cards... Please wait.');
        try {
            // For now, we'll capture the whole container
            // In a real scenario, we might want to loop and zip them
            const dataUrl = await toPng(containerRef.current, { quality: 0.95, pixelRatio: 2 });
            const link = document.createElement('a');
            link.download = `Batch-ID-Cards-${new Date().getTime()}.png`;
            link.href = dataUrl;
            link.click();
            toast.success('Downloaded successfully!');
        } catch {
            toast.error('Failed to generate cards');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 sticky top-0 z-30 bg-slate-50 dark:bg-slate-900/50/80 backdrop-blur-md py-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:border-slate-600 shadow-sm transition-all">
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">Batch ID Generator</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{devotees.length} cards to be generated</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-sm">
                        <button onClick={() => setLayout('grid')} className={clsx("p-2 rounded-lg transition-all", layout === 'grid' ? "bg-slate-900 text-white" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-300")}>
                            <Grid3X3 size={18} />
                        </button>
                        <button onClick={() => setLayout('list')} className={clsx("p-2 rounded-lg transition-all", layout === 'list' ? "bg-slate-900 text-white" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-300")}>
                            <Layout size={18} />
                        </button>
                    </div>
                    <button 
                        onClick={handleDownloadAll}
                        disabled={generating}
                        className="flex items-center gap-2 px-6 py-2.5 bg-corporate-600 text-white rounded-xl font-bold text-sm hover:bg-corporate-700 transition-all shadow-lg shadow-corporate-600/20 active:scale-95 disabled:opacity-50"
                    >
                        {generating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={18} />}
                        Download Image
                    </button>
                    <button onClick={() => window.print()} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:bg-slate-900/50 transition-all shadow-sm">
                        <Printer size={20} />
                    </button>
                </div>
            </div>

            {/* ID Cards Canvas */}
            <div className="print:bg-white dark:bg-slate-900 print:p-0">
                <div 
                    ref={containerRef}
                    className={clsx(
                        "p-8 bg-slate-100 dark:bg-slate-800 rounded-[2rem] border border-dashed border-slate-300 dark:border-slate-600 print:border-none print:bg-white dark:bg-slate-900 print:p-0",
                        layout === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-8" : "flex flex-col items-center gap-12"
                    )}
                >
                    {devotees.map((devotee) => (
                        <div key={devotee.id} className="id-card-wrapper print:break-inside-avoid">
                            <IDCard devotee={devotee} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Reusable ID Card Component (Enhanced version of the one in DevoteeProfile)
const IDCard = ({ devotee }) => {
    return (
        <div className="w-[350px] h-[520px] bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col relative mx-auto">
            {/* Header / Brand */}
            <div className="h-32 bg-corporate-700 relative overflow-hidden flex flex-col items-center justify-center text-white px-6">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute -top-10 -left-10 w-40 h-40 bg-white dark:bg-slate-900 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-corporate-400 rounded-full blur-3xl"></div>
                </div>
                <h2 className="text-lg font-black tracking-widest uppercase mb-1">ISKCON Durgapur</h2>
                <p className="text-[10px] font-bold text-blue-200/60 uppercase tracking-[0.3em]">International Society for Krishna Consciousness</p>
            </div>

            {/* Photo Section */}
            <div className="flex flex-col items-center -mt-14 relative z-10 px-8">
                <div className="w-32 h-32 rounded-3xl bg-white dark:bg-slate-900 p-1.5 shadow-2xl ring-4 ring-white/20">
                    <div className="w-full h-full rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-100 dark:border-slate-800">
                        <img src={devotee.photo || '/default-avatar.png'} alt="" className="w-full h-full object-cover" />
                    </div>
                </div>
                
                <div className="mt-4 text-center">
                    <h3 className="text-xl font-black text-slate-900 leading-tight">
                        {devotee.initiatedName || devotee.name}
                    </h3>
                    {devotee.initiatedName && (
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1">({devotee.name})</p>
                    )}
                </div>
            </div>

            {/* Details Section */}
            <div className="flex-1 px-8 py-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">ID NUMBER</p>
                        <p className="text-sm font-black text-slate-700 dark:text-slate-200">#{devotee.id.toString().padStart(5, '0')}</p>
                    </div>
                    <div className="space-y-1 text-right">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">GENDER</p>
                        <p className="text-sm font-black text-slate-700 dark:text-slate-200">{devotee.gender || 'N/A'}</p>
                    </div>
                </div>

                <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">SPIRITUAL STATUS</p>
                    <p className="text-sm font-black text-corporate-600">{devotee.spiritualStatus || 'Seeker'}</p>
                </div>

                <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">COUNSELOR</p>
                    <p className="text-sm font-black text-slate-700 dark:text-slate-200">{devotee.counselor || 'None'}</p>
                </div>
            </div>

            {/* Footer / QR */}
            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">CONTACT</p>
                    <p className="text-xs font-black text-slate-500 dark:text-slate-400">{devotee.contact}</p>
                </div>
                <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <QRCodeCanvas value={`DEV:${devotee.id}`} size={48} />
                </div>
            </div>

            {/* Decorative strip */}
            <div className="h-1.5 bg-gradient-to-r from-corporate-600 via-orange-500 to-corporate-400"></div>
        </div>
    );
};

export default BatchIDCardGenerator;
