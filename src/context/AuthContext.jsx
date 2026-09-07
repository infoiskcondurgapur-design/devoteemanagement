import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    // Local auxiliary user list kept for the User Management UI.
    const [users, setUsers] = useState(() => {
        const saved = localStorage.getItem('app_users');
        return saved ? JSON.parse(saved) : [];
    });

    // Login is removed: everyone is treated as a local admin.
    const currentUser = {
        id: '1',
        name: 'Admin',
        displayName: 'Admin',
        email: 'admin@iskcon.org',
        role: 'admin'
    };

    const isAdmin = true;
    const isCounselor = false;
    const isViewer = false;

    return (
        <AuthContext.Provider value={{
            currentUser, users, setUsers,
            isAdmin, isCounselor, isViewer
        }}>
            {children}
        </AuthContext.Provider>
    );
};
