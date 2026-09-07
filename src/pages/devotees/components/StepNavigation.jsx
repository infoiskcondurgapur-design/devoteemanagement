import React from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react';

const StepNavigation = ({ currentStep, stepsCount, handlePrevStep, handleNextStep, handleSubmit, isSaving }) => {
    return (
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
            <button
                onClick={handlePrevStep}
                disabled={currentStep === 1}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
                <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="text-xs text-slate-400 dark:text-slate-500">Step {currentStep} of {stepsCount}</span>
            {currentStep < stepsCount ? (
                <button
                    onClick={handleNextStep}
                    className="flex items-center gap-2 px-5 py-2 bg-[#0056b3] text-white rounded text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                >
                    Next <ChevronRight className="w-4 h-4" />
                </button>
            ) : (
                <button
                    onClick={handleSubmit}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-60"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {isSaving ? 'Saving...' : 'Save & Finish'}
                </button>
            )}
        </div>
    );
};

export default StepNavigation;
