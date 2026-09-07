import React from 'react';
import { useFormContext } from 'react-hook-form';
import { CorporateInput, CorporateSelect } from '../../../components/FormControls';

const FamilyMiscStep = () => {
    const { register } = useFormContext();

    return (
        <div className="space-y-8">
            {/* 16. Anniversary */}
            <div className="w-full md:w-1/2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold">1</span>
                    Anniversary
                </h3>
                <CorporateInput label="Date of Anniversary" type="date" {...register('anniversary')} />
            </div>

            {/* 17. Child Details */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-900/50/50 px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold">2</span>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Child Details</h3>
                </div>
                <div className="p-5 overflow-x-auto">
                    <div className="min-w-[600px]">
                        <div className="grid grid-cols-3 gap-4 mb-3 px-2">
                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</div>
                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date of Birth</div>
                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Spiritual Status</div>
                        </div>
                        <div className="space-y-3">
                            {[1, 2, 3].map(num => (
                                <div key={num} className="grid grid-cols-3 gap-4 p-2 rounded-lg hover:bg-slate-50 dark:bg-slate-900/50 transition-colors">
                                    <CorporateInput {...register(`child${num}Name`)} placeholder={`Child ${num} Name`} />
                                    <CorporateInput type="date" {...register(`child${num}Dob`)} />
                                    <CorporateSelect options={['None', 'Aspiring', 'Sheltered', 'Initiated']} {...register(`child${num}Status`)} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 18. Special Dates */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-900/50/50 px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold">3</span>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Special Dates & Memorials</h3>
                </div>
                <div className="p-5 space-y-6">
                    <div>
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">Annual Shraddha Ceremony</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <CorporateInput placeholder="Name of Person" {...register('shraddhaName')} />
                            <CorporateInput type="date" {...register('shraddhaDate')} />
                        </div>
                    </div>
                    <div className="h-px bg-slate-100 dark:bg-slate-800 w-full"></div>
                    <div>
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">Other Special Day</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <CorporateInput placeholder="Name of Event" {...register('specialDayName')} />
                            <CorporateInput type="date" {...register('specialDay')} />
                        </div>
                    </div>
                </div>
            </div>

            {/* 19. Feedback */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold">4</span>
                    Feedback & Notes
                </h3>
                <textarea
                    {...register('feedback')}
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400
                             focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:bg-slate-900 hover:border-slate-300 dark:border-slate-600 transition-all duration-200 resize-y"
                    placeholder="Enter any additional feedback or notes here..."
                />
            </div>
        </div>
    );
};

export default FamilyMiscStep;
