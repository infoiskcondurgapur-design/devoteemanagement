import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

const PwaInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isIos, setIsIos] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showIosPrompt, setShowIosPrompt] = useState(false);

    useEffect(() => {
        // Check if the user is already using the installed PWA
        const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        setIsStandalone(checkStandalone);

        // Check if device is iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIos(isIosDevice);

        const handleBeforeInstallPrompt = (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // If the app is installed, we won't get the beforeinstallprompt event anymore
        window.addEventListener('appinstalled', () => {
            setDeferredPrompt(null);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            // Show the install prompt
            deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }
            // We've used the prompt, and can't use it again, throw it away
            setDeferredPrompt(null);
        } else if (isIos && !isStandalone) {
            // Show custom iOS instructions
            setShowIosPrompt(true);
        }
    };

    if (isStandalone) {
        return null; // App is already installed and running in standalone mode
    }

    if (!deferredPrompt && (!isIos || isStandalone)) {
        return null; // Can't install
    }

    return (
        <>
            <button
                onClick={handleInstallClick}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-full transition-colors border border-orange-200"
            >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Install App</span>
            </button>

            {/* Custom iOS Prompt Modal */}
            {showIosPrompt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 max-w-sm w-full relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setShowIosPrompt(false)}
                            className="absolute top-4 right-4 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-300"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Download className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Install on iOS</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                                To install this app on your iPhone or iPad:
                            </p>
                            <ol className="text-left text-sm text-slate-600 dark:text-slate-300 space-y-4 mb-6">
                                <li className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center font-medium text-xs">1</span>
                                    <span>Tap the <strong className="text-slate-800 dark:text-slate-100">Share</strong> button at the bottom of Safari.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center font-medium text-xs">2</span>
                                    <span>Scroll down and tap <strong className="text-slate-800 dark:text-slate-100">Add to Home Screen</strong>.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center font-medium text-xs">3</span>
                                    <span>Tap <strong className="text-slate-800 dark:text-slate-100">Add</strong> in the top right corner.</span>
                                </li>
                            </ol>
                            <button
                                onClick={() => setShowIosPrompt(false)}
                                className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-medium rounded-lg transition-colors"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default PwaInstallPrompt;
