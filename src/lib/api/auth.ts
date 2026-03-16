import type { AuthResponse, LoginCredentials, RegisterCredentials } from '@/types';
import { fetchApi } from './client';

export const authApi = {
    // POST /auth/login
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const response = await fetchApi<AuthResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });

        if (response.token) {
            localStorage.setItem('auth_token', response.token);
        }

        if (response.user?.role) {
            localStorage.setItem('user_role', response.user.role);
        }

        return response;
    },

    // POST /auth/register
    register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
        const response = await fetchApi<AuthResponse>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });

        // Store token on successful registration
        if (response.token) {
            localStorage.setItem('auth_token', response.token);
        }

        if (response.user?.role) {
            localStorage.setItem('user_role', response.user.role);
        }

        return response;
    },

    // Logout - Clear stored token
    logout: (): void => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_role');
    },

    // Check if user is authenticated
    isAuthenticated: (): boolean => {
        return !!localStorage.getItem('auth_token');
    },
};
