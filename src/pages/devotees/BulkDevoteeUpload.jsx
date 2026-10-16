import React, { useState, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
    ArrowLeft, Upload, Download, FileSpreadsheet, CheckCircle2, 
    AlertTriangle, XCircle, Info, Users, RefreshCw, Check, 
    FileText, HelpCircle, Filter, Trash2, ArrowRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useDevotees } from '../../context/DevoteeContext';
import { useToast } from '../../components/Toast';
import clsx from 'clsx';

// Column synonym mappings to accommodate spreadsheets from different temples/sources
const COLUMN_ALIASES = {
    name: ['name', 'full name', 'devotee name', 'devotee', 'legal name', 'first name', 'naam'],
    spiritualName: ['spiritual name', 'spiritualname', 'initiated name', 'initiatedname', 'diksha name', 'harinaam', 'spiritual title'],
    contact: ['contact', 'mobile', 'mobile no', 'mobile number', 'phone', 'phone no', 'phone number', 'contact no', 'contact number', 'cell'],
    whatsapp: ['whatsapp', 'wa', 'whatsapp no', 'whatsapp number', 'wa no', 'wa number'],
    email: ['email', 'e-mail', 'mail', 'email id', 'email address'],
    gender: ['gender', 'sex', 'm/f'],
    dob: ['dob', 'date of birth', 'birth date', 'birthdate'],
    age: ['age'],
    bloodGroup: ['blood group', 'bloodgroup', 'blood', 'bg'],
    maritalStatus: ['marital status', 'maritalstatus', 'marriage status'],
    anniversary: ['anniversary', 'marriage anniversary', 'wedding date'],
    education: ['education', 'qualification', 'degree'],
    occupation: ['occupation', 'profession', 'job', 'work'],
    guardianName: ['guardian name', 'guardian', 'father name', 'father', 'husband name', 'husband', 'care of', 'c/o'],
    relationType: ['relation type', 'relation', 'relationship'],
    address: ['address', 'residence', 'residential address', 'street'],
    village: ['village', 'city', 'town', 'area'],
    district: ['district', 'dist', 'zilla'],
    state: ['state', 'province'],
    pinCode: ['pincode', 'pin code', 'pin', 'postal code', 'zip', 'zipcode'],
    counselor: ['counselor', 'counselor name', 'mentor', 'guide'],
    spiritualStatus: ['spiritual status', 'status of devotion', 'devotional status', 'stage'],
    spiritualMaster: ['spiritual master', 'guru', 'diksha guru', 'guru maharaj'],
    shelterDate: ['shelter date', 'ashraya date', 'sheltered date'],
    initiatedDate1: ['1st initiation date', 'first initiation date', 'harinaam date', 'initiation date', 'initiated date 1'],
    initiatedDate2: ['2nd initiation date', 'second initiation date', 'brahminical initiation date', 'brahmin date', 'initiated date 2'],
    rounds: ['rounds', 'japa rounds', 'chanting rounds', 'mala'],
    followingPrinciplesSince: ['following principles since', '4 regulative principles', 'principles since'],
    currentService: ['current service', 'seva', 'current seva', 'service']
};

const normalizePhone = (val) => {
    if (!val) return '';
    let digits = String(val).replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) {
        digits = digits.slice(2);
    } else if (digits.length === 11 && digits.startsWith('0')) {
        digits = digits.slice(1);
    }
    return digits;
};

const normalizeGender = (val) => {
    if (!val) return 'Male';
    const s = String(val).trim().toLowerCase();
    if (s.startsWith('f') || s.includes('female') || s.includes('mataji')) return 'Female';
    if (s.startsWith('m') || s.includes('male') || s.includes('prabhuji')) return 'Male';
    return 'Other';
};

const normalizeSpiritualStatus = (val, defaultVal = 'Aspiring') => {
    if (!val) return defaultVal;
    const s = String(val).trim().toLowerCase();
    if (s.includes('initiat') || s.includes('diksha') || s.includes('2nd') || s.includes('1st')) return 'Initiated';
    if (s.includes('shelt') || s.includes('ashray')) return 'Sheltered';
    if (s.includes('aspir') || s.includes('seeker') || s.includes('connect')) return 'Aspiring';
    return defaultVal;
};

