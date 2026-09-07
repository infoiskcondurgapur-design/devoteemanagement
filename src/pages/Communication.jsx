import React, { useState, useMemo, useEffect } from 'react';
import { Mail, MessageSquare, Send, Search, User, Phone, RefreshCw, Megaphone, Heart, Sparkles, Copy, Check } from 'lucide-react';
import clsx from 'clsx';
import { useDevotees } from '../context/DevoteeContext';
import { useToast } from '../components/Toast';
import apiService from '../services/api';

const NavButton = ({ active, onClick, icon: Icon, label, badge }) => (
    <button
        onClick={onClick}
        className={clsx(
            "w-full flex items-center gap-4 px-6 py-3 rounded-lg transition-all duration-200 relative group active:scale-[0.98]",
            active
                ? "bg-corporate-50 text-corporate-700 font-bold border border-corporate-100"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-900/50 hover:text-slate-700 dark:text-slate-200"
        )}
    >
        <div className={clsx(
            "p-1.5 rounded-lg transition-colors",
            active ? "bg-corporate-100 text-corporate-700" : "bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200"
        )}>
            <Icon className="w-4 h-4" />
        </div>
        <span className="flex-1 text-left text-sm tracking-tight">{label}</span>
        {badge > 0 && (
            <span className="bg-corporate-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {badge}
            </span>
        )}
    </button>
);

const sanitizeNumber = (number) => {
    let num = String(number || '').replace(/\D/g, '');
    if (num.length === 10) num = '91' + num;
    return num;
};

const openWhatsAppLink = (number, message) => {
    const num = sanitizeNumber(number);
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
};

