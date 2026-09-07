import React from 'react';
import clsx from 'clsx';

export const CorporateInput = ({ label, icon: Icon, className, error, ...props }) => (
    <div className={className}>
        {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">{label} {props.required && <span className="text-red-500">*</span>}</label>}
        <div className="relative">
            <input
                {...props}
                className={clsx(
                    'w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50/50 border rounded-lg text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white dark:bg-slate-900 transition-all duration-200 disabled:bg-slate-100 dark:bg-slate-800 disabled:text-slate-500 dark:text-slate-400',
                    error
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-500/20'
                        : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20 hover:border-slate-300 dark:border-slate-600'
                )}
            />
        </div>
    </div>
);

export const CorporateSelect = ({ label, options, className, ...props }) => (
    <div className={className}>
        {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">{label}</label>}
        <div className="relative">
            <select
                {...props}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 appearance-none
                         focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:bg-slate-900 hover:border-slate-300 dark:border-slate-600 transition-all duration-200 cursor-pointer"
            >
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
        </div>
    </div>
);