const parseDateVal = (val) => {
    if (!val) return '';
    if (typeof val === 'number') {
        try {
            const date = XLSX.SSF.parse_date_code(val);
            if (date) {
                return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
            }
        } catch { /* ignore */ }
    }
    const str = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    const dmy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (dmy) {
        return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
    }
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
    }
    return str;
};

const BulkDevoteeUpload = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const { bulkAddDevotees, filterOptions, devotees } = useDevotees();
    const fileInputRef = useRef(null);

    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState('');
    const [parsedRows, setParsedRows] = useState([]);
    const [columnMap, setColumnMap] = useState({});
    const [isParsing, setIsParsing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [updateDuplicates, setUpdateDuplicates] = useState(false);
    const [defaultCounselor, setDefaultCounselor] = useState('');
    const [defaultSpiritualStatus, setDefaultSpiritualStatus] = useState('Aspiring');
    const [previewFilter, setPreviewFilter] = useState('all'); // 'all', 'valid', 'duplicate', 'error'
    const [uploadResult, setUploadResult] = useState(null);

    const counselors = filterOptions?.counselors || [];

    // Pre-index existing devotees for instant client-side duplicate preview
    const existingDevoteesIndex = useMemo(() => {
        const contactMap = new Set();
        const contactAndNameMap = new Set();
        (devotees || []).forEach(d => {
            const c = (d.contact || '').toString().trim();
            const n = (d.name || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
            if (c) contactMap.add(c);
            if (c && n) contactAndNameMap.add(`${c}::${n}`);
        });
        return { contactMap, contactAndNameMap };
    }, [devotees]);

    // Generate and download sample template
    const handleDownloadTemplate = (format = 'xlsx') => {
        const templateData = [
            {
                'Name': 'Radheshyam Das',
                'Spiritual Name': 'Radheshyam Das',
                'Contact': '9876543210',
                'WhatsApp': '9876543210',
                'Email': 'radheshyam@example.com',
                'Gender': 'Male',
                'DOB': '1985-05-15',
                'Age': 41,
                'Blood Group': 'O+',
                'Marital Status': 'Married',
                'Guardian Name': 'Priya Devi Dasi',
                'Relation Type': 'Husband',
                'Address': 'B-12, Sector 4',
                'Village/City': 'Durgapur',
                'District': 'Paschim Bardhaman',
                'State': 'West Bengal',
                'PIN Code': '713216',
                'Counselor': 'HG Anandamoy Das',
                'Spiritual Status': 'Initiated',
                'Spiritual Master': 'HH Jayapataka Swami',
                '1st Initiation Date': '2015-03-28',
                'Chanting Rounds': 16,
                'Current Seva': 'Book Distribution'
            },
            {
                'Name': 'Priya Sharma',
                'Spiritual Name': 'Priya Devi Dasi',
                'Contact': '9876543211',
                'WhatsApp': '9876543211',
                'Email': 'priya@example.com',
                'Gender': 'Female',
                'DOB': '1988-10-20',
                'Age': 38,
                'Blood Group': 'B+',
                'Marital Status': 'Married',
                'Guardian Name': 'Radheshyam Das',
                'Relation Type': 'Wife',
                'Address': 'B-12, Sector 4',
                'Village/City': 'Durgapur',
                'District': 'Paschim Bardhaman',
                'State': 'West Bengal',
                'PIN Code': '713216',
                'Counselor': 'HG Anandamoy Das',
                'Spiritual Status': 'Initiated',
                'Spiritual Master': 'HH Jayapataka Swami',
                '1st Initiation Date': '2017-11-12',
                'Chanting Rounds': 16,
                'Current Seva': 'Deity Kitchen Seva'
            },
            {
                'Name': 'Amit Roy',
                'Spiritual Name': '',
                'Contact': '9123456789',
                'WhatsApp': '9123456789',
                'Email': 'amit.roy@example.com',
                'Gender': 'Male',
                'DOB': '1998-02-14',
                'Age': 28,
                'Blood Group': 'A+',
                'Marital Status': 'Single',
                'Guardian Name': 'Subhash Roy',
                'Relation Type': 'Father',
                'Address': '45 Station Road',
                'Village/City': 'Asansol',
                'District': 'Paschim Bardhaman',
                'State': 'West Bengal',
                'PIN Code': '713301',
                'Counselor': 'HG Anandamoy Das',
                'Spiritual Status': 'Aspiring',
                'Spiritual Master': '',
                '1st Initiation Date': '',
                'Chanting Rounds': 4,
                'Current Seva': 'Youth Forum Volunteer'
            }
        ];

        const ws = XLSX.utils.json_to_sheet(templateData);
        // Set column widths for comfortable reading
        ws['!cols'] = [
            { wch: 22 }, { wch: 22 }, { wch: 15 }, { wch: 15 }, { wch: 25 },
            { wch: 10 }, { wch: 14 }, { wch: 8 }, { wch: 12 }, { wch: 15 },
            { wch: 20 }, { wch: 14 }, { wch: 25 }, { wch: 18 }, { wch: 20 },
            { wch: 16 }, { wch: 12 }, { wch: 22 }, { wch: 16 }, { wch: 24 },
            { wch: 18 }, { wch: 15 }, { wch: 24 }
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Devotees');

        if (format === 'csv') {
            const csv = XLSX.utils.sheet_to_csv(ws);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'devotees_bulk_upload_template.csv';
            link.click();
            URL.revokeObjectURL(url);
        } else {
            XLSX.writeFile(wb, 'devotees_bulk_upload_template.xlsx');
        }
        toast.success(`Sample template (${format.toUpperCase()}) downloaded successfully`);
    };

    // File selection & parsing
    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;
        processFile(selectedFile);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files?.[0];
        if (!droppedFile) return;
        processFile(droppedFile);
    };

    const processFile = (inputFile) => {
        const ext = inputFile.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'xls', 'csv'].includes(ext)) {
            toast.error('Please upload an Excel (.xlsx, .xls) or CSV file');
            return;
        }

        setFile(inputFile);
        setFileName(inputFile.name);
        setIsParsing(true);
        setUploadResult(null);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const dataBuffer = evt.target.result;
                const wb = XLSX.read(dataBuffer, {
                    type: 'array',
                    cellDates: true,
                    dateNF: 'yyyy-mm-dd'
                });

                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const rawJson = XLSX.utils.sheet_to_json(ws, { raw: false, defval: '' });

                if (!rawJson || rawJson.length === 0) {
                    toast.error('No rows found in the uploaded spreadsheet');
                    setIsParsing(false);
                    return;
                }

                // Detect headers and auto-map to devotee schema
                const headers = Object.keys(rawJson[0]);
                const detectedMap = {};

                headers.forEach(header => {
                    const cleanHeader = header.trim().toLowerCase();
                    for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
                        if (aliases.includes(cleanHeader) || aliases.some(a => cleanHeader.includes(a))) {
                            if (!detectedMap[field]) {
                                detectedMap[field] = header;
                                break;
                            }
                        }
                    }
                });

                setColumnMap(detectedMap);

                // Process rows into normalized devotee objects
                const seenFileContacts = new Map();
                const processed = rawJson.map((row, idx) => {
                    const rowNum = idx + 2; // Accounting for 1-based index and header row
                    
                    const getValue = (field) => {
                        const colName = detectedMap[field];
                        if (colName && row[colName] !== undefined) {
                            return String(row[colName]).trim();
                        }
                        return '';
                    };

                    const name = getValue('name');
                    const rawContact = getValue('contact');
                    const contact = normalizePhone(rawContact);
                    const whatsapp = normalizePhone(getValue('whatsapp')) || contact;
                    const spiritualName = getValue('spiritualName');
                    const gender = normalizeGender(getValue('gender'));
                    const dob = parseDateVal(getValue('dob'));
                    const age = getValue('age') || '';
                    const bloodGroup = getValue('bloodGroup');
                    const maritalStatus = getValue('maritalStatus') || 'Single';
                    const counselor = getValue('counselor') || defaultCounselor;
                    const spiritualStatus = normalizeSpiritualStatus(getValue('spiritualStatus'), defaultSpiritualStatus);
                    const spiritualMaster = getValue('spiritualMaster');
                    const shelterDate = parseDateVal(getValue('shelterDate'));
                    const initiatedDate1 = parseDateVal(getValue('initiatedDate1'));
                    const initiatedDate2 = parseDateVal(getValue('initiatedDate2'));
                    const rounds = getValue('rounds') || '';
                    const address = getValue('address');
                    const village = getValue('village');
                    const district = getValue('district');
                    const state = getValue('state') || 'West Bengal';
                    const pinCode = getValue('pinCode');
                    const email = getValue('email');
                    const occupation = getValue('occupation');
                    const education = getValue('education');
                    const guardianName = getValue('guardianName');
                    const relationType = getValue('relationType') || 'Father';
                    const currentService = getValue('currentService');

                    // Validation checks
                    const errors = [];
                    const warnings = [];

                    if (!name) {
                        errors.push('Devotee name is required');
                    }

                    if (rawContact && !contact) {
                        warnings.push('Invalid phone number format');
                    }

                    // Check duplicate within the uploaded file
                    let isDuplicateInFile = false;
                    if (contact) {
                        if (seenFileContacts.has(contact)) {
                            isDuplicateInFile = true;
                            warnings.push(`Duplicate contact with row ${seenFileContacts.get(contact)} in this file`);
                        } else {
                            seenFileContacts.set(contact, rowNum);
                        }
                    }

                    // Check duplicate in database
                    const normName = name.toLowerCase().replace(/\s+/g, ' ');
                    const isDuplicateInDb = contact && (
                        existingDevoteesIndex.contactAndNameMap.has(`${contact}::${normName}`) ||
                        existingDevoteesIndex.contactMap.has(contact)
                    );

                    if (isDuplicateInDb) {
                        warnings.push('Devotee with this contact already exists in database');
                    }

                    let status = 'valid';
                    if (errors.length > 0) status = 'error';
                    else if (isDuplicateInDb || isDuplicateInFile) status = 'duplicate';

                    return {
                        rowNum,
                        status,
                        errors,
                        warnings,
                        isDuplicateInDb,
                        isDuplicateInFile,
                        data: {
                            name,
                            spiritualName,
                            contact,
                            whatsapp,
                            email,
                            gender,
                            dob,
                            age,
                            bloodGroup,
                            maritalStatus,
                            guardianName,
                            relationType,
                            address,
                            village,
                            district,
                            state,
                            pinCode,
                            education,
                            occupation,
                            counselor,
                            spiritualStatus,
                            spiritualMaster,
                            shelterDate,
                            initiatedDate1,
                            initiatedDate2,
                            rounds,
                            currentService,
                            status: 'Active',
                            source: 'Bulk Import'
                        }
                    };
                });

                setParsedRows(processed);
                setIsParsing(false);
                toast.success(`Parsed ${processed.length} devotee rows from ${inputFile.name}`);
            } catch (err) {
                console.error('File parsing error:', err);
                toast.error(`Error reading file: ${err.message || 'Check spreadsheet format'}`);
                setIsParsing(false);
            }
        };

        reader.readAsArrayBuffer(inputFile);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Row filtering based on tabs
    const filteredRows = useMemo(() => {
        if (previewFilter === 'valid') return parsedRows.filter(r => r.status === 'valid');
        if (previewFilter === 'duplicate') return parsedRows.filter(r => r.status === 'duplicate');
        if (previewFilter === 'error') return parsedRows.filter(r => r.status === 'error');
        return parsedRows;
    }, [parsedRows, previewFilter]);

    // Statistics
    const stats = useMemo(() => {
        const total = parsedRows.length;
        const valid = parsedRows.filter(r => r.status === 'valid').length;
        const duplicates = parsedRows.filter(r => r.status === 'duplicate').length;
        const errors = parsedRows.filter(r => r.status === 'error').length;
        return { total, valid, duplicates, errors };
    }, [parsedRows]);

    // Execute bulk upload
    const handleStartUpload = async () => {
        // Collect rows to submit: all valid rows + duplicate rows if updateDuplicates is enabled
        const rowsToUpload = parsedRows.filter(r => {
            if (r.status === 'error') return false;
            if (r.status === 'duplicate' && !updateDuplicates) return false;
            return true;
        }).map(r => r.data);

        if (rowsToUpload.length === 0) {
            toast.error('No eligible rows to upload. Please fix errors or enable updating duplicates.');
            return;
        }

        setIsUploading(true);
        setUploadProgress(10);

        try {
            // Apply default counselor if missing
            const preparedList = rowsToUpload.map(item => ({
                ...item,
                counselor: item.counselor || defaultCounselor || '',
                spiritualStatus: item.spiritualStatus || defaultSpiritualStatus || 'Aspiring'
            }));

            setUploadProgress(40);
            const res = await bulkAddDevotees(preparedList, { updateDuplicates });
            setUploadProgress(100);

            if (res.success) {
                setUploadResult(res);
                toast.success(`Bulk upload completed: ${res.added || 0} added, ${res.updated || 0} updated, ${res.skipped || 0} skipped.`);
            } else {
                toast.error(res.error || 'Bulk upload failed');
            }
        } catch (err) {
            console.error('Bulk upload error:', err);
            toast.error(err.message || 'Failed to complete bulk upload');
        } finally {
            setIsUploading(false);
        }
    };

    const resetState = () => {
        setFile(null);
        setFileName('');
        setParsedRows([]);
        setUploadResult(null);
        setUploadProgress(0);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            {/* Header / Breadcrumb */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/devotees')}
                        className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm text-slate-600 dark:text-slate-300"
                        title="Back to Devotees List"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bulk Devotee Upload</h1>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                                Excel / CSV
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Seamlessly import congregation records, contacts, and spiritual profiles in bulk
                        </p>
                    </div>
                </div>

                {/* Template Download Quick Links */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleDownloadTemplate('xlsx')}
                        className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-950/60 transition-colors shadow-sm"
                        title="Download sample Excel template"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Download Template (.xlsx)</span>
                    </button>
                    <button
                        onClick={() => handleDownloadTemplate('csv')}
                        className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm"
                        title="Download sample CSV template"
                    >
                        <Download className="w-4 h-4" />
                        <span>CSV Template</span>
                    </button>
                </div>
            </div>

            {/* If upload completed successfully, show results card */}
            {uploadResult && (
                <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in-50 duration-300">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Import Successfully Completed</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Congregation records have been written to the database and synced across clients.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                            <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">Total Processed</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{uploadResult.total || 0}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                            <p className="text-xs uppercase tracking-wider font-semibold text-emerald-700 dark:text-emerald-400">New Added</p>
                            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">{uploadResult.added || 0}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                            <p className="text-xs uppercase tracking-wider font-semibold text-blue-700 dark:text-blue-400">Updated</p>
                            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-1">{uploadResult.updated || 0}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                            <p className="text-xs uppercase tracking-wider font-semibold text-amber-700 dark:text-amber-400">Skipped (Duplicates)</p>
                            <p className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1">{uploadResult.skipped || 0}</p>
                        </div>
                    </div>

                    {uploadResult.errors && uploadResult.errors.length > 0 && (
                        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
                            <h4 className="text-sm font-semibold text-rose-800 dark:text-rose-300 mb-2">Rows with Errors:</h4>
                            <ul className="text-xs text-rose-700 dark:text-rose-400 space-y-1 list-disc list-inside">
                                {uploadResult.errors.map((e, idx) => (
                                    <li key={idx}>Row {e.row}: {e.error}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                        <button
                            onClick={() => navigate('/devotees')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-medium transition-colors shadow-md shadow-orange-900/20"
                        >
                            <Users className="w-4 h-4" />
                            <span>Go to Devotee List</span>
                        </button>
                        <button
                            onClick={resetState}
                            className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors"
                        >
                            <Upload className="w-4 h-4" />
                            <span>Upload Another File</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Upload & Configuration Section */}
            {!uploadResult && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Drag-and-Drop Dropzone */}
                    <div className="lg:col-span-2 space-y-4">
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={clsx(
                                "border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[260px]",
                                file
                                    ? "border-orange-500/60 bg-orange-50/20 dark:bg-orange-950/10"
                                    : "border-slate-300 dark:border-slate-700 hover:border-orange-400 dark:hover:border-orange-500 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            )}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx, .xls, .csv"
                                onChange={handleFileChange}
                                className="hidden"
                            />

                            <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-4 shadow-inner">
                                <Upload className="w-7 h-7" />
                            </div>

                            {file ? (
                                <div className="space-y-1">
                                    <p className="text-base font-semibold text-slate-900 dark:text-white">{fileName}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {(file.size / 1024).toFixed(1)} KB • Click or drag to choose another file
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <p className="text-base font-semibold text-slate-900 dark:text-white">
                                        Click to upload or drag & drop spreadsheet
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv)
                                    </p>
                                </div>
                            )}

                            {isParsing && (
                                <div className="mt-4 flex items-center gap-2 text-xs text-orange-600 font-medium">
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>Reading and validating rows...</span>
                                </div>
                            )}
                        </div>

                        {/* File details banner when file selected */}
                        {file && !isParsing && (
                            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs">
                                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                                    <span className="font-semibold">{fileName}</span>
                                    <span className="text-slate-400">• {parsedRows.length} rows detected</span>
                                    {Object.keys(columnMap).length > 0 && (
                                        <span className="text-slate-400">• {Object.keys(columnMap).length} columns mapped</span>
                                    )}
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        resetState();
                                    }}
                                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                                    title="Remove file"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Import Settings Panel */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
                        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <Info className="w-5 h-5 text-orange-600" />
                            <h3 className="font-bold text-slate-900 dark:text-white">Import Settings</h3>
                        </div>

                        {/* Duplicate Handling Toggle */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-900 dark:text-white block">
                                Duplicate Handling
                            </label>
                            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                                <input
                                    type="checkbox"
                                    checked={updateDuplicates}
                                    onChange={(e) => setUpdateDuplicates(e.target.checked)}
                                    className="mt-0.5 w-4 h-4 rounded text-orange-600 border-slate-300 dark:border-slate-600 focus:ring-orange-500"
                                />
                                <div>
                                    <p className="text-xs font-semibold text-slate-900 dark:text-white">Update existing devotees</p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                        If contact & name match an existing devotee, overwrite with new spreadsheet fields. When disabled, duplicates are skipped.
                                    </p>
                                </div>
                            </label>
                        </div>

                        {/* Default Counselor Fallback */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Default Counselor (Optional)
                            </label>
                            <select
                                value={defaultCounselor}
                                onChange={(e) => setDefaultCounselor(e.target.value)}
                                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                            >
                                <option value="">-- Apply file counselor --</option>
                                {counselors.map((c, i) => (
                                    <option key={i} value={c}>{c}</option>
                                ))}
                            </select>
                            <p className="text-[10px] text-slate-400">
                                Applied if a devotee row does not specify a counselor.
                            </p>
                        </div>

                        {/* Default Spiritual Status Fallback */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Default Spiritual Status
                            </label>
                            <select
                                value={defaultSpiritualStatus}
                                onChange={(e) => setDefaultSpiritualStatus(e.target.value)}
                                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                            >
                                <option value="Aspiring">Aspiring / Connected</option>
                                <option value="Sheltered">Sheltered (Ashraya)</option>
                                <option value="Initiated">Initiated (Diksha)</option>
                            </select>
                        </div>

                        {/* Upload trigger button */}
                        {parsedRows.length > 0 && (
                            <div className="space-y-3">
                                <button
                                    onClick={handleStartUpload}
                                    disabled={isUploading || (stats.valid === 0 && (!updateDuplicates || stats.duplicates === 0))}
                                    className={clsx(
                                        "w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm text-white transition-all shadow-lg",
                                        isUploading
                                            ? "bg-slate-400 cursor-not-allowed"
                                            : "bg-orange-600 hover:bg-orange-700 shadow-orange-900/20 active:scale-[0.98]"
                                    )}
                                >
                                    {isUploading ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            <span>Importing {stats.valid + (updateDuplicates ? stats.duplicates : 0)} Devotees... ({uploadProgress}%)</span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4" />
                                            <span>
                                                Import {stats.valid + (updateDuplicates ? stats.duplicates : 0)} Devotees
                                            </span>
                                        </>
                                    )}
                                </button>
                                {isUploading && (
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                        <div 
                                            className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Validation & Preview Section */}
            {parsedRows.length > 0 && !uploadResult && (
                <div className="space-y-4">
                    {/* Summary Badges Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <button
                            onClick={() => setPreviewFilter('all')}
                            className={clsx(
                                "p-4 rounded-2xl border text-left transition-all",
                                previewFilter === 'all'
                                    ? "bg-slate-900 text-white border-slate-800 shadow-md"
                                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                            )}
                        >
                            <p className="text-xs uppercase tracking-wider font-semibold opacity-75">All Rows</p>
                            <p className="text-2xl font-black mt-1">{stats.total}</p>
                        </button>

                        <button
                            onClick={() => setPreviewFilter('valid')}
                            className={clsx(
                                "p-4 rounded-2xl border text-left transition-all",
                                previewFilter === 'valid'
                                    ? "bg-emerald-600 text-white border-emerald-700 shadow-md"
                                    : "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border-slate-200 dark:border-slate-800 hover:border-emerald-300"
                            )}
                        >
                            <p className="text-xs uppercase tracking-wider font-semibold opacity-75">Ready to Import</p>
                            <p className="text-2xl font-black mt-1">{stats.valid}</p>
                        </button>

                        <button
                            onClick={() => setPreviewFilter('duplicate')}
                            className={clsx(
                                "p-4 rounded-2xl border text-left transition-all",
                                previewFilter === 'duplicate'
                                    ? "bg-amber-600 text-white border-amber-700 shadow-md"
                                    : "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 border-slate-200 dark:border-slate-800 hover:border-amber-300"
                            )}
                        >
                            <p className="text-xs uppercase tracking-wider font-semibold opacity-75">
                                {updateDuplicates ? 'Will Update' : 'Will Skip (Duplicates)'}
                            </p>
                            <p className="text-2xl font-black mt-1">{stats.duplicates}</p>
                        </button>

                        <button
                            onClick={() => setPreviewFilter('error')}
                            className={clsx(
                                "p-4 rounded-2xl border text-left transition-all",
                                previewFilter === 'error'
                                    ? "bg-rose-600 text-white border-rose-700 shadow-md"
                                    : "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 border-slate-200 dark:border-slate-800 hover:border-rose-300"
                            )}
                        >
                            <p className="text-xs uppercase tracking-wider font-semibold opacity-75">Invalid / Missing Name</p>
                            <p className="text-2xl font-black mt-1">{stats.errors}</p>
                        </button>
                    </div>

                    {/* Preview Table */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">Preview Data</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Showing {filteredRows.length} of {parsedRows.length} rows
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400">Status filter:</span>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 capitalize">
                                    {previewFilter}
                                </span>
                            </div>
                        </div>

                        <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10 font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <th className="py-3 px-4 w-12 text-center">Row</th>
                                        <th className="py-3 px-4 w-28">Status</th>
                                        <th className="py-3 px-4 min-w-[160px]">Name</th>
                                        <th className="py-3 px-4 min-w-[140px]">Contact</th>
                                        <th className="py-3 px-4 min-w-[140px]">Spiritual Name</th>
                                        <th className="py-3 px-4 min-w-[80px]">Gender</th>
                                        <th className="py-3 px-4 min-w-[120px]">Spiritual Status</th>
                                        <th className="py-3 px-4 min-w-[140px]">Counselor</th>
                                        <th className="py-3 px-4 min-w-[120px]">District</th>
                                        <th className="py-3 px-4 min-w-[80px]">Rounds</th>
                                        <th className="py-3 px-4 min-w-[200px]">Notes / Issues</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredRows.map((r, i) => (
                                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="py-2.5 px-4 text-center font-mono text-slate-400">{r.rowNum}</td>
                                            <td className="py-2.5 px-4">
                                                {r.status === 'valid' && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold">
                                                        <Check className="w-3 h-3" /> Ready
                                                    </span>
                                                )}
                                                {r.status === 'duplicate' && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[10px] font-semibold">
                                                        <AlertTriangle className="w-3 h-3" /> {updateDuplicates ? 'Update' : 'Duplicate'}
                                                    </span>
                                                )}
                                                {r.status === 'error' && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-[10px] font-semibold">
                                                        <XCircle className="w-3 h-3" /> Error
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                                                {r.data.name || <span className="text-rose-500 italic">Missing Name</span>}
                                            </td>
                                            <td className="py-2.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                                                {r.data.contact || '-'}
                                            </td>
                                            <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                                                {r.data.spiritualName || '-'}
                                            </td>
                                            <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                                                {r.data.gender}
                                            </td>
                                            <td className="py-2.5 px-4">
                                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-300">
                                                    {r.data.spiritualStatus}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                                                {r.data.counselor || defaultCounselor || '-'}
                                            </td>
                                            <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                                                {r.data.district || '-'}
                                            </td>
                                            <td className="py-2.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                                                {r.data.rounds || '-'}
                                            </td>
                                            <td className="py-2.5 px-4">
                                                {r.errors.length > 0 && (
                                                    <span className="text-rose-600 dark:text-rose-400 font-medium">
                                                        {r.errors.join('; ')}
                                                    </span>
                                                )}
                                                {r.warnings.length > 0 && (
                                                    <span className="text-amber-600 dark:text-amber-400">
                                                        {r.warnings.join('; ')}
                                                    </span>
                                                )}
                                                {r.errors.length === 0 && r.warnings.length === 0 && (
                                                    <span className="text-slate-400 text-[11px]">All clear</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BulkDevoteeUpload;
