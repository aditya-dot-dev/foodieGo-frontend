import { fetchApi } from './client';

export const deliveryApi = {
    // GET /delivery/available-orders - Get available orders for pickup
    getAvailableOrders: async (): Promise<any[]> => {
        return fetchApi('/delivery/available-orders');
    },

    // GET /delivery/my-orders - Get delivery partner's assigned orders
    getMyOrders: async (): Promise<{
        active: any[];
        completed: any[];
        all: any[];
    }> => {
        return fetchApi('/delivery/my-orders');
    },

    // POST /delivery/accept/:orderId - Accept an order
    acceptOrder: async (orderId: string): Promise<{ message: string; order: any }> => {
        return fetchApi(`/delivery/accept/${orderId}`, { method: 'POST' });
    },

    // PATCH /delivery/update-status/:orderId - Update delivery status
    updateStatus: async (orderId: string, status: string): Promise<any> => {
        return fetchApi(`/delivery/update-status/${orderId}`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
    },

    // PATCH /delivery/toggle-availability - Toggle availability
    toggleAvailability: async (): Promise<{ isAvailable: boolean; message: string; partner: any }> => {
        return fetchApi('/delivery/toggle-availability', { method: 'PATCH' });
    },

    // PATCH /delivery/update-location - Update current location
    updateLocation: async (lat: number, lng: number): Promise<{ message: string }> => {
        return fetchApi('/delivery/update-location', {
            method: 'PATCH',
            body: JSON.stringify({ lat, lng }),
        });
    },

    // GET /delivery/profile - Get delivery partner profile
    getProfile: async (): Promise<any> => {
        return fetchApi('/delivery/profile');
    },
};
