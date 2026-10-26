import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, Eye, Edit, Trash, LayoutGrid, List, MessageSquare, X, ChevronLeft, ChevronRight, Layout, UserCheck, Maximize2, RefreshCw, Phone, Upload, User } from 'lucide-react';
import { useDevotees } from '../../context/DevoteeContext';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useToast } from '../../components/Toast';
import { searchDevoteesByName, HighlightText } from '../../lib/searchUtils';
import clsx from 'clsx';

import ConfirmationModal from '../../components/ConfirmationModal';
import WhatsAppModal from '../../components/WhatsAppModal';
import ImageModal from '../../components/ImageModal';
import { useAuth } from '../../context/AuthContext';

const PAGE_SIZE = 25;

const DevoteeList = () => {
    const { isAdmin, isCounselor, currentUser } = useAuth();
    const { 
        devotees, paginatedDevotees: contextPaginatedDevotees, totalCount, filterOptions, fetchPaginatedDevotees, 
        deleteDevotee, updateDevotee, isLiveConnected, fetchDevotees
    } = useDevotees();
    const navigate = useNavigate();
    const toast = useToast();
    const [searchParams] = useSearchParams();

    const isViewer = !isAdmin && !isCounselor;
    const myDevoteeId = currentUser?.devoteeId || (Array.isArray(devotees) ? devotees.find(d => d.contact === currentUser?.username)?.id : null);

    React.useEffect(() => {
        if (isViewer) {
            navigate(myDevoteeId ? `/devotees/${myDevoteeId}` : '/profile', { replace: true });
        }
    }, [isViewer, myDevoteeId, navigate]);

    const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '');
    const [viewMode, setViewMode] = useState('list');
    const [deleteId, setDeleteId] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [activeDevotee, setActiveDevotee] = useState(null);
    const [showWhatsApp, setShowWhatsApp] = useState(false);
    const [selectedImageDevotee, setSelectedImageDevotee] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [selectedIds, setSelectedIds] = useState(new Set());

    // ✅ Working filter state
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        status: '',
        gender: '',
        counselor: '',
        spiritualStatus: '',
        district: '',
        contact: '',
    });
    const hasActiveFilters = Object.values(filters).some(Boolean);

    // Scroll virtualization state
    const containerRef = React.useRef(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(400);

    const handleScroll = (e) => {
        setScrollTop(e.target.scrollTop);
    };

    // Keep searchTerm in sync with URL ?search= query parameter
    React.useEffect(() => {
        const urlSearch = searchParams.get('search') || '';
        if (urlSearch !== searchTerm) {
            setSearchTerm(urlSearch);
            setCurrentPage(1);
        }
    }, [searchParams]);

    // Server-side paginated fetch effect:
    // Fetches immediately on mount and when page, size, search, or filters change
    React.useEffect(() => {
        setIsSearching(true);
        const delayDebounceFn = setTimeout(() => {
            fetchPaginatedDevotees(currentPage, pageSize, searchTerm, filters)
                .finally(() => setIsSearching(false));
        }, 150);
        return () => clearTimeout(delayDebounceFn);
    }, [currentPage, pageSize, searchTerm, filters]);

    // Live refresh listener (auto-syncs view when devotees are added, updated, or deleted)
    React.useEffect(() => {
        const handleLiveRefresh = () => {
            fetchPaginatedDevotees(currentPage, pageSize, searchTerm, filters);
        };
        window.addEventListener('devotees:refresh', handleLiveRefresh);
        return () => window.removeEventListener('devotees:refresh', handleLiveRefresh);
    }, [currentPage, pageSize, searchTerm, filters]);

    // Continuous auto-sync interval: quietly refreshes current page when tab is active (every 60s)
    React.useEffect(() => {
        const autoSyncInterval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                fetchPaginatedDevotees(currentPage, pageSize, searchTerm, filters);
            }
        }, 60000);
        return () => clearInterval(autoSyncInterval);
    }, [currentPage, pageSize, searchTerm, filters]);

    // Measure virtualization container height
    React.useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        setContainerHeight(container.getBoundingClientRect().height);
        
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                setContainerHeight(entry.contentRect.height);
            }
        });
        resizeObserver.observe(container);
        return () => resizeObserver.disconnect();
    }, [viewMode, contextPaginatedDevotees]);

    const counselors = filterOptions?.counselors || [];
    const districts = filterOptions?.districts || [];

    // Safely memoize active paginated devotees
    const safeDevotees = useMemo(() => {
        if (Array.isArray(contextPaginatedDevotees) && (contextPaginatedDevotees.length > 0 || hasActiveFilters || searchTerm || totalCount === 0)) {
            return contextPaginatedDevotees;
        }
        if (Array.isArray(devotees) && devotees.length > 0) {
            let filtered = devotees;
            if (searchTerm) {
                filtered = searchDevoteesByName(filtered, searchTerm);
            }
            if (filters.status) filtered = filtered.filter(d => d.status === filters.status);
            if (filters.gender) filtered = filtered.filter(d => d.gender === filters.gender);
            if (filters.spiritualStatus) filtered = filtered.filter(d => d.spiritualStatus === filters.spiritualStatus);
            if (filters.counselor) filtered = filtered.filter(d => d.counselor === filters.counselor);
            if (filters.district) filtered = filtered.filter(d => d.district === filters.district);
            if (filters.contact) {
                const cTerm = filters.contact.trim().toLowerCase();
                filtered = filtered.filter(d => 
                    (d.contact && String(d.contact).toLowerCase().includes(cTerm)) ||
                    (d.whatsapp && String(d.whatsapp).toLowerCase().includes(cTerm))
                );
            }
            const start = (currentPage - 1) * pageSize;
            return filtered.slice(start, start + pageSize);
        }
        return [];
    }, [contextPaginatedDevotees, devotees, currentPage, pageSize, searchTerm, filters, hasActiveFilters, totalCount]);

    // Virtualized table rows calculation
    const rowHeight = 72; // Avg row height in pixels
    const visibleItems = useMemo(() => {
        if (safeDevotees.length <= 25) {
            return safeDevotees.map((item, index) => ({ item, index }));
        }
        const start = Math.max(0, Math.floor(scrollTop / rowHeight) - 5);
        const end = Math.min(safeDevotees.length - 1, Math.floor((scrollTop + containerHeight) / rowHeight) + 5);
        return safeDevotees.slice(start, end + 1).map((item, i) => ({
            item,
            index: start + i
        }));
    }, [safeDevotees, scrollTop, containerHeight]);

    const topPadding = useMemo(() => {
        if (safeDevotees.length <= 25) return 0;
        const start = Math.max(0, Math.floor(scrollTop / rowHeight) - 5);
        return start * rowHeight;
    }, [safeDevotees, scrollTop]);

    const bottomPadding = useMemo(() => {
        if (safeDevotees.length <= 25) return 0;
        const end = Math.min(safeDevotees.length - 1, Math.floor((scrollTop + containerHeight) / rowHeight) + 5);
        return (safeDevotees.length - 1 - end) * rowHeight;
    }, [safeDevotees, scrollTop, containerHeight]);

    const totalPages = Math.ceil(totalCount / pageSize);
    const paginatedDevotees = safeDevotees;

    const clearFilters = () => {
        setFilters({ status: '', gender: '', counselor: '', spiritualStatus: '', district: '', contact: '' });
        setCurrentPage(1);
    };

    // Approve a Pending public registration: promote it to Active.
    const approveDevotee = async (devotee) => {
        try {
            await updateDevotee(devotee.id, { status: 'Active' });
            toast.success(`${devotee.name} approved and activated.`);
            fetchPaginatedDevotees(currentPage, pageSize, searchTerm, filters);
        } catch (err) {
            toast.error('Approve failed: ' + err.message);
        }
    };

    const toggleSelect = (id) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === paginatedDevotees.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(paginatedDevotees.map(d => d.id)));
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr || dateStr === '-') return '-';
        try {
            const parts = dateStr.split('-');
            if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
            return dateStr;
        } catch { return dateStr; }
    };

    const selectClass = "px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none";

    if (isViewer) {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-foreground">Devotees</h1>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/40 text-emerald-300 border border-emerald-800/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            {isLiveConnected ? 'Live Sync' : 'Auto Sync Active'}
                        </span>
                    </div>
                    <p className="text-muted-foreground">
                        Total {totalCount} devotees
                        {hasActiveFilters && <span className="text-orange-400 font-medium"> (filtered)</span>}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            fetchPaginatedDevotees(currentPage, pageSize, searchTerm, filters);
                            fetchDevotees();
                            toast.info('Devotee list refreshed');
                        }}
                        title="Refresh list"
                        className="p-2 border border-border rounded-xl bg-card hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                    {isAdmin && (
                        <>
                            <Link 
                                to="/devotees/bulk-upload"
                                className="flex items-center gap-2 bg-card border border-border text-foreground px-4 py-2 rounded-xl hover:bg-muted/70 transition-colors shadow-sm font-medium"
                                title="Bulk Upload Devotees from Excel or CSV"
                            >
                                <Upload className="w-5 h-5 text-orange-400" />
                                <span>Bulk Upload</span>
                            </Link>
                            <Link to="/devotees/new" className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-xl hover:bg-orange-700 transition-colors shadow-lg shadow-orange-900/20">
                                <Plus className="w-5 h-5" />
                                <span>Add Devotee</span>
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {/* Search, Filter Toggle & View Toggle */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="flex items-center gap-4 flex-1 w-full">
                    <div className="relative flex-1 max-w-md group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-orange-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search devotees by name (e.g. Deb), phone, or DOB..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className={`w-full pl-10 pr-24 py-2.5 bg-card border border-border text-foreground placeholder:text-muted-foreground rounded-xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all shadow-sm ${isSearching ? 'border-orange-400' : ''}`}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                                    className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted/70 rounded-lg transition-all"
                                    title="Clear search"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                            {isSearching ? (
                                <div className="animate-spin h-4 w-4 border-2 border-orange-500 border-t-transparent rounded-full"></div>
                            ) : (
                                <button 
                                    onClick={() => {
                                        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                                        if (!SpeechRecognition) return toast.error('Voice search not supported in this browser');
                                        const recognition = new SpeechRecognition();
                                        recognition.lang = 'en-US';
                                        recognition.onstart = () => toast.info('Listening...', { duration: 2000 });
                                        recognition.onresult = (event) => {
                                            const transcript = event.results[0][0].transcript;
                                            setSearchTerm(transcript);
                                            toast.success(`Searching for: ${transcript}`);
                                        };
                                        recognition.start();
                                    }}
                                    className="p-1.5 text-muted-foreground hover:text-orange-400 hover:bg-orange-950/40 rounded-lg transition-all"
                                    title="Voice Search"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                                </button>
                            )}
                        </div>
                    </div>
                    {/* ✅ Working Filter Toggle Button */}
                    <button
                        onClick={() => setShowFilters(v => !v)}
                        className={clsx(
                            "flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors",
                            showFilters || hasActiveFilters
                                ? "bg-orange-950/40 border-orange-800/80 text-orange-300"
                                : "bg-card border-border text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                        )}
                    >
                        <Filter className="w-4 h-4" />
                        <span>Filters</span>
                        {hasActiveFilters && (
                            <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                {Object.values(filters).filter(Boolean).length}
                            </span>
                        )}
                    </button>
                </div>

                {/* View Toggle */}
                <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-300'}`}
                    >
                        <List className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-300'}`}
                    >
                        <LayoutGrid className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* ✅ Filter Panel */}
            {showFilters && (
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                            <Filter className="w-4 h-4 text-orange-400" />
                            Filter Devotees
                        </h3>
                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1">
                                <X className="w-3 h-3" /> Clear All
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        <div className="relative">
                            <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Mobile number..."
                                value={filters.contact}
                                onChange={e => { setFilters(f => ({ ...f, contact: e.target.value })); setCurrentPage(1); }}
                                className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none placeholder:text-muted-foreground"
                            />
                        </div>
                        <select value={filters.status} onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setCurrentPage(1); }} className={selectClass}>
                            <option value="">All Status</option>
                            <option value="Pending">Pending</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                        <select value={filters.gender} onChange={e => { setFilters(f => ({ ...f, gender: e.target.value })); setCurrentPage(1); }} className={selectClass}>
                            <option value="">All Genders</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                        <select value={filters.spiritualStatus} onChange={e => { setFilters(f => ({ ...f, spiritualStatus: e.target.value })); setCurrentPage(1); }} className={selectClass}>
                            <option value="">All Spiritual Status</option>
                            <option value="Initiated">Initiated</option>
                            <option value="Sheltered">Sheltered</option>
                            <option value="Aspiring">Aspiring</option>
                        </select>
                        <select value={filters.counselor} onChange={e => { setFilters(f => ({ ...f, counselor: e.target.value })); setCurrentPage(1); }} className={selectClass}>
                            <option value="">All Counselors</option>
                            {counselors.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select value={filters.district} onChange={e => { setFilters(f => ({ ...f, district: e.target.value })); setCurrentPage(1); }} className={selectClass}>
                            <option value="">All Districts</option>
                            {districts.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                </div>
            )}

            {viewMode === 'list' ? (
                /* List View */
                <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                    <div ref={containerRef} className="overflow-x-auto max-h-[650px] overflow-y-auto" onScroll={handleScroll}>
                        <table className="w-full text-left relative border-collapse">
                            <thead className="bg-[#1b2e2f] text-muted-foreground text-xs uppercase font-semibold sticky top-0 z-20 border-b border-[#254042]">
                                <tr>
                                    {isAdmin && (
                                        <th className="px-6 py-4 w-10 bg-[#1b2e2f]">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedIds.size > 0 && selectedIds.size === paginatedDevotees.length}
                                                onChange={toggleSelectAll}
                                                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-orange-600 focus:ring-orange-500"
                                            />
                                        </th>
                                    )}
                                    <th className="px-6 py-4 sticky left-0 bg-[#1b2e2f] z-10">Devotee</th>
                                    <th className="px-6 py-4 bg-[#1b2e2f]">Status</th>
                                    <th className="px-6 py-4 bg-[#1b2e2f]">Gender</th>
                                    <th className="px-6 py-4 bg-[#1b2e2f]">Contact</th>
                                    <th className="px-6 py-4 bg-[#1b2e2f]">DOB</th>
                                    <th className="px-6 py-4 bg-[#1b2e2f]">Counselor</th>
                                    <th className="px-6 py-4 bg-[#1b2e2f] text-right sticky right-0 z-10">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#254042]">
                                {topPadding > 0 && <tr style={{ height: `${topPadding}px` }}><td colSpan={isAdmin ? 8 : 7} /></tr>}
                                {visibleItems.map(({ item: devotee }) => (
                                    <tr key={devotee.id} className={clsx("hover:bg-[#263f41] transition-colors border-b border-[#254042]", selectedIds.has(devotee.id) && "bg-amber-500/15")}>
                                        {isAdmin && (
                                            <td className="px-6 py-4">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedIds.has(devotee.id)}
                                                    onChange={() => toggleSelect(devotee.id)}
                                                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-orange-600 focus:ring-orange-500"
                                                />
                                            </td>
                                        )}
                                        <td className="px-6 py-4 sticky left-0 bg-card group-hover:bg-[#263f41] z-10 border-b border-[#254042]">
                                            <div className="flex items-center gap-4 min-w-[200px]">
                                                <div 
                                                    onClick={(e) => {
                                                        if (devotee.photo) {
                                                            e.stopPropagation();
                                                            setSelectedImageDevotee(devotee);
                                                        }
                                                    }}
                                                    className={`relative group shrink-0 ${devotee.photo ? 'cursor-pointer' : ''}`}
                                                    title={devotee.photo ? "Click to view original image" : ""}
                                                >
                                                    {devotee.photo ? (
                                                        <img
                                                            src={devotee.photo}
                                                            alt={devotee.name}
                                                            className="w-12 h-12 rounded-full object-cover border-2 border-[#37595b] shadow-sm transition-transform duration-200 group-hover:scale-105"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-full bg-[#172728] border-2 border-[#37595b] flex items-center justify-center text-[#8fa8a4] shadow-sm">
                                                            <User className="w-6 h-6" />
                                                        </div>
                                                    )}
                                                    {devotee.photo && (
                                                        <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[#c7ded9]">
                                                            <Maximize2 className="w-4 h-4 drop-shadow" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-foreground truncate max-w-[180px]" title={devotee.name}>
                                                        <HighlightText text={devotee.name} query={searchTerm} />
                                                    </div>
                                                    {(devotee.initiatedName || devotee.spiritualName) && (
                                                        <div className="text-[10px] text-orange-400 font-medium truncate max-w-[180px]" title={devotee.initiatedName || devotee.spiritualName}>
                                                            <HighlightText text={devotee.initiatedName || devotee.spiritualName} query={searchTerm} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                                                devotee.status === 'Active'
                                                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                                                    : devotee.status === 'Pending'
                                                        ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                                                        : 'bg-muted text-muted-foreground border border-border'
                                            }`}>
                                                {devotee.status}
                                                {devotee.source === 'Public Form' && devotee.status === 'Pending' && <span className="ml-1 normal-case font-semibold opacity-70">• Public</span>}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{devotee.gender || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{devotee.contact}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{formatDate(devotee.dob)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{devotee.counselor || '-'}</td>
                                        <td className="px-6 py-4 text-right sticky right-0 bg-card group-hover:bg-[#263f41] z-10 border-b border-[#254042]">
                                            <div className="flex items-center justify-end gap-2">
                                                {isAdmin && devotee.status === 'Pending' && (
                                                    <button
                                                        onClick={() => approveDevotee(devotee)}
                                                        className="p-2 text-amber-400 hover:text-amber-300 hover:bg-amber-950/40 rounded-lg transition-colors"
                                                        title="Approve Registration"
                                                    >
                                                        <UserCheck className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <Link to={`/devotees/${devotee.id}`} className="p-2 text-muted-foreground hover:text-orange-400 hover:bg-orange-950/40 rounded-lg transition-colors" title="View Profile">
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                                {isAdmin && (
                                                    <>
                                                        <button
                                                            onClick={() => { setActiveDevotee(devotee); setShowWhatsApp(true); }}
                                                            className="p-2 text-muted-foreground hover:text-emerald-400 hover:bg-emerald-950/40 rounded-lg transition-colors"
                                                            title="Send WhatsApp"
                                                        >
                                                            <MessageSquare className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => navigate(`/devotees/${devotee.id}/edit`)} className="p-2 text-muted-foreground hover:text-blue-400 hover:bg-blue-950/40 rounded-lg transition-colors" title="Edit Devotee">
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => setDeleteId(devotee.id)} className="p-2 text-muted-foreground hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors" title="Delete Devotee">
                                                            <Trash className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {bottomPadding > 0 && <tr style={{ height: `${bottomPadding}px` }}><td colSpan={isAdmin ? 8 : 7} /></tr>}
                                {safeDevotees.length === 0 && (
                                    <tr>
                                        <td colSpan={isAdmin ? 8 : 7} className="px-6 py-16 text-center text-slate-400 dark:text-slate-500 text-sm">
                                            {hasActiveFilters ? 'No devotees match the current filters.' : 'No devotees found.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* Grid View */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {paginatedDevotees.map((devotee) => (
                        <div key={devotee.id} className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center">
                            <div 
                                onClick={() => {
                                    if (devotee.photo) setSelectedImageDevotee(devotee);
                                }}
                                className={`relative mb-4 group ${devotee.photo ? 'cursor-pointer' : ''}`}
                                title={devotee.photo ? "Click to view original image" : ""}
                            >
                                {devotee.photo ? (
                                    <img src={devotee.photo} alt={devotee.name} className="w-24 h-24 rounded-full object-cover border-4 border-[#37595b] shadow-inner transition-transform duration-200 group-hover:scale-105" />
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-[#172728] border-4 border-[#37595b] flex items-center justify-center text-[#8fa8a4] shadow-inner">
                                        <User className="w-10 h-10" />
                                    </div>
                                )}
                                <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-card ${devotee.status === 'Active' ? 'bg-emerald-500' : devotee.status === 'Pending' ? 'bg-amber-400' : 'bg-slate-400'}`}></span>
                                {devotee.photo && (
                                    <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-[#c7ded9]">
                                        <Maximize2 className="w-5 h-5 drop-shadow" />
                                    </div>
                                )}
                            </div>
                            <h3 className="font-bold text-foreground text-lg mb-1">
                                <HighlightText text={devotee.name} query={searchTerm} />
                            </h3>
                            {(devotee.initiatedName || devotee.spiritualName) && (
                                <p className="text-sm text-orange-400 font-medium mb-3">
                                    <HighlightText text={devotee.initiatedName || devotee.spiritualName} query={searchTerm} />
                                </p>
                            )}
                            <div className="text-sm text-muted-foreground mb-6">
                                <p>{devotee.contact}</p>
                                <p className="text-xs mt-1">{devotee.gender} • {devotee.counselor}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-auto w-full pt-4 border-t border-border">
                                {isAdmin && devotee.status === 'Pending' && (
                                    <button onClick={() => approveDevotee(devotee)} className="flex-1 p-2 text-amber-400 hover:text-amber-300 hover:bg-amber-950/40 rounded-lg transition-colors flex justify-center" title="Approve Registration">
                                        <UserCheck className="w-4 h-4" />
                                    </button>
                                )}
                                <Link to={`/devotees/${devotee.id}`} className="flex-1 p-2 text-muted-foreground hover:text-orange-400 hover:bg-orange-950/40 rounded-lg transition-colors flex justify-center" title="View Profile">
                                    <Eye className="w-4 h-4" />
                                </Link>
                                {isAdmin && (
                                    <>
                                        <button onClick={() => { setActiveDevotee(devotee); setShowWhatsApp(true); }} className="flex-1 p-2 text-muted-foreground hover:text-emerald-400 hover:bg-emerald-950/40 rounded-lg transition-colors flex justify-center" title="Send WhatsApp">
                                            <MessageSquare className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => navigate(`/devotees/${devotee.id}/edit`)} className="flex-1 p-2 text-muted-foreground hover:text-blue-400 hover:bg-blue-950/40 rounded-lg transition-colors flex justify-center" title="Edit Devotee">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => setDeleteId(devotee.id)} className="flex-1 p-2 text-muted-foreground hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors flex justify-center" title="Delete Devotee">
                                            <Trash className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                    {paginatedDevotees.length === 0 && (
                        <div className="col-span-4 py-16 text-center text-muted-foreground text-sm">
                            {hasActiveFilters ? 'No devotees match the current filters.' : 'No devotees found.'}
                        </div>
                    )}
                </div>
            )}

            {/* ✅ Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card border border-border rounded-xl px-6 py-3 shadow-sm">
                    <div className="flex items-center gap-6">
                        <p className="text-sm text-muted-foreground">
                            Showing <span className="font-semibold text-foreground">{(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalCount)}</span> of <span className="font-semibold text-foreground">{totalCount}</span> devotees
                        </p>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Show:</span>
                            <select
                                value={pageSize}
                                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                                className="px-2 py-1 bg-[#1b2e2f] border border-[#2d4d4f] text-foreground rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-500"
                            >
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                                <option value={250}>250</option>
                                <option value={500}>500</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let page;
                            if (totalPages <= 5) page = i + 1;
                            else if (currentPage <= 3) page = i + 1;
                            else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                            else page = currentPage - 2 + i;
                            return (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={clsx(
                                        "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                                        currentPage === page
                                            ? "bg-orange-600 text-white"
                                            : "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900/50"
                                    )}
                                >
                                    {page}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={() => {
                    if (deleteId) {
                        deleteDevotee(deleteId);
                        setDeleteId(null);
                        toast.success('Devotee deleted successfully.');
                    }
                }}
                title="Delete Devotee"
                message="Are you sure you want to delete this devotee? This action cannot be undone."
            />

            <WhatsAppModal
                isOpen={showWhatsApp}
                onClose={() => setShowWhatsApp(false)}
                devotee={activeDevotee}
            />

            {/* Original Profile Picture Modal */}
            <ImageModal
                isOpen={!!selectedImageDevotee}
                onClose={() => setSelectedImageDevotee(null)}
                imageUrl={selectedImageDevotee?.photo}
                title={selectedImageDevotee?.name}
                subtitle={selectedImageDevotee?.initiatedName || selectedImageDevotee?.spiritualName || selectedImageDevotee?.status}
            />

            {/* Batch Action Bar */}
            {isAdmin && selectedIds.size > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-8 duration-500">
                    <div className="bg-slate-900 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-8 border border-slate-800">
                        <div className="flex items-center gap-3 pr-8 border-r border-slate-800">
                            <span className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-xs font-black">{selectedIds.size}</span>
                            <span className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Devotees Selected</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => navigate('/devotees/batch-id', { 
                                    state: { selectedDevotees: safeDevotees.filter(d => selectedIds.has(d.id)) } 
                                })}
                                className="flex items-center gap-2 px-4 py-2 hover:bg-slate-800 rounded-xl transition-all text-xs font-black uppercase tracking-widest text-orange-400"
                            >
                                <Layout className="w-4 h-4" />
                                Generate ID Cards
                            </button>
                            <button 
                                onClick={() => setSelectedIds(new Set())}
                                className="px-4 py-2 hover:bg-slate-800 rounded-xl transition-all text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DevoteeList;
