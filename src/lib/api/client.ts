// API base URL from environment variable
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.example.com';

// Generic fetch wrapper with error handling
export async function fetchApi<T>(
    endpoint: string,
    options?: RequestInit
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const isFormData = options?.body instanceof FormData;

    const config: RequestInit = {
        ...options,
        headers: {
            ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
            ...options?.headers,
        },
        credentials: 'include', // Include cookies for auth
    };

    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${token}`,
        };
    }

    const response = await fetch(url, config);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
    }

    return response.json();
}
