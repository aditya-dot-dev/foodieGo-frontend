import type { Order, OwnerOrder } from '@/types';
import { fetchApi } from './client';
import { CreateOrderPayload } from './types';

export const orderApi = {
    // POST /orders - Create a new order
    create: async (payload: CreateOrderPayload): Promise<Order> => {
        return fetchApi<Order>('/orders', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    // GET /orders/my - Get current user's orders
    getMyOrders: async (): Promise<Order[]> => {
        return fetchApi<Order[]>('/orders/my');
    },

    // GET /orders/:id - Get single order
    getById: async (id: string): Promise<Order> => {
        return fetchApi<Order>(`/orders/${id}`);
    },

    // GET /orders/restaurant/:restaurantId - Get orders for a specific restaurant (owner)
    getRestaurantOrdersByRestaurant: async (restaurantId: string): Promise<OwnerOrder[]> => {
        return fetchApi<OwnerOrder[]>(`/orders/restaurant/${restaurantId}`);
    },

    // GET /orders/restaurant - Get restaurant orders (owner)
    getRestaurantOrders: async (): Promise<OwnerOrder[]> => {
        return fetchApi<OwnerOrder[]>('/orders/restaurant');
    },

    // PATCH /orders/:id/status - Update order status
    updateStatus: async (orderId: string, status: string): Promise<OwnerOrder> => {
        return fetchApi<OwnerOrder>(`/orders/${orderId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
    },

    // POST /orders/:id/cancel - Cancel order
    cancel: async (orderId: string, reason?: string): Promise<{
        message: string;
        refundAmount: number;
        refundPercentage: number;
        refundStatus: string;
        order: Order;
    }> => {
        return fetchApi(`/orders/${orderId}/cancel`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
        });
    },

    // POST /orders/:orderId/cancel - Cancel an order (alias for admin use)
    cancelOrder: async (orderId: string, reason: string): Promise<{ message: string; refundAmount: number; order: any }> => {
        return fetchApi(`/orders/${orderId}/cancel`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
        });
    },
};
