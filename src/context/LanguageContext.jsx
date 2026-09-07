import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
    en: {
        dashboard: 'Dashboard',
        devotees: 'Devotees',
        finance: 'Finance',
        inventory: 'Inventory',
        seva: 'Seva Board',
        settings: 'Settings',
        logout: 'Logout',
        add_devotee: 'Add Devotee',
        search_placeholder: 'Search by name, phone...',
        loading: 'Loading...',
        save: 'Save',
        cancel: 'Cancel',
        actions: 'Actions',
        welcome: 'Hare Krishna'
    }
};

export const LanguageProvider = ({ children }) => {
    const [lang, setLang] = useState(localStorage.getItem('app_lang') || 'en');

    useEffect(() => {
        localStorage.setItem('app_lang', lang);
    }, [lang]);

    const t = (key) => {
        return translations[lang][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useTranslation = () => {
    const context = useContext(LanguageContext);
    if (!context) throw new Error('useTranslation must be used within a LanguageProvider');
    return context;
};
