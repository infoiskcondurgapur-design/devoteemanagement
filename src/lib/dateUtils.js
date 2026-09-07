/**
 * Centralized Date Utilities
 * Formats dates to the standard dd/mm/yyyy format used throughout the app.
 */

export const formatDate = (dateInput) => {
    if (!dateInput) return 'N/A';
    
    try {
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) return 'N/A';
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'N/A';
    }
};

/**
 * Formats a date range (start to end)
 */
export const formatDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return 'N/A';
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
};
