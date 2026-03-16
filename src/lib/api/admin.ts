import { fetchApi } from './client';

export const adminApi = {
    // GET /admin/stats - Get platform statistics
    getStats: async (): Promise<{
        totalUsers: number;
        totalRestaurants: number;
        totalOrders: number;
        totalRevenue: number;
        platformCommission: number;
        usersByRole: { role: string; _count: number }[];
        ordersByStatus: { status: string; _count: number }[];
    }> => {
        return fetchApi('/admin/stats');
    },

    // GET /admin/restaurants - List all restaurants
    getRestaurants: async (): Promise<any[]> => {
        return fetchApi('/admin/restaurants');
    },

    // PATCH /admin/restaurants/:id/toggle-status - Toggle restaurant status
    toggleRestaurantStatus: async (id: string): Promise<{ message: string; restaurant: any }> => {
        return fetchApi(`/admin/restaurants/${id}/toggle-status`, { method: 'PATCH' });
    },

    // PATCH /admin/restaurants/:id/toggle-verification - Toggle restaurant verification
    toggleRestaurantVerification: async (id: string): Promise<{ message: string; restaurant: any }> => {
        return fetchApi(`/admin/restaurants/${id}/toggle-verification`, { method: 'PATCH' });
    },

    // GET /admin/users - List all users
    getUsers: async (params?: { role?: string; status?: string }): Promise<any[]> => {
        const searchParams = new URLSearchParams();
        if (params?.role) searchParams.append('role', params.role);
        if (params?.status) searchParams.append('status', params.status);

        const queryString = searchParams.toString();
        return fetchApi(`/admin/users${queryString ? `?${queryString}` : ''}`);
    },

    // PATCH /admin/users/:id/verify - Verify user
    verifyUser: async (id: string): Promise<{ message: string; user: any }> => {
        return fetchApi(`/admin/users/${id}/verify`, { method: 'PATCH' });
    },

    // DELETE /admin/users/:id/reject - Reject user
    rejectUser: async (id: string): Promise<{ message: string; userId: string }> => {
        return fetchApi(`/admin/users/${id}/reject`, { method: 'DELETE' });
    },

    // GET /admin/coupons - List all coupons
    getCoupons: async (): Promise<any[]> => {
        return fetchApi('/admin/coupons');
    },
    getOrders: async (): Promise<any[]> => {
        return fetchApi('/admin/orders');
    },
};
