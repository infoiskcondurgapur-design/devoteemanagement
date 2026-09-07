import React, { useState } from 'react';
import { Shield, Plus, Trash2, Key, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

const UserManagement = () => {
    const { users, setUsers, currentUser } = useAuth();
    const toast = useToast();
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'viewer' });

    const handleSave = (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.password) return toast.error('Fill all fields');
        if (users.find(u => u.email === form.email)) return toast.error('Email already exists');

        const newUser = { id: Date.now().toString(), ...form };
        setUsers(prev => [...prev, newUser]);
        toast.success(`User ${newUser.name} added`);
        setShowForm(false);
        setForm({ name: '', email: '', password: '', role: 'viewer' });
    };

    const handleDelete = (id, name) => {
        if (id === currentUser.id) return toast.error('Cannot delete yourself');
        if (!window.confirm(`Delete ${name}?`)) return;
        setUsers(prev => prev.filter(u => u.id !== id));
        toast.success(`User ${name} deleted`);
    };

    const getRoleBadge = (role) => {
        switch (role) {
            case 'admin': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold uppercase tracking-wider">Admin</span>;
            case 'counselor': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold uppercase tracking-wider">Counselor</span>;
            case 'viewer': return <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded text-xs font-bold uppercase tracking-wider">Viewer</span>;
            default: return null;
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <Shield className="text-red-500" size={32} /> User Management
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Manage system access and assign roles</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                    <Plus size={16} /> Add User
                </button>
            </div>

            {showForm && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-4">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2"><Users size={18} /> New User Details</h3>
                    <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Name</label>
                            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. John Doe" />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Email (Login ID)</label>
                            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="john@iskcon.org" />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Password</label>
                            <input type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Secret Key" />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Role</label>
                            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none">
                                <option value="viewer">Viewer (Read-only)</option>
                                <option value="counselor">Counselor (Can log sessions, edit assigned)</option>
                                <option value="admin">Admin (Full Access)</option>
                            </select>
                        </div>
                        <div className="md:col-span-1 flex gap-2">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-900/50 w-full">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 w-full">Save</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email / Login</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Password</th>
                            <th className="px-6 py-4 text-right text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-slate-50 dark:bg-slate-900/50/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="font-bold text-slate-900">{u.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {getRoleBadge(u.role)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300 font-mono">{u.email}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2 text-sm text-slate-400 dark:text-slate-500 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded w-fit">
                                        <Key size={12} /> {u.password}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <button
                                        onClick={() => handleDelete(u.id, u.name)}
                                        disabled={u.id === currentUser.id}
                                        className="text-slate-400 dark:text-slate-500 hover:text-red-500 disabled:opacity-30 disabled:hover:text-slate-400 dark:text-slate-500 transition-colors p-2"
                                        title={u.id === currentUser.id ? "Cannot delete yourself" : "Delete User"}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManagement;
