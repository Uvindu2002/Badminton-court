import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Admin API
export const adminAPI = {
    login: (credentials) => api.post('/admin/login', credentials),
    verify: () => api.get('/admin/verify'),
};

// Booking API
export const bookingAPI = {
    getByDate: (date) => api.get(`/bookings?date=${date}`),
    create: (bookingData) => api.post('/bookings', bookingData),
    update: (id, bookingData) => api.put(`/bookings/${id}`, bookingData),
    delete: (id) => api.delete(`/bookings/${id}`),
    bulkDelete: (bookingIds) => api.post('/bookings/bulk-delete', { bookingIds }),
    closeSlot: (data) => api.post('/bookings/close', data),
};

// Court Status API
export const courtStatusAPI = {
    getByDate: (date) => api.get(`/court-status?date=${date}`),
    closeSlot: (data) => api.post('/court-status/close', data),
    closeDay: (data) => api.post('/court-status/close-day', data),
    reopen: (id) => api.delete(`/court-status/${id}`),
    check: (date, startTime, courtId) => api.get(`/court-status/check?date=${date}&startTime=${startTime}&courtId=${courtId}`),
};

// Pricing API
export const pricingAPI = {
    getCurrent: () => api.get('/pricing/current'),
    getHistory: (limit) => api.get(`/pricing/history?limit=${limit || 10}`),
    update: (pricingData) => api.post('/pricing', pricingData),
    delete: (id) => api.delete(`/pricing/${id}`),
};

export default api;
