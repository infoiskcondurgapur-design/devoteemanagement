import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { X, CheckCircle, AlertCircle, Camera, RefreshCw, Upload, Image, ShieldAlert, Sparkles } from 'lucide-react';

const QRScanner = ({ onClose, onScan }) => {
    const navigate = useNavigate();
    
    // Scanner states
    const [scanResult, setScanResult] = useState(null);
    const [isScannerReady, setIsScannerReady] = useState(false);
    const [cameraError, setCameraError] = useState(null);
    const [scanMode, setScanMode] = useState('camera'); // 'camera' | 'file'
    
    // Camera selection states
    const [cameras, setCameras] = useState([]);
    const [selectedCameraId, setSelectedCameraId] = useState('');
    
    // Scanning file feedback states
    const [fileError, setFileError] = useState(null);
    const [isScanningFile, setIsScanningFile] = useState(false);

    // Refs for instance control
    const html5QrCodeRef = useRef(null);
    const lastScannedRef = useRef(null);
    const scanTimeoutRef = useRef(null);
    const fileInputRef = useRef(null);

    // Synthesize a quick "beep" success sound using Web Audio API
    const playSuccessBeep = () => {
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) return;
            const ctx = new AudioContextClass();
            
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
            
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15); // Fade out over 150ms
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start();
            osc.stop(ctx.currentTime + 0.15);
        } catch (e) {
            console.warn('[Audio] Failed to synthesize beep:', e);
        }
    };

    // Trigger haptic feedback
    const triggerHaptic = () => {
        if (navigator.vibrate) {
            navigator.vibrate(100);
        }
    };

    // Parse scanned text and get ID
    const parseScannedText = (decodedText) => {
        let extractedId = decodedText;
        try {
            const data = JSON.parse(decodedText);
            if (data.id) extractedId = data.id;
        } catch {
            if (extractedId.startsWith('DMS:')) {
                extractedId = extractedId.replace('DMS:', '');
            }
        }
        return extractedId;
    };

    // Handle a successful scan
    const handleSuccessfulScan = async (id) => {
        playSuccessBeep();
        triggerHaptic();
        
        // Stop camera if running
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
            try {
                await html5QrCodeRef.current.stop();
            } catch (err) {
                console.error("Error stopping scanner on success:", err);
            }
        }

        setScanResult({ id, name: 'Devotee' });
        
        setTimeout(() => {
            if (onScan) {
                onScan(id);
            } else {
                navigate(`/devotees/${id}`);
            }
            if (onClose) onClose();
        }, 1200);
    };

    // Camera Scan Callback
    const onScanSuccess = (decodedText) => {
        // Debounce scan events
        if (decodedText === lastScannedRef.current) return;
        lastScannedRef.current = decodedText;
        
        if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = setTimeout(() => { 
            lastScannedRef.current = null; 
        }, 3000);

        const id = parseScannedText(decodedText);
        handleSuccessfulScan(id);
    };

    const onScanFailure = () => {
        // Silent failure for continuous frame scanning
    };

    // Core Camera Lifecycle Manager
    useEffect(() => {
        if (scanMode !== 'camera') {
            // Clean up scanner when switching to file mode
            if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
                html5QrCodeRef.current.stop()
                    .then(() => {
                        setIsScannerReady(false);
                    })
                    .catch(err => console.error("Teardown error during mode switch:", err));
            }
            return;
        }

        const html5QrCode = new Html5Qrcode("reader");
        html5QrCodeRef.current = html5QrCode;

        const initCameras = async () => {
            try {
                const devices = await Html5Qrcode.getCameras();
                if (devices && devices.length > 0) {
                    setCameras(devices);
                    // Match back camera if available, otherwise default to first
                    const backCam = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
                    const defaultCamId = backCam ? backCam.id : devices[0].id;
                    setSelectedCameraId(defaultCamId);
                    startScanning(html5QrCode, defaultCamId);
                } else {
                    setCameraError("No cameras detected on this device.");
                }
            } catch (err) {
                console.error("Camera acquisition error:", err);
                setCameraError("Camera access denied. Please grant permission.");
            }
        };

        const startScanning = async (scannerInstance, cameraId) => {
            setIsScannerReady(false);
            setCameraError(null);
            try {
                const config = { 
                    fps: 15, 
                    qrbox: (width, height) => {
                        const size = Math.min(width, height) * 0.65;
                        return { width: size, height: size };
                    },
                    aspectRatio: 1.0
                };

                await scannerInstance.start(
                    cameraId,
                    config,
                    onScanSuccess,
                    onScanFailure
                );
                setIsScannerReady(true);
            } catch (err) {
                console.error("Failed to start camera scan:", err);
                setCameraError("Failed to access camera stream. Close other camera apps.");
            }
        };

        initCameras();

        return () => {
            if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
            if (html5QrCode.isScanning) {
                html5QrCode.stop().catch(err => console.error("Scanner cleanup error on unmount:", err));
            }
        };
    }, [scanMode]);

    // Handle switching camera dynamically
    const handleCameraChange = async (e) => {
        const newCameraId = e.target.value;
        setSelectedCameraId(newCameraId);
        
        if (html5QrCodeRef.current) {
            if (html5QrCodeRef.current.isScanning) {
                await html5QrCodeRef.current.stop();
            }
            setIsScannerReady(false);
            try {
                await html5QrCodeRef.current.start(
                    newCameraId,
                    { 
                        fps: 15, 
                        qrbox: (w, h) => {
                            const size = Math.min(w, h) * 0.65;
                            return { width: size, height: size };
                        },
                        aspectRatio: 1.0 
                    },
                    onScanSuccess,
                    onScanFailure
                );
                setIsScannerReady(true);
            } catch {
                setCameraError("Failed to switch camera.");
            }
        }
    };

    // Scan an uploaded image file
    const handleFileScan = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileError(null);
        setIsScanningFile(true);

        // Instantiate temporary scanner if not present
        let localScanner = html5QrCodeRef.current;
        if (!localScanner) {
            localScanner = new Html5Qrcode("reader-temp-file-holder");
        }

        try {
            const decodedText = await localScanner.scanFile(file, true);
            setIsScanningFile(false);
            const id = parseScannedText(decodedText);
            handleSuccessfulScan(id);
        } catch (err) {
            console.error("File scanning error:", err);
            setIsScanningFile(false);
            setFileError("No valid QR code found in this image. Try another file.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-955/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-800/80 flex justify-between items-center bg-slate-900/60">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
                            <Camera className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-white text-lg tracking-tight">Advanced QR Engine</h3>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Verify credentials & attendance</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
                                html5QrCodeRef.current.stop()
                                    .then(() => onClose())
                                    .catch(() => onClose());
                            } else {
                                onClose();
                            }
                        }} 
                        className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 dark:text-slate-500 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6">
                    {/* Scan Mode Tabs */}
                    {!scanResult && (
                        <div className="flex bg-slate-950 rounded-xl p-1 mb-6 border border-slate-800/60">
                            <button
                                onClick={() => setScanMode('camera')}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${scanMode === 'camera' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 dark:text-slate-500 hover:text-white'}`}
                            >
                                <Camera className="w-4 h-4" /> Live Camera
                            </button>
                            <button
                                onClick={() => setScanMode('file')}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${scanMode === 'file' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 dark:text-slate-500 hover:text-white'}`}
                            >
                                <Upload className="w-4 h-4" /> Upload Image
                            </button>
                        </div>
                    )}

                    {!scanResult ? (
                        <div className="relative">
                            
                            {/* Live Camera Scanner Mode */}
                            {scanMode === 'camera' && (
                                <div className="space-y-6">
                                    {cameraError ? (
                                        <div className="aspect-square bg-slate-950 rounded-2xl border border-red-500/20 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
                                            <ShieldAlert className="w-14 h-14 text-red-500 mb-4" />
                                            <h4 className="font-extrabold text-white text-lg mb-2">Camera Access Restricted</h4>
                                            <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs">{cameraError}</p>
                                            <button 
                                                onClick={() => setScanMode('file')}
                                                className="mt-6 px-6 py-2.5 bg-slate-800 text-white hover:bg-slate-700 font-bold rounded-xl text-sm transition-all"
                                            >
                                                Use Image Upload
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Camera Selector Dropdown */}
                                            {cameras.length > 1 && (
                                                <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                                                    <RefreshCw className="w-4 h-4 text-orange-500 shrink-0" />
                                                    <select
                                                        value={selectedCameraId}
                                                        onChange={handleCameraChange}
                                                        className="w-full bg-transparent text-slate-300 text-xs font-bold outline-none cursor-pointer"
                                                    >
                                                        {cameras.map((cam) => (
                                                            <option key={cam.id} value={cam.id} className="bg-slate-900 text-white font-medium">
                                                                {cam.label || `Camera ${cameras.indexOf(cam) + 1}`}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {/* Scanner Box */}
                                            <div className="relative ring-4 ring-slate-850 rounded-2xl overflow-hidden shadow-2xl bg-black border border-slate-800 aspect-square">
                                                <div id="reader" className="w-full h-full"></div>
                                                
                                                {/* Customized Overlay Layout */}
                                                {isScannerReady && (
                                                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                                        {/* Scanning Laser Line */}
                                                        <div className="absolute left-[15%] right-[15%] h-[2px] bg-orange-500 shadow-[0_0_12px_#ea580c] animate-scanner-laser"></div>
                                                        
                                                        {/* Corner brackets */}
                                                        <div className="absolute w-[65%] h-[65%] border-2 border-white/20 rounded-2xl flex items-center justify-center">
                                                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-orange-500 rounded-tl-lg -translate-x-1.5 -translate-y-1.5"></div>
                                                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-orange-500 rounded-tr-lg translate-x-1.5 -translate-y-1.5"></div>
                                                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-orange-500 rounded-bl-lg -translate-x-1.5 translate-y-1.5"></div>
                                                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-orange-500 rounded-br-lg translate-x-1.5 translate-y-1.5"></div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Initializing Spinner Overlay */}
                                                {!isScannerReady && (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-white">
                                                        <div className="w-10 h-10 border-4 border-slate-800 border-t-orange-500 rounded-full animate-spin mb-4"></div>
                                                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Activating Stream...</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="text-center">
                                                <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-400 text-xs font-extrabold rounded-full border border-green-500/20">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping"></span>
                                                    Align code inside target frame
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* File Upload Scan Mode */}
                            {scanMode === 'file' && (
                                <div className="space-y-6">
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="aspect-square bg-slate-950/60 rounded-2xl border-2 border-dashed border-slate-800 hover:border-orange-500/50 hover:bg-slate-900/40 transition-all duration-300 flex flex-col items-center justify-center p-8 text-center cursor-pointer group"
                                    >
                                        {isScanningFile ? (
                                            <>
                                                <div className="w-12 h-12 border-4 border-slate-800 border-t-orange-500 rounded-full animate-spin mb-4"></div>
                                                <h4 className="font-bold text-white text-base">Processing Image...</h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Extracting QR code symbols</p>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-16 h-16 bg-slate-900 text-slate-400 dark:text-slate-500 group-hover:text-orange-500 group-hover:scale-105 rounded-2xl flex items-center justify-center border border-slate-800 group-hover:border-orange-500/30 transition-all duration-300 mb-4 shadow-lg">
                                                    <Image className="w-8 h-8" />
                                                </div>
                                                <h4 className="font-bold text-white text-base">Select QR Image File</h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1.5">Drag & drop or click to choose PNG, JPG, or SVG from your device</p>
                                            </>
                                        )}
                                    </div>

                                    {fileError && (
                                        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl flex items-start gap-2.5 animate-in fade-in">
                                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                            <p>{fileError}</p>
                                        </div>
                                    )}

                                    {/* Hidden Inputs */}
                                    <input 
                                        type="file" 
                                        ref={fileInputRef}
                                        onChange={handleFileScan}
                                        className="hidden" 
                                        accept="image/*" 
                                    />
                                    <div id="reader-temp-file-holder" className="hidden"></div>
                                </div>
                            )}

                        </div>
                    ) : (
                        <div className="text-center py-16 animate-in fade-in zoom-in-95 duration-500">
                            <div className="w-24 h-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20 shadow-lg shadow-green-500/5">
                                <CheckCircle className="w-12 h-12" />
                            </div>
                            <h4 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
                                <Sparkles className="w-5 h-5 text-orange-500" />
                                Decode Successful
                            </h4>
                            <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">Connecting, loading devotee profile...</p>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes laser-sweep {
                    0% { top: 18%; opacity: 0.8; }
                    50% { top: 82%; opacity: 1; }
                    100% { top: 18%; opacity: 0.8; }
                }
                .animate-scanner-laser {
                    animation: laser-sweep 2.5s ease-in-out infinite;
                }
                #reader video {
                    width: 100% !important;
                    height: 100% !important;
                    object-fit: cover !important;
                }
            `}</style>
        </div>
    );
};

export default QRScanner;
