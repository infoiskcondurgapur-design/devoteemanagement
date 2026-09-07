// Centralized API Service for consistent fetching and error handling
const handleResponse = async (response) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.error || `Server error: ${response.status}`;
        throw new Error(message);
    }
    return response.json();
};

// Configurable API base URL. In web deployments set VITE_API_URL to the backend origin
// (e.g. https://api.your-subdomain.duckdns.org). Falls back to the local backend for
// desktop/dev usage.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const getApiUrl = (url) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

const apiService = {
    baseURL: BASE_URL,

    async get(url) {
        try {
            const response = await fetch(getApiUrl(url), { headers: { 'Content-Type': 'application/json' } });
            return await handleResponse(response);
        } catch (error) {
            console.error(`[API GET] Failed: ${url}`, error);
            throw error;
        }
    },

    async post(url, data) {
        try {
            const response = await fetch(getApiUrl(url), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await handleResponse(response);
        } catch (error) {
            console.error(`[API POST] Failed: ${url}`, error);
            throw error;
        }
    },

    async put(url, data) {
        try {
            const response = await fetch(getApiUrl(url), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await handleResponse(response);
        } catch (error) {
            console.error(`[API PUT] Failed: ${url}`, error);
            throw error;
        }
    },

    async delete(url) {
        try {
            const response = await fetch(getApiUrl(url), {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            return await handleResponse(response);
        } catch (error) {
            console.error(`[API DELETE] Failed: ${url}`, error);
            throw error;
        }
    },

    // Specialized helpers
    async uploadImage(base64) {
        return this.post('/api/upload', { image: base64 });
    }
};

export default apiService;