import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';
import { COUNSELORS_LIST } from '../data/counselors';
import { SPIRITUAL_MASTERS_LIST } from '../data/spiritualMasters';

const ReferenceDataContext = createContext();

export const useReferenceData = () => {
    const context = useContext(ReferenceDataContext);
    if (!context) {
        throw new Error('useReferenceData must be used within a ReferenceDataProvider');
    }
    return context;
};

export const LIST_TYPES = {
    counselors: 'counselors_list',
    spiritualMasters: 'spiritual_masters_list',
};

const parseList = (raw) => {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter(name => (name || '').trim()) : [];
    } catch {
        return [];
    }
};

const uniqueSorted = (names) => [...new Set(names.map(n => (n || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));

export const ReferenceDataProvider = ({ children }) => {
    const [customLists, setCustomLists] = useState({
        [LIST_TYPES.counselors]: [],
        [LIST_TYPES.spiritualMasters]: [],
    });
    const [loading, setLoading] = useState(true);

    const fetchLists = useCallback(async () => {
        try {
            const result = await apiService.get('/api/system/settings');
            const settings = result.data || {};
            setCustomLists({
                [LIST_TYPES.counselors]: parseList(settings[LIST_TYPES.counselors]),
                [LIST_TYPES.spiritualMasters]: parseList(settings[LIST_TYPES.spiritualMasters]),
            });
        } catch {
            // Non-fatal: fall back to built-in defaults only
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Anonymous visitors (public pages) get a 401 here — fall back to the
        // built-in defaults and fetch the custom lists once a session exists.
        if (apiService.authGetToken()) fetchLists();
        else setLoading(false);

        const onAuthChanged = () => {
            if (apiService.authGetToken()) fetchLists();
        };
        window.addEventListener('auth:changed', onAuthChanged);
        return () => window.removeEventListener('auth:changed', onAuthChanged);
    }, [fetchLists]);

    const persistList = async (type, names) => {
        const next = {
            ...customLists,
            [type]: names,
        };
        setCustomLists(next);
        await apiService.post('/api/system/settings', {
            [type]: JSON.stringify(names),
        });
    };

    const addName = async (type, name) => {
        const clean = (name || '').trim();
        if (!clean) return null;
        const current = customLists[type] || [];
        if (current.some(n => n.toLowerCase() === clean.toLowerCase())) return clean;
        const next = uniqueSorted([...current, clean]);
        await persistList(type, next);
        fetchLists();
        return clean;
    };

    const removeName = async (type, name) => {
        const current = customLists[type] || [];
        const next = current.filter(n => n.toLowerCase() !== String(name).toLowerCase());
        if (next.length === current.length) return false;
        await persistList(type, next);
        fetchLists();
        return true;
    };

    const counselors = uniqueSorted([...COUNSELORS_LIST, ...(customLists[LIST_TYPES.counselors] || [])]);
    const spiritualMasters = uniqueSorted([...SPIRITUAL_MASTERS_LIST, ...(customLists[LIST_TYPES.spiritualMasters] || [])]);

    return (
        <ReferenceDataContext.Provider
            value={{
                loading,
                counselors,
                spiritualMasters,
                customCounselors: customLists[LIST_TYPES.counselors] || [],
                customSpiritualMasters: customLists[LIST_TYPES.spiritualMasters] || [],
                addName,
                removeName,
                LIST_TYPES,
            }}
        >
            {children}
        </ReferenceDataContext.Provider>
    );
};

export default ReferenceDataProvider;