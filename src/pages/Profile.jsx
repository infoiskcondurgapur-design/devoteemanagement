import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Camera, Save, Maximize2 } from 'lucide-react';
import ImageModal from '../components/ImageModal';

const Profile = () => {
    const { currentUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [formData, setFormData] = useState({
        name: currentUser?.name || '',
        email: currentUser?.email || '',
        photo: currentUser?.photo || ''
    });

    const handleSave = () => {
        setIsEditing(false);
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

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Admin Profile</h1>

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
                                    <h2 className="text-2xl font-bold text-slate-900">{currentUser?.name}</h2>
                                )}
                                <p className="text-slate-500 dark:text-slate-400">{currentUser?.email}</p>
                            </div>
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
                                    <p className="text-slate-900 font-medium">{currentUser?.email}</p>
                                )}
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3 mb-2">
                                    <Shield className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Role</span>
                                </div>
                                <p className="text-slate-900 font-medium">Local Administrator</p>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                        </div>
                    </div>
                </div>
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
