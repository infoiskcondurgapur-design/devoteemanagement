import React, { useState, useEffect } from 'react';
import { X, ExternalLink, MessageSquare } from 'lucide-react';
import clsx from 'clsx';
import { useDevotees } from '../context/DevoteeContext';

const WhatsAppModal = ({ isOpen, onClose, devotee }) => {
    const { getAiMessageDraft } = useDevotees();
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (isOpen && devotee) {
            setMessage('');
        }
    }, [isOpen, devotee]);

    if (!isOpen || !devotee) return null;

    const sanitizeNumber = (number) => {
        let num = String(number || '').replace(/\D/g, '');
        if (num.length === 10) num = '91' + num;
        return num;
    };

    const applyAiDraft = (type) => {
        setMessage(getAiMessageDraft(devotee, type));
    };

    const openWhatsApp = () => {
        const number = sanitizeNumber(devotee.whatsapp || devotee.contact);
        const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-4">
                        <img src={devotee.photo || '/default-avatar.png'} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" alt="" />
                        <div>
                            <h3 className="font-bold text-slate-900 line-clamp-1">{devotee.name}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{devotee.whatsapp || devotee.contact}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white dark:bg-slate-900 rounded-xl transition-colors">
                        <X className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Draft with AI ✨</label>
                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => applyAiDraft('general')} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 hover:text-orange-600 rounded-lg text-xs font-medium transition-all">General</button>
                            <button onClick={() => applyAiDraft('birthday')} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-pink-50 hover:text-pink-600 rounded-lg text-xs font-medium transition-all">Birthday</button>
                            <button onClick={() => applyAiDraft('anniversary')} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 rounded-lg text-xs font-medium transition-all">Anniversary</button>
                            <button onClick={() => applyAiDraft('reminder')} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-xs font-medium transition-all">Follow-up</button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 flex justify-between">
                            Your Message
                            <span className={clsx('lowercase font-medium', message.length > 500 ? 'text-red-500' : 'text-slate-300')}>{message.length} chars</span>
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your message here..."
                            className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-corporate-600/20 focus:border-corporate-600 outline-none resize-none transition-all text-sm font-medium"
                        />
                    </div>

                    <button
                        onClick={openWhatsApp}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all shadow-md bg-corporate-600 text-white hover:bg-corporate-700 active:scale-95"
                    >
                        <ExternalLink className="w-5 h-5" />
                        Open in WhatsApp Web
                    </button>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Opens WhatsApp Web in a new tab with your message pre-filled.</p>
                </div>
            </div>
        </div>
    );
};

export default WhatsAppModal;
