import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';
import wsClient from '../services/wsClient';

const DevoteeContext = createContext();

export const useDevotees = () => {
    const context = useContext(DevoteeContext);
    if (!context) {
        throw new Error('useDevotees must be used within a DevoteeProvider');
    }
    return context;
};

export const DevoteeProvider = ({ children }) => {
    const [devotees, setDevotees] = useState([]);
    const [paginatedDevotees, setPaginatedDevotees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState('saved');
    const [stats, setStats] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [googleSheetsStatus, setGoogleSheetsStatus] = useState({ authenticated: false, lastSync: null });
    const [events, setEvents] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [filterOptions, setFilterOptions] = useState({ counselors: [], districts: [] });
    const [isLiveConnected, setIsLiveConnected] = useState(false);

    // Strips legacy Unsplash placeholder photo that was previously defaulted
    const cleanPhotoUrl = (photo) => {
        if (!photo || typeof photo !== 'string') return '';
        if (photo.includes('photo-1633332755192-727a05c4013d')) return '';
        return photo;
    };

    // ✅ Safe localStorage helper — strips base64 photos to avoid quota errors and cleans legacy placeholder URLs
    const safeLocalStorageSave = (devoteeList) => {
        try {
            const safe = devoteeList.map(d => ({
                ...d,
                photo: d.photo && d.photo.startsWith('data:') ? '' : cleanPhotoUrl(d.photo)
            }));
            localStorage.setItem('devotees', JSON.stringify(safe));
        } catch (e) {
            console.warn('[LocalStorage] Could not save devotees (quota exceeded):', e.message);
            try { localStorage.removeItem('devotees'); } catch { }
        }
    };

    // ✅ Heals devotees with null/undefined IDs locally and sanitizes legacy placeholder photos
    const healNullIds = async (devoteeList) => {
        return devoteeList.map(dev => {
            const cleanedPhoto = cleanPhotoUrl(dev.photo);
            if (!dev.id || dev.photo !== cleanedPhoto) {
                return {
                    ...dev,
                    id: dev.id || crypto.randomUUID(),
                    photo: cleanedPhoto
                };
            }
            return dev;
        });
    };

    useEffect(() => {
        let statsInterval = null;
        const stopPolling = () => {
            if (statsInterval) { clearInterval(statsInterval); statsInterval = null; }
            wsClient.disconnect();
        };
        const startPolling = () => {
            stopPolling();
            wsClient.connect();
            fetchDevotees();
            fetchStats();
            fetchEvents();
            checkGoogleSheetsStatus();
            fetchFilterOptions();
            statsInterval = setInterval(() => {
                if (document.visibilityState === 'visible') {
                    fetchStats();
                }
            }, 60000);
        };

        // Real-Time WebSocket event listener
        const handleSync = (e) => {
            const { type } = e.detail || {};
            if (['DEVOTEE_CREATED', 'DEVOTEE_UPDATED', 'DEVOTEE_DELETED', 'DATA_MUTATED'].includes(type)) {
                fetchDevotees(true);
                fetchStats();
                fetchFilterOptions();
                window.dispatchEvent(new CustomEvent('devotees:refresh'));
            }
        };

        const handleWsStatus = (e) => {
            setIsLiveConnected(!!e.detail?.connected);
        };

        // Auto-refresh when user focuses back on the tab
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && apiService.authGetToken()) {
                fetchStats();
                fetchFilterOptions();
                fetchDevotees(true);
                window.dispatchEvent(new CustomEvent('devotees:refresh'));
            }
        };

        window.addEventListener('dms:sync', handleSync);
        window.addEventListener('dms:ws-status', handleWsStatus);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Anonymous visitors (public pages like #/register) must not fire admin
        // API calls — they would only produce 401 noise and rate-limit pressure.
        if (apiService.authGetToken()) startPolling();
        else setLoading(false);

        const onAuthChanged = () => {
            if (apiService.authGetToken()) startPolling();
            else { stopPolling(); setLoading(false); }
        };
        window.addEventListener('auth:changed', onAuthChanged);

        return () => {
            stopPolling();
            window.removeEventListener('dms:sync', handleSync);
            window.removeEventListener('dms:ws-status', handleWsStatus);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('auth:changed', onAuthChanged);
        };
    }, []);

    // Master devotee list query (loads complete congregation up to 2000 for Map, Reports, CounselorDashboard, etc.)
    const fetchDevotees = async (quiet = false) => {
        try {
            if (!quiet) setLoading(true);
            const result = await apiService.get('/api/devotees?limit=2000');
            if (result.success) {
                const saved = localStorage.getItem('devotees');
                const localData = saved ? JSON.parse(saved) : [];

                if (result.total === 0 && localData.length > 0) {
                    for (const dev of localData) {
                        await apiService.post('/api/devotees', dev);
                    }
                    const reResult = await apiService.get('/api/devotees?limit=2000');
                    const healed = await healNullIds(reResult.data || []);
                    setDevotees(healed);
                    setTotalCount(reResult.total || healed.length);
                    safeLocalStorageSave(healed);
                } else {
                    const healed = await healNullIds(result.data || []);
                    setDevotees(healed);
                    setTotalCount(result.total || healed.length);
                    safeLocalStorageSave(healed);
                }
            }
        } catch (error) {
            console.error('Failed to fetch devotees from SQL:', error);
            if (!quiet) {
                const saved = localStorage.getItem('devotees');
                setDevotees(saved ? JSON.parse(saved) : []);
            }
        } finally {
            if (!quiet) setLoading(false);
        }
    };

    const fetchFilterOptions = async () => {
        try {
            const result = await apiService.get('/api/devotees/filter-options');
            if (result.success) {
                setFilterOptions({
                    counselors: result.counselors || [],
                    districts: result.districts || []
                });
            }
        } catch (error) {
            console.error('Failed to fetch filter options:', error);
        }
    };

    // Dedicated paginated fetch for the DevoteeList table. Updates paginatedDevotees WITHOUT wiping the master devotees list!
    const fetchPaginatedDevotees = async (page = 1, limit = 25, search = '', filters = {}) => {
        setLoading(true);
        try {
            const offset = (page - 1) * limit;
            let url = `/api/devotees?limit=${limit}&offset=${offset}`;
            if (search) url += `&search=${encodeURIComponent(search)}`;
            if (filters.status) url += `&status=${encodeURIComponent(filters.status)}`;
            if (filters.gender) url += `&gender=${encodeURIComponent(filters.gender)}`;
            if (filters.spiritualStatus) url += `&spiritualStatus=${encodeURIComponent(filters.spiritualStatus)}`;
            if (filters.counselor) url += `&counselor=${encodeURIComponent(filters.counselor)}`;
            if (filters.district) url += `&district=${encodeURIComponent(filters.district)}`;
            if (filters.contact) url += `&contact=${encodeURIComponent(filters.contact)}`;

            const result = await apiService.get(url);
            if (result.success) {
                const data = result.data || [];
                setPaginatedDevotees(data);
                setTotalCount(result.total || 0);
                return {
                    data,
                    total: result.total || 0
                };
            }
            throw new Error(result.error || 'Failed to fetch paginated devotees');
        } catch (error) {
            console.error('Failed to fetch paginated devotees:', error);
            return { data: [], total: 0 };
        } finally {
            setLoading(false);
        }
    };

    const checkGoogleSheetsStatus = async () => {
        try {
            const data = await apiService.get('/api/auth/google/status');
            if (data.success) {
                setGoogleSheetsStatus({
                    authenticated: data.authenticated,
                    lastSync: data.lastSync
                });
            }
        } catch (err) {
            console.error('Failed to fetch Google Sheets status:', err);
        }
    };

    const fetchStats = async () => {
        try {
            const result = await apiService.get('/api/devotees/stats');
            if (result.success) {
                setStats(result);
                setLastUpdated(new Date());
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const fetchEvents = async () => {
        try {
            const data = await apiService.get('/api/events');
            if (data.success) {
                setEvents(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch events:', error);
        }
    };

    const searchDevotees = async (term) => {
        try {
            const url = term
                ? `/api/devotees?search=${encodeURIComponent(term)}&limit=100`
                : '/api/devotees?limit=100';
            const result = await apiService.get(url);
            if (result.success) setDevotees(result.data);
        } catch (error) {
            console.error('Search failed:', error);
        }
    };

    const getDevoteeById = async (id) => {
        try {
            const data = await apiService.get(`/api/devotees/${encodeURIComponent(id)}`);
            return data.success ? data.data : null;
        } catch (error) {
            console.error('getDevoteeById failed:', error);
            return null;
        }
    };

    const uploadPhoto = async (imageSource) => {
        if (!imageSource) return null;
        if (typeof imageSource === 'string' && (imageSource.startsWith('http') || (!imageSource.startsWith('data:') && imageSource.length > 500))) {
            return imageSource;
        }

        try {
            let base64 = imageSource;
            if (imageSource instanceof File) {
                base64 = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(imageSource);
                });
            }

            const data = await apiService.uploadImage(base64);
            if (data.success) return data.url;
            throw new Error(data.error || 'Upload failed');
        } catch (err) {
            console.error('[Cloudinary] Upload helper failed:', err);
            throw new Error(`Photo upload failed: ${err.message}`);
        }
    };

    const addDevotee = async (devoteeData, imageFile) => {
        setSaveStatus('saving');
        try {
            let photoUrl = cleanPhotoUrl(devoteeData.photo);
            if (imageFile || (devoteeData.photo && devoteeData.photo.startsWith('data:'))) {
                const uploadedUrl = await uploadPhoto(imageFile || devoteeData.photo);
                if (uploadedUrl) photoUrl = uploadedUrl;
            }

            const newId = devoteeData.id || crypto.randomUUID();
            
            // Clean undefined values
            const cleanDevoteeData = {};
            Object.keys(devoteeData).forEach(key => {
                if (devoteeData[key] !== undefined) {
                    cleanDevoteeData[key] = devoteeData[key];
                }
            });

            const payload = { 
                ...cleanDevoteeData, 
                id: newId, 
                status: 'Active', 
                photo: photoUrl, 
                createdAt: new Date().toISOString() 
            };

            const result = await apiService.post('/api/devotees', payload);
            if (!result.success) throw new Error(result.error || 'Failed to save devotee');

            const newDevotee = { ...payload, id: newId };
            const updatedDevotees = [newDevotee, ...devotees].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setDevotees(updatedDevotees);
            setPaginatedDevotees(prev => [newDevotee, ...prev]);
            setTotalCount(prev => prev + 1);
            safeLocalStorageSave(updatedDevotees);
            fetchStats();
            setSaveStatus('saved');
            window.dispatchEvent(new CustomEvent('devotees:refresh'));
            return newDevotee;
        } catch (error) {
            console.error('Error adding devotee:', error);
            setSaveStatus('error');
            throw error;
        }
    };

    const bulkAddDevotees = async (devoteesList, options = {}) => {
        setSaveStatus('saving');
        try {
            const result = await apiService.bulkAddDevotees(devoteesList, options);
            if (!result.success) throw new Error(result.error || 'Failed to bulk import devotees');
            await fetchDevotees(true);
            fetchStats();
            fetchFilterOptions();
            setSaveStatus('saved');
            window.dispatchEvent(new CustomEvent('devotees:refresh'));
            return result;
        } catch (error) {
            console.error('Error in bulkAddDevotees:', error);
            setSaveStatus('error');
            throw error;
        }
    };

    const updateDevotee = async (id, updatedData, imageFile) => {
        setSaveStatus('saving');
        try {
            let photoUrl = cleanPhotoUrl(updatedData.photo);
            if (imageFile || (updatedData.photo && updatedData.photo.startsWith('data:'))) {
                const uploadedUrl = await uploadPhoto(imageFile || updatedData.photo);
                if (uploadedUrl) photoUrl = uploadedUrl;
            }

            // Create clean finalData without undefined properties
            const finalData = {};
            Object.keys(updatedData).forEach(key => {
                if (updatedData[key] !== undefined) {
                    finalData[key] = updatedData[key];
                }
            });
            if (photoUrl !== undefined) {
                finalData.photo = photoUrl;
            }

            await apiService.put(`/api/devotees/${id}`, finalData);

            setDevotees(prev => {
                const updated = prev.map(d => d.id === id ? { ...d, ...finalData } : d).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                safeLocalStorageSave(updated);
                return updated;
            });
            setPaginatedDevotees(prev => prev.map(d => d.id === id ? { ...d, ...finalData } : d));
            fetchStats();
            setSaveStatus('saved');
            window.dispatchEvent(new CustomEvent('devotees:refresh'));
        } catch (error) {
            console.error("Error updating devotee: ", error);
            setSaveStatus('error');
            throw error;
        }
    };

    const deleteDevotee = async (id) => {
        try {
            await apiService.delete(`/api/devotees/${id}`);
            setDevotees(prev => {
                const updated = prev.filter(d => d.id !== id);
                safeLocalStorageSave(updated);
                return updated;
            });
            setPaginatedDevotees(prev => prev.filter(d => d.id !== id));
            setTotalCount(prev => Math.max(0, prev - 1));
            fetchStats(); // Refresh stats from backend
            window.dispatchEvent(new CustomEvent('devotees:refresh'));
        } catch (error) {
            console.error("Error deleting devotee: ", error);
        }
    };


    const importData = async (file) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (Array.isArray(data)) {
                    if (window.confirm(`Importing ${data.length} devotees. Continue?`)) {
                        // ✅ Sync each devotee to SQL backend
                        let synced = 0;
                        for (const dev of data) {
                            const devWithId = { ...dev, id: dev.id || Date.now().toString() + Math.random().toString(36).slice(2), createdAt: dev.createdAt || new Date().toISOString() };
                            try {
                                await apiService.post('/api/devotees', devWithId);
                                synced++;
                            } catch (e) {
                                console.error('Failed to sync:', dev.name, e);
                            }
                        }
                        const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                        setDevotees(sorted);
                        localStorage.setItem('devotees', JSON.stringify(sorted));
                        fetchStats();
                        alert(`Import Complete! ${synced}/${data.length} devotees synced to database.`);
                    }
                }
            } catch {
                alert('Invalid JSON file.');
            }
        };
        reader.readAsText(file);
    };

    const getDashboardStats = () => {
        // Fallback to local calculation if backend stats haven't loaded or are unavailable
        const totalDevotees = stats?.total ?? devotees.length;
        const initiatedCount = stats?.initiated ?? devotees.filter(d => d.spiritualStatus === 'Initiated').length;
        const shelteredCount = stats?.sheltered ?? devotees.filter(d => d.spiritualStatus === 'Sheltered').length;
        const aspiringCount = stats?.aspiring ?? devotees.filter(d => !['Initiated', 'Sheltered'].includes(d.spiritualStatus)).length;

        const growthPercentage = stats && stats.lastMonthRegistrations > 0
            ? Math.round(((stats.currentMonthRegistrations - stats.lastMonthRegistrations) / stats.lastMonthRegistrations) * 100)
            : (stats?.currentMonthRegistrations > 0 ? 100 : 0);

        return {
            totalDevotees,
            initiatedCount,
            shelteredCount,
            aspiringCount,
            currentMonthRegistrations: stats?.currentMonthRegistrations ?? 0,
            growthPercentage,
            weeklyActivity: stats?.weeklyActivity ?? [0, 0, 0, 0, 0, 0, 0],
            birthdaysToday: stats?.birthdaysTodayList ?? devotees.filter(d => {
                if (!d.dob) return false;
                const today = new Date();
                const parts = d.dob.split('-');
                if (parts.length !== 3) return false;
                return parseInt(parts[1]) === (today.getMonth() + 1) && parseInt(parts[2]) === today.getDate();
            }),
            anniversariesToday: stats?.anniversariesTodayList ?? devotees.filter(d => {
                if (!d.anniversary) return false;
                const today = new Date();
                const parts = d.anniversary.split('-');
                if (parts.length !== 3) return false;
                return parseInt(parts[1]) === (today.getMonth() + 1) && parseInt(parts[2]) === today.getDate();
            }),
            lastUpdated,
            allDevotees: devotees, // ✅ Expose all devotees for upcoming birthdays computation
        };
    };

    const findDuplicate = (data, excludeId = null) => {
        const mode = localStorage.getItem('duplicate_detection_mode') || 'standard';

        // Normalize for comparison
        const name = data.name?.trim().toLowerCase();
        const contact = data.contact?.replace(/\D/g, '');
        const dob = data.dob;

        return devotees.find(d => {
            if (excludeId && d.id === excludeId) return false;

            if (mode === 'name_only') {
                return name && d.name?.trim().toLowerCase() === name;
            }

            // Standard Mode
            // 1. Check Phone (Strongest Match)
            if (contact && d.contact && d.contact.replace(/\D/g, '') === contact) return true;

            // 2. Check Name + DOB (Secondary Match)
            if (name && dob && d.name?.trim().toLowerCase() === name && d.dob === dob) return true;

            return false;
        });
    };

    const getAiMessageDraft = (devotee, type = 'general') => {
        const title = devotee.gender === 'Female' ? 'Mataji' : 'Prabhu';
        const name = devotee.name;

        const templates = {
            general: `Hare Krishna {name} {title}, how are you today?`,
            birthday: `Hare Krishna {name} {title}, wishing you a very happy birthday! May Lord Krishna bless you with more and more devotion.`,
            anniversary: `Hare Krishna {name} {title}, happy marriage anniversary! May your life together be always Krishna Centered.`,
            reminder: `Hare Krishna {name} {title}, this is a gentle reminder regarding...`
        };

        let draft = templates[type] || templates.general;
        return draft.replace(/{name}/g, name).replace(/{title}/g, title);
    };

    const value = {
        devotees,
        paginatedDevotees,
        loading,
        isLiveConnected,
        fetchDevotees,
        addDevotee,
        bulkAddDevotees,
        updateDevotee,
        deleteDevotee,
        importData,
        saveStatus,
        getDashboardStats,
        findDuplicate,
        searchDevotees,
        getDevoteeById,
        fetchStats,
        lastUpdated,
        googleSheetsStatus,
        getAiMessageDraft,
        events,
        fetchEvents,
        totalCount,
        filterOptions,
        fetchFilterOptions,
        fetchPaginatedDevotees
    };

    return (
        <DevoteeContext.Provider value={value}>
            {children}
        </DevoteeContext.Provider>
    );
};
