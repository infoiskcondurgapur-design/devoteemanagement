import React, { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, Users, KeyRound, RefreshCw, X, Search, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import apiService from '../services/api';

const UserManagement = () => {
    const { currentUser } = useAuth();
    const toast = useToast();

    const [userList, setUserList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    // Add user form state
    const [showForm, setShowForm] = useState(false);
    const [createBusy, setCreateBusy] = useState(false);
    const [form, setForm] = useState({
        username: '',
        fullName: '',
        email: '',
        password: '',
        role: 'viewer'
    });

    // Reset password modal state
    const [resetModalUser, setResetModalUser] = useState(null);
    const [newResetPassword, setNewResetPassword] = useState('');
    const [resetBusy, setResetBusy] = useState(false);

    // Role change state
    const [changingRoleId, setChangingRoleId] = useState(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await apiService.getUsers();
            if (res.success && Array.isArray(res.data)) {
                setUserList(res.data);
            } else {
                toast.error(res.error || 'Failed to load users');
            }
        } catch (err) {
            toast.error(err.message || 'Error fetching users from database');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const generateRandomPassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
        let pwd = '';
        for (let i = 0; i < 12; i++) {
            pwd += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setNewResetPassword(pwd);
    };

    const handleAdminResetPassword = async (e) => {
        e.preventDefault();
        if (!newResetPassword || newResetPassword.length < 6) {
            return toast.error('Password must be at least 6 characters long');
        }

        setResetBusy(true);
        try {
            const res = await apiService.authAdminResetPassword(resetModalUser.id, newResetPassword);
            if (res.success) {
                toast.success(`Password for ${resetModalUser.fullName || resetModalUser.username} reset successfully!`);
                setResetModalUser(null);
                setNewResetPassword('');
            } else {
                toast.error(res.error || 'Failed to reset password');
            }
        } catch (err) {
            toast.error(err.message || 'Error resetting password');
        } finally {
            setResetBusy(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        if (!form.username.trim() || !form.password) {
            return toast.error('Username and password are required');
        }
        if (form.password.length < 6) {
            return toast.error('Password must be at least 6 characters');
        }

        setCreateBusy(true);
        try {
            const res = await apiService.createUser({
                username: form.username.trim(),
                fullName: form.fullName.trim() || null,
                email: form.email.trim() || null,
                password: form.password,
                role: form.role
            });

            if (res.success) {
                toast.success(`User ${form.username} created successfully!`);
                setShowForm(false);
                setForm({ username: '', fullName: '', email: '', password: '', role: 'viewer' });
                fetchUsers();
            } else {
                toast.error(res.error || 'Failed to create user');
            }
        } catch (err) {
            toast.error(err.message || 'Error creating user');
        } finally {
            setCreateBusy(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        setChangingRoleId(userId);
        try {
            const res = await apiService.updateUserRole(userId, newRole);
            if (res.success) {
                toast.success('Role updated');
                setUserList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
            } else {
                toast.error(res.error || 'Failed to update role');
            }
        } catch (err) {
            toast.error(err.message || 'Error updating role');
        } finally {
            setChangingRoleId(null);
        }
    };

    const handleDelete = async (id, displayName) => {
        if (String(id) === String(currentUser?.id)) {
            return toast.error('Cannot delete your own account');
        }
        if (!window.confirm(`Are you sure you want to delete user "${displayName}"?`)) {
            return;
        }

        try {
            const res = await apiService.deleteUser(id);
            if (res.success) {
                toast.success(`User "${displayName}" deleted`);
                setUserList(prev => prev.filter(u => u.id !== id));
            } else {
                toast.error(res.error || 'Failed to delete user');
            }
        } catch (err) {
            toast.error(err.message || 'Error deleting user');
        }
    };

    const filteredUsers = userList.filter(u => {
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        const q = searchQuery.toLowerCase().trim();
        if (!q) return matchesRole;
        const name = (u.fullName || '').toLowerCase();
        const username = (u.userName || u.username || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        return matchesRole && (name.includes(q) || username.includes(q) || email.includes(q));
    });

    return (
        <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-3">
                        <Shield className="text-red-500" size={30} /> User Management
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">
                        Manage system access, assign roles, and administer devotee accounts ({userList.length} total)
                    </p>
                </div>
                <div className="flex items-center gap-2.5">
                    <button
                        onClick={fetchUsers}
                        disabled={loading}
                        className="p-2.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                        title="Refresh Users"
                    >
                        <RefreshCw size={17} className={loading ? 'animate-spin text-orange-500' : ''} />
                    </button>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-2 bg-slate-900 dark:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                    >
                        <Plus size={16} /> Add User
                    </button>
                </div>
            </div>

            {/* Add User Panel */}
            {showForm && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-base">
                            <Users size={18} className="text-orange-500" /> New User Credentials
                        </h3>
                        <button
                            onClick={() => setShowForm(false)}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                            <X size={18} />
                        </button>
                    </div>
                    <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Full Name</label>
                            <input
                                type="text"
                                value={form.fullName}
                                onChange={e => setForm({ ...form, fullName: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-orange-500 outline-none"
                                placeholder="e.g. Radheshyam Das"
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Username / Phone *</label>
                            <input
                                type="text"
                                required
                                value={form.username}
                                onChange={e => setForm({ ...form, username: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-orange-500 outline-none font-mono"
                                placeholder="919876543210"
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Email (Optional)</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-orange-500 outline-none"
                                placeholder="user@iskcon.org"
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Password *</label>
                            <input
                                type="text"
                                required
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-orange-500 outline-none font-mono"
                                placeholder="Min 6 characters"
                            />
                        </div>
                        <div className="md:col-span-1 flex gap-2">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Role</label>
                                <select
                                    value={form.role}
                                    onChange={e => setForm({ ...form, role: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-orange-500 outline-none"
                                >
                                    <option value="viewer">Viewer</option>
                                    <option value="counselor">Counselor</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                disabled={createBusy}
                                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center self-end h-[38px]"
                            >
                                {createBusy ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : 'Save'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filter & Search Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search by name, username, or email…"
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <span className="text-xs font-bold text-slate-400 uppercase">Role:</span>
                    <select
                        value={roleFilter}
                        onChange={e => setRoleFilter(e.target.value)}
                        className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-orange-500 outline-none"
                    >
                        <option value="all">All Roles ({userList.length})</option>
                        <option value="admin">Admin ({userList.filter(u => u.role === 'admin').length})</option>
                        <option value="counselor">Counselor ({userList.filter(u => u.role === 'counselor').length})</option>
                        <option value="viewer">Viewer ({userList.filter(u => u.role === 'viewer').length})</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                        <p className="text-sm font-medium">Loading registered users from database…</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                        <Users size={32} className="mx-auto mb-2 opacity-40 text-slate-400" />
                        <p className="text-base font-bold text-slate-700 dark:text-slate-300">No users match your search</p>
                        <p className="text-xs text-slate-400 mt-1">Try resetting the filter or search query</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-6 py-3.5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">User Identity</th>
                                    <th className="px-6 py-3.5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Username / Phone</th>
                                    <th className="px-6 py-3.5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role Access</th>
                                    <th className="px-6 py-3.5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3.5 text-right text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredUsers.map(u => {
                                    const isSelf = String(u.id) === String(currentUser?.id);
                                    return (
                                        <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-sm">
                                                        {(u.fullName || u.userName || u.username || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5">
                                                            {u.fullName || 'Devotee Account'}
                                                            {isSelf && (
                                                                <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded text-[10px] font-bold">You</span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-slate-400">ID #{u.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-mono font-medium text-slate-700 dark:text-slate-300">{u.userName || u.username}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <select
                                                    value={u.role || 'viewer'}
                                                    disabled={changingRoleId === u.id || isSelf}
                                                    onChange={e => handleRoleChange(u.id, e.target.value)}
                                                    className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 uppercase tracking-wider focus:ring-1 focus:ring-orange-500 outline-none disabled:opacity-60 cursor-pointer"
                                                >
                                                    <option value="admin">Admin</option>
                                                    <option value="counselor">Counselor</option>
                                                    <option value="viewer">Viewer</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                                    {u.email && !u.email.endsWith('@temp.local') ? u.email : '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right space-x-1">
                                                <button
                                                    onClick={() => {
                                                        setResetModalUser(u);
                                                        setNewResetPassword('');
                                                    }}
                                                    className="text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors p-2 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/20"
                                                    title={`Reset Password for ${u.fullName || u.username}`}
                                                >
                                                    <KeyRound size={17} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(u.id, u.fullName || u.username)}
                                                    disabled={isSelf}
                                                    className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 disabled:opacity-20 disabled:cursor-not-allowed transition-colors p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20"
                                                    title={isSelf ? 'Cannot delete your own account' : 'Delete User'}
                                                >
                                                    <Trash2 size={17} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Admin Reset Password Modal */}
            {resetModalUser && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full p-6 animate-in zoom-in-95">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-orange-100 dark:bg-orange-950/40 text-orange-600 rounded-lg">
                                    <KeyRound size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Reset Password</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{resetModalUser.fullName || resetModalUser.username} (#{resetModalUser.id})</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setResetModalUser(null)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAdminResetPassword} className="mt-5 space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                                        New Password
                                    </label>
                                    <button
                                        type="button"
                                        onClick={generateRandomPassword}
                                        className="text-xs text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 font-medium"
                                    >
                                        <RefreshCw size={12} /> Auto-generate
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    autoFocus
                                    value={newResetPassword}
                                    onChange={e => setNewResetPassword(e.target.value)}
                                    placeholder="Enter new password (min 6 chars)"
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-orange-500 outline-none font-mono"
                                />
                            </div>

                            <div className="pt-2 flex justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setResetModalUser(null)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={resetBusy}
                                    className="px-5 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white rounded-lg font-semibold text-sm shadow-sm transition-colors flex items-center gap-2"
                                >
                                    {resetBusy && <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />}
                                    {resetBusy ? 'Saving...' : 'Set Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
