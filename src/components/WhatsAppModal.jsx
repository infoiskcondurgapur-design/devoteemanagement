import React, { useState, useEffect } from 'react';
import { X, ExternalLink, MessageSquare, Copy, Check, AlertCircle, Smartphone, Globe } from 'lucide-react';
import clsx from 'clsx';
import { useDevotees } from '../context/DevoteeContext';
import { useToast } from './Toast';
import { 
    sanitizeWhatsAppNumber, 
    getWhatsAppWebUrl, 
    getWhatsAppAppUrl, 
    openWhatsApp 
} from '../services/whatsappLink';

const WhatsAppModal = ({ isOpen, onClose, devotee }) => {
    const { getAiMessageDraft } = useDevotees();
    const toast = useToast();
    const [message, setMessage] = useState('');
    const [targetPhone, setTargetPhone] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isOpen && devotee) {
            setMessage('');
            setTargetPhone(devotee.whatsapp || devotee.contact || '');
            setCopied(false);
        }
    }, [isOpen, devotee]);

    if (!isOpen || !devotee) return null;

    const cleanNumber = sanitizeWhatsAppNumber(targetPhone);
    const isValidPhone = cleanNumber && cleanNumber.length >= 10;
    const webUrl = isValidPhone ? getWhatsAppWebUrl(cleanNumber, message) : '#';
    const appUrl = isValidPhone ? getWhatsAppAppUrl(cleanNumber, message) : '#';

    const applyAiDraft = (type) => {
        setMessage(getAiMessageDraft(devotee, type));
    };

    const handleOpen = (mode = 'web') => {
        try {
            openWhatsApp(targetPhone, message, mode);
            toast.success(`Opening ${mode === 'web' ? 'WhatsApp Web' : 'WhatsApp'}...`);
            onClose();
        } catch (err) {
            toast.error(err.message || 'Failed to open WhatsApp');
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(message);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast.success('Message copied to clipboard!');
        } catch {
            toast.error('Could not copy message');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-4">
                        <img 
                            src={devotee.photo || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop'} 
                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" 
                            alt={devotee.name} 
                        />
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{devotee.name}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                                    {isValidPhone ? `+${cleanNumber}` : (targetPhone || 'No phone number')}
                                </span>
                                {isValidPhone && (
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" title="Valid Phone" />
                                )}
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Phone Number check & input if invalid */}
                    {!isValidPhone && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs space-y-2">
                            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>Missing or incomplete mobile number</span>
                            </div>
                            <p className="text-amber-700 dark:text-amber-400 text-[11px]">
                                Enter the devotee's 10-digit WhatsApp number below to send message:
                            </p>
                            <input
                                type="tel"
                                placeholder="e.g. 9876543210"
                                value={targetPhone}
                                onChange={(e) => setTargetPhone(e.target.value)}
                                className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-amber-500/20"
                            />
                        </div>
                    )}

                    {/* AI Quick Draft Templates */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">
                            Quick Templates ✨
                        </label>
                        <div className="flex flex-wrap gap-2">
                            <button 
                                onClick={() => applyAiDraft('general')} 
                                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-950/40 rounded-lg text-xs font-medium transition-all"
                            >
                                General
                            </button>
                            <button 
                                onClick={() => applyAiDraft('birthday')} 
                                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-pink-50 hover:text-pink-600 dark:hover:bg-pink-950/40 rounded-lg text-xs font-medium transition-all"
                            >
                                Birthday 🎂
                            </button>
                            <button 
                                onClick={() => applyAiDraft('anniversary')} 
                                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 rounded-lg text-xs font-medium transition-all"
                            >
                                Anniversary 💐
                            </button>
                            <button 
                                onClick={() => applyAiDraft('reminder')} 
                                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40 rounded-lg text-xs font-medium transition-all"
                            >
                                Follow-up 🔔
                            </button>
                        </div>
                    </div>

                    {/* Message Textarea */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 flex justify-between">
                            <span>Your Message</span>
                            <span className={clsx('lowercase font-medium', message.length > 500 ? 'text-red-500' : 'text-slate-400')}>
                                {message.length} chars
                            </span>
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your message here..."
                            rows={4}
                            className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none transition-all text-sm font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {/* Primary: Direct WhatsApp Web */}
                            <button
                                onClick={() => handleOpen('web')}
                                disabled={!isValidPhone}
                                className={clsx(
                                    "flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white transition-all shadow-md",
                                    isValidPhone
                                        ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20 active:scale-[0.98]"
                                        : "bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-60"
                                )}
                                title="Opens WhatsApp Web directly with prefilled chat"
                            >
                                <Globe className="w-4 h-4" />
                                <span>Open WhatsApp Web</span>
                            </button>

                            {/* Secondary: WhatsApp Mobile / App */}
                            <button
                                onClick={() => handleOpen('app')}
                                disabled={!isValidPhone}
                                className={clsx(
                                    "flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm border transition-all",
                                    isValidPhone
                                        ? "border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 active:scale-[0.98]"
                                        : "border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed opacity-60"
                                )}
                                title="Opens in WhatsApp Desktop App or Mobile App"
                            >
                                <Smartphone className="w-4 h-4" />
                                <span>WhatsApp App</span>
                            </button>
                        </div>

                        {/* Copy message button */}
                        {message && (
                            <button
                                onClick={handleCopy}
                                className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-dashed border-slate-200 dark:border-slate-700"
                            >
                                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copied ? 'Copied to Clipboard!' : 'Copy Message Text'}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Footer Fallback with Direct HTML Link */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 text-center space-y-1">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        Opens in your browser's WhatsApp Web tab with the message pre-filled.
                    </p>
                    {isValidPhone && (
                        <p className="text-[10px] text-slate-400">
                            Popup blocked?{' '}
                            <a 
                                href={webUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-emerald-600 dark:text-emerald-400 underline font-semibold hover:text-emerald-700"
                                onClick={() => onClose()}
                            >
                                Click here to open WhatsApp Web directly
                            </a>
                            {' or '}
                            <a 
                                href={appUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-emerald-600 dark:text-emerald-400 underline font-semibold hover:text-emerald-700"
                                onClick={() => onClose()}
                            >
                                wa.me link
                            </a>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WhatsAppModal;
