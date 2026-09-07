import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPin, Calendar, Users, Save, X, IndianRupee, FileText, User, Compass, Plane } from 'lucide-react';
import { useToast } from '../../components/Toast';
import apiService from '../../services/api';

const TourForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const toast = useToast();
    const isEditing = !!id;

    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: '',
        destination: '',
        startDate: '',
        endDate: '',
        status: 'Upcoming',
        fees: 0,
        organizer: '',
        maxParticipants: ''
    });

    useEffect(() => {
        if (isEditing) {
            const fetchTour = async () => {
                try {
                    const response = await apiService.get(`/api/tours/${id}`);
                    if (response.success) {
                        setForm(response.data);
                    } else {
                        toast.error(response.error || 'Failed to fetch tour');
                        navigate('/tours');
                    }
                } catch {
                    toast.error('Failed to connect to server');
                } finally {
                    setLoading(false);
                }
            };
            fetchTour();
        }
    }, [id, isEditing, navigate, toast]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            let response;
            if (isEditing) {
                response = await apiService.put(`/api/tours/${id}`, form);
            } else {
                response = await apiService.post('/api/tours', form);
            }

            if (response.success) {
                toast.success(isEditing ? 'Tour updated' : 'Tour scheduled');
                navigate('/tours');
            } else {
                toast.error(response.error || 'Failed to save tour');
            }
        } catch {
            toast.error('Error saving tour');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <Compass className="text-orange-600" size={32} />
                        {isEditing ? 'Edit Tour' : 'Plan New Yatra'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Configure your spiritual pilgrimage details</p>
                </div>
                <button
                    onClick={() => navigate('/tours')}
                    className="p-2.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800 rounded-xl transition-all"
                >
                    <X size={24} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Compass size={14} /> Tour Name / Title
                            </label>
                            <input
                                required
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="e.g. Braj Mandal Parikrama 2026"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Plane size={14} /> Destination
                            </label>
                            <input
                                required
                                type="text"
                                name="destination"
                                value={form.destination}
                                onChange={handleChange}
                                placeholder="e.g. Vrindavan, Uttar Pradesh"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Calendar size={14} /> Start Date
                            </label>
                            <input
                                type="date"
                                name="startDate"
                                value={form.startDate}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Calendar size={14} /> End Date
                            </label>
                            <input
                                type="date"
                                name="endDate"
                                value={form.endDate}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <MapPin size={14} /> Status
                            </label>
                            <select
                                name="status"
                                value={form.status}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium"
                            >
                                <option value="Upcoming">Upcoming</option>
                                <option value="Ongoing">Ongoing</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <IndianRupee size={14} /> Tour Fees (per person)
                            </label>
                            <input
                                type="number"
                                name="fees"
                                value={form.fees}
                                onChange={handleChange}
                                placeholder="0.00"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <User size={14} /> Organizer / Lead
                            </label>
                            <input
                                type="text"
                                name="organizer"
                                value={form.organizer}
                                onChange={handleChange}
                                placeholder="e.g. HG Ramanuj Das"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Users size={14} /> Max Participants
                            </label>
                            <input
                                type="number"
                                name="maxParticipants"
                                value={form.maxParticipants}
                                onChange={handleChange}
                                placeholder="e.g. 50"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => navigate('/tours')}
                        className="flex-1 px-6 py-4 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900/50 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-[2] px-6 py-4 bg-orange-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-orange-600/20 hover:bg-orange-700 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 flex items-center justify-center gap-3"
                    >
                        {saving ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                            <>
                                <Save size={18} />
                                {isEditing ? 'Update Tour' : 'Schedule Tour'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TourForm;
