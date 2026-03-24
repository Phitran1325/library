import axios from 'axios';
import type { User} from "../types";

// Create axios instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
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

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            const status = error.response.status;
            if (status === 401) {
                // Token expired or invalid
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.dispatchEvent(new Event('auth:logout'));
            }
        }
        return Promise.reject(error);
    }
);

// ==================== PROFILE APIs ====================

/**
 * Get current user profile
 */
/**
 * Get current user profile
 */
export const getProfile = async (): Promise<User> => {
    try {
        const res = await api.get<User>('/users/profile');
        return res.data;
    } catch (error) {
        console.error('Error fetching profile:', error);
        throw error;
    }
};

/**
 * Update user profile
 */
export const updateProfile = async (data: Partial<User>): Promise<User> => {
    try {
        const res = await api.patch<{ message: string; user: User }>('/users/profile', data);
        return res.data.user;
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
};

/**
 * Upload user avatar
 */
/**
 * Upload user avatar
 */
export const uploadAvatar = async (file: File): Promise<string> => {
    try {
        // Convert file to Base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });
        reader.readAsDataURL(file);
        const avatarUrl = await base64Promise;

        // Send as JSON
        const res = await api.post<{ message: string; avatarUrl: string }>('/users/avatar', { avatarUrl });

        return res.data.avatarUrl;
    } catch (error) {
        console.error('Error uploading avatar:', error);
        throw error;
    }
};
