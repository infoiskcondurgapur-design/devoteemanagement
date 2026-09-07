import React from 'react';
import { useFormContext } from 'react-hook-form';
import { COUNSELORS_LIST } from '../../../data/counselors';
import { SPIRITUAL_MASTERS_LIST } from '../../../data/spiritualMasters';
import { CorporateInput, CorporateSelect } from '../../../components/FormControls';

const SpiritualLifeStep = () => {
    const { register, watch, setValue } = useFormContext();
    const spiritualStatus = watch('spiritualStatus');
    const courses = watch('courses') || [];
    const booksRead = watch('booksRead') || [];

    return (
        <div className="space-y-8">
            {/* Spiritual Status & Names */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold">1</span>
                    Spiritual Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <CorporateSelect
                        label="Spiritual Status"
                        options={['Aspiring', 'Sheltered', 'Initiated']}
                        {...register('spiritualStatus')}
                    />
                    <CorporateInput
                        label={spiritualStatus === 'Initiated' ? 'Initiated Name' : 'Spiritual Name'}
                        {...register('spiritualName', {
                            onChange: (e) => {
                                if (spiritualStatus === 'Initiated') {
                                    setValue('initiatedName', e.target.value);
                                }
                            }
                        })}
                        placeholder={spiritualStatus === 'Initiated' ? 'Enter Initiated Name' : 'Enter Spiritual Name (if any)'}
                    />
                </div>
            </div>

            {/* Mentorship & Initiation */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm space-y-6">
                <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold">2</span>
                        Mentorship & Initiation
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <CorporateSelect label="Counselor Name" options={COUNSELORS_LIST} {...register('counselor')} />
                        {(spiritualStatus === 'Sheltered' || spiritualStatus === 'Initiated') && (
                            <CorporateInput
                                label="Date of Shelter"
                                type="date"
                                {...register('shelterDate')}
                            />
                        )}
                    </div>
                </div>

                {/* Initiation Details - Conditionally Enabled */}
                <div className={`p-5 rounded-lg border transition-all duration-300 ${spiritualStatus === 'Initiated' ? 'bg-indigo-50/30 border-indigo-100' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 opacity-60'}`}>
                    <h4 className={`text-sm font-semibold mb-4 flex items-center justify-between ${spiritualStatus === 'Initiated' ? 'text-indigo-800' : 'text-slate-600 dark:text-slate-300'}`}>
                        <span>Initiation Information</span>
                        {spiritualStatus !== 'Initiated' && <span className="text-xs bg-slate-200 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-md font-medium">Available when Initiated</span>}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="col-span-1 md:col-span-2">
                            <CorporateSelect
                                label="Spiritual Master"
                                options={SPIRITUAL_MASTERS_LIST}
                                {...register('spiritualMaster')}
                                disabled={spiritualStatus !== 'Initiated'}
                            />
                        </div>
                        <CorporateInput
                            label="1st Initiation Date"
                            type="date"
                            {...register('initiatedDate1')}
                            disabled={spiritualStatus !== 'Initiated'}
                        />
                        <CorporateInput
                            label="2nd Initiation Date"
                            type="date"
                            {...register('initiatedDate2')}
                            disabled={spiritualStatus !== 'Initiated'}
                        />
                    </div>
                </div>
            </div>

            {/* Courses & Reading */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-900/50/50 px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold">3</span>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Education & Reading</h3>
                </div>
                
                <div className="p-5 space-y-8">
                    {/* Courses */}
                    <div>
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">Courses Completed</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {['IDC', 'Vaishnav Sadachar', 'Bhakti Sastri', 'Pujari Course', 'Bhakti Vaibhav'].map(course => (
                                <label key={course} className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer transition-all">
                                    <input
                                        type="checkbox"
                                        value={course}
                                        checked={courses.includes(course)}
                                        onChange={(e) => {
                                            const newCourses = e.target.checked
                                                ? [...courses, course]
                                                : courses.filter(c => c !== course);
                                            setValue('courses', newCourses);
                                        }}
                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600"
                                    />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{course}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-slate-100 dark:bg-slate-800 w-full"></div>

                    {/* Books Read */}
                    <div>
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">Books Read (Prabhupada's Books)</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-60 overflow-y-auto p-1 pr-2">
                            {['Bhagavad-gita As It Is', 'Srimad-Bhagavatam', 'Chaitanya Charitamrita', 'Nectar of Devotion', 'Nectar of Instruction', 'Isopanisad', 'Krsna Book', 'Teachings of Lord Caitanya', 'Science of Self Realization', 'Raja Vidya', 'Beyond Birth & Death', 'Perfection of Yoga'].map(book => (
                                <label key={book} className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer transition-all">
                                    <input
                                        type="checkbox"
                                        value={book}
                                        checked={booksRead.includes(book) || false}
                                        onChange={(e) => {
                                            const newBooks = e.target.checked
                                                ? [...booksRead, book]
                                                : booksRead.filter(b => b !== book);
                                            setValue('booksRead', newBooks);
                                        }}
                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600"
                                    />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate" title={book}>{book}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Information */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold">4</span>
                    Additional Information
                </h3>
                <div className="space-y-5">
                    <CorporateInput
                        label="Other Initiated/Sheltered Family Members"
                        {...register('otherFamilyMembers')}
                        placeholder="Enter names"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <CorporateInput
                            label="Experience / Skills"
                            {...register('skills')}
                            placeholder="e.g. Diety Dress Maker, Cooking, etc."
                        />
                        <CorporateInput
                            label="Current Devotional Service"
                            {...register('currentService')}
                            placeholder="What service are you performing in the temple?"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SpiritualLifeStep;
