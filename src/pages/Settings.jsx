import React, { useState, useEffect } from 'react';
import {
    RefreshCw, Loader2, CheckCircle2, RotateCcw,
    Monitor, Download, HardDrive, Archive, Cloud, Plus, Trash2, User, GraduationCap, MessageSquare,
    Settings as SettingsIcon, ExternalLink, X
} from 'lucide-react';

import clsx from 'clsx';
import { useToast } from '../components/Toast';
import apiService from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useReferenceData, LIST_TYPES } from '../context/ReferenceDataContext';

const SectionCard = ({ children, className = '' }) => (
    <div className={clsx('bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden', className)}>
        {children}
    </div>
);

const SectionHeader = ({ icon: Icon, title, subtitle, badge }) => (
    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                <Icon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
                <h2 className="font-bold text-slate-900 text-base">{title}</h2>
                {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
        </div>
        {badge}
    </div>
);

const NameListPanel = ({ listKey, label, icon: Icon, customNames, onAdd, onRemove }) => {
    const [value, setValue] = useState('');
    const [busy, setBusy] = useState(false);
    const toast = useToast();

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!value.trim()) return;
        setBusy(true);
        try {
            await onAdd(listKey, value);
            setValue('');
            toast.success(`${label} added`);
        } catch {
            toast.error(`Failed to add ${label.toLowerCase()}`);
        } finally {
            setBusy(false);
        }
    };

    const handleRemove = async (name) => {
        setBusy(true);
        try {
            if (await onRemove(listKey, name)) {
                toast.success(`${label} removed`);
            }
        } catch {
            toast.error(`Failed to remove ${label.toLowerCase()}`);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-50 dark:bg-slate-800 rounded-lg">
                    <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</p>
                    <p className="text-xs text-slate-400">{customNames.length} custom added · {customNames.length > 0 ? 'can be removed' : 'none yet'}</p>
                </div>
            </div>

            <form onSubmit={handleAdd} className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    placeholder={`Add ${label.toLowerCase()} name…`}
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <button
                    type="submit"
                    disabled={busy || !value.trim()}
                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                    {busy ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                    Add
                </button>
            </form>

            {customNames.length > 0 ? (
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {customNames.map(name => (
                        <div key={name} className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-lg">
                            <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{name}</span>
                            <button
                                onClick={() => handleRemove(name)}
                                disabled={busy}
                                className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shrink-0"
                                title={`Remove ${name}`}
                            >
                                <Trash2 size={13} />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500 py-2">
                    No custom names yet. Displays built-in defaults plus anything you add here.
                </p>
            )}
        </div>
    );
};

function formatNextSync(nextIso) {
    if (!nextIso) return 'Scheduled soon';
    const diffMs = new Date(nextIso).getTime() - Date.now();
    if (diffMs <= 0) return 'Syncing shortly...';
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 60) return `in ~${diffMins} min${diffMins === 1 ? '' : 's'}`;
    const diffHours = (diffMins / 60).toFixed(1);
    return `in ~${diffHours} hrs`;
}

const Settings = () => {
    const [health, setHealth] = useState('checking');
    const [backupFiles, setBackupFiles] = useState([]);
    const [backingUp, setBackingUp] = useState(false);
    const [googleConnected, setGoogleConnected] = useState(false);
    const [googleConnecting, setGoogleConnecting] = useState(false);
    const [googleBackingUp, setGoogleBackingUp] = useState(false);
    const [cloudBackupStatus, setCloudBackupStatus] = useState(null);
    const [cloudSyncing, setCloudSyncing] = useState(false);
    const [showDropboxModal, setShowDropboxModal] = useState(false);
    const [dropboxToken, setDropboxToken] = useState('');
    const [dropboxRefreshToken, setDropboxRefreshToken] = useState('');
    const [dropboxAppKey, setDropboxAppKey] = useState('');
    const [dropboxAppSecret, setDropboxAppSecret] = useState('');
    const [dropboxMode, setDropboxMode] = useState('token');
    const [dropboxSaving, setDropboxSaving] = useState(false);
    const [dropboxSyncing, setDropboxSyncing] = useState(false);
    const [dropboxAutoSyncUpdating, setDropboxAutoSyncUpdating] = useState(false);
    const [whatsappStatus, setWhatsappStatus] = useState('checking');

    const [whatsappQr, setWhatsappQr] = useState(null);
    const [whatsappLoading, setWhatsappLoading] = useState(false);
    const toast = useToast();
    const { isAdmin } = useAuth();
    const { customCounselors, customSpiritualMasters, addName, removeName } = useReferenceData();

    const fetchWhatsAppStatus = async () => {
        try {
            const data = await apiService.getWhatsAppStatus();
            if (data.success) {
                setWhatsappStatus(data.status || 'UNKNOWN');
                if (data.status === 'QR_RECEIVED') {
                    const qrData = await apiService.getWhatsAppQR();
                    if (qrData.success && qrData.qr) {
                        setWhatsappQr(qrData.qr);
                    }
                } else if (data.status === 'READY') {
                    setWhatsappQr(null);
                }
            }
        } catch {
            setWhatsappStatus('OFFLINE');
        }
    };

    const handleRestartWhatsApp = async () => {
        setWhatsappLoading(true);
        try {
            await apiService.restartWhatsApp();
            toast.info('Restarting WhatsApp client...');
            setTimeout(fetchWhatsAppStatus, 4000);
        } catch (err) {
            toast.error('Failed to restart WhatsApp: ' + err.message);
        } finally {
            setWhatsappLoading(false);
        }
    };

    const handleLogoutWhatsApp = async () => {
        setWhatsappLoading(true);
        try {
            await apiService.logoutWhatsApp();
            toast.success('Disconnected WhatsApp session');
            setTimeout(fetchWhatsAppStatus, 2000);
        } catch (err) {
            toast.error('Failed to disconnect: ' + err.message);
        } finally {
            setWhatsappLoading(false);
        }
    };

    const fetchHealth = async () => {
        try {
            const data = await apiService.get('/api/system/health');
            setHealth(data.success ? 'healthy' : 'error');
        } catch {
            setHealth('error');
        }
    };

    const fetchBackupList = async () => {
        try {
            const data = await apiService.get('/api/backup/list');
            if (data.success) setBackupFiles(data.files || []);
        } catch { }
    };

    const fetchGoogleStatus = async () => {
        try {
            const data = await apiService.get('/api/auth/google/status');
            setGoogleConnected(data.authenticated || false);
        } catch { }
    };

    const fetchCloudStatus = async () => {
        try {
            const data = await apiService.get('/api/backup/cloud-status');
            if (data.success && data.status) {
                setCloudBackupStatus(data.status);
            }
        } catch (err) {
            console.error('Failed to fetch cloud backup status:', err);
        }
    };

    const handleCloudSync = async () => {
        setCloudSyncing(true);
        try {
            const data = await apiService.post('/api/backup/cloud-sync', {});
            if (data.success) {
                toast.success('Cloud backup sync completed!');
                fetchCloudStatus();
            } else {
                throw new Error(data.error || 'Unknown error');
            }
        } catch (err) {
            toast.error('Cloud sync failed: ' + err.message);
        } finally {
            setCloudSyncing(false);
        }
    };

    const handleDropboxSync = async () => {
        setDropboxSyncing(true);
        try {
            const data = await apiService.runDropboxSync();
            if (data.success) {
                toast.success(`Dropbox sync successful! Saved to ${data.result?.path || '/DMS_Backups'}`);
                fetchCloudStatus();
            } else {
                throw new Error(data.error || 'Sync failed');
            }
        } catch (err) {
            toast.error('Dropbox sync failed: ' + err.message);
            fetchCloudStatus();
        } finally {
            setDropboxSyncing(false);
        }
    };

    const handleSaveDropboxConfig = async (e) => {
        if (e) e.preventDefault();
        setDropboxSaving(true);
        try {
            const payload = dropboxMode === 'token'
                ? { accessToken: dropboxToken.trim() }
                : {
                    refreshToken: dropboxRefreshToken.trim(),
                    appKey: dropboxAppKey.trim(),
                    appSecret: dropboxAppSecret.trim()
                };
            const data = await apiService.saveDropboxConfig(payload);
            if (data.success) {
                toast.success('Dropbox settings saved successfully!');
                setShowDropboxModal(false);
                fetchCloudStatus();
            } else {
                throw new Error(data.error || 'Failed to save settings');
            }
        } catch (err) {
            toast.error('Failed to save Dropbox settings: ' + err.message);
        } finally {
            setDropboxSaving(false);
        }
    };

    const handleClearDropboxConfig = async () => {
        if (!window.confirm('Are you sure you want to disconnect Dropbox?')) return;
        try {
            const data = await apiService.saveDropboxConfig({ clear: true });
            if (data.success) {
                toast.info('Dropbox credentials removed');
                setDropboxToken('');
                setDropboxRefreshToken('');
                setDropboxAppKey('');
                setDropboxAppSecret('');
                setShowDropboxModal(false);
                fetchCloudStatus();
            }
        } catch (err) {
            toast.error('Failed to clear Dropbox config: ' + err.message);
        }
    };

    const handleToggleAutoSync = async (enabled) => {
        setDropboxAutoSyncUpdating(true);
        try {
            const data = await apiService.saveDropboxAutoSyncConfig({ enabled });
            if (data.success) {
                toast.success(enabled ? 'Dropbox auto-sync enabled!' : 'Dropbox auto-sync paused');
                fetchCloudStatus();
            } else {
                throw new Error(data.error || 'Failed to update auto-sync');
            }
        } catch (err) {
            toast.error('Failed to change auto-sync: ' + err.message);
        } finally {
            setDropboxAutoSyncUpdating(false);
        }
    };

    const handleChangeAutoSyncInterval = async (intervalMinutes) => {
        setDropboxAutoSyncUpdating(true);
        try {
            const data = await apiService.saveDropboxAutoSyncConfig({ intervalMinutes: Number(intervalMinutes) });
            if (data.success) {
                toast.success('Auto-sync frequency updated!');
                fetchCloudStatus();
            } else {
                throw new Error(data.error || 'Failed to update interval');
            }
        } catch (err) {
            toast.error('Failed to update interval: ' + err.message);
        } finally {
            setDropboxAutoSyncUpdating(false);
        }
    };

    const handleConnectGoogle = async () => {
        setGoogleConnecting(true);
        try {
            const data = await apiService.get('/api/auth/google/url');
            const authLink = data.url || data.authUrl;
            if (data.success && authLink) {
                const width = 600, height = 700;
                const left = window.screen.width / 2 - width / 2;
                const top = window.screen.height / 2 - height / 2;
                const popup = window.open(authLink, 'GoogleAuth', `width=${width},height=${height},left=${left},top=${top}`);

                if (!popup) {
                    throw new Error("Popup blocked by browser. Please allow popups for this site.");
                }

                const pollTimer = setInterval(() => {
                    if (popup.closed) {
                        clearInterval(pollTimer);
                        fetchGoogleStatus();
                        setGoogleConnecting(false);
                    }
                }, 1000);
            } else throw new Error(data.error || "Failed to get Google Auth URL.");
        } catch (err) {
            toast.error('Failed to start Google Auth: ' + err.message);
            setGoogleConnecting(false);
        }
    };

    const handleGoogleBackup = async () => {
        setGoogleBackingUp(true);
        try {
            const data = await apiService.post('/api/backup/google-sheets-oauth', {});
            if (!data.success) throw new Error(data.error);
            toast.success(`Google Sheets Sync Complete!\n${data.title}`);
        } catch (err) { toast.error('Google Auth backup failed: ' + err.message); }
        finally { setGoogleBackingUp(false); }
    };

    const handleRunBackup = async () => {
        setBackingUp(true);
        try {
            const data = await apiService.post('/api/backup/run', {});
            if (!data.success) throw new Error(data.error);
            const blob = new Blob([`${data.devoteesCSV}\n\n${data.sadhanaCSV}`], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dms_backup_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success('Backup downloaded! Check your downloads folder.');
            fetchBackupList();
        } catch (err) { toast.error('Backup failed: ' + err.message); }
        finally { setBackingUp(false); }
    };

    useEffect(() => {
        fetchHealth();
        fetchBackupList();
        fetchGoogleStatus();
        fetchCloudStatus();
        fetchWhatsAppStatus();
        const interval = setInterval(() => {
            fetchHealth();
        }, 15000);
        const cloudInterval = setInterval(() => {
            fetchCloudStatus();
        }, 30000);
        const waInterval = setInterval(() => {
            fetchWhatsAppStatus();
        }, 8000);
        return () => {
            clearInterval(interval);
            clearInterval(cloudInterval);
            clearInterval(waInterval);
        };
    }, []);

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage application integrations and data protection.</p>
            </div>

            <div className="grid grid-cols-1 gap-6">

                <SectionCard>
                    <SectionHeader
                        icon={Monitor}
                        title="Server Status"
                        subtitle="Cloud API status"
                        badge={
                            <span className={clsx(
                                'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold',
                                health === 'healthy' ? 'bg-emerald-100 text-emerald-700' : health === 'error' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                            )}>
                                <span className={clsx('w-2 h-2 rounded-full', health === 'healthy' ? 'bg-emerald-500' : health === 'error' ? 'bg-red-500' : 'bg-amber-500 animate-pulse')} />
                                {health === 'healthy' ? 'Online' : health === 'error' ? 'Offline' : 'Checking'}
                            </span>
                        }
                    />
                    <div className="p-5 space-y-3">
                        <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                            <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">Backend</span>
                            <span className={clsx('text-xs font-bold px-2 py-1 rounded-lg',
                                health === 'healthy' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            )}>{health === 'healthy' ? 'Running' : 'Check helper ->'}</span>
                        </div>
                    </div>
                </SectionCard>

                {isAdmin && (
                    <SectionCard>
                        <SectionHeader
                            icon={User}
                            title="Reference Names"
                            subtitle="Manage counselor & spiritual master names shown in the devotee forms"
                        />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 divide-y-0 max-lg:divide-y lg:divide-x lg:divide-slate-100 dark:lg:divide-slate-800">
                            <NameListPanel
                                listKey={LIST_TYPES.counselors}
                                label="Counselors"
                                icon={User}
                                customNames={customCounselors}
                                onAdd={addName}
                                onRemove={removeName}
                            />
                            <NameListPanel
                                listKey={LIST_TYPES.spiritualMasters}
                                label="Spiritual Masters"
                                icon={GraduationCap}
                                customNames={customSpiritualMasters}
                                onAdd={addName}
                                onRemove={removeName}
                            />
                        </div>
                    </SectionCard>
                )}

                <SectionCard>
                    <SectionHeader icon={Archive} title="Backup & Export" subtitle="Download CSV snapshot" />
                    <div className="p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">On-demand snapshot</p>
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5">Download devotee + sadhana CSV</p>
                            </div>
                            <button onClick={handleRunBackup} disabled={backingUp}
                                className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-100 disabled:opacity-60 transition-colors">
                                {backingUp ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                                {backingUp ? 'Generating...' : 'Backup Now'}
                            </button>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Saved Files (desktop only)</p>
                            {backupFiles.length === 0 ? (
                                <p className="text-xs text-slate-400 dark:text-slate-500">No server-side backups. On the web version, backups download to your browser.</p>
                            ) : (
                                <div className="space-y-1">
                                    {backupFiles.slice(0, 5).map((file, i) => (
                                        <div key={file} className={clsx('flex items-center gap-2 py-1.5 px-2 rounded-lg', i === 0 ? 'bg-emerald-50' : '')}>
                                            <HardDrive size={13} className={i === 0 ? 'text-emerald-500' : 'text-slate-300'} />
                                            <span className="text-xs text-slate-600 dark:text-slate-300 flex-1 truncate">{file}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </SectionCard>

                <SectionCard>
                    <SectionHeader
                        icon={MessageSquare}
                        title="WhatsApp Bot"
                        subtitle="Automated WhatsApp messaging & broadcasts"
                        badge={
                            <span className={clsx(
                                "text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5",
                                whatsappStatus === 'READY' ? "bg-emerald-100 text-emerald-800" :
                                whatsappStatus === 'QR_RECEIVED' ? "bg-amber-100 text-amber-800" :
                                "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            )}>
                                <span className={clsx(
                                    "w-2 h-2 rounded-full",
                                    whatsappStatus === 'READY' ? "bg-emerald-500 animate-pulse" :
                                    whatsappStatus === 'QR_RECEIVED' ? "bg-amber-500" : "bg-slate-400"
                                )} />
                                {whatsappStatus === 'READY' ? 'Connected' :
                                 whatsappStatus === 'QR_RECEIVED' ? 'Scan QR Code' :
                                 whatsappStatus === 'INITIALIZING' ? 'Initializing...' :
                                 whatsappStatus === 'DISCONNECTED' ? 'Disconnected' :
                                 whatsappStatus === 'OFFLINE' ? 'Server Offline' : whatsappStatus}
                            </span>
                        }
                    />
                    <div className="p-5 space-y-4">
                        {whatsappStatus === 'READY' ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">WhatsApp is linked and active</p>
                                        <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">Automated sadhana notifications, broadcasts, and birthday greetings are operational.</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={fetchWhatsAppStatus}
                                        className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                                    >
                                        <RefreshCw size={12} /> Check Status
                                    </button>
                                    <button
                                        onClick={handleLogoutWhatsApp}
                                        disabled={whatsappLoading}
                                        className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors flex items-center gap-1.5"
                                    >
                                        {whatsappLoading ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />} Disconnect
                                    </button>
                                </div>
                            </div>
                        ) : whatsappStatus === 'QR_RECEIVED' && whatsappQr ? (
                            <div className="flex flex-col sm:flex-row items-center gap-6 p-2">
                                <div className="p-3 bg-white rounded-2xl border-2 border-slate-200 shadow-sm shrink-0">
                                    <img src={whatsappQr} alt="WhatsApp QR Code" className="w-48 h-48 rounded-lg" />
                                </div>
                                <div className="space-y-3 text-center sm:text-left">
                                    <div>
                                        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Scan QR Code with WhatsApp</h3>
                                        <ol className="text-xs text-slate-500 dark:text-slate-400 mt-2 space-y-1 list-decimal list-inside">
                                            <li>Open <strong>WhatsApp</strong> on your mobile phone</li>
                                            <li>Go to <strong>Settings</strong> &gt; <strong>Linked Devices</strong></li>
                                            <li>Tap <strong>Link a Device</strong> and point your camera here</li>
                                        </ol>
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-2 justify-center sm:justify-start">
                                        <button
                                            onClick={fetchWhatsAppStatus}
                                            className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                                        >
                                            <RefreshCw size={12} /> Refresh QR
                                        </button>
                                        <button
                                            onClick={handleRestartWhatsApp}
                                            disabled={whatsappLoading}
                                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors flex items-center gap-1.5"
                                        >
                                            {whatsappLoading ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />} Restart Bot
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-xs text-slate-600 dark:text-slate-300">
                                    Current status: <span className="font-semibold text-slate-800 dark:text-slate-100">{whatsappStatus}</span>
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={fetchWhatsAppStatus}
                                        className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                                    >
                                        <RefreshCw size={12} /> Check Status
                                    </button>
                                    <button
                                        onClick={handleRestartWhatsApp}
                                        disabled={whatsappLoading}
                                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
                                    >
                                        {whatsappLoading ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />} Connect / Restart
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </SectionCard>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SectionCard>
                        <SectionHeader icon={HardDrive} title="Cloud Integration" subtitle="Live Google Sheets Sync" />
                        <div className="p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Status</p>
                                    <p className="text-sm font-semibold mt-0.5 flex items-center gap-1.5">
                                        <span className={clsx("w-2 h-2 rounded-full", googleConnected ? "bg-emerald-500" : "bg-slate-300")} />
                                        <span className={googleConnected ? "text-emerald-700" : "text-slate-600 dark:text-slate-300"}>
                                            {googleConnected ? "Connected" : "Not Linked"}
                                        </span>
                                    </p>
                                </div>
                                {!googleConnected ? (
                                    <button onClick={handleConnectGoogle} disabled={googleConnecting}
                                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm">
                                        {googleConnecting ? <Loader2 size={13} className="animate-spin" /> : <HardDrive size={13} />}
                                        Connect Google Drive
                                    </button>
                                ) : (
                                    <button onClick={handleGoogleBackup} disabled={googleBackingUp}
                                        className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold hover:bg-emerald-100 disabled:opacity-60 transition-colors">
                                        {googleBackingUp ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                                        {googleBackingUp ? 'Syncing...' : 'Sync Now'}
                                    </button>
                                )}
                            </div>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-snug">
                                Upload current data to a Google Spreadsheet in your personal Drive.
                            </p>
                        </div>
                    </SectionCard>

                    <SectionCard>
                        <SectionHeader icon={Cloud} title="Disaster Recovery" subtitle="AWS S3 & Dropbox Sync" />
                        <div className="p-5 space-y-4">
                            {/* AWS S3 */}
                            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">AWS S3 Storage</span>
                                    <span className={clsx(
                                        "text-xs font-bold px-2 py-0.5 rounded-full",
                                        cloudBackupStatus?.s3?.configured ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                    )}>
                                        {cloudBackupStatus?.s3?.configured ? "Configured" : "Credentials Missing"}
                                    </span>
                                </div>
                                {cloudBackupStatus?.s3?.configured && (
                                    <div className="mt-1.5 space-y-0.5">
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500">Bucket: <span className="font-semibold text-slate-600 dark:text-slate-400">{cloudBackupStatus.s3.bucket}</span></p>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500">Last Sync: <span className="font-semibold text-slate-600 dark:text-slate-400">{cloudBackupStatus.s3.lastBackupTime ? new Date(cloudBackupStatus.s3.lastBackupTime).toLocaleString() : 'Never'}</span></p>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500">Status: <span className={clsx("font-bold", cloudBackupStatus.s3.lastBackupStatus === 'Success' ? "text-emerald-600" : "text-red-500")}>{cloudBackupStatus.s3.lastBackupStatus}</span></p>
                                    </div>
                                )}
                            </div>

                            {/* Dropbox Storage */}
                            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Dropbox Storage</span>
                                        <span className={clsx(
                                            "text-xs font-bold px-2 py-0.5 rounded-full",
                                            cloudBackupStatus?.dropbox?.configured ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                        )}>
                                            {cloudBackupStatus?.dropbox?.configured ? "Configured" : "Not Linked"}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setShowDropboxModal(true)}
                                        className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold flex items-center gap-1 hover:underline"
                                    >
                                        <SettingsIcon size={12} />
                                        {cloudBackupStatus?.dropbox?.configured ? "Configure" : "Connect"}
                                    </button>
                                </div>
                                {cloudBackupStatus?.dropbox?.configured ? (
                                    <div className="mt-2 space-y-2.5">
                                        <div className="space-y-0.5">
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500">Path: <span className="font-semibold text-slate-600 dark:text-slate-400">{cloudBackupStatus.dropbox.folderPath}</span></p>
                                            {cloudBackupStatus.dropbox.space && (
                                                <div className="py-1">
                                                    <div className="flex items-center justify-between text-[10px]">
                                                        <span className="text-slate-400 dark:text-slate-500">Dropbox Space:</span>
                                                        <span className={clsx("font-bold", cloudBackupStatus.dropbox.space.isFull ? "text-red-500" : "text-slate-600 dark:text-slate-300")}>
                                                            {cloudBackupStatus.dropbox.space.usedFormatted} / {cloudBackupStatus.dropbox.space.allocatedFormatted} ({cloudBackupStatus.dropbox.space.percentUsed}%)
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
                                                        <div
                                                            className={clsx("h-full transition-all", cloudBackupStatus.dropbox.space.isFull ? "bg-red-500" : cloudBackupStatus.dropbox.space.percentUsed > 85 ? "bg-amber-500" : "bg-blue-500")}
                                                            style={{ width: `${Math.min(100, cloudBackupStatus.dropbox.space.percentUsed)}%` }}
                                                        />
                                                    </div>
                                                    {cloudBackupStatus.dropbox.space.isFull && (
                                                        <p className="text-[10px] text-red-500 font-medium mt-1">
                                                            ⚠️ Storage full! Delete files or empty Trash on dropbox.com to sync.
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500">Last Sync: <span className="font-semibold text-slate-600 dark:text-slate-400">{cloudBackupStatus.dropbox.lastBackupTime ? new Date(cloudBackupStatus.dropbox.lastBackupTime).toLocaleString() : 'Never'}</span></p>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500">Status: <span className={clsx("font-bold", cloudBackupStatus.dropbox.lastBackupStatus === 'Success' ? "text-emerald-600" : "text-red-500")}>{cloudBackupStatus.dropbox.lastBackupStatus}</span></p>
                                        </div>

                                        {/* Auto-Sync Configuration Box */}
                                        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={clsx("w-2 h-2 rounded-full", cloudBackupStatus.dropbox.autoSyncEnabled ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
                                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Auto Sync to Dropbox</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    disabled={dropboxAutoSyncUpdating}
                                                    onClick={() => handleToggleAutoSync(!cloudBackupStatus.dropbox.autoSyncEnabled)}
                                                    className={clsx(
                                                        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                                                        cloudBackupStatus.dropbox.autoSyncEnabled ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700",
                                                        dropboxAutoSyncUpdating && "opacity-60 cursor-not-allowed"
                                                    )}
                                                    role="switch"
                                                    aria-checked={cloudBackupStatus.dropbox.autoSyncEnabled}
                                                >
                                                    <span
                                                        className={clsx(
                                                            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                                            cloudBackupStatus.dropbox.autoSyncEnabled ? "translate-x-4" : "translate-x-0"
                                                        )}
                                                    />
                                                </button>
                                            </div>

                                            {cloudBackupStatus.dropbox.autoSyncEnabled ? (
                                                <div className="space-y-1.5 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Frequency:</span>
                                                        <select
                                                            value={cloudBackupStatus.dropbox.autoSyncIntervalMinutes || 60}
                                                            disabled={dropboxAutoSyncUpdating}
                                                            onChange={(e) => handleChangeAutoSyncInterval(e.target.value)}
                                                            className="text-[11px] font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-0.5 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                                        >
                                                            <option value="60">Every 1 Hour (Recommended)</option>
                                                            <option value="360">Every 6 Hours</option>
                                                            <option value="720">Every 12 Hours</option>
                                                            <option value="1440">Every 24 Hours (Daily)</option>
                                                        </select>
                                                    </div>
                                                    <div className="flex items-center justify-between text-[10px]">
                                                        <span className="text-slate-500 dark:text-slate-400">Next Scheduled Sync:</span>
                                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                            {formatNextSync(cloudBackupStatus.dropbox.nextSyncTime)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-[9px] text-slate-400 dark:text-slate-500 pt-0.5">
                                                        <span>🛡️ Space Protection:</span>
                                                        <span>Retains latest 10 snapshots (auto-pruned)</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                                    Auto-sync paused. Turn on to backup automatically in background.
                                                </p>
                                            )}
                                        </div>

                                        <div className="pt-1 flex items-center justify-between">
                                            <button
                                                onClick={handleDropboxSync}
                                                disabled={dropboxSyncing || cloudBackupStatus?.dropbox?.space?.isFull}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm"
                                            >
                                                {dropboxSyncing ? <Loader2 size={12} className="animate-spin" /> : <Cloud size={12} />}
                                                {dropboxSyncing ? 'Syncing to Dropbox...' : 'Sync Dropbox Now'}
                                            </button>
                                        </div>

                                    </div>
                                ) : (
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 leading-snug">
                                        Upload automated snapshots to Dropbox <code>/DMS_Backups/</code> folder.
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-[180px] leading-snug">
                                    Trigger a multi-cloud disaster recovery sync.
                                </p>
                                <button
                                    onClick={handleCloudSync}
                                    disabled={cloudSyncing || (!cloudBackupStatus?.s3?.configured && !cloudBackupStatus?.dropbox?.configured)}
                                    className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-100 disabled:opacity-60 transition-colors"
                                >
                                    {cloudSyncing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                                    {cloudSyncing ? 'Syncing...' : 'Sync All Clouds'}
                                </button>
                            </div>
                        </div>
                    </SectionCard>
                </div>
            </div>

            {/* Dropbox Configuration Modal */}
            {showDropboxModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600 dark:text-blue-400">
                                    <Cloud className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Dropbox Disaster Recovery</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Configure cloud backup storage</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowDropboxModal(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Mode Selector */}
                        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
                            <button
                                type="button"
                                onClick={() => setDropboxMode('token')}
                                className={clsx(
                                    "flex-1 py-1.5 rounded-lg transition-all",
                                    dropboxMode === 'token' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                )}
                            >
                                Access Token (Quick)
                            </button>
                            <button
                                type="button"
                                onClick={() => setDropboxMode('oauth')}
                                className={clsx(
                                    "flex-1 py-1.5 rounded-lg transition-all",
                                    dropboxMode === 'oauth' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                )}
                            >
                                App Key &amp; Refresh Token (Permanent)
                            </button>
                        </div>

                        {/* Instructions */}
                        <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-xl text-xs text-slate-600 dark:text-slate-300 space-y-1">
                            <p className="font-semibold text-blue-700 dark:text-blue-300 flex items-center justify-between">
                                <span>How to get credentials:</span>
                                <a
                                    href="https://www.dropbox.com/developers/apps"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    Open Dropbox Apps <ExternalLink size={11} />
                                </a>
                            </p>
                            <ol className="list-decimal pl-4 space-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                <li>Create an App with <strong>Scoped access</strong> &amp; <strong>Full Dropbox</strong>.</li>
                                <li>Under <strong>Permissions</strong>, check <code>files.content.write</code>.</li>
                                {dropboxMode === 'token' ? (
                                    <li>Under <strong>Settings</strong>, click <strong>Generate access token</strong> and paste below.</li>
                                ) : (
                                    <li>Copy <strong>App Key</strong> &amp; <strong>App Secret</strong>, and generate a Refresh Token.</li>
                                )}
                            </ol>
                        </div>

                        {dropboxMode === 'token' ? (
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Dropbox Access Token
                                </label>
                                <input
                                    type="password"
                                    placeholder="sl.u.AF9..."
                                    value={dropboxToken}
                                    onChange={(e) => setDropboxToken(e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                <div>
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">App Key</label>
                                    <input
                                        type="text"
                                        placeholder="Dropbox App Key"
                                        value={dropboxAppKey}
                                        onChange={(e) => setDropboxAppKey(e.target.value)}
                                        className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">App Secret</label>
                                    <input
                                        type="password"
                                        placeholder="Dropbox App Secret"
                                        value={dropboxAppSecret}
                                        onChange={(e) => setDropboxAppSecret(e.target.value)}
                                        className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Refresh Token</label>
                                    <input
                                        type="password"
                                        placeholder="Dropbox Refresh Token"
                                        value={dropboxRefreshToken}
                                        onChange={(e) => setDropboxRefreshToken(e.target.value)}
                                        className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                            {cloudBackupStatus?.dropbox?.configured ? (
                                <button
                                    type="button"
                                    onClick={handleClearDropboxConfig}
                                    className="text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1"
                                >
                                    Disconnect
                                </button>
                            ) : <span />}
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowDropboxModal(false)}
                                    className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveDropboxConfig}
                                    disabled={dropboxSaving || (dropboxMode === 'token' ? !dropboxToken.trim() : (!dropboxAppKey.trim() || !dropboxAppSecret.trim() || !dropboxRefreshToken.trim()))}
                                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition-colors shadow-sm flex items-center gap-1.5"
                                >
                                    {dropboxSaving ? <Loader2 size={13} className="animate-spin" /> : null}
                                    Save &amp; Connect
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;