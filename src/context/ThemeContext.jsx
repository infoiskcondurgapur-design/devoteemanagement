import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme_dark_mode');
        return saved === 'true';
    });

    const [primaryColor, setPrimaryColor] = useState(() => {
        return localStorage.getItem('theme_primary_color') || '#ea580c'; // Default ISKCON Orange
    });

    const [eyeProtectMode, setEyeProtectMode] = useState(() => {
        const saved = localStorage.getItem('theme_eye_protect');
        return saved === 'true';
    });

    // Color options for the user
    const colorThemes = [
        { name: 'Orange', value: '#ea580c' },
        { name: 'Blue', value: '#2563eb' },
        { name: 'Purple', value: '#9333ea' },
        { name: 'Green', value: '#16a34a' },
        { name: 'Indigo', value: '#4f46e5' },
        { name: 'Red', value: '#dc2626' }
    ];

    useEffect(() => {
        localStorage.setItem('theme_dark_mode', darkMode);
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    useEffect(() => {
        localStorage.setItem('theme_eye_protect', eyeProtectMode);
        if (eyeProtectMode) {
            document.documentElement.classList.add('eye-protect');
        } else {
            document.documentElement.classList.remove('eye-protect');
        }
    }, [eyeProtectMode]);

    useEffect(() => {
        localStorage.setItem('theme_primary_color', primaryColor);
        // Apply primary color to CSS variable
        document.documentElement.style.setProperty('--primary-color', primaryColor);
    }, [primaryColor]);

    const toggleDarkMode = () => setDarkMode(prev => !prev);
    const toggleEyeProtect = () => setEyeProtectMode(prev => !prev);

    return (
        <ThemeContext.Provider value={{
            darkMode,
            toggleDarkMode,
            eyeProtectMode,
            toggleEyeProtect,
            setEyeProtectMode,
            primaryColor,
            setPrimaryColor,
            colorThemes
        }}>
            {children}
        </ThemeContext.Provider>
    );
};
