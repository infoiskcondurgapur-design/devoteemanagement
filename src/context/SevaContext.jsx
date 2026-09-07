import React, { createContext, useContext, useState, useEffect } from 'react';

const SevaContext = createContext();

export const useSeva = () => useContext(SevaContext);

export const SevaProvider = ({ children }) => {
    // Initial mock data simulating a database
    const [sevas, setSevas] = useState(() => {
        const saved = localStorage.getItem('seva_opportunities');
        return saved ? JSON.parse(saved) : [
            { id: '1', title: 'Sunday Feast Serving', department: 'Kitchen', date: '2025-02-15', slots: 5, occupied: 2, status: 'Open' },
            { id: '2', title: 'Temple Cleaning', department: 'Maintenance', date: '2025-02-16', slots: 10, occupied: 0, status: 'Open' },
            { id: '3', title: 'Book Distribution', department: 'Outreach', date: '2025-02-18', slots: 3, occupied: 3, status: 'Full' }
        ];
    });

    useEffect(() => {
        localStorage.setItem('seva_opportunities', JSON.stringify(sevas));
    }, [sevas]);

    const addSeva = (newSeva) => {
        const seva = { ...newSeva, id: Date.now().toString(), occupied: 0, status: 'Open' };
        setSevas([...sevas, seva]);
    };

    const deleteSeva = (id) => {
        setSevas(sevas.filter(s => s.id !== id));
    };

    // Simple mock logic for volunteering
    const volunteerForSeva = (id, _devoteeId) => {
        setSevas(sevas.map(s => {
            if (s.id === id && s.occupied < s.slots) {
                return { ...s, occupied: s.occupied + 1, status: s.occupied + 1 >= s.slots ? 'Full' : 'Open' };
            }
            return s;
        }));
    };

    return (
        <SevaContext.Provider value={{ sevas, addSeva, deleteSeva, volunteerForSeva }}>
            {children}
        </SevaContext.Provider>
    );
};
