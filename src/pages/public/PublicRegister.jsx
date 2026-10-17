import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Heart, BookOpen, CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react';
import { devoteeSchema } from '../devotees/devoteeSchema';
import apiService from '../../services/api';
import { compressImage } from '../../lib/imageCompression';

// Reuses the admin wizard steps — they are presentational and need only a FormProvider.
import VerticalNav from '../devotees/components/VerticalNav';
import StepNavigation from '../devotees/components/StepNavigation';
import PersonalDetailsStep from '../devotees/components/PersonalDetailsStep';
import SpiritualLifeStep from '../devotees/components/SpiritualLifeStep';
import FamilyMiscStep from '../devotees/components/FamilyMiscStep';

const MAX_PHOTO_BASE64_CHARS = 14000000;

const steps = [
    { id: 1, name: 'Personal Details', icon: User },
    { id: 2, name: 'Spiritual Life', icon: BookOpen },
    { id: 3, name: 'Family & Misc', icon: Heart },
];

const PublicRegister = () => {
    const defaultValues = {
        name: '', spiritualName: '', email: '', gender: 'Male', dob: '', age: '',
        bloodGroup: '', education: '', occupation: '', relationType: 'Father',
        guardianName: '', contact: '', whatsapp: '',
        address: '', village: '', district: '', pinCode: '', state: 'West Bengal',
        maritalStatus: 'Single', skills: '', specialDay: '', specialDayName: '',
        spiritualStatus: 'Aspiring', initiatedName: '', counselor: '', spiritualMaster: '',
        shelterDate: '', initiatedDate1: '', initiatedDate2: '', rounds: '',
        followingPrinciplesSince: '', booksRead: [], booksReading: '', courses: [],
        anniversary: '', shraddhaName: '', shraddhaDate: '',
        feedback: '',
        child1Name: '', child1Dob: '', child1Status: 'None',
        child2Name: '', child2Dob: '', child2Status: 'None',
        child3Name: '', child3Dob: '', child3Status: 'None',
        otherFamilyMembers: '',
        currentService: '',
        photo: '',
    };

    const methods = useForm({
        resolver: zodResolver(devoteeSchema),
        defaultValues,
        mode: 'onTouched'
    });

    const { handleSubmit, watch, setValue } = methods;
    const formData = watch();

    const [currentStep, setCurrentStep] = useState(1);
    const [, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [sameAsContact, setSameAsContact] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [serverError, setServerError] = useState('');
    const [submitted, setSubmitted] = useState(null);
    const [honeypot, setHoneypot] = useState('');

    // Age auto-calculation
    useEffect(() => {
        if (formData.dob) {
            const birthDate = new Date(formData.dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
            setValue('age', age >= 0 ? age.toString() : '', { shouldValidate: true });
        }
    }, [formData.dob, setValue]);

    // WhatsApp sync with contact
    useEffect(() => {
        if (sameAsContact) setValue('whatsapp', formData.contact, { shouldValidate: true });
    }, [formData.contact, sameAsContact, setValue]);

    const handleNextStep = async () => {
        let fieldsToValidate = [];
        if (currentStep === 1) fieldsToValidate = ['name', 'contact'];
        if (currentStep === 2) fieldsToValidate = ['spiritualStatus'];
        const isStepValid = await methods.trigger(fieldsToValidate);
        if (isStepValid) setCurrentStep(s => Math.min(s + 1, steps.length));
    };

    const handlePrevStep = () => setCurrentStep(s => Math.max(s - 1, 1));

    const handleChange = async (e) => {
        const { name, files } = e.target;
        if (name === 'photo' && files?.[0]) {
            const file = files[0];
            setSelectedFile(file);
            try {
                const compressed = await compressImage(file, 500, 0.75);
                setPreviewUrl(compressed);
            } catch {
                const reader = new FileReader();
                reader.onloadend = () => setPreviewUrl(reader.result);
                reader.readAsDataURL(file);
            }
        }
    };

    const onFormSubmit = async (data) => {
        setServerError('');
        setIsSaving(true);
        try {
            const payload = { ...data, website: honeypot };

            // Inline the photo as base64 — the server uploads it to Cloudinary
            // through the rate-limited public endpoint (no /api/upload access).
            if (previewUrl && previewUrl.startsWith('data:image/')) {
                if (previewUrl.length > MAX_PHOTO_BASE64_CHARS) {
                    throw new Error('Photo is too large (max 10 MB)');
                }
                payload.photo = previewUrl;
            }

            const result = await apiService.post('/api/public/register', payload);
            if (!result.success) throw new Error(result.error || 'Registration failed');
            setSubmitted({ id: result.id });
        } catch (err) {
            setServerError(err.message || 'Registration failed. Please try again.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsSaving(false);
        }
    };

    const onFormError = (errors) => {
        const firstErrorKey = Object.keys(errors)[0];
        if (firstErrorKey) {
            const step1Fields = ['name', 'spiritualName', 'email', 'gender', 'dob', 'age', 'bloodGroup', 'education', 'occupation', 'relationType', 'guardianName', 'contact', 'whatsapp', 'address', 'village', 'district', 'pinCode', 'state', 'maritalStatus', 'skills', 'specialDay', 'specialDayName'];
            const step2Fields = ['spiritualStatus', 'initiatedName', 'counselor', 'spiritualMaster', 'shelterDate', 'initiatedDate1', 'initiatedDate2', 'rounds', 'followingPrinciplesSince', 'booksRead', 'booksReading', 'courses'];
            if (step1Fields.includes(firstErrorKey)) setCurrentStep(1);
            else if (step2Fields.includes(firstErrorKey)) setCurrentStep(2);
            else setCurrentStep(3);
            setServerError(errors[firstErrorKey].message || 'Please check all fields.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const resetForm = () => {
        setSubmitted(null);
        setServerError('');
        setPreviewUrl(null);
        setSelectedFile(null);
        setCurrentStep(1);
        methods.reset(defaultValues);
    };

    // ─── Success screen ────────────────────────────────────────────────
    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-2">Registration Submitted!</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
                        Thank you for registering. Your details will be reviewed by an administrator and added shortly.
                    </p>
                    {submitted.id && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mb-6 font-mono bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
                            Reference: {submitted.id}
                        </p>
                    )}
                    <button
                        onClick={resetForm}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0056b3] text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" /> Register Another Devotee
                    </button>
                </div>
            </div>
        );
    }

    // ─── Form ──────────────────────────────────────────────────────────
    return (
        <FormProvider {...methods}>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900/50 pb-12 px-4 py-8">
                <div className="max-w-6xl mx-auto w-full">
                    {/* Branding header */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-orange-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
                            <User size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Devotee Registration</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Fill in your details — an administrator will review your submission.</p>
                        </div>
                    </div>

                    {serverError && (
                        <div className="mb-6 flex items-start gap-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-lg px-4 py-3 text-sm">
                            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{serverError}</span>
                        </div>
                    )}

                    <div className="flex gap-6 items-start">
                        <div className="hidden lg:block">
                            <VerticalNav steps={steps} currentStep={currentStep} setCurrentStep={setCurrentStep} isEdit={false} />
                        </div>

                        <div className="flex-1 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 min-h-[500px] w-full min-w-0">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{steps[currentStep - 1].name}</h2>
                                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Step {currentStep} of {steps.length}</span>
                            </div>

                            <div className="p-4 sm:p-8">
                                <form className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300" onSubmit={handleSubmit(onFormSubmit, onFormError)}>
                                    {currentStep === 1 && (
                                        <PersonalDetailsStep
                                            formData={formData}
                                            handleChange={handleChange}
                                            previewUrl={previewUrl}
                                            sameAsContact={sameAsContact}
                                            setSameAsContact={setSameAsContact}
                                        />
                                    )}
                                    {currentStep === 2 && (
                                        <SpiritualLifeStep formData={formData} />
                                    )}
                                    {currentStep === 3 && (
                                        <FamilyMiscStep formData={formData} />
                                    )}

                                    {/* Honeypot — invisible to humans, tempting for bots */}
                                    <input
                                        type="text"
                                        name="website"
                                        value={honeypot}
                                        onChange={(e) => setHoneypot(e.target.value)}
                                        tabIndex={-1}
                                        autoComplete="off"
                                        aria-hidden="true"
                                        className="absolute left-[-9999px] w-px h-px opacity-0"
                                    />
                                </form>

                                <StepNavigation
                                    currentStep={currentStep}
                                    stepsCount={steps.length}
                                    handlePrevStep={handlePrevStep}
                                    handleNextStep={handleNextStep}
                                    handleSubmit={handleSubmit(onFormSubmit, onFormError)}
                                    isSaving={isSaving}
                                    submitLabel="Submit Registration"
                                />
                            </div>
                        </div>
                    </div>

                    <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
                        Your information is used only for temple records and will be reviewed before publication.
                    </p>
                </div>
            </div>
        </FormProvider>
    );
};

export default PublicRegister;
