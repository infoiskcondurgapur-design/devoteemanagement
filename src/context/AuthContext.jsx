import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const USER_KEY = 'auth_user';

const getStoredUser = () => {
    try {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
};

const setStoredUser = (user) => {
    try {
        if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
        else localStorage.removeItem(USER_KEY);
    } catch { /* ignore */ }
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(getStoredUser);
    const [loading, setLoading] = useState(!!apiService.authGetToken());
    const [bypassEnabled, setBypassEnabled] = useState(false);

    const isAdmin = currentUser?.role === 'admin';
    const isCounselor = currentUser?.role === 'counselor';
    const isViewer = currentUser?.role === 'viewer';
    const isAuthenticated = !!currentUser && !!apiService.authGetToken();
    const devoteeId = currentUser?.devoteeId || null;
    const canEdit = isAdmin;
    const canRequestChanges = isAuthenticated;

    // Local auxiliary user list kept for the User Management UI.
    const [users, setUsers] = useState(() => {
        const saved = localStorage.getItem('app_users');
        return saved ? JSON.parse(saved) : [];
    });

    const login = async (username, password) => {
        const res = await apiService.authLogin(username, password);
        if (res.success && res.user) {
            setCurrentUser(res.user);
            setStoredUser(res.user);
        }
        return res;
    };

    const bypassLogin = async () => {
        const res = await apiService.authBypass();
        if (res.success && res.user) {
            setCurrentUser(res.user);
            setStoredUser(res.user);
        }
        return res;
    };

    const logout = async () => {
        await apiService.authLogout();
        setCurrentUser(null);
        setStoredUser(null);
        window.location.hash = '#/login';
    };

    // Bootstrap: validate session on mount
    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!apiService.authGetToken()) {
                setLoading(false);
                return;
            }
            try {
                const res = await apiService.validateSession();
                if (!cancelled && res.success && res.user) {
                    setCurrentUser(res.user);
                    setStoredUser(res.user);
                } else if (!cancelled) {
                    setCurrentUser(null);
                    setStoredUser(null);
                }
            } catch {
                if (!cancelled) {
                    setCurrentUser(null);
                    setStoredUser(null);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // Probe whether the backend exposes the dev bypass (DMS_AUTH_BYPASS=1).
    // Silently resolves to false when the API is unreachable.
    useEffect(() => {
        let cancelled = false;
        apiService.authBypassStatus().then((enabled) => {
            if (!cancelled) setBypassEnabled(enabled);
        });
        return () => { cancelled = true; };
    }, []);

    // Auto-logout on 401 from any non-login API call.
    // Never bounce visitors of public routes (#/login, #/register) elsewhere.
    useEffect(() => {
        const handler = () => {
            setCurrentUser(null);
            setStoredUser(null);
            apiService.authClearToken();
            const hash = (window.location.hash || '').toLowerCase();
            if (!hash.includes('/login') && !hash.includes('/register')) {
                window.location.hash = '#/login';
            }
        };
        window.addEventListener('app:unauthorized', handler);
        return () => window.removeEventListener('app:unauthorized', handler);
    }, []);

    return (
        <AuthContext.Provider value={{
            currentUser,
            users,
            setUsers,
            loading,
            isAuthenticated,
            isAdmin,
            isCounselor,
            isViewer,
            devoteeId,
            canEdit,
            canRequestChanges,
            login,
            bypassLogin,
            bypassEnabled,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};