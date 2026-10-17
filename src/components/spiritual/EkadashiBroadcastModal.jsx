import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Send, Sparkles, MessageCircle, Moon, Sun, Info } from 'lucide-react';
import clsx from 'clsx';
import { generateEkadashiWhatsAppText, formatParanaNotice } from '../../lib/vaishnavaCalendarUtils';
import { useToast } from '../Toast';

const EkadashiBroadcastModal = ({ isOpen, onClose, event, initialRecipientPhone = '', initialRecipientName = '' }) => {
    const toast = useToast();
    const [language, setLanguage] = useState('bilingual'); // 'bilingual' | 'bn' | 'en'
    const [recipientName, setRecipientName] = useState(initialRecipientName || '');
    const [phone, setPhone] = useState(initialRecipientPhone || '');
    const [messageText, setMessageText] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (event) {
            const formatted = generateEkadashiWhatsAppText(event, {
                language,
                recipientName,
                templeName: 'ইস্কন শ্রীশ্রী রাধাগোবিন্দজিউ মন্দির (Durgapur)'
            });
            setMessageText(formatted);
        }
    }, [event, language, recipientName]);

    if (!isOpen || !event) return null;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(messageText);
            setCopied(true);
            toast.success('মেসেজ কপি হয়েছে! WhatsApp-এ পেস্ট করুন।');
            setTimeout(() => setCopied(false), 2500);
        } catch (err) {
            console.error('Failed to copy', err);
            toast.error('কপি করতে সমস্যা হয়েছে');
        }
    };

    const handleSendWhatsApp = () => {
        const encoded = encodeURIComponent(messageText);
        let url = `https://api.whatsapp.com/send?text=${encoded}`;
        if (phone && phone.trim()) {
            const cleaned = phone.replace(/[^0-9]/g, '');
            url = `https://api.whatsapp.com/send?phone=${cleaned}&text=${encoded}`;
        }
        window.open(url, '_blank');
        toast.success('WhatsApp উইন্ডো ওপেন হচ্ছে...');
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="px-6 py-5 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent dark:from-orange-500/20 dark:via-amber-500/10 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                            📿
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <span>একাদশী রিমাইন্ডার ও নোটিফিকেশন</span>
                                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950/80 dark:text-orange-300">
                                    WhatsApp Hub
                                </span>
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {event.bengaliName} • {event.date}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
                    
                    {/* Parana & Fasting Quick Info Bar */}
                    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                            <span className="font-bold text-amber-900 dark:text-amber-200 block">
                                ⏰ পারণের সময় (Fast Breaking):
                            </span>
                            <span className="text-amber-700 dark:text-amber-300 font-medium">
                                {event.paranaDate ? `${event.paranaDate}, ` : ''}{event.paranaTime || 'সূর্যোদয়ের পর শাস্ত্রীয় সময় অনুযায়ী'} (মায়াপুর IST)
                            </span>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 font-bold rounded-lg shrink-0">
                            🌾 পঞ্চরবিশস্য বর্জনীয়
                        </span>
                    </div>

                    {/* Controls Bar: Language & Devotee Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                                ভাষা নির্বাচন (Message Language)
                            </label>
                            <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                {[
                                    { id: 'bilingual', label: 'উভয় / Dual' },
                                    { id: 'bn', label: 'বাংলা' },
                                    { id: 'en', label: 'English' }
                                ].map(item => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setLanguage(item.id)}
                                        className={clsx(
                                            "py-1.5 text-xs font-bold rounded-lg transition-all",
                                            language === item.id
                                                ? "bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm"
                                                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                        )}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                                ভক্তের নাম (ঐচ্ছিক / Optional)
                            </label>
                            <input
                                type="text"
                                value={recipientName}
                                onChange={(e) => setRecipientName(e.target.value)}
                                placeholder="উদাঃ অমল কৃষ্ণ দাস"
                                className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-800 dark:text-slate-100"
                            />
                        </div>
                    </div>

                    {/* WhatsApp Direct Phone input */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                            নির্দিষ্ট ভক্তের WhatsApp নম্বর (ঐচ্ছিক — গ্রুপে পাঠালে ফাঁকা রাখুন)
                        </label>
                        <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+91 9876543210 (ফাঁকা রাখলে যেকোনো চ্যাটে শেয়ার করা যাবে)"
                            className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-800 dark:text-slate-100"
                        />
                    </div>

                    {/* Message Preview Box */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                মেসেজ প্রিভিউ (সম্পাদনাযোগ্য / Editable)
                            </label>
                            <span className="text-[11px] text-slate-400">
                                WhatsApp ফরম্যাটিং সমর্থিত (*bold*, _italic_)
                            </span>
                        </div>
                        <textarea
                            rows={8}
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            className="w-full text-xs font-mono p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-800 dark:text-slate-200 leading-relaxed custom-scrollbar"
                        />
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={handleCopy}
                        className={clsx(
                            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border",
                            copied
                                ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 text-emerald-700 dark:text-emerald-300"
                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                        )}
                    >
                        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        <span>{copied ? 'কপি সম্পন্ন!' : 'কপি করুন (Copy Text)'}</span>
                    </button>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            বন্ধ করুন
                        </button>
                        <button
                            type="button"
                            onClick={handleSendWhatsApp}
                            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
                        >
                            <Send className="w-4 h-4" />
                            <span>WhatsApp-এ পাঠান</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default EkadashiBroadcastModal;
