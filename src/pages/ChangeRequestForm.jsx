import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDevotees } from '../context/DevoteeContext';
import { useToast } from '../components/Toast';
import apiService from '../services/api';
import { Save, ArrowLeft, User, MessageSquare, FileText } from 'lucide-react';

const FIELD_LABELS = [
    { key: 'name', label: 'Full Name', icon: User },
    { key: 'spiritualName', label: 'Spiritual Name', icon: User },
    { key: 'email', label: 'Email', icon: MessageSquare },
    { key: 'gender', label: 'Gender', icon: User },
    { key: 'dob', label: 'Date of Birth', icon: Save },
    { key: 'age', label: 'Age', icon: Save },
    { key: 'bloodGroup', label: 'Blood Group', icon: Save },
    { key: 'education', label: 'Education', icon: FileText },
    { key: 'occupation', label: 'Occupation', icon: FileText },
    { key: 'contact', label: 'Contact Number', icon: MessageSquare },
    { key: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
    { key: 'address', label: 'Address', icon: Save },
    { key: 'village', label: 'Village', icon: Save },
    { key: 'district', label: 'District', icon: Save },
    { key: 'pinCode', label: 'Pin Code', icon: Save },
    { key: 'state', label: 'State', icon: Save },
    { key: 'maritalStatus', label: 'Marital Status', icon: Save },
    { key: 'spiritualStatus', label: 'Spiritual Status', icon: Save },
    { key: 'initiatedName', label: 'Initiated Name', icon: User },
    { key: 'counselor', label: 'Counselor', icon: User },
    { key: 'spiritualMaster', label: 'Spiritual Master', icon: User },
    { key: 'shelterDate', label: 'Date of Shelter', icon: Save },
    { key: 'initiatedDate1', label: '1st Initiation Date', icon: Save },
    { key: 'initiatedDate2', label: '2nd Initiation Date', icon: Save },
];

const ChangeRequestForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { devotees, getDevoteeById } = useDevotees();
    const toast = useToast();

    const [devotee, setDevotee] = useState(null);
    const [selectedFields, setSelectedFields] = useState({});
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const found = devotees.find(d => String(d.id) === String(id)) || null;
        if (found) {
            setDevotee(found);
        } else {
            getDevoteeById(id).then(f => setDevotee(f)).catch(() => {});
        }
    }, [id, devotees, getDevoteeById]);

    if (!isAuthenticated) {
        navigate('/login');
        return null;
    }

    const handleFieldToggle = (fieldKey) => {
        setSelectedFields(prev => {
            const next = { ...prev };
            if (next[fieldKey]) {
                delete next[fieldKey];
            } else {
                next[fieldKey] = '';
            }
            return next;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const fields = Object.keys(selectedFields);
        if (fields.length === 0) return toast.error('Select at least one field to change');
        if (!reason.trim()) return toast.error('Please provide a reason for the changes');

        const changes = {};
        fields.forEach(f => {
            changes[f] = selectedFields[f];
        });

        setSubmitting(true);
        try {
            const res = await apiService.post('/api/change-requests', {
                devoteeId: id,
                changes,
                reason: reason.trim()
            });
            if (res.success) {
                toast.success('Change request submitted successfully!');
                navigate('/my-requests');
            } else {
                toast.error(res.error || 'Failed to submit');
            }
        } catch {
            toast.error('Failed to submit change request');
        } finally {
            setSubmitting(false);
        }
    };

    if (!devotee) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="text-slate-400 dark:text-slate-500 mb-4"><User size={48} /></div>
                <h3 className="text-lg font-medium text-slate-900">Devotee Not Found</h3>
                <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:underline">Go Back</button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-12">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 text-slate-500 hover:text-orange-600 rounded-lg hover:bg-slate-100 dark:bg-slate-800 transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Request Changes</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        {devotee.name} — Select fields and describe your changes
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Current Profile Summary */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <User size={18} /> Current Profile
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {FIELD_LABELS.slice(0, 8).map(({ key, label }) => (
                            <div key={key} className="text-sm">
                                <span className="text-slate-500 dark:text-slate-400">{label}:</span>{' '}
                                <span className="font-medium text-slate-900">{devotee[key] || '--'}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Field Selection */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <Save size={18} /> Select Fields to Change
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {FIELD_LABELS.map(({ key, label, icon: Icon }) => (
                            <label key={key} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                                <input
                                    type="checkbox"
                                    checked={!!selectedFields[key]}
                                    onChange={() => handleFieldToggle(key)}
                                    className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                                />
                                <Icon size={14} className="text-slate-400" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* New Values */}
                {Object.keys(selectedFields).length > 0 && (
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">New Values</h3>
                        <div className="space-y-3">
                            {Object.keys(selectedFields).map(key => (
                                <div key={key}>
                                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                                        {FIELD_LABELS.find(f => f.key === key)?.label}
                                    </label>
                                    <input
                                        type="text"
                                        value={selectedFields[key]}
                                        onChange={(e) => setSelectedFields(prev => ({ ...prev, [key]: e.target.value }))}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500 outline-none"
                                        placeholder={`Enter new ${FIELD_LABELS.find(f => f.key === key)?.label?.toLowerCase()}`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Reason */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <FileText size={18} /> Reason
                    </h3>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                        placeholder="Explain why you want these changes..."
                    />
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={submitting || Object.keys(selectedFields).length === 0 || !reason.trim()}
                    className="w-full py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                    {submitting ? (
                        <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> Submitting...</>
                    ) : (
                        <><Save size={18} /> Submit Change Request</>
                    )}
                </button>
            </form>
        </div>
    );
};

export default ChangeRequestForm;
