import React, { useState, useEffect, useMemo } from 'react';
import { 
    Calendar, Clock, Users, Plus, Trash2, 
    ChevronLeft, ChevronRight, Filter, 
    CheckCircle2, AlertCircle, Info, MoreVertical
} from 'lucide-react';
import apiService from '../../services/api';
import { useDevotees } from '../../context/DevoteeContext';
import { useToast } from '../../components/Toast';
import { formatDate } from '../../lib/dateUtils';
import clsx from 'clsx';

const DEPARTMENTS = [
    'Deity Worship', 'Kitchen', 'Book Distribution', 'Preaching',
    'IT & Media', 'Accounts', 'Security', 'Education', 'Counseling', 'Other'
];

const SevaScheduler = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [shifts, setShifts] = useState([]);
    const [, setLoading] = useState(true);
    const [showAddShift, setShowAddShift] = useState(false);
    const [selectedShift, setSelectedShift] = useState(null);
    const [showAssign, setShowAssign] = useState(false);
    const [shiftAssignments, setShiftAssignments] = useState([]);
    
    const { devotees } = useDevotees();
    const toast = useToast();

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const fetchShifts = async () => {
        setLoading(true);
        try {
            const res = await apiService.get(`/api/seva/schedule?startDate=${startOfMonth.toISOString().slice(0,10)}&endDate=${endOfMonth.toISOString().slice(0,10)}`);
            if (res.success) setShifts(res.data);
        } catch {
            toast.error('Failed to load schedule');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShifts();
    }, [currentDate]);

    const fetchAssignments = async (shiftId) => {
        try {
            const res = await apiService.get(`/api/seva/shifts/${shiftId}/assignments`);
            if (res.success) setShiftAssignments(res.data);
        } catch {
            toast.error('Failed to load assignments');
        }
    };

    const handleAddShift = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        try {
            const res = await apiService.post('/api/seva/shifts', data);
            if (res.success) {
                toast.success('Shift created');
                setShowAddShift(false);
                fetchShifts();
            }
        } catch (error) { toast.error(error.message); }
    };

    const handleAssign = async (devoteeId) => {
        try {
            const res = await apiService.post('/api/seva/shifts/assign', {
                shiftId: selectedShift.id,
                devoteeId
            });
            if (res.success) {
                toast.success('Devotee assigned');
                fetchAssignments(selectedShift.id);
                fetchShifts(); // Update counts
            }
        } catch (error) { toast.error(error.message); }
    };

    const handleRemoveAssignment = async (assignmentId) => {
        try {
            const res = await apiService.delete(`/api/seva/assignments/${assignmentId}`);
            if (res.success) {
                toast.success('Assignment removed');
                fetchAssignments(selectedShift.id);
                fetchShifts();
            }
        } catch (error) { toast.error(error.message); }
    };

    const days = useMemo(() => {
        const arr = [];
        const startDay = startOfMonth.getDay();
        const totalDays = endOfMonth.getDate();

        // Padding for previous month
        for (let i = 0; i < startDay; i++) arr.push(null);
        
        // Days of current month
        for (let i = 1; i <= totalDays; i++) {
            const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
            arr.push({
                day: i,
                date: dateStr,
                shifts: shifts.filter(s => s.shiftDate === dateStr)
            });
        }
        return arr;
    }, [currentDate, shifts]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Calendar Header */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 hover:bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors text-slate-500 dark:text-slate-400">
                            <ChevronLeft size={20} />
                        </button>
                        <h2 className="text-xl font-black text-slate-900 min-w-[150px] text-center">
                            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h2>
                        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 hover:bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors text-slate-500 dark:text-slate-400">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                    <button onClick={() => setCurrentDate(new Date())} className="text-xs font-black uppercase tracking-widest text-corporate-600 hover:text-corporate-700">Today</button>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={() => setShowAddShift(true)} className="flex items-center gap-2 px-5 py-2.5 bg-corporate-600 text-white rounded-xl font-bold text-sm hover:bg-corporate-700 transition-all shadow-lg shadow-corporate-600/20 active:scale-95">
                        <Plus size={18} />
                        Create Shift
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
                <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="py-4 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7">
                    {days.map((d, i) => (
                        <div key={i} className={clsx(
                            "min-h-[160px] border-r border-b border-slate-100 dark:border-slate-800 p-4 transition-colors",
                            !d ? "bg-slate-50 dark:bg-slate-900/50/50" : "hover:bg-slate-50 dark:bg-slate-900/50/30"
                        )}>
                            {d && (
                                <>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={clsx(
                                            "w-8 h-8 flex items-center justify-center rounded-xl text-sm font-black",
                                            d.date === new Date().toISOString().slice(0,10) ? "bg-corporate-600 text-white shadow-lg" : "text-slate-400 dark:text-slate-500"
                                        )}>
                                            {d.day}
                                        </span>
                                        {d.shifts.length > 0 && (
                                            <span className="text-[10px] font-black text-slate-300 uppercase">{d.shifts.length} Shifts</span>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        {d.shifts.map(s => (
                                            <button 
                                                key={s.id}
                                                onClick={() => {
                                                    setSelectedShift(s);
                                                    fetchAssignments(s.id);
                                                    setShowAssign(true);
                                                }}
                                                className={clsx(
                                                    "w-full text-left p-2 rounded-xl border text-[10px] font-bold transition-all hover:scale-[1.02] active:scale-95",
                                                    s.volunteerCount >= s.requiredVolunteers 
                                                        ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
                                                        : "bg-amber-50 border-amber-100 text-amber-700"
                                                )}
                                            >
                                                <div className="flex items-center justify-between gap-1">
                                                    <span className="truncate">{s.shiftName}</span>
                                                    <span className="shrink-0">{s.volunteerCount}/{s.requiredVolunteers}</span>
                                                </div>
                                                <div className="flex items-center gap-1 mt-0.5 opacity-60">
                                                    <Clock size={10} />
                                                    <span>{s.startTime || 'TBD'}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Modals */}
            {showAddShift && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <form onSubmit={handleAddShift} className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="text-xl font-black text-slate-900">Create Seva Shift</h3>
                            <button type="button" onClick={() => setShowAddShift(false)} className="p-2 hover:bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-8 space-y-5">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Department</label>
                                <select name="department" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-corporate-500/10 font-bold">
                                    {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Shift Name</label>
                                <input name="shiftName" required placeholder="e.g. Afternoon Deity Kit" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-corporate-500/10 font-bold" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Date</label>
                                    <input type="date" name="shiftDate" required defaultValue={new Date().toISOString().slice(0,10)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-corporate-500/10 font-bold" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Needed</label>
                                    <input type="number" name="requiredVolunteers" defaultValue="1" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-corporate-500/10 font-bold" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Start Time</label>
                                    <input type="time" name="startTime" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-corporate-500/10 font-bold" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">End Time</label>
                                    <input type="time" name="endTime" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-corporate-500/10 font-bold" />
                                </div>
                            </div>
                        </div>
                        <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                            <button type="button" onClick={() => setShowAddShift(false)} className="flex-1 px-6 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white dark:bg-slate-900 transition-all">Cancel</button>
                            <button type="submit" className="flex-1 px-6 py-3 bg-corporate-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-corporate-700 transition-all shadow-lg shadow-corporate-600/20">Create Shift</button>
                        </div>
                    </form>
                </div>
            )}

            {showAssign && selectedShift && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-2xl animate-in slide-in-from-bottom-4 duration-300 overflow-hidden">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                            <div>
                                <h3 className="text-xl font-black text-slate-900">{selectedShift.shiftName}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold flex items-center gap-2 mt-1">
                                    <Calendar size={14} /> {formatDate(selectedShift.shiftDate)}
                                    <Clock size={14} className="ml-2" /> {selectedShift.startTime} - {selectedShift.endTime}
                                </p>
                            </div>
                            <button onClick={() => setShowAssign(false)} className="p-2 hover:bg-white dark:bg-slate-900 rounded-xl transition-colors"><X size={20} /></button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2">
                            {/* Assigned List */}
                            <div className="p-8 border-r border-slate-100 dark:border-slate-800 h-[400px] flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                    <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Assigned Volunteers</h4>
                                    <span className={clsx(
                                        "px-2 py-0.5 rounded-full text-[10px] font-black uppercase",
                                        shiftAssignments.length >= selectedShift.requiredVolunteers ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                                    )}>
                                        {shiftAssignments.length} / {selectedShift.requiredVolunteers}
                                    </span>
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                                    {shiftAssignments.map(a => (
                                        <div key={a.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                                                    {a.photo && <img src={a.photo} alt="" className="w-full h-full object-cover" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{a.initiatedName || a.devoteeName}</p>
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{a.contact || 'No Contact'}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => handleRemoveAssignment(a.id)} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {shiftAssignments.length === 0 && (
                                        <div className="flex flex-col items-center justify-center h-full opacity-30">
                                            <Users size={32} />
                                            <p className="text-[10px] font-black uppercase mt-2 tracking-widest">No one assigned</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Search & Add */}
                            <div className="p-8 h-[400px] flex flex-col">
                                <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Add Volunteer</h4>
                                <div className="relative mb-4">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                                    <input placeholder="Search devotees..." className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-corporate-500/20" />
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                                    {devotees.filter(d => !shiftAssignments.some(a => a.devoteeId === d.id)).slice(0, 10).map(d => (
                                        <button key={d.id} onClick={() => handleAssign(d.id)} className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-transparent hover:border-slate-100 dark:border-slate-800 transition-all text-left">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                                                    {d.photo && <img src={d.photo} alt="" className="w-full h-full object-cover" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{d.initiatedName || d.name}</p>
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{d.counselor || 'No Counselor'}</p>
                                                </div>
                                            </div>
                                            <Plus size={14} className="text-corporate-600" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                                <Info size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Shift ID: {selectedShift.id}</span>
                            </div>
                            <button 
                                onClick={async () => {
                                    if (window.confirm('Delete this shift?')) {
                                        await apiService.delete(`/api/seva/shifts/${selectedShift.id}`);
                                        toast.success('Shift deleted');
                                        setShowAssign(false);
                                        fetchShifts();
                                    }
                                }}
                                className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest"
                            >
                                Delete Shift
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const X = ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const Search = ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

export default SevaScheduler;
