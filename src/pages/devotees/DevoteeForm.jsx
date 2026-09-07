import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDevotees } from '../../context/DevoteeContext';
import { User, Heart, BookOpen } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { devoteeSchema } from './devoteeSchema';

// Sub-components
import FormHeader from './components/FormHeader';
import VerticalNav from './components/VerticalNav';
import StepNavigation from './components/StepNavigation';
import PersonalDetailsStep from './components/PersonalDetailsStep';
import SpiritualLifeStep from './components/SpiritualLifeStep';
import FamilyMiscStep from './components/FamilyMiscStep';

const DevoteeForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;
    const { addDevotee, updateDevotee, devotees, findDuplicate } = useDevotees();
    const toast = useToast();
    const [isSaving, setIsSaving] = useState(false);

    // Initial default values
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

    // React Hook Form
    const methods = useForm({
        resolver: zodResolver(devoteeSchema),
        defaultValues,
        mode: 'onTouched'
    });

    const { handleSubmit, reset, watch, setValue } = methods;
    const formData = watch(); // Get all form values for effects and passing down

    const [currentStep, setCurrentStep] = useState(1);
    const [duplicateFound, setDuplicateFound] = useState(null);
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [sameAsContact, setSameAsContact] = useState(false);

    // Initialize Edit Data
    useEffect(() => {
        if (isEdit) {
            const devoteeToEdit = devotees.find(d => d.id === id);
            if (devoteeToEdit) {
                const rounds = devoteeToEdit.rounds || devoteeToEdit.japaRounds || '';
                
                // Parse JSON strings back into arrays for the form fields
                let parsedBooksRead = [];
                let parsedCourses = [];
                
                try {
                    if (typeof devoteeToEdit.booksRead === 'string' && devoteeToEdit.booksRead.startsWith('[')) {
                        parsedBooksRead = JSON.parse(devoteeToEdit.booksRead);
                    } else if (Array.isArray(devoteeToEdit.booksRead)) {
                        parsedBooksRead = devoteeToEdit.booksRead;
                    } else if (typeof devoteeToEdit.booksRead === 'string' && devoteeToEdit.booksRead.trim() !== '') {
                         parsedBooksRead = devoteeToEdit.booksRead.split(',').map(s => s.trim());
                    }

                    if (typeof devoteeToEdit.courses === 'string' && devoteeToEdit.courses.startsWith('[')) {
                        parsedCourses = JSON.parse(devoteeToEdit.courses);
                    } else if (Array.isArray(devoteeToEdit.courses)) {
                        parsedCourses = devoteeToEdit.courses;
                    } else if (typeof devoteeToEdit.courses === 'string' && devoteeToEdit.courses.trim() !== '') {
                        parsedCourses = devoteeToEdit.courses.split(',').map(s => s.trim());
                    }
                } catch (e) {
                    console.error("Error parsing booksRead or courses", e);
                }

                // Clean up any null values from the database to empty strings or default values
                const sanitizedDevotee = {};
                Object.keys(devoteeToEdit).forEach(key => {
                    sanitizedDevotee[key] = devoteeToEdit[key] === null ? (defaultValues[key] ?? '') : devoteeToEdit[key];
                });

                reset({ 
                    ...defaultValues, 
                    ...sanitizedDevotee, 
                    rounds,
                    booksRead: parsedBooksRead,
                    courses: parsedCourses
                });
                if (devoteeToEdit.photo) setPreviewUrl(devoteeToEdit.photo);
            }
        }
    }, [isEdit, id, devotees, reset]);

    // Age Calculation Effect
    useEffect(() => {
        if (formData.dob) {
            const birthDate = new Date(formData.dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            setValue('age', age >= 0 ? age.toString() : '', { shouldValidate: true });
        }
    }, [formData.dob, setValue]);

    // WhatsApp Sync Effect
    useEffect(() => {
        if (sameAsContact) {
            setValue('whatsapp', formData.contact, { shouldValidate: true });
        }
    }, [formData.contact, sameAsContact, setValue]);

    const handleNextStep = async () => {
        // Validate fields for the current step before moving forward
        let fieldsToValidate = [];
        if (currentStep === 1) fieldsToValidate = ['name', 'contact'];
        if (currentStep === 2) fieldsToValidate = ['spiritualStatus'];

        const isStepValid = await methods.trigger(fieldsToValidate);
        if (isStepValid) setCurrentStep(s => Math.min(s + 1, steps.length));
    };

    const handlePrevStep = () => {
        setCurrentStep(s => Math.max(s - 1, 1));
    };

    const onFormSubmit = async (data) => {
        const duplicate = findDuplicate(data, id);
        if (duplicate && !isEdit) {
            setDuplicateFound(duplicate);
            setShowDuplicateModal(true);
            return;
        }
        await performSave(data);
    };

    const performSave = async (data = formData) => {
        setIsSaving(true);
        try {
            if (isEdit) await updateDevotee(id, data, selectedFile);
            else await addDevotee(data, selectedFile);
            toast.success(isEdit ? 'Devotee updated successfully!' : 'New devotee registered successfully!');
            navigate('/devotees');
        } catch (err) {
            toast.error('Save failed: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const onFormError = (errors) => {
        console.error("Form Validation Errors:", errors);
        const firstErrorKey = Object.keys(errors)[0];
        
        if (firstErrorKey) {
            const step1Fields = ['name', 'spiritualName', 'email', 'gender', 'dob', 'age', 'bloodGroup', 'education', 'occupation', 'relationType', 'guardianName', 'contact', 'whatsapp', 'address', 'village', 'district', 'pinCode', 'state', 'maritalStatus', 'skills', 'specialDay', 'specialDayName'];
            const step2Fields = ['spiritualStatus', 'initiatedName', 'counselor', 'spiritualMaster', 'shelterDate', 'initiatedDate1', 'initiatedDate2', 'rounds', 'followingPrinciplesSince', 'booksRead', 'booksReading', 'courses'];
            
            if (step1Fields.includes(firstErrorKey)) setCurrentStep(1);
            else if (step2Fields.includes(firstErrorKey)) setCurrentStep(2);
            else setCurrentStep(3);

            toast.error(`Validation Error: ${errors[firstErrorKey].message || 'Please check all fields.'}`);
        } else {
            toast.error('Please fix the errors in the form before saving.');
        }
    };

    const steps = [
        { id: 1, name: 'Personal Details', icon: User },
        { id: 2, name: 'Spiritual Life', icon: BookOpen },
        { id: 3, name: 'Family & Misc', icon: Heart },
    ];

    const handleChange = (e) => {
        const { name, files } = e.target;
        if (name === 'photo' && files?.[0]) {
            const file = files[0];
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreviewUrl(reader.result);
            reader.readAsDataURL(file);
        }
    };

    return (
        <FormProvider {...methods}>
            <div className="max-w-7xl mx-auto pb-12 w-full">
                <FormHeader name={formData.name} isEdit={isEdit} navigate={navigate} handleSubmit={handleSubmit(onFormSubmit, onFormError)} isSaving={isSaving} />

                <div className="flex gap-6 items-start">
                    <VerticalNav steps={steps} currentStep={currentStep} setCurrentStep={setCurrentStep} isEdit={isEdit} />

                    <div className="flex-1 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 min-h-[500px]">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{steps[currentStep - 1].name}</h2>
                            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Step {currentStep} of {steps.length}</span>
                        </div>

                        <div className="p-8">
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
                                    <SpiritualLifeStep
                                        formData={formData}
                                    />
                                )}
                                {currentStep === 3 && (
                                    <FamilyMiscStep
                                        formData={formData}
                                    />
                                )}
                            </form>

                            <StepNavigation
                                currentStep={currentStep}
                                stepsCount={steps.length}
                                handlePrevStep={handlePrevStep}
                                handleNextStep={handleNextStep}
                                handleSubmit={handleSubmit(onFormSubmit, onFormError)}
                                isSaving={isSaving}
                            />
                        </div>
                    </div>
                </div>

                {/* Duplicate Modal */}
                {showDuplicateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-md p-6">
                            <div className="flex items-center gap-3 text-amber-600 mb-4">
                                <span className="text-2xl">⚠️</span>
                                <h3 className="text-lg font-bold">Duplicate Profile Found</h3>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 mb-6">
                                A devotee named <strong>{duplicateFound?.name}</strong> already exists.
                                Creating a new profile may result in data inconsistency.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => { setShowDuplicateModal(false); navigate(`/devotees/${duplicateFound?.id}`); }}
                                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:bg-slate-900/50"
                                >
                                    View Existing
                                </button>
                                <button
                                    onClick={() => { setShowDuplicateModal(false); performSave(methods.getValues()); }}
                                    className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
                                >
                                    Create Anyway
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </FormProvider>
    );
};

export default DevoteeForm;
