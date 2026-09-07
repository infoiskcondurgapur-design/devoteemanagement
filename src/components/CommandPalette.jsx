import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Command, LayoutDashboard, Users, Heart, Calendar, ArrowRight, User } from 'lucide-react';
import { useDevotees } from '../context/DevoteeContext';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

const CommandPalette = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef(null);
    const navigate = useNavigate();
    const { devotees } = useDevotees();
    const { isAdmin } = useAuth();

    // Toggle with Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
            setQuery('');
            setActiveIndex(0);
        }
    }, [isOpen]);

    // Define Actions/Pages
    const pages = [
        { id: 'home', title: 'Go to Dashboard', icon: LayoutDashboard, path: '/', type: 'Page' },
        { id: 'seva', title: 'Go to Events', icon: Calendar, path: '/seva', type: 'Page' },
        { id: 'profile', title: 'My Profile', icon: User, path: '/profile', type: 'Page' },
    ];

    // Filter Items
    const filteredItems = [
        // Pages
        ...pages.filter(p => p.title.toLowerCase().includes(query.toLowerCase())),

        // Devotees (Admin Only)
        ...(isAdmin ? devotees.filter(d =>
            d.name.toLowerCase().includes(query.toLowerCase()) ||
            (d.initiatedName && d.initiatedName.toLowerCase().includes(query.toLowerCase()))
        ).map(d => ({
            id: d.id,
            title: d.name,
            subtitle: d.initiatedName,
            icon: Users,
            path: `/devotees/${d.id}`,
            type: 'Devotee'
        })).slice(0, 5) : []) // Limit to 5 devotees
    ];

    // Validation for active index
    useEffect(() => {
        if (activeIndex >= filteredItems.length) {
            setActiveIndex(Math.max(0, filteredItems.length - 1));
        }
    }, [filteredItems.length]);

    // Handle Navigation
    const handleSelect = (item) => {
        navigate(item.path);
        setIsOpen(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev + 1) % filteredItems.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredItems[activeIndex]) {
                handleSelect(filteredItems[activeIndex]);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)} />

            {/* Modal */}
            <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-slate-900/5 animate-in fade-in zoom-in-95 duration-100 ease-out">
                {/* Search Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <Search className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Type a command or search..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 text-lg bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400 dark:text-slate-500"
                    />
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => {
                                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                                if (!SpeechRecognition) return;
                                const recognition = new SpeechRecognition();
                                recognition.lang = 'en-US';
                                recognition.onstart = () => { inputRef.current.placeholder = 'Listening...'; };
                                recognition.onresult = (event) => {
                                    const transcript = event.results[0][0].transcript;
                                    setQuery(transcript);
                                    inputRef.current.placeholder = 'Type a command or search...';
                                };
                                recognition.start();
                            }}
                            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                            title="Voice Command"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                        </button>
                        <div className="hidden sm:flex items-center gap-1 border-l border-slate-100 dark:border-slate-800 pl-2">
                            <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs text-slate-500 dark:text-slate-400 font-sans font-medium">Esc</kbd>
                        </div>
                    </div>
                </div>

                {/* Results */}
                <div className="max-h-[60vh] overflow-y-auto p-2" role="listbox">
                    {filteredItems.length === 0 ? (
                        <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                            <p className="text-sm">No results found.</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {/* Group Label if needed, for simplicity just list */}
                            {filteredItems.map((item, index) => {
                                const Icon = item.icon;
                                const isActive = index === activeIndex;
                                return (
                                    <button
                                        key={item.id + item.type}
                                        onClick={() => handleSelect(item)}
                                        onMouseEnter={() => setActiveIndex(index)}
                                        className={clsx(
                                            'w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors',
                                            isActive ? 'bg-orange-50 text-orange-900' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:bg-slate-900/50'
                                        )}
                                    >
                                        <div className={clsx("p-2 rounded-lg", isActive ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400')}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={clsx("font-medium truncate", isActive && "text-orange-900")}>{item.title}</p>
                                            {item.subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{item.subtitle}</p>}
                                        </div>
                                        {isActive && <ArrowRight className="w-4 h-4 text-orange-400" />}
                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium ml-2 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                                            {item.type}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                    <div className="flex gap-3">
                        <span><strong className="font-medium text-slate-600 dark:text-slate-300">↑↓</strong> to navigate</span>
                        <span><strong className="font-medium text-slate-600 dark:text-slate-300">↵</strong> to select</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;
