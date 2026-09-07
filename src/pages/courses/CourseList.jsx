import React, { useState, useEffect } from 'react';
import { formatDateRange } from '../../lib/dateUtils';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Calendar, Users, Plus, Search, Filter, MoreVertical, CreditCard, Award, ChevronRight, GraduationCap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import apiService from '../../services/api';

const CourseList = () => {
    const navigate = useNavigate();
    const { isAdmin } = useAuth();
    const toast = useToast();

    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' or 'completed'
    const [searchTerm, setSearchTerm] = useState('');

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const response = await apiService.get('/api/courses');
            if (response.success) {
                setCourses(response.data);
            }
        } catch {
            toast.error('Failed to fetch courses');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             (course.instructor && course.instructor.toLowerCase().includes(searchTerm.toLowerCase()));
        
        if (activeTab === 'upcoming') {
            return matchesSearch && course.status !== 'Completed';
        } else {
            return matchesSearch && course.status === 'Completed';
        }
    });

    const stats = {
        total: courses.length,
        upcoming: courses.filter(c => c.status === 'Upcoming').length,
        ongoing: courses.filter(c => c.status === 'Ongoing').length,
        completed: courses.filter(c => c.status === 'Completed').length
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <GraduationCap className="text-corporate-600" size={32} /> Course Management
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Manage spiritual education, track enrollments and payments</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => navigate('/courses/new')}
                        className="flex items-center gap-2 bg-corporate-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-corporate-600/20 hover:bg-corporate-700 hover:-translate-y-0.5 transition-all"
                    >
                        <Plus size={18} /> Create New Course
                    </button>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Courses', value: stats.total, color: 'bg-blue-50 text-blue-600', icon: BookOpen },
                    { label: 'Upcoming', value: stats.upcoming, color: 'bg-amber-50 text-amber-600', icon: Calendar },
                    { label: 'Ongoing', value: stats.ongoing, color: 'bg-emerald-50 text-emerald-600', icon: Users },
                    { label: 'Completed', value: stats.completed, color: 'bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300', icon: Award },
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
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'upcoming' ? 'bg-white dark:bg-slate-900 text-corporate-600 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'}`}
                    >
                        Upcoming & Ongoing
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'completed' ? 'bg-white dark:bg-slate-900 text-corporate-600 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'}`}
                    >
                        Completed
                    </button>
                </div>

                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search courses or instructors..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-corporate-500 outline-none transition-all"
                    />
                </div>
            </div>

            {/* Course Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-corporate-600"></div>
                </div>
            ) : filteredCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCourses.map((course) => (
                        <div 
                            key={course.id} 
                            onClick={() => navigate(`/courses/${course.id}`)}
                            className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-corporate-200 transition-all cursor-pointer overflow-hidden flex flex-col"
                        >
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                                        course.status === 'Upcoming' ? 'bg-amber-50 text-amber-600' :
                                        course.status === 'Ongoing' ? 'bg-emerald-50 text-emerald-600' :
                                        'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                    }`}>
                                        {course.status}
                                    </span>
                                    <CreditCard size={18} className="text-slate-300 group-hover:text-corporate-500 transition-colors" />
                                </div>
                                
                                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-corporate-700 transition-colors">{course.name}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">{course.description || 'No description provided.'}</p>
                                
                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300 font-medium">
                                        <Calendar size={16} className="text-slate-400 dark:text-slate-500" />
                                        <span>{formatDateRange(course.startDate, course.endDate)}</span>
                                    </div>
                                    <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300 font-medium">
                                        <Users size={16} className="text-slate-400 dark:text-slate-500" />
                                        <span>Instructor: {course.instructor || 'Not assigned'}</span>
                                    </div>
                                    <div className="flex items-center gap-2.5 text-sm font-bold text-corporate-600">
                                        <CreditCard size={16} />
                                        <span>Fees: ₹{course.fees || 0}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between group-hover:bg-corporate-50 transition-colors">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-corporate-600 transition-colors">View Details & Participants</span>
                                <ChevronRight size={18} className="text-slate-400 dark:text-slate-500 group-hover:text-corporate-600 group-hover:translate-x-1 transition-all" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl border-dashed">
                    <GraduationCap className="mx-auto h-16 w-16 text-slate-200 mb-4" />
                    <h3 className="text-xl font-bold text-slate-900">No courses found</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Try adjusting your search or filters, or create a new course.</p>
                    {isAdmin && (
                        <button
                            onClick={() => navigate('/courses/new')}
                            className="mt-6 inline-flex items-center gap-2 text-corporate-600 font-bold hover:underline"
                        >
                            <Plus size={18} /> Create your first course
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default CourseList;
