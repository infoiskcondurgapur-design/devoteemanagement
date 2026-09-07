import React, { useState, useEffect, useCallback } from 'react'; // Module Refresh: 2026-04-12
import { formatDateRange } from '../../lib/dateUtils';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Users, Plus, Search, Filter, MoreVertical, CreditCard, Compass, ChevronRight, Plane } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import apiService from '../../services/api';

const TourList = () => {
    const navigate = useNavigate();
    const { isAdmin } = useAuth();
    const toast = useToast();

    const [tours, setTours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' or 'completed'
    const [searchTerm, setSearchTerm] = useState('');

    const fetchTours = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiService.get('/api/tours');
            if (response.success) {
                setTours(response.data);
            } else {
                toast.error(response.message || 'Failed to fetch tours');
            }
        } catch {
            toast.error('Failed to fetch tours');
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchTours();
    }, [fetchTours]);

    const filteredTours = tours.filter(tour => {
        const matchesSearch = tour.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             (tour.destination && tour.destination.toLowerCase().includes(searchTerm.toLowerCase()));
        
        if (activeTab === 'upcoming') {
            return matchesSearch && tour.status !== 'Completed';
        } else {
            return matchesSearch && tour.status === 'Completed';
        }
    });

    const stats = {
        total: tours.length,
        upcoming: tours.filter(t => t.status === 'Upcoming').length,
        ongoing: tours.filter(t => t.status === 'Ongoing').length,
        completed: tours.filter(t => t.status === 'Completed').length
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <MapPin className="text-orange-600" size={32} /> Tour & Yatra Management
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Organize spiritual pilgrimages and track bookings</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => navigate('/tours/new')}
                        className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-orange-600/20 hover:bg-orange-700 hover:-translate-y-0.5 transition-all"
                    >
                        <Plus size={18} /> Schedule New Yatra
                    </button>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Tours', value: stats.total, color: 'bg-orange-50 text-orange-600', icon: Compass },
                    { label: 'Upcoming', value: stats.upcoming, color: 'bg-blue-50 text-blue-600', icon: Calendar },
                    { label: 'Ongoing', value: stats.ongoing, color: 'bg-emerald-50 text-emerald-600', icon: MapPin },
                    { label: 'Completed', value: stats.completed, color: 'bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300', icon: ChevronRight },
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
                            <stat.icon size={20} />
                        </div>
                        <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Filters & Tabs */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('upcoming')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'upcoming' ? 'bg-white dark:bg-slate-900 text-orange-600 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'}`}
                    >
                        Upcoming & Ongoing
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'completed' ? 'bg-white dark:bg-slate-900 text-orange-600 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'}`}
                    >
                        Completed
                    </button>
                </div>

                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search tours or destinations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    />
                </div>
            </div>

            {/* Tour Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                </div>
            ) : filteredTours.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTours.map((tour) => (
                        <div 
                            key={tour.id} 
                            onClick={() => navigate(`/tours/${tour.id}`)}
                            className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all cursor-pointer overflow-hidden flex flex-col"
                        >
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                                        tour.status === 'Upcoming' ? 'bg-blue-50 text-blue-600' :
                                        tour.status === 'Ongoing' ? 'bg-emerald-50 text-emerald-600' :
                                        'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                    }`}>
                                        {tour.status}
                                    </span>
                                    <MapPin size={18} className="text-slate-300 group-hover:text-orange-500 transition-colors" />
                                </div>
                                
                                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-orange-700 transition-colors">{tour.name}</h3>
                                <div className="flex items-center gap-2 mb-4 text-orange-600 font-bold text-sm">
                                    <Plane size={14} />
                                    <span>{tour.destination || 'Destination TBD'}</span>
                                </div>
                                
                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300 font-medium">
                                        <Calendar size={16} className="text-slate-400 dark:text-slate-500" />
                                        <span>{formatDateRange(tour.startDate, tour.endDate)}</span>
                                    </div>
                                    <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300 font-medium">
                                        <Users size={16} className="text-slate-400 dark:text-slate-500" />
                                        <span>Capacity: {tour.maxParticipants ? `${tour.maxParticipants} max` : 'Unlimited'}</span>
                                    </div>
                                    <div className="flex items-center gap-2.5 text-sm font-bold text-orange-600">
                                        <CreditCard size={16} />
                                        <span>Fees: ₹{tour.fees || 0}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between group-hover:bg-orange-50 transition-colors">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-orange-600 transition-colors">View Details & Bookings</span>
                                <ChevronRight size={18} className="text-slate-400 dark:text-slate-500 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl border-dashed">
                    <Compass className="mx-auto h-16 w-16 text-slate-200 mb-4" />
                    <h3 className="text-xl font-bold text-slate-900">No tours found</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Try adjusting your search or filters, or plan a new pilgrimage.</p>
                    {isAdmin && (
                        <button
                            onClick={() => navigate('/tours/new')}
                            className="mt-6 inline-flex items-center gap-2 text-orange-600 font-bold hover:underline"
                        >
                            <Plus size={18} /> Plan your first Yatra
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default TourList;
