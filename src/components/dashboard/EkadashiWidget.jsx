import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Bell, Clock, ChevronRight, Share2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { getNextEkadashi } from '../../lib/vaishnavaCalendarUtils';
import EkadashiBroadcastModal from '../spiritual/EkadashiBroadcastModal';

const EkadashiWidget = () => {
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);

    const ekadashiInfo = getNextEkadashi();
    const { nextEkadashi, daysRemaining, isTodayEkadashi, todayEkadashiEvent, isTodayParana, todayParanaEvent } = ekadashiInfo;

    // Pick active event for modal
    const activeModalEvent = isTodayParana ? todayParanaEvent : (todayEkadashiEvent || nextEkadashi);

    return (
        <>
            <div className="bg-card text-card-foreground rounded-2xl border border-border shadow-md overflow-hidden relative group transition-all duration-300">
                {/* Decorative Top Accent Line */}
                <div className={clsx(
                    "h-1.5 w-full",
                    isTodayEkadashi
                        ? "bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500"
                        : isTodayParana
                            ? "bg-gradient-to-r from-emerald-400 via-teal-500 to-green-600"
                            : "bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-400"
                )} />

                <div className="p-6 space-y-5">
                    {/* Header with Title and Live Badge */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className={clsx(
                                "w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm",
                                isTodayEkadashi
                                    ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20"
                                    : isTodayParana
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                            )}>
                                {isTodayEkadashi ? '📿' : isTodayParana ? '⏰' : '🌸'}
                            </div>
                            <div>
                                <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                                    <span>বৈষ্ণব ক্যালেন্ডার হাব</span>
                                </h4>
                                <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                                    ISKCON Mayapur Standard
                                </p>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <span className={clsx(
                            "text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border flex items-center gap-1.5",
                            isTodayEkadashi
                                ? "bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-900 animate-pulse"
                                : isTodayParana
                                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900"
                                    : daysRemaining === 1
                                        ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900"
                                        : "bg-muted text-muted-foreground border-border"
                        )}>
                            <span className={clsx(
                                "w-1.5 h-1.5 rounded-full",
                                isTodayEkadashi ? "bg-orange-500" : isTodayParana ? "bg-emerald-500" : "bg-amber-500"
                            )}></span>
                            {isTodayEkadashi ? 'আজ একাদশী' : isTodayParana ? 'আজ পারণ তিথি' : `${daysRemaining} দিন বাকি`}
                        </span>
                    </div>

                    {/* Content Body Based on State */}
                    {isTodayEkadashi ? (
                        /* STATE 1: TODAY IS EKADASHI */
                        <div className="bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent dark:from-orange-500/20 dark:via-amber-500/10 p-4 rounded-xl border border-orange-200/80 dark:border-orange-900/50 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <span className="text-[10px] font-bold uppercase text-orange-600 dark:text-orange-400">
                                        আজ পরম পবিত্র একাদশী ব্রত
                                    </span>
                                    <h3 className="text-lg font-black text-foreground leading-tight font-bangla">
                                        {todayEkadashiEvent?.bengaliName}
                                    </h3>
                                    <p className="text-xs text-muted-foreground italic">
                                        {todayEkadashiEvent?.name}
                                    </p>
                                </div>
                            </div>

                            <div className="text-xs text-foreground bg-card/90 p-2.5 rounded-lg border border-orange-100 dark:border-slate-800 flex items-center justify-between">
                                <span className="font-medium text-rose-600 dark:text-rose-400 font-bold font-bangla">
                                    🚫 পঞ্চরবিশস্য বর্জনীয়
                                </span>
                                <span className="text-muted-foreground font-medium font-bangla">
                                    পারণ: কাল {todayEkadashiEvent?.paranaTime?.split(' - ')[0]} পর
                                </span>
                            </div>
                        </div>
                    ) : isTodayParana ? (
                        /* STATE 2: TODAY IS PARANA DAY */
                        <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent dark:from-emerald-500/20 dark:via-teal-500/10 p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-900/50 space-y-3">
                            <div>
                                <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bangla">
                                    <Clock className="w-3 h-3" /> আজ একাদশী পারণ সময়
                                </span>
                                <h3 className="text-lg font-black text-foreground leading-tight">
                                    {todayParanaEvent?.paranaTime}
                                </h3>
                                <p className="text-xs text-muted-foreground font-bangla">
                                    {todayParanaEvent?.bengaliName}-এর উপবাস ভঙ্গ করুন।
                                </p>
                            </div>
                            <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium font-bangla">
                                এই সময়সীমার মধ্যে ভগবৎ-প্রসাদ গ্রহণ করে পারণ সম্পন্ন করুন।
                            </p>
                        </div>
                    ) : (
                        /* STATE 3: COUNTDOWN TO NEXT EKADASHI */
                        <div className="bg-muted/40 p-4 rounded-xl border border-border space-y-2.5">
                            <div className="flex items-start justify-between">
                                <div>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block font-bangla">
                                        পরবর্তী একাদশী
                                    </span>
                                    <h3 className="text-base font-bold text-foreground font-bangla">
                                        {nextEkadashi?.bengaliName}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        {nextEkadashi?.name}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-black text-orange-600 dark:text-orange-400 leading-none">
                                        {daysRemaining}
                                    </div>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                                        {daysRemaining === 1 ? 'দিন বাকি (কাল)' : 'দিন বাকি'}
                                    </span>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                                <span className="flex items-center gap-1.5 font-medium">
                                    <Calendar className="w-3.5 h-3.5 text-orange-500" />
                                    {nextEkadashi?.date}
                                </span>
                                <span className="text-[11px] font-bold text-foreground/80">
                                    পারণ: {nextEkadashi?.paranaTime}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                        <button
                            type="button"
                            onClick={() => setShowModal(true)}
                            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 transition-all shadow-sm"
                        >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>WhatsApp রিমাইন্ডার</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate('/calendar')}
                            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-muted hover:bg-muted/80 text-foreground transition-all border border-border"
                        >
                            <span>সম্পূর্ণ ক্যালেন্ডার</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Broadcast Modal */}
            <EkadashiBroadcastModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                event={activeModalEvent}
            />
        </>
    );
};

export default EkadashiWidget;
