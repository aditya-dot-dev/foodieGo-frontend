import { fetchApi } from './client';
import { Coupon, ApplyCouponResponse } from './types';

export const couponApi = {
    // GET /coupons - Get all active coupons (with optional filters)
    getAll: async (params?: { ownerId?: string; restaurantId?: string; ownerRestaurantId?: string }): Promise<Coupon[]> => {
        const queryParams = new URLSearchParams();
        if (params?.ownerId) queryParams.append('ownerId', params.ownerId);
        if (params?.restaurantId) queryParams.append('restaurantId', params.restaurantId);
        if (params?.ownerRestaurantId) queryParams.append('ownerRestaurantId', params.ownerRestaurantId);

        return fetchApi<Coupon[]>(`/coupons?${queryParams.toString()}`);
    },

    // POST /coupons - Create new coupon
    create: async (data: Partial<Coupon>): Promise<Coupon> => {
        return fetchApi<Coupon>('/coupons', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // POST /coupons/apply - Validate and apply coupon
    apply: async (code: string, cartValue: number): Promise<ApplyCouponResponse> => {
        return fetchApi<ApplyCouponResponse>('/coupons/apply', {
            method: 'POST',
            body: JSON.stringify({ code, cartValue }),
        });
    },

    // PUT /coupons/:id - Update coupon
    update: async (id: string, data: Partial<Coupon>): Promise<Coupon> => {
        return fetchApi<Coupon>(`/coupons/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    // DELETE /coupons/:id - Delete coupon
    delete: async (id: string): Promise<{ message: string }> => {
        return fetchApi<{ message: string }>(`/coupons/${id}`, {
            method: 'DELETE'
        });
    },
};