const Communication = () => {
    const [activeTab, setActiveTab] = useState('whatsapp');
    const { devotees, getDashboardStats } = useDevotees();
    const stats = getDashboardStats();
    const toast = useToast();
    const [copied, setCopied] = useState(false);

    const [filters, setFilters] = useState({
        counselor: '',
        initiationStatus: '',
        district: '',
        search: ''
    });
    const [messageTemplate, setMessageTemplate] = useState("Hare Krishna {name},\n\n");
    const [isBroadcasting, setIsBroadcasting] = useState(false);

    const counselors = [...new Set(devotees.map(d => d.counselor).filter(Boolean))];
    const audience = useMemo(() => {
        return devotees.filter(d => {
            const matchCounselor = !filters.counselor || d.counselor === filters.counselor;
            let statusMatch = true;
            if (filters.initiationStatus === 'Initiated') statusMatch = !!d.initiatedName;
            if (filters.initiationStatus === 'Aspiring') statusMatch = !d.initiatedName;
            const matchSearch = !filters.search ||
                d.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                (d.initiatedName && d.initiatedName.toLowerCase().includes(filters.search.toLowerCase()));
            return matchCounselor && statusMatch && matchSearch;
        });
    }, [devotees, filters]);

    const buildMessages = (template) => {
        return audience.map(d => {
            const title = d.gender === 'Female' ? 'Mataji' : 'Prabhu';
            const message = template
                .replace(/{name}/gi, d.initiatedName || d.name || 'Devotee')
                .replace(/{title}/gi, title);
            return { devotee: d, message };
        });
    };

    const sendBroadcast = async () => {
        if (audience.length === 0) return toast.error('No devotees match the current filter.');
        if (!messageTemplate.trim()) return toast.error('Please write a message first.');

        setIsBroadcasting(true);
        try {
            const messages = buildMessages(messageTemplate);
            const text = messages.map(m => `${m.devotee.name} (${m.devotee.whatsapp || m.devotee.contact || 'no number'}):\n${m.message}\n${'https://wa.me/' + sanitizeNumber(m.devotee.whatsapp || m.devotee.contact)}\n\n`).join('---\n');
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast.success(`Copied ${audience.length} personalized messages. Paste & send from your WhatsApp!`);
        } catch (err) {
            toast.error('Broadcast failed: ' + err.message);
        } finally {
            setIsBroadcasting(false);
        }
    };

    const wish = (devotee, message) => {
        openWhatsAppLink(devotee.whatsapp || devotee.contact, message);
    };

    return (
        <div className="p-10 space-y-8 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 relative">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                        Communication Hub
                        <Megaphone className="w-6 h-6 text-corporate-600" />
                    </h1>
                    <div className="flex items-center gap-4 text-sm font-medium">
                        <p className="text-slate-500 dark:text-slate-400">Wishes and broadcast composer (opens WhatsApp Web)</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-10 items-start">
                <div className="col-span-3 space-y-3 sticky top-10">
                    <NavButton active={activeTab === 'whatsapp'} onClick={() => setActiveTab('whatsapp')} icon={Phone} label="Daily Spirits" badge={stats.birthdaysToday.length + stats.anniversariesToday.length} />
                    <NavButton active={activeTab === 'broadcast'} onClick={() => setActiveTab('broadcast')} icon={Megaphone} label="Smart Broadcast" />
                    <NavButton active={activeTab === 'automation'} onClick={() => setActiveTab('automation')} icon={RefreshCw} label="Auto-Secretary" />
                </div>

                <div className="col-span-9 bg-white dark:bg-slate-900 min-h-[750px] flex flex-col overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg p-0">
                    {activeTab === 'whatsapp' && (
                        <div className="flex flex-col h-full">
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3"><Sparkles className="w-5 h-5 text-amber-500" />Community celebrations</h2>
                            </div>
                            <div className="p-6 overflow-y-auto space-y-8 flex-1">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2"><span className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></span> Birthdays</h3>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        {stats.birthdaysToday.map(d => (
                                            <div key={d.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-pink-100 shadow-sm">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-pink-50 rounded-full flex items-center justify-center text-pink-500"><User className="w-5 h-5" /></div>
                                                    <div><h4 className="font-bold text-slate-900">{d.name}</h4><p className="text-xs text-slate-500 dark:text-slate-400">Birthday Today</p></div>
                                                </div>
                                                <button onClick={() => wish(d, "Hare Krishna {name}! Wish you a very Happy Birthday! 🎂".replace("{name}", d.initiatedName || d.name))} className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-bold">Wish Now</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> Anniversaries</h3>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        {stats.anniversariesToday.map(d => (
                                            <div key={d.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-red-100 shadow-sm">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-red-500"><Heart className="w-5 h-5" /></div>
                                                    <div><h4 className="font-bold text-slate-900">{d.name}</h4><p className="text-xs text-slate-500 dark:text-slate-400">Anniversary Today</p></div>
                                                </div>
                                                <button onClick={() => wish(d, "Hare Krishna {name}! Wish you a very Happy Wedding Anniversary! 💐".replace("{name}", d.initiatedName || d.name))} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold">Wish Now</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'broadcast' && (
                        <div className="flex h-full">
                            <div className="w-2/5 border-r border-slate-100 dark:border-slate-800 flex flex-col bg-slate-50 dark:bg-slate-900/50/50 p-6 space-y-6">
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
                                        <input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-2 border rounded-xl" value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} />
                                    </div>
                                    <select className="w-full p-2 border rounded-xl" value={filters.counselor} onChange={e => setFilters({...filters, counselor: e.target.value})}>
                                        <option value="">All Counselors</option>
                                        {counselors.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <select className="w-full p-2 border rounded-xl" value={filters.initiationStatus} onChange={e => setFilters({...filters, initiationStatus: e.target.value})}>
                                        <option value="">All Initiation Statuses</option>
                                        <option value="Initiated">Initiated</option>
                                        <option value="Aspiring">Aspiring</option>
                                    </select>
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-2">
                                    {audience.map(d => (
                                        <div key={d.id} className="p-3 bg-white dark:bg-slate-900 border rounded-xl flex justify-between items-center">
                                            <span className="text-sm font-medium">{d.name}</span>
                                            <Send className="w-4 h-4 text-slate-300" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="w-3/5 p-8 flex flex-col space-y-6">
                                <h3 className="font-bold">Campaign Designer</h3>
                                <p className="text-xs text-slate-500">Personalized messages are copied to your clipboard, each with its wa.me link — send them from your WhatsApp.</p>
                                <textarea value={messageTemplate} onChange={e => setMessageTemplate(e.target.value)} className="flex-1 p-4 border rounded-2xl resize-none" />
                                <button onClick={sendBroadcast} disabled={isBroadcasting} className="w-full py-4 bg-corporate-600 text-white rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-corporate-600/20 flex items-center justify-center gap-2 disabled:opacity-60">
                                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                    {isBroadcasting ? 'Preparing...' : copied ? 'Copied!' : `Copy ${audience.length} Messages`}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'automation' && <AutomationSettings />}
                </div>
            </div>
        </div>
    );
};

const AutomationSettings = () => {
    const [settings, setSettings] = useState({ automation_enabled: 'true', automation_time: '07:00', birthday_message: '', anniversary_message: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const toast = useToast();

    useEffect(() => {
        apiService.get('/api/system/settings').then(res => {
            if (res.success) setSettings(prev => ({ ...prev, ...res.data }));
        }).finally(() => setLoading(false));
    }, []);

    const save = async () => {
        setSaving(true);
        try {
            const res = await apiService.post('/api/system/settings', settings);
            if (res.success) toast.success('Settings saved successfully!');
            else throw new Error(res.error);
        } catch (err) { toast.error('Failed to save: ' + err.message); }
        finally { setSaving(false); }
    };

    if (loading) return <div className="flex-1 flex items-center justify-center"><RefreshCw className="w-8 h-8 animate-spin text-slate-300" /></div>;

    return (
        <div className="flex flex-col h-full p-8 space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Autonomous Secretary Settings</h2>
                <button onClick={save} disabled={saving} className="px-6 py-2 bg-corporate-600 text-white rounded-lg font-bold disabled:opacity-50">{saving ? 'Saving...' : 'Save Settings'}</button>
            </div>
            <div className="space-y-6 overflow-y-auto pr-2">
                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border flex justify-between items-center">
                    <div><h3 className="font-bold">Enable Service</h3><p className="text-xs text-slate-500 dark:text-slate-400">Automatically send wishes daily</p></div>
                    <button onClick={() => setSettings({...settings, automation_enabled: settings.automation_enabled === 'true' ? 'false' : 'true'})} className={clsx("w-12 h-6 rounded-full p-1 transition-colors", settings.automation_enabled === 'true' ? "bg-corporate-600" : "bg-slate-300")}>
                        <div className={clsx("w-4 h-4 bg-white dark:bg-slate-900 rounded-full transition-transform", settings.automation_enabled === 'true' ? "translate-x-6" : "translate-x-0")} />
                    </button>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Daily Execution Time</label>
                    <input type="time" value={settings.automation_time} onChange={e => setSettings({...settings, automation_time: e.target.value})} className="w-full p-3 border rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Birthday Template</label>
                    <textarea value={settings.birthday_message} onChange={e => setSettings({...settings, birthday_message: e.target.value})} rows={4} className="w-full p-4 border rounded-xl text-sm" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Anniversary Template</label>
                    <textarea value={settings.anniversary_message} onChange={e => setSettings({...settings, anniversary_message: e.target.value})} rows={4} className="w-full p-4 border rounded-xl text-sm" />
                </div>
            </div>
        </div>
    );
};

export default Communication;