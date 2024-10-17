// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000'; // Adjust if your backend runs on a different port

const api = axios.create({
    baseURL: API_BASE_URL,
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
