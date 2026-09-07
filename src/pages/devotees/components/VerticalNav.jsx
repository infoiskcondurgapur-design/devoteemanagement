import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

const VerticalNav = ({ steps, currentStep, setCurrentStep, isEdit }) => {
    return (
        <div className="w-64 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden sticky top-24 shrink-0">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50/50">
                <h3 className="font-semibold text-slate-700 dark:text-slate-200">Form Sections</h3>
            </div>
            <div>
                {steps.map((step) => {
                    const isActive = currentStep === step.id;
                    const isCompleted = currentStep > step.id || (isEdit && step.id < 3);

                    return (
                        <button
                            key={step.id}
                            onClick={() => setCurrentStep(step.id)}
                            className={clsx(
                                "w-full text-left px-4 py-4 flex items-center gap-3 text-sm font-medium transition-colors border-l-[3px]",
                                isActive
                                    ? "border-[#0056b3] bg-blue-50/50 text-[#0056b3]"
                                    : "border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900/50 hover:text-slate-900"
                            )}
                        >
                            <div className={clsx(
                                "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                                isActive ? "text-[#0056b3]" : isCompleted ? "text-green-500" : "text-slate-300"
                            )}>
                                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <step.icon className="w-4 h-4" />}
                            </div>
                            <span>{step.name}</span>
                        </button>
                    );
                })}
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 text-xs text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 mt-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-[#0056b3]"></span> Active
                    <span className="w-2 h-2 rounded-full bg-green-500 ml-2"></span> Completed
                </div>
                Press "Save" to apply changes.
            </div>
        </div>
    );
};

export default VerticalNav;
