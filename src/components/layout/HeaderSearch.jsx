import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, User, Phone, ArrowRight, ShieldCheck, Sparkles, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDevotees } from '../../context/DevoteeContext';
import { searchDevoteesByName, HighlightText } from '../../lib/searchUtils';

const HeaderSearch = () => {
    const { devotees } = useDevotees();
    const navigate = useNavigate();

    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [isMobileExpanded, setIsMobileExpanded] = useState(false);

    const containerRef = useRef(null);
    const inputRef = useRef(null);

    // Compute matching devotees using case-insensitive prefix-ranked search
    const results = useMemo(() => {
        if (!query.trim()) return [];
        return searchDevoteesByName(devotees, query, { limit: 8, returnAllWhenEmpty: false });
    }, [devotees, query]);

    // Handle outside clicks to close the dropdown
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
                setIsMobileExpanded(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle keyboard navigation
    const handleKeyDown = (e) => {
        if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            if (query.trim()) setIsOpen(true);
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex >= 0 && results[activeIndex]) {
                handleSelectDevotee(results[activeIndex]);
            } else if (query.trim()) {
                handleViewAll();
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
            setActiveIndex(-1);
            inputRef.current?.blur();
        }
    };

    const handleSelectDevotee = (devotee) => {
        setIsOpen(false);
        setQuery('');
        setIsMobileExpanded(false);
        navigate(`/devotees/${devotee.id}`);
    };

    const handleViewAll = () => {
        const q = query.trim();
        setIsOpen(false);
        setIsMobileExpanded(false);
        if (q) {
            navigate(`/devotees?search=${encodeURIComponent(q)}`);
        } else {
            navigate('/devotees');
        }
    };

    const handleClear = () => {
        setQuery('');
        setIsOpen(false);
        setActiveIndex(-1);
        inputRef.current?.focus();
    };

    return (
        <div ref={containerRef} className="relative flex items-center">
            {/* Mobile Search Toggle Icon */}
            <button
                type="button"
                onClick={() => {
                    setIsMobileExpanded(true);
                    setTimeout(() => inputRef.current?.focus(), 100);
                }}
                className="p-2 sm:hidden text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                title="Search devotees"
            >
                <Search className="w-5 h-5" />
            </button>

            {/* Search Input Box */}
            <div className={`
                ${isMobileExpanded 
                    ? 'fixed inset-x-2 top-2 z-50 flex items-center bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-2' 
                    : 'hidden sm:flex relative items-center'
                }
            `}>
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                        setActiveIndex(-1);
                    }}
                    onFocus={() => {
                        if (query.trim()) setIsOpen(true);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Search devotees by name (e.g. Deb)..."
                    className="w-full sm:w-72 md:w-80 pl-9 pr-14 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent dark:border-slate-700/60 rounded-full text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white dark:focus:bg-slate-850 transition-all shadow-sm"
                />

                {/* Right controls inside input */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    {query ? (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            title="Clear search"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    ) : (
                        <span className="hidden md:inline-block text-[10px] font-medium text-slate-400 dark:text-slate-500 bg-slate-200/70 dark:bg-slate-700/70 px-1.5 py-0.5 rounded border border-slate-300/60 dark:border-slate-600/60 pointer-events-none">
                            Ctrl K
                        </span>
                    )}

                    {isMobileExpanded && (
                        <button
                            type="button"
                            onClick={() => {
                                setIsMobileExpanded(false);
                                setIsOpen(false);
                            }}
                            className="sm:hidden p-1 text-slate-500 hover:text-slate-700"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Live Search Floating Dropdown */}
            {isOpen && query.trim() && (
                <div className={`
                    absolute z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150
                    ${isMobileExpanded 
                        ? 'fixed top-16 inset-x-2 max-h-[70vh]' 
                        : 'top-full mt-2 left-0 sm:right-auto w-[92vw] sm:w-[420px] max-h-[480px]'
                    }
                    flex flex-col
                `}>
                    {/* Results Header */}
                    <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-semibold flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                            {results.length > 0 ? (
                                <>Found <strong className="text-slate-800 dark:text-slate-200">{results.length}</strong> matches (case-insensitive)</>
                            ) : (
                                <>No matching devotees</>
                            )}
                        </span>
                        <span className="text-[11px] opacity-75 hidden sm:inline">Use ↑↓ keys to navigate</span>
                    </div>

                    {/* Results List */}
                    <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 flex-1">
                        {results.length > 0 ? (
                            results.map((devotee, index) => {
                                const isSelected = index === activeIndex;
                                return (
                                    <div
                                        key={devotee.id}
                                        onClick={() => handleSelectDevotee(devotee)}
                                        onMouseEnter={() => setActiveIndex(index)}
                                        className={`px-4 py-3 cursor-pointer flex items-center gap-3 transition-colors ${
                                            isSelected 
                                                ? 'bg-orange-50 dark:bg-orange-950/30' 
                                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                                        }`}
                                    >
                                        {/* Avatar */}
                                        <div className="relative shrink-0">
                                            {devotee.photo ? (
                                                <img
                                                    src={devotee.photo}
                                                    alt={devotee.name}
                                                    className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-300 font-bold flex items-center justify-center text-sm border border-orange-200 dark:border-orange-800">
                                                    {(devotee.name || 'D').charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>

                                        {/* Devotee Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <div className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
                                                    <HighlightText text={devotee.name} query={query} />
                                                </div>
                                                {devotee.spiritualStatus && (
                                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                                                        devotee.spiritualStatus === 'Initiated' 
                                                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' 
                                                            : devotee.spiritualStatus === 'Sheltered'
                                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                                    }`}>
                                                        {devotee.spiritualStatus}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Initiated / Spiritual Name */}
                                            {(devotee.initiatedName || devotee.spiritualName) && (
                                                <div className="text-xs text-orange-600 dark:text-orange-400 font-medium truncate">
                                                    <HighlightText 
                                                        text={devotee.initiatedName || devotee.spiritualName} 
                                                        query={query} 
                                                    />
                                                </div>
                                            )}

                                            {/* Details subtitle: Contact & Counselor */}
                                            <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                                {devotee.contact && (
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="w-3 h-3 text-slate-400" />
                                                        <HighlightText text={devotee.contact} query={query} />
                                                    </span>
                                                )}
                                                {devotee.counselor && (
                                                    <span className="truncate">
                                                        • Counselor: {devotee.counselor}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Icon */}
                                        <div className="shrink-0 text-slate-400 dark:text-slate-500">
                                            <ArrowRight className={`w-4 h-4 transition-transform ${isSelected ? 'translate-x-1 text-orange-600 dark:text-orange-400' : ''}`} />
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                <User className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2 stroke-1" />
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    No devotees match "{query}"
                                </p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                    Search is case-insensitive. Try typing the first few letters of a name (e.g. "deb" or "DEB").
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Results Footer */}
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={handleViewAll}
                            className="w-full text-center py-1.5 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                        >
                            <span>View All Results in Directory</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HeaderSearch;
