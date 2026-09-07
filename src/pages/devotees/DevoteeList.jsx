import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, Eye, Edit, Trash, LayoutGrid, List, MessageSquare, X, ChevronLeft, ChevronRight, Layout } from 'lucide-react';
import { useDevotees } from '../../context/DevoteeContext';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../components/Toast';
import clsx from 'clsx';

import ConfirmationModal from '../../components/ConfirmationModal';
import WhatsAppModal from '../../components/WhatsAppModal';

const PAGE_SIZE = 25;

const DevoteeList = () => {
    const { 
        devotees, totalCount, filterOptions, fetchPaginatedDevotees, 
        deleteDevotee 
    } = useDevotees();
    const navigate = useNavigate();
    const toast = useToast();

    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('list');
    const [deleteId, setDeleteId] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [activeDevotee, setActiveDevotee] = useState(null);
    const [showWhatsApp, setShowWhatsApp] = useState(false);
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
    });
    const hasActiveFilters = Object.values(filters).some(Boolean);

    // Scroll virtualization state
    const containerRef = React.useRef(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(400);

    const handleScroll = (e) => {
        setScrollTop(e.target.scrollTop);
    };

    // Server-side paginated fetch effect.
    // Skip the initial run: DevoteeContext already hydrates `devotees` + `totalCount`
    // on mount, so refetching here on first render duplicates that request.
    const isFirstRender = React.useRef(true);
    React.useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const delayDebounceFn = setTimeout(() => {
            setIsSearching(true);
            fetchPaginatedDevotees(currentPage, pageSize, searchTerm, filters)
                .finally(() => setIsSearching(false));
        }, 300);
        return () => clearTimeout(delayDebounceFn);
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
    }, [viewMode, devotees]);

    const counselors = filterOptions?.counselors || [];
    const districts = filterOptions?.districts || [];
    const safeDevotees = Array.isArray(devotees) ? devotees : [];

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
    const paginatedDevotees = safeDevotees; // Server-side paginated already

    const clearFilters = () => {
        setFilters({ status: '', gender: '', counselor: '', spiritualStatus: '', district: '' });
        setCurrentPage(1);
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

    const selectClass = "px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none";

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Devotees</h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Total {totalCount} devotees
                        {hasActiveFilters && <span className="text-orange-600 font-medium"> (filtered)</span>}
                    </p>
                </div>
                <Link to="/devotees/new" className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-xl hover:bg-orange-700 transition-colors shadow-lg shadow-orange-900/20">
                    <Plus className="w-5 h-5" />
                    <span>Add Devotee</span>
                </Link>
            </div>

            {/* Search, Filter Toggle & View Toggle */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="flex items-center gap-4 flex-1 w-full">
                    <div className="relative flex-1 max-w-md group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500 group-focus-within:text-orange-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by name, phone, or DOB..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className={`w-full pl-10 pr-20 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all shadow-sm ${isSearching ? 'border-orange-300' : ''}`}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
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
                                    className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
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
                                ? "bg-orange-50 border-orange-300 text-orange-700"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900/50 hover:text-slate-900"
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
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                            <Filter className="w-4 h-4 text-orange-500" />
                            Filter Devotees
                        </h3>
                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
                                <X className="w-3 h-3" /> Clear All
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        <select value={filters.status} onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setCurrentPage(1); }} className={selectClass}>
                            <option value="">All Status</option>
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
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div ref={containerRef} className="overflow-x-auto max-h-[650px] overflow-y-auto" onScroll={handleScroll}>
                        <table className="w-full text-left relative border-collapse">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold sticky top-0 z-20 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
                                <tr>
                                    <th className="px-6 py-4 w-10 bg-slate-50 dark:bg-slate-900">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.size > 0 && selectedIds.size === paginatedDevotees.length}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-orange-600 focus:ring-orange-500"
                                        />
                                    </th>
                                    <th className="px-6 py-4 sticky left-0 bg-slate-50 dark:bg-slate-900 z-10">Devotee</th>
                                    <th className="px-6 py-4 bg-slate-50 dark:bg-slate-900">Status</th>
                                    <th className="px-6 py-4 bg-slate-50 dark:bg-slate-900">Gender</th>
                                    <th className="px-6 py-4 bg-slate-50 dark:bg-slate-900">Contact</th>
                                    <th className="px-6 py-4 bg-slate-50 dark:bg-slate-900">DOB</th>
                                    <th className="px-6 py-4 bg-slate-50 dark:bg-slate-900">Counselor</th>
                                    <th className="px-6 py-4 bg-slate-50 dark:bg-slate-900 text-right sticky right-0 z-10">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {topPadding > 0 && <tr style={{ height: `${topPadding}px` }}><td colSpan={8} /></tr>}
                                {visibleItems.map(({ item: devotee }) => (
                                    <tr key={devotee.id} className={clsx("hover:bg-slate-50 dark:bg-slate-900/50/50 transition-colors", selectedIds.has(devotee.id) && "bg-orange-50/30")}>
                                        <td className="px-6 py-4">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedIds.has(devotee.id)}
                                                onChange={() => toggleSelect(devotee.id)}
                                                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-orange-600 focus:ring-orange-500"
                                            />
                                        </td>
                                        <td className="px-6 py-4 sticky left-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:bg-slate-900/50/50 z-10">
                                            <div className="flex items-center gap-4 min-w-[200px]">
                                                <img
                                                    src={devotee.photo || '/default-avatar.png'}
                                                    alt={devotee.name}
                                                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                                                />
                                                <div>
                                                    <div className="font-semibold text-slate-900 truncate max-w-[150px]">{devotee.name}</div>
                                                    {devotee.initiatedName && (
                                                        <div className="text-[10px] text-orange-600 font-medium truncate max-w-[150px]">{devotee.initiatedName}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${devotee.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100'}`}>
                                                {devotee.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{devotee.gender || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{devotee.contact}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{formatDate(devotee.dob)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{devotee.counselor || '-'}</td>
                                        <td className="px-6 py-4 text-right sticky right-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:bg-slate-900/50/50 z-10">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link to={`/devotees/${devotee.id}`} className="p-2 text-slate-400 dark:text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors">
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => { setActiveDevotee(devotee); setShowWhatsApp(true); }}
                                                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                    title="Send WhatsApp"
                                                >
                                                    <MessageSquare className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => navigate(`/devotees/${devotee.id}/edit`)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => setDeleteId(devotee.id)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                    <Trash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {bottomPadding > 0 && <tr style={{ height: `${bottomPadding}px` }}><td colSpan={8} /></tr>}
                                {safeDevotees.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-16 text-center text-slate-400 dark:text-slate-500 text-sm">
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
                        <div key={devotee.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center">
                            <div className="relative mb-4">
                                <img src={devotee.photo || '/default-avatar.png'} alt={devotee.name} className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 shadow-inner" />
                                <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${devotee.status === 'Active' ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                            </div>
                            <h3 className="font-bold text-slate-900 text-lg mb-1">{devotee.name}</h3>
                            {devotee.initiatedName && <p className="text-sm text-orange-600 font-medium mb-3">{devotee.initiatedName}</p>}
                            <div className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                <p>{devotee.contact}</p>
                                <p className="text-xs mt-1">{devotee.gender} • {devotee.counselor}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-auto w-full pt-4 border-t border-slate-100 dark:border-slate-800">
                                <Link to={`/devotees/${devotee.id}`} className="flex-1 p-2 text-slate-500 dark:text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors flex justify-center">
                                    <Eye className="w-4 h-4" />
                                </Link>
                                <button onClick={() => { setActiveDevotee(devotee); setShowWhatsApp(true); }} className="flex-1 p-2 text-slate-500 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex justify-center">
                                    <MessageSquare className="w-4 h-4" />
                                </button>
                                <button onClick={() => navigate(`/devotees/${devotee.id}/edit`)} className="flex-1 p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex justify-center">
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => setDeleteId(devotee.id)} className="flex-1 p-2 text-slate-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex justify-center">
                                    <Trash className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {paginatedDevotees.length === 0 && (
                        <div className="col-span-4 py-16 text-center text-slate-400 dark:text-slate-500 text-sm">
                            {hasActiveFilters ? 'No devotees match the current filters.' : 'No devotees found.'}
                        </div>
                    )}
                </div>
            )}

            {/* ✅ Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-6 py-3 shadow-sm">
                    <div className="flex items-center gap-6">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalCount)}</span> of <span className="font-semibold text-slate-700 dark:text-slate-200">{totalCount}</span> devotees
                        </p>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">Show:</span>
                            <select
                                value={pageSize}
                                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                                className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 outline-none focus:ring-1 focus:ring-orange-500"
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
                devotee={activeDevotee}
            />

            {/* Batch Action Bar */}
            {selectedIds.size > 0 && (
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
