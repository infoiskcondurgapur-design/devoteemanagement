import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import { Eye, EyeOff, ArrowLeft, KeyRound, CheckCircle2, MessageSquare, AlertCircle } from 'lucide-react';

const LoginPage = () => {
    const { login, isAuthenticated, currentUser, isAdmin, isCounselor, loading, bypassEnabled, bypassLogin } = useAuth();
    const navigate = useNavigate();

    // Mode: 'login' | 'forgot_request' | 'forgot_verify' | 'forgot_success'
    const [mode, setMode] = useState('login');

    // Login state
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Forgot password state
    const [identity, setIdentity] = useState('');
    const [requestId, setRequestId] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [devCode, setDevCode] = useState('');
    const [maskedContact, setMaskedContact] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);

    // Common feedback state
    const [error, setError] = useState('');
    const [infoMessage, setInfoMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Resend countdown timer
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setInterval(() => {
            setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [resendCooldown]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
            </div>
        );
    }

    if (isAuthenticated) {
        const isViewer = !isAdmin && !isCounselor;
        const myDevoteeId = currentUser?.devoteeId;
        return <Navigate to={isViewer ? (myDevoteeId ? `/devotees/${myDevoteeId}` : '/profile') : '/'} replace />;
    }

    const resetFeedback = () => {
        setError('');
        setInfoMessage('');
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        resetFeedback();
        if (!username.trim() || !password) {
            setError('Please enter username and password');
            return;
        }
        setSubmitting(true);
        try {
            const res = await login(username.trim(), password);
            if (res.success) {
                const user = res.user;
                const isViewer = user?.role === 'viewer' || (!user?.isAdmin && user?.role !== 'admin' && user?.role !== 'counselor');
                const target = isViewer ? (user?.devoteeId ? `/devotees/${user.devoteeId}` : '/profile') : '/';
                navigate(target, { replace: true });
            } else {
                setError(res.error || 'Invalid credentials');
            }
        } catch (err) {
            setError(err.message || 'Login failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleBypass = async () => {
        resetFeedback();
        setSubmitting(true);
        try {
            const res = await bypassLogin();
            if (res.success) {
                const user = res.user;
                const isViewer = user?.role === 'viewer' || (!user?.isAdmin && user?.role !== 'admin' && user?.role !== 'counselor');
                const target = isViewer ? (user?.devoteeId ? `/devotees/${user.devoteeId}` : '/profile') : '/';
                navigate(target, { replace: true });
            } else {
                setError(res.error || 'Bypass login failed');
            }
        } catch (err) {
            setError(err.message || 'Bypass login failed');
        } finally {
            setSubmitting(false);
        }
    };

    // Step 1 of Forgot Password: Request OTP code
    const handleRequestCode = async (e) => {
        if (e) e.preventDefault();
        resetFeedback();
        if (!identity.trim()) {
            setError('Please enter your username, email, or phone number');
            return;
        }
        setSubmitting(true);
        try {
            const res = await apiService.authForgotPassword(identity.trim());
            if (res.success) {
                setRequestId(res.requestId);
                setMaskedContact(res.maskedContact || '');
                setDevCode(res.devCode || '');
                setInfoMessage(res.message || 'Verification code generated.');
                setResendCooldown(60);
                setMode('forgot_verify');
            } else {
                setError(res.error || 'Failed to request password reset');
            }
        } catch (err) {
            setError(err.message || 'Server error. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Step 2 of Forgot Password: Verify Code and Set New Password
    const handleResetSubmit = async (e) => {
        e.preventDefault();
        resetFeedback();
        if (!code.trim()) {
            setError('Please enter the 6-digit verification code');
            return;
        }
        if (!newPassword || newPassword.length < 6) {
            setError('New password must be at least 6 characters long');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        setSubmitting(true);
        try {
            const res = await apiService.authResetPassword(requestId, code.trim(), newPassword);
            if (res.success) {
                setMode('forgot_success');
            } else {
                setError(res.error || 'Password reset failed');
            }
        } catch (err) {
            setError(err.message || 'Server error. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const switchToLogin = (prefillUser = '') => {
        resetFeedback();
        if (prefillUser) setUsername(prefillUser);
        setCode('');
        setNewPassword('');
        setConfirmPassword('');
        setDevCode('');
        setMode('login');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-4 py-8">
            <div className="w-full max-w-md">
                {/* Branding */}
                <div className="text-center mb-8">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200 dark:shadow-orange-900/30 mb-4">
                        <img src="/logo.png" alt="" className="w-12 h-12 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
                        <span className="text-white font-bold text-2xl" id="logo-fallback" style={{ display: 'none' }}>D</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Devotee Management</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        {mode === 'login' && 'Sign in to continue'}
                        {mode === 'forgot_request' && 'Password Recovery'}
                        {mode === 'forgot_verify' && 'Verify & Set Password'}
                        {mode === 'forgot_success' && 'Reset Complete'}
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8">
                    {/* Error Notice */}
                    {error && (
                        <div className="mb-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm px-4 py-3 rounded-lg flex items-start gap-2.5">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Info Notice */}
                    {infoMessage && mode !== 'login' && (
                        <div className="mb-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-sm px-4 py-3 rounded-lg flex items-start gap-2.5">
                            <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
                            <span>{infoMessage}</span>
                        </div>
                    )}

                    {/* Dev Mode Code Helper Box */}
                    {devCode && mode === 'forgot_verify' && (
                        <div className="mb-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs px-3.5 py-2.5 rounded-lg">
                            <div className="font-semibold flex items-center justify-between">
                                <span>Dev Mode Verification Code:</span>
                                <span className="font-mono text-sm bg-amber-200/60 dark:bg-amber-800/60 px-2 py-0.5 rounded font-bold tracking-widest">{devCode}</span>
                            </div>
                        </div>
                    )}

                    {/* ─── 1. LOGIN MODE ─── */}
                    {mode === 'login' && (
                        <form onSubmit={handleLoginSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Username</label>
                                <input
                                    type="text"
                                    autoFocus
                                    autoComplete="username"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                                    placeholder="Enter your username or phone"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            resetFeedback();
                                            if (username.trim()) setIdentity(username.trim());
                                            setMode('forgot_request');
                                        }}
                                        className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
                                    >
                                        Forgot Password?
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all pr-10"
                                        placeholder="Enter your password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-sm shadow-orange-200 dark:shadow-orange-900/30 transition-all flex items-center justify-center gap-2"
                            >
                                {submitting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
                                {submitting ? 'Signing in...' : 'Sign In'}
                            </button>

                            {bypassEnabled && (
                                <button
                                    type="button"
                                    onClick={handleBypass}
                                    disabled={submitting}
                                    className="w-full py-2.5 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-60 border border-dashed border-slate-300 dark:border-slate-500 text-slate-500 dark:text-slate-300 text-sm font-medium rounded-lg transition-all"
                                >
                                    Skip login (dev mode)
                                </button>
                            )}
                        </form>
                    )}

                    {/* ─── 2. FORGOT PASSWORD: REQUEST OTP ─── */}
                    {mode === 'forgot_request' && (
                        <form onSubmit={handleRequestCode} className="space-y-5">
                            <div className="text-center sm:text-left">
                                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                    <KeyRound className="w-5 h-5 text-orange-500" />
                                    Reset Password
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                                    Enter your registered username, email, or phone number. We will send a 6-digit verification code to your WhatsApp.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Username, Email or Phone Number
                                </label>
                                <input
                                    type="text"
                                    autoFocus
                                    value={identity}
                                    onChange={e => setIdentity(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                                    placeholder="e.g. admin, devotee@iskcon.org, or phone"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-sm shadow-orange-200 dark:shadow-orange-900/30 transition-all flex items-center justify-center gap-2"
                            >
                                {submitting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
                                {submitting ? 'Sending code...' : 'Send Verification Code'}
                            </button>

                            <button
                                type="button"
                                onClick={() => switchToLogin(identity.trim())}
                                className="w-full py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Sign In
                            </button>
                        </form>
                    )}

                    {/* ─── 3. FORGOT PASSWORD: VERIFY & SET PASSWORD ─── */}
                    {mode === 'forgot_verify' && (
                        <form onSubmit={handleResetSubmit} className="space-y-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                    Enter Verification Code
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                                    {maskedContact
                                        ? `Code sent to ${maskedContact}. Valid for 10 minutes.`
                                        : 'Please enter the 6-digit code received.'}
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                                    6-Digit Code
                                </label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    autoFocus
                                    value={code}
                                    onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                                    className="w-full text-center tracking-[0.35em] font-mono text-xl font-bold px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                    placeholder="••••••"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all pr-10"
                                        placeholder="At least 6 characters"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                        tabIndex={-1}
                                    >
                                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                                    Confirm New Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all pr-10"
                                        placeholder="Repeat new password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                        tabIndex={-1}
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <button
                                    type="button"
                                    disabled={resendCooldown > 0 || submitting}
                                    onClick={() => handleRequestCode()}
                                    className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline disabled:opacity-50 disabled:no-underline"
                                >
                                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-sm shadow-orange-200 dark:shadow-orange-900/30 transition-all flex items-center justify-center gap-2"
                            >
                                {submitting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
                                {submitting ? 'Resetting password...' : 'Set New Password'}
                            </button>

                            <button
                                type="button"
                                onClick={() => switchToLogin(identity.trim())}
                                className="w-full py-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                Cancel and return to Sign In
                            </button>
                        </form>
                    )}

                    {/* ─── 4. FORGOT PASSWORD: SUCCESS ─── */}
                    {mode === 'forgot_success' && (
                        <div className="text-center py-4 space-y-5">
                            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-9 h-9" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                                    Password Reset Successful!
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5">
                                    Your password has been securely updated. You can now log in with your new credentials.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => switchToLogin(identity.trim())}
                                className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg shadow-sm shadow-orange-200 dark:shadow-orange-900/30 transition-all"
                            >
                                Sign In Now
                            </button>
                        </div>
                    )}
                </div>

                <p className="text-center text-slate-400 dark:text-slate-500 text-xs mt-6">
                    ISKCON Devotee Management System
                </p>
            </div>
        </div>
    );
};

export default LoginPage;