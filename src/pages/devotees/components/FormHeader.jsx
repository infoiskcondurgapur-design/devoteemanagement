import React from 'react';
import { ChevronRight, Save, Loader2 } from 'lucide-react';

const FormHeader = ({ name, isEdit, navigate, handleSubmit, isSaving }) => {
    return (
        <div className="flex items-center justify-between mb-6">
            <div>
                <nav className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-1">
                    <span className="cursor-pointer hover:text-blue-600" onClick={() => navigate('/devotees')}>Devotees</span>
                    <ChevronRight className="w-4 h-4 mx-1" />
                    <span className="font-medium text-slate-900">{isEdit ? 'Edit Profile' : 'New Registration'}</span>
                </nav>
                <h1 className="text-2xl font-bold text-slate-900">{name || 'New Devotee'}</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {isEdit ? `Last modified: ${new Date().toLocaleDateString()}` : `Created: ${new Date().toLocaleDateString()}`}
                </p>
            </div>
            <div className="flex gap-3">
                <button onClick={() => navigate('/devotees')} className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 dark:bg-slate-900/50 transition-colors shadow-sm">
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={isSaving}
                    className="px-6 py-2 bg-[#0056b3] text-white rounded text-sm font-medium shadow-sm hover:bg-blue-700 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSaving ? 'Saving...' : 'Save & Finish'}
                </button>
            </div>
        </div>
    );
};

export default FormHeader;
