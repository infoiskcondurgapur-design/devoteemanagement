import React, { useState } from 'react';
import { formatDate } from '../lib/dateUtils';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Plus, MessageSquare, Trash2, Edit, CheckCircle, FileUp, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useDevotees } from '../context/DevoteeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import apiService from '../services/api';

const Events = () => {
    const navigate = useNavigate();
    const { events, fetchEvents, loading } = useDevotees();
    const { isAdmin, isCounselor } = useAuth();
    const toast = useToast();

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [form, setForm] = useState({
        name: '',
        date: '',
        type: 'Sunday Feast',
        location: '',
        description: ''
    });
 
    const fileInputRef = React.useRef(null);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...form, eventDate: form.date, eventType: form.type };
            let data;
            if (editingId) {
                data = await apiService.put(`/api/events/${editingId}`, payload);
            } else {
                data = await apiService.post('/api/events', payload);
            }
            
            if (data.success) {
                toast.success(editingId ? 'Event updated' : 'Event created');
                fetchEvents();
                setShowForm(false);
                setEditingId(null);
                setForm({ name: '', date: '', type: 'Sunday Feast', location: '', description: '' });
            } else {
                toast.error(data.error || 'Failed to save event');
            }
        } catch {
            toast.error('Failed to connect to server');
        }
    };

    const handleEdit = (event) => {
        setForm({
            name: event.name,
            date: event.eventDate,
            type: event.eventType,
            location: event.location || '',
            description: event.description || ''
        });
        setEditingId(event.id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this event?')) return;
        try {
            const data = await apiService.delete(`/api/events/${id}`);
            if (data.success) {
                toast.success('Event deleted');
                fetchEvents();
            }
        } catch {
            toast.error('Failed to delete event');
        }
    };
 
    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const dataBuffer = evt.target.result;
                const wb = XLSX.read(dataBuffer, { 
                    type: 'array',
                    cellDates: true,
                    dateNF: 'yyyy-mm-dd'
                });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const jsonData = XLSX.utils.sheet_to_json(ws, { raw: false });

                if (!jsonData || jsonData.length === 0) {
                    toast.error('No data found in the file. Please check the sheet content.');
                    return;
                }

                // Map columns and validate with case-insensitive check
                const findValue = (row, possibleKeys) => {
                    const keys = Object.keys(row);
                    for (const pk of possibleKeys) {
                        const foundKey = keys.find(k => k.toLowerCase() === pk.toLowerCase());
                        if (foundKey) return row[foundKey];
                    }
                    return null;
                };

                const formatDate = (val) => {
                    if (!val) return null;
                    
                    // Handle Excel serial date (numeric)
                    if (typeof val === 'number') {
                        const date = XLSX.SSF.parse_date_code(val);
                        return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
                    }

                    // Handle string dates
                    let dateStr = String(val).trim();
                    
                    // Handle DD/MM/YYYY or DD-MM-YYYY
                    const dmyMatch = dateStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
                    if (dmyMatch) {
                        return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
                    }

                    const d = new Date(dateStr);
                    if (!isNaN(d.getTime())) {
                        return d.toISOString().split('T')[0];
                    }
                    return null;
                };

                const eventsToImport = jsonData.map(row => ({
                    name: findValue(row, ['Name', 'Event Name', 'Event']),
                    eventDate: formatDate(findValue(row, ['Date', 'Event Date'])),
                    eventType: findValue(row, ['Type', 'Event Type', 'Category']) || 'Sunday Feast',
                    location: findValue(row, ['Location', 'Venue']) || '',
                    description: findValue(row, ['Description', 'Notes', 'Details']) || ''
                })).filter(ev => ev.name && ev.eventDate);

                if (eventsToImport.length === 0) {
                    toast.error('No valid events found. Ensure "Name" and "Date" columns are present.');
                    return;
                }

                toast.info(`Importing ${eventsToImport.length} events...`);
                const res = await apiService.post('/api/events/bulk', eventsToImport);
                if (res.success) {
                    toast.success(`Successfully imported ${res.count} events`);
                    fetchEvents();
                } else {
                    toast.error(res.error || 'Failed to import events');
                }
            } catch (err) {
                console.error('Import error:', err);
                toast.error(`Error reading file: ${err.message || 'Unknown error'}`);
            }
        };
        reader.readAsArrayBuffer(file);
        e.target.value = ''; // Reset input
    };

    const downloadTemplate = (format = 'xlsx') => {
        const template = [
            { Name: 'Sunday Feast', Date: '2026-04-01', Type: 'Sunday Feast', Location: 'Temple Hall', Description: 'Weekly feast' },
            { Name: 'Janmashtami', Date: '2026-08-15', Type: 'Festival', Location: 'Hare Krishna Land', Description: 'Appearance day of Lord Krishna' }
        ];
        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Events");
        
        if (format === 'csv') {
            const csv = XLSX.utils.sheet_to_csv(ws);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", "events_import_template.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            XLSX.writeFile(wb, "events_import_template.xlsx");
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <Calendar className="text-purple-500" size={32} /> Event Management
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Create events, track RSVPs, and send WhatsApp invites</p>
                </div>
                {(isAdmin || isCounselor) && (
                    <div className="flex gap-2">
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                            <button
                                onClick={() => downloadTemplate('xlsx')}
                                title="Download Excel Template"
                                className="flex items-center gap-2 hover:bg-slate-200 px-3 py-1.5 rounded-md font-bold text-xs text-slate-600 dark:text-slate-300 transition-all border-r border-slate-200 dark:border-slate-700"
                            >
                                <Download size={14} /> Excel
                            </button>
                            <button
                                onClick={() => downloadTemplate('csv')}
                                title="Download CSV Template"
                                className="flex items-center gap-2 hover:bg-slate-200 px-3 py-1.5 rounded-md font-bold text-xs text-slate-600 dark:text-slate-300 transition-all"
                            >
                                <FileUp size={14} /> CSV
                            </button>
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-emerald-100 transition-all border border-emerald-200"
                        >
                            <FileUp size={16} /> Bulk Import
                        </button>
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-lg hover:bg-purple-700 hover:-translate-y-0.5 transition-all"
                        >
                            <Plus size={16} /> Create Event
                        </button>
                    </div>
                )}
                <input type="file" ref={fileInputRef} onChange={handleImport} accept=".xlsx, .xls, .csv" className="hidden" />
            </div>

            {showForm && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-4">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">{editingId ? 'Edit Event' : 'New Event'}</h3>
                    <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Event Name</label>
                            <input required type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="e.g. Janmashtami Festival" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Date</label>
                            <input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-purple-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Type</label>
                            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-purple-500 outline-none">
                                <option>Sunday Feast</option>
                                <option>Festival</option>
                                <option>Seminar</option>
                                <option>Retreat</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Location</label>
                            <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Temple Hall" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Description (Optional)</label>
                            <textarea rows="2" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Event details..." />
                        </div>
                        <div className="md:col-span-2 flex gap-3 mt-2">
                            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm({ name: '', date: '', type: 'Sunday Feast', location: '', description: '' }); }} className="px-5 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900/50 transition-colors">Cancel</button>
                            <button type="submit" className="px-5 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors">{editingId ? 'Update Event' : 'Save Event'}</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                    <div key={event.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex-1">
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-xs font-black uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-1 rounded-md">
                                    {event.eventType}
                                </span>
                                {(isAdmin || isCounselor) && (
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(event)} className="text-slate-300 hover:text-blue-500 transition-colors">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(event.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-1">{event.name}</h3>
                            <div className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                                <Calendar size={14} className="text-slate-400 dark:text-slate-500" />
                                {formatDate(event.eventDate)}
                            </div>
                            {event.location && (
                                <div className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-3">
                                    <MapPin size={14} className="text-slate-400 dark:text-slate-500" />
                                    {event.location}
                                </div>
                            )}
                            {event.description && (
                                <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 line-clamp-2">{event.description}</p>
                            )}
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
                            <button onClick={() => navigate('/attendance')} className="flex items-center justify-center gap-1.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:bg-slate-900/50 transition-colors">
                                <Users size={16} /> RSVPs
                            </button>
                            <button onClick={() => navigate('/communication')} className="flex items-center justify-center gap-1.5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm">
                                <MessageSquare size={16} /> Invite
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {!loading && events.length === 0 && (
                <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl border-dashed">
                    <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                    <h3 className="text-lg font-bold text-slate-900">No events found</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Create an event to start inviting devotees and tracking RSVPs.</p>
                </div>
            )}
        </div>
    );
};

export default Events;
