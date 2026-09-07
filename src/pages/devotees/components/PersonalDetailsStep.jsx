import React from 'react';
import { User, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { CorporateInput, CorporateSelect } from '../../../components/FormControls';

const PersonalDetailsStep = ({ handleChange, previewUrl, sameAsContact, setSameAsContact }) => {
    const { register, formState: { errors } } = useFormContext();

    return (
        <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 md:col-span-9 space-y-8">
                {/* 1. Basic Info */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold">1</span>
                        Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                        <div className="md:col-span-8">
                            <CorporateInput 
                                label="Full Name" 
                                {...register('name')} 
                                required 
                                error={!!errors.name} 
                            />
                            {errors.name && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" />{errors.name.message}</p>}
                        </div>
                        <div className="md:col-span-4">
                            <CorporateSelect
                                label="Gender"
                                options={['Male', 'Female', 'Other']}
                                {...register('gender')}
                            />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mt-5">
                        <div className="md:col-span-4">
                            <CorporateSelect
                                label="Relationship"
                                options={['Father', 'Husband', 'Wife']}
                                {...register('relationType')}
                            />
                        </div>
                        <div className="md:col-span-8">
                            <CorporateInput
                                label="Relative Name"
                                {...register('guardianName')}
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Personal Demographics */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm space-y-5">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold">2</span>
                        Personal Demographics
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <CorporateInput label="Date of Birth" type="date" {...register('dob')} />
                        <CorporateInput label="Age" {...register('age')} readOnly placeholder="Auto-calculated" className="opacity-80" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <CorporateSelect label="Blood Group" options={['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']} {...register('bloodGroup')} />
                        <CorporateSelect label="Marital Status" options={['Single', 'Married', 'Divorced', 'Widowed']} {...register('maritalStatus')} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <CorporateInput label="Education" {...register('education')} />
                        <CorporateInput label="Occupation" {...register('occupation')} />
                    </div>
                </div>

                {/* 3. Contact Details */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm space-y-5">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold">3</span>
                        Contact Details
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="flex flex-col">
                            <CorporateInput 
                                label="Primary Contact No." 
                                {...register('contact')} 
                                required 
                                error={!!errors.contact} 
                            />
                            {errors.contact && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" />{errors.contact.message}</p>}
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">WhatsApp No.</label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${sameAsContact ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 group-hover:border-indigo-400'}`}>
                                        {sameAsContact && <CheckCircle2 className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:text-slate-200 select-none transition-colors">Same as Contact</span>
                                    <input 
                                        type="checkbox" 
                                        className="hidden" 
                                        checked={sameAsContact} 
                                        onChange={() => setSameAsContact(!sameAsContact)} 
                                    />
                                </label>
                            </div>
                            <input
                                {...register('whatsapp')}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:bg-slate-900 transition-all duration-200"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="flex flex-col md:col-span-2 lg:col-span-1">
                            <CorporateInput label="Email Address" {...register('email')} error={!!errors.email} />
                            {errors.email && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" />{errors.email.message}</p>}
                        </div>
                    </div>
                </div>

                {/* 4. Address */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm space-y-5">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold">4</span>
                        Address
                    </h3>
                    <CorporateInput label="Street / House No." {...register('address')} />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        <CorporateInput label="Village / City" {...register('village')} />
                        <CorporateInput label="District" {...register('district')} />
                        <CorporateInput label="State" {...register('state')} />
                        <CorporateInput label="Pin Code" {...register('pinCode')} />
                    </div>
                </div>
            </div>

            <div className="col-span-12 md:col-span-3">
                <div className="sticky top-24">
                    <div className="relative group w-full aspect-square bg-white dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden hover:border-indigo-400 hover:bg-indigo-50/30 transition-all duration-300 cursor-pointer mb-3 shadow-sm">
                        {previewUrl ? (
                            <div className="w-full h-full relative group-hover:after:content-['Change_Photo'] group-hover:after:absolute group-hover:after:inset-0 group-hover:after:bg-black/40 group-hover:after:flex group-hover:after:items-center group-hover:after:justify-center group-hover:after:text-white group-hover:after:font-medium group-hover:after:text-sm">
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                        ) : (
                            <div className="text-center p-5">
                                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3 text-indigo-500 group-hover:scale-110 transition-transform duration-300">
                                    <User className="w-6 h-6" />
                                </div>
                                <span className="block text-sm font-medium text-slate-600 dark:text-slate-300">Upload Photo</span>
                                <span className="block text-xs text-slate-400 dark:text-slate-500 mt-1">PNG, JPG up to 2MB</span>
                            </div>
                        )}
                        <input type="file" name="photo" onChange={handleChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PersonalDetailsStep;
