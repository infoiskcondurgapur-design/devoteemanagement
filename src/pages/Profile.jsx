import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import apiService from '../services/api';
import { User, Mail, Shield, Camera, Save, Maximize2, KeyRound, Eye, EyeOff, Lock, CheckCircle2 } from 'lucide-react';
import ImageModal from '../components/ImageModal';

const Profile = () => {
    const { currentUser, isAdmin } = useAuth();
    const toast = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [formData, setFormData] = useState({
        name: currentUser?.fullName || currentUser?.displayName || currentUser?.name || currentUser?.username || '',
        email: currentUser?.email || '',
        photo: currentUser?.photo || ''
    });

    // Password reset / change state
    const [pwdData, setPwdData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [showCurPwd, setShowCurPwd] = useState(false);
    const [showNewPwd, setShowNewPwd] = useState(false);
    const [showConfPwd, setShowConfPwd] = useState(false);
    const [pwdBusy, setPwdBusy] = useState(false);

    const handleSave = () => {
        setIsEditing(false);
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (!pwdData.currentPassword) {
            toast.error('Please enter your current password');
            return;
        }
        if (!pwdData.newPassword || pwdData.newPassword.length < 6) {
            toast.error('New password must be at least 6 characters long');
            return;
        }
        if (pwdData.newPassword !== pwdData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        setPwdBusy(true);
        try {
            const res = await apiService.authChangePassword(pwdData.currentPassword, pwdData.newPassword);
            if (res.success) {
                toast.success('Password updated successfully!');
                setPwdData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                toast.error(res.error || 'Failed to update password');
            }
        } catch (err) {
            toast.error(err.message || 'Error updating password');
        } finally {
            setPwdBusy(false);
        }
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, photo: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const displayName = currentUser?.fullName || currentUser?.displayName || currentUser?.name || currentUser?.username || 'Devotee';
    const roleName = currentUser?.role ? (currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)) : 'User';

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">User Profile</h1>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden max-w-2xl">
                <div className="h-32 bg-gradient-to-r from-orange-400 to-red-500"></div>
                <div className="px-8 pb-8">
                    <div className="relative -mt-16 mb-6">
                        <div className="relative inline-block">
                            <div
                                onClick={() => formData.photo && !isEditing && setShowImageModal(true)}
                                className={`relative rounded-full overflow-hidden ${formData.photo && !isEditing ? 'cursor-pointer group' : ''}`}
                                title={formData.photo && !isEditing ? "Click to view original image" : ""}
                            >
                                <img
                                    src={formData.photo || '/default-avatar.png'}
                                    alt={formData.name}
                                    className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-white dark:bg-slate-900 object-cover transition-transform duration-200 group-hover:scale-105"
                                />
                                {formData.photo && !isEditing && (
                                    <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                        <Maximize2 className="w-6 h-6 drop-shadow" />
                                    </div>
                                )}
                            </div>
                            {isEditing && (
                                <label className="absolute bottom-0 right-0 p-2 bg-white dark:bg-slate-900 rounded-full shadow-md border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:bg-slate-900/50 transition-colors">
                                    <Camera className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                                </label>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="text-2xl font-bold text-slate-900 border-b border-orange-500 focus:outline-none"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                ) : (
                                    <h2 className="text-2xl font-bold text-slate-900">{displayName}</h2>
                                )}
                                <p className="text-slate-500 dark:text-slate-400">{currentUser?.email || currentUser?.username}</p>
                            </div>
                            {isAdmin && (
                                <button
                                    onClick={isEditing ? handleSave : () => setIsEditing(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors"
                                >
                                    {isEditing ? (
                                        <><Save className="w-4 h-4" /> Save</>
                                    ) : (
                                        'Edit Profile'
                                    )}
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3 mb-2">
                                    <Mail className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Email</span>
                                </div>
                                {isEditing ? (
                                    <input
                                        type="email"
                                        className="text-slate-900 font-medium bg-transparent border-b border-orange-500 focus:outline-none w-full"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                ) : (
                                    <p className="text-slate-900 font-medium">{currentUser?.email || '—'}</p>
                                )}
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3 mb-2">
                                    <Shield className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Role</span>
                                </div>
                                <p className="text-slate-900 font-medium">{roleName} Account</p>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                        </div>
                    </div>
                </div>
            </div>

            {/* Reset / Change Password Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden max-w-2xl mt-8">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-50 dark:bg-orange-950/40 text-orange-600 rounded-lg">
                            <KeyRound className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base">Reset / Change Password</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Ensure your account is using a secure password</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                            Current Password
                        </label>
                        <div className="relative">
                            <input
                                type={showCurPwd ? 'text' : 'password'}
                                value={pwdData.currentPassword}
                                onChange={e => setPwdData({ ...pwdData, currentPassword: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-orange-500 outline-none pr-10"
                                placeholder="Enter your current password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurPwd(!showCurPwd)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                tabIndex={-1}
                            >
                                {showCurPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showNewPwd ? 'text' : 'password'}
                                    value={pwdData.newPassword}
                                    onChange={e => setPwdData({ ...pwdData, newPassword: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-orange-500 outline-none pr-10"
                                    placeholder="At least 6 characters"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPwd(!showNewPwd)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    tabIndex={-1}
                                >
                                    {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfPwd ? 'text' : 'password'}
                                    value={pwdData.confirmPassword}
                                    onChange={e => setPwdData({ ...pwdData, confirmPassword: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-orange-500 outline-none pr-10"
                                    placeholder="Repeat new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfPwd(!showConfPwd)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    tabIndex={-1}
                                >
                                    {showConfPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                        <button
                            type="submit"
                            disabled={pwdBusy}
                            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white rounded-lg font-semibold text-sm shadow-sm transition-colors flex items-center gap-2"
                        >
                            {pwdBusy ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                            ) : (
                                <KeyRound className="w-4 h-4" />
                            )}
                            {pwdBusy ? 'Updating...' : 'Update Password'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="mt-8 p-6 bg-blue-50 border border-blue-100 rounded-2xl max-w-2xl">
                <h3 className="text-blue-900 font-bold mb-2 flex items-center gap-2">
                    <Shield className="w-5 h-5" /> Local-Only Mode Active
                </h3>
                <p className="text-blue-700 text-sm">
                    This application is running entirely on your local device. Your data is stored in your browser's local storage and is never sent to any server. Remember to use the "Backup Data" feature in the sidebar to keep your data safe.
                </p>
            </div>

            {/* Original Profile Picture Modal */}
            <ImageModal
                isOpen={showImageModal}
                onClose={() => setShowImageModal(false)}
                imageUrl={formData.photo}
                title={formData.name || 'Admin'}
                subtitle="Administrator Profile Picture"
            />
        </div>
    );
};

export default Profile;
