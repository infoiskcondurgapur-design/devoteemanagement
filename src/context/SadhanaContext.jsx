import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import apiService from '../services/api';

const SadhanaContext = createContext();

export const useSadhana = () => useContext(SadhanaContext);

export const SadhanaProvider = ({ children }) => {
    const [sadhanaEntries, setSadhanaEntries] = useState([]);
    const [, setLoading] = useState(true);

    // Initial Migration logic
    useEffect(() => {
        const fetchAllSadhana = async () => {
            try {
                // Since sadhana is fetched by devotee, we might need a general fetch or just rely on lazy loading
                // For migration, we check localStorage
                const saved = localStorage.getItem('sadhana_entries');
                const localData = saved ? JSON.parse(saved) : [];

                if (localData.length > 0) {
                    console.log('Migrating local sadhana to SQL...');
                    for (const entry of localData) {
                        await apiService.post('/api/sadhana', entry);
                    }
                    localStorage.removeItem('sadhana_entries');
                }
            } catch (error) {
                console.error('Sadhana migration failed:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAllSadhana();
    }, []);

    const addEntry = async (entry) => {
        const newEntry = { ...entry, id: Date.now().toString(), timestamp: new Date().toISOString() };
        try {
            await apiService.post('/api/sadhana', newEntry);
            setSadhanaEntries(prev => [...prev, newEntry]);
        } catch (error) {
            console.error("Error adding sadhana: ", error);
        }
    };

    const fetchSadhanaByDevotee = useCallback(async (devoteeId) => {
        try {
            const result = await apiService.get(`/api/sadhana/${devoteeId}`);
            if (result.success) {
                setSadhanaEntries(prev => {
                    const others = prev.filter(e => e.devoteeId !== devoteeId);
                    return [...others, ...result.data];
                });
            }
        } catch (error) {
            console.error('Error fetching sadhana:', error);
        }
    }, []);

    const getEntriesByDevotee = (devoteeId) => {
        const filtered = sadhanaEntries.filter(e => e.devoteeId === devoteeId);
        return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    };

    const deleteEntry = async (id) => {
        try {
            await apiService.delete(`/api/sadhana/${id}`);
            setSadhanaEntries(prev => prev.filter(e => e.id !== id));
        } catch (error) {
            console.error("Error deleting sadhana: ", error);
        }
    };

    return (
        <SadhanaContext.Provider value={{ sadhanaEntries, addEntry, fetchSadhanaByDevotee, getEntriesByDevotee, deleteEntry }}>
            {children}
        </SadhanaContext.Provider>
    );
};
