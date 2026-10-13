import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
    const { login, isAuthenticated, loading, bypassEnabled, bypassLogin } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
            </div>
        );
    }

    if (isAuthenticated) return <Navigate to="/" replace />;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!username.trim() || !password) {
            setError('Please enter username and password');
            return;
        }
        setSubmitting(true);
        try {
            const res = await login(username.trim(), password);
            if (res.success) {
                navigate('/', { replace: true });
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
        setError('');
        setSubmitting(true);
        try {
            const res = await bypassLogin();
            if (res.success) {
                navigate('/', { replace: true });
            } else {
                setError(res.error || 'Bypass login failed');
            }
        } catch (err) {
            setError(err.message || 'Bypass login failed');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-4">
            <div className="w-full max-w-md">
                {/* Branding */}
                <div className="text-center mb-8">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200 dark:shadow-orange-900/30 mb-4">
                        <img src="/logo.png" alt="" className="w-12 h-12 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
                        <span className="text-white font-bold text-2xl" id="logo-fallback" style={{ display: 'none' }}>D</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Devotee Management</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Sign in to continue</p>
                </div>

                {/* Login card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm px-4 py-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Username</label>
                            <input
                                type="text"
                                autoFocus
                                autoComplete="username"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                                placeholder="Enter your username"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
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
                </div>

                <p className="text-center text-slate-400 dark:text-slate-500 text-xs mt-6">
                    ISKCON Devotee Management System
                </p>
            </div>
        </div>
    );
};

export default LoginPage;