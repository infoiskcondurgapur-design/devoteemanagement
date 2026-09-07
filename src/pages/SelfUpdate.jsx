import React, { useState } from 'react';
import { User, Phone, Save, Edit2, ShieldAlert } from 'lucide-react';
import apiService from '../services/api';

const SelfUpdate = () => {
    const [step, setStep] = useState(1); // 1: Login, 2: Form
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const [devotee, setDevotee] = useState({
        id: '',
        name: '',
        email: '',
        contact: '',
        whatsapp: '',
        address: '',
        bloodGroup: '',
        occupation: ''
    });

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!phone) return setError('Please enter your phone number');

        setLoading(true);
        setError(null);

        try {
            // Re-using the same search logic the bot uses to find by phone
            // We need a new lightweight API route for this
            const data = await apiService.get(`/api/devotees/search?phone=${encodeURIComponent(phone)}`);

            if (data.success && data.data) {
                setDevotee(data.data);
                setStep(2);
            } else {
                setError('No profile found. Please register at the temple first.');
            }
        } catch {
            setError('Connection failed. Try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const data = await apiService.put(`/api/devotees/${devotee.id}`, devotee);

            if (data.success) {
                setSuccess(true);
            } else {
                setError(data.error || 'Failed to update profile');
            }
        } catch {
            setError('Connection failed. Try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 text-center max-w-md w-full animate-in zoom-in-95 duration-300">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Save size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">Profile Updated!</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">Hare Krishna! Your contact details have been successfully saved to the temple database.</p>
                    <button onClick={() => { setSuccess(false); setStep(1); setPhone(''); }} className="text-blue-600 font-bold hover:underline">
                        Update another profile
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-orange-500 text-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/20">
                        <User size={24} />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">DMS Self-Service</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Update your profile information</p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">

                    {error && (
                        <div className="mx-6 mt-6 p-4 bg-red-50 text-red-700 text-sm font-bold rounded-lg flex items-start gap-3 border border-red-100 animate-in fade-in">
                            <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                            <p>{error}</p>
                        </div>
                    )}

                    {step === 1 ? (
                        <form onSubmit={handleLogin} className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Registered Phone Number</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                                        <Phone size={18} />
                                    </div>
                                    <input
                                        type="tel"
                                        required
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-lg font-medium"
                                        placeholder="e.g. 9876543210"
                                    />
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Enter the phone number associated with your temple registration.</p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !phone}
                                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                            >
                                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Find My Profile'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleUpdate} className="p-6 space-y-4 animate-in slide-in-from-right-8">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-2">
                                <div>
                                    <h3 className="font-bold text-slate-900 text-lg">{devotee.name}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">{devotee.contact}</p>
                                </div>
                                <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded">Editing</span>
                            </div>

                            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Full Name</label>
                                    <input type="text" value={devotee.name} onChange={e => setDevotee({ ...devotee, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Email</label>
                                    <input type="email" value={devotee.email || ''} onChange={e => setDevotee({ ...devotee, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">WhatsApp Number</label>
                                    <input type="tel" value={devotee.whatsapp || ''} onChange={e => setDevotee({ ...devotee, whatsapp: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Current Address</label>
                                    <textarea rows="2" value={devotee.address || ''} onChange={e => setDevotee({ ...devotee, address: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Blood Group</label>
                                        <select value={devotee.bloodGroup || ''} onChange={e => setDevotee({ ...devotee, bloodGroup: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                                            <option value="">Select</option>
                                            <option value="A+">A+</option><option value="A-">A-</option>
                                            <option value="B+">B+</option><option value="B-">B-</option>
                                            <option value="O+">O+</option><option value="O-">O-</option>
                                            <option value="AB+">AB+</option><option value="AB-">AB-</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Occupation</label>
                                        <input type="text" value={devotee.occupation || ''} onChange={e => setDevotee({ ...devotee, occupation: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3 border-t border-slate-100 dark:border-slate-800">
                                <button type="button" onClick={() => setStep(1)} className="px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-900/50 rounded-lg w-full border">Cancel</button>
                                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg w-full flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20">
                                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={16} /> Save Updates</>}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6 flex items-center justify-center gap-1">
                    <ShieldAlert size={12} /> Secure ISKCON Database Link
                </p>
            </div>
        </div>
    );
};

export default SelfUpdate;
