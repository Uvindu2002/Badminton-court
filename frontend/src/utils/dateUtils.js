/**
 * Format date to YYYY-MM-DD
 */
export const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Get today's date in YYYY-MM-DD format
 */
export const getTodayDate = () => {
    return formatDate(new Date());
};

/**
 * Format date for display (e.g., "Jan 11, 2026")
 */
export const formatDisplayDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
};

/**
 * Check if date is today
 */
export const isToday = (dateStr) => {
    return dateStr === getTodayDate();
};
