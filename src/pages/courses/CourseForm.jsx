import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, Calendar, Users, Save, X, IndianRupee, FileText, User } from 'lucide-react';
import { useToast } from '../../components/Toast';
import apiService from '../../services/api';

const CourseForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const toast = useToast();
    const isEditing = !!id;

    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        status: 'Upcoming',
        fees: 0,
        instructor: ''
    });

    useEffect(() => {
        if (isEditing) {
            const fetchCourse = async () => {
                try {
                    const response = await apiService.get(`/api/courses/${id}`);
                    if (response.success) {
                        setForm(response.data);
                    } else {
                        toast.error(response.error || 'Failed to fetch course');
                        navigate('/courses');
                    }
                } catch {
                    toast.error('Failed to connect to server');
                } finally {
                    setLoading(false);
                }
            };
            fetchCourse();
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
                response = await apiService.put(`/api/courses/${id}`, form);
            } else {
                response = await apiService.post('/api/courses', form);
            }

            if (response.success) {
                toast.success(isEditing ? 'Course updated' : 'Course created');
                navigate('/courses');
            } else {
                toast.error(response.error || 'Failed to save course');
            }
        } catch {
            toast.error('Error saving course');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-corporate-600"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <BookOpen className="text-corporate-600" size={32} />
                        {isEditing ? 'Edit Course' : 'Create New Course'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Configure your course details and settings</p>
                </div>
                <button
                    onClick={() => navigate('/courses')}
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
                                <BookOpen size={14} /> Course Name
                            </label>
                            <input
                                required
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="e.g. Bhakti Shastri Module 1"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-corporate-500 outline-none transition-all font-medium"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <FileText size={14} /> Description
                            </label>
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                rows="3"
                                placeholder="What will this course cover?"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-corporate-500 outline-none transition-all font-medium"
                            ></textarea>
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
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-corporate-500 outline-none transition-all font-medium"
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
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-corporate-500 outline-none transition-all font-medium"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Users size={14} /> Course Status
                            </label>
                            <select
                                name="status"
                                value={form.status}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-corporate-500 outline-none transition-all font-medium"
                            >
                                <option value="Upcoming">Upcoming</option>
                                <option value="Ongoing">Ongoing</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <IndianRupee size={14} /> Course Fees
                            </label>
                            <input
                                type="number"
                                name="fees"
                                value={form.fees}
                                onChange={handleChange}
                                placeholder="0.00"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-corporate-500 outline-none transition-all font-medium"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <User size={14} /> Instructor Name
                            </label>
                            <input
                                type="text"
                                name="instructor"
                                value={form.instructor}
                                onChange={handleChange}
                                placeholder="e.g. HG Amogh Lila Das"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-corporate-500 outline-none transition-all font-medium"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => navigate('/courses')}
                        className="flex-1 px-6 py-4 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900/50 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-[2] px-6 py-4 bg-corporate-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-corporate-600/20 hover:bg-corporate-700 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 flex items-center justify-center gap-3"
                    >
                        {saving ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                            <>
                                <Save size={18} />
                                {isEditing ? 'Update Course' : 'Create Course'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CourseForm;
