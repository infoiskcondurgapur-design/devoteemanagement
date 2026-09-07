import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

const NetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showLabel, setShowLabel] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowLabel(true);
            setTimeout(() => setShowLabel(false), 3000);
        };
        const handleOffline = () => {
            setIsOnline(false);
            setShowLabel(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-500 overflow-hidden bg-white dark:bg-slate-900/10 backdrop-blur-md border border-white/20">
            <div className={clsx(
                "w-2 h-2 rounded-full animate-pulse",
                isOnline ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" : "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]"
            )} />
            
            {(showLabel || !isOnline) && (
                <span className={clsx(
                    "text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-left-2 duration-300",
                    isOnline ? "text-emerald-100" : "text-red-100"
                )}>
                    {isOnline ? 'Online' : 'Offline Mode'}
                </span>
            )}

            {isOnline ? (
                <Wifi size={14} className="text-emerald-200/50" />
            ) : (
                <WifiOff size={14} className="text-red-200/50" />
            )}
        </div>
    );
};

export default NetworkStatus;
