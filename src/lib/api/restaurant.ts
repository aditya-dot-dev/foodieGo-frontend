import type { Restaurant, RestaurantWithMenu, Review, CreateReviewPayload } from '@/types';
import { fetchApi } from './client';

export const restaurantApi = {
    // GET /restaurants - Fetch all restaurants
    getAll: async (): Promise<Restaurant[]> => {
        return fetchApi<Restaurant[]>('/restaurants');
    },

    // GET /restaurants/owner/restaurants - Fetch owner's restaurants
    getOwnerRestaurants: async (): Promise<Restaurant[]> => {
        return fetchApi<Restaurant[]>('/restaurants/owner/restaurants');
    },

    // GET /restaurants/:id - Fetch single restaurant
    getById: async (id: string): Promise<Restaurant> => {
        return fetchApi<Restaurant>(`/restaurants/${id}`);
    },

    // GET /restaurants/:id/menu - Fetch restaurant menu
    getMenu: async (id: string): Promise<RestaurantWithMenu> => {
        return fetchApi<RestaurantWithMenu>(`/restaurants/${id}/menu`);
    },

    // POST /restaurants - Create a new restaurant
    create: async (data: { name: string; description: string; cuisine: string; address: string; imageUrl?: string | File; city?: string; area?: string; lat?: number; lng?: number; openingTime?: string; closingTime?: string; priceRange?: string }): Promise<Restaurant> => {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                formData.append(key, value instanceof File ? value : String(value));
            }
        });

        return fetchApi<Restaurant>('/restaurants', {
            method: 'POST',
            body: formData,
        });
    },

    // PUT /restaurants/:id - Update restaurant details
    update: async (id: string, data: { name?: string; description?: string; cuisine?: string; address?: string; imageUrl?: string | File; city?: string; area?: string; lat?: number; lng?: number; openingTime?: string; closingTime?: string; priceRange?: string }): Promise<Restaurant> => {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                formData.append(key, value instanceof File ? value : String(value));
            }
        });

        return fetchApi<Restaurant>(`/restaurants/${id}`, {
            method: 'PUT',
            body: formData,
        });
    },

    // POST /restaurants/:id/menu/categories - Add menu category
    addCategory: async (restaurantId: string, data: { name: string }): Promise<{ id: string; name: string }> => {
        return fetchApi<{ id: string; name: string }>(`/restaurants/${restaurantId}/menu/categories`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // POST /restaurants/:id/menu/items - Add menu item
    addMenuItem: async (restaurantId: string, data: { name: string; description: string; price: number; categoryId: string; isVeg: boolean; imageUrl?: string | File }): Promise<{ id: string }> => {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                formData.append(key, value instanceof File ? value : String(value));
            }
        });

        return fetchApi<{ id: string }>(`/restaurants/${restaurantId}/menu/items`, {
            method: 'POST',
            body: formData,
        });
    },

    // GET /restaurants/:id/reviews - Get restaurant reviews
    getReviews: async (id: string): Promise<Review[]> => {
        return fetchApi<Review[]>(`/restaurants/${id}/reviews`);
    },

    // POST /restaurants/:id/reviews - Create a review
    createReview: async (id: string, payload: CreateReviewPayload): Promise<Review> => {
        return fetchApi<Review>(`/restaurants/${id}/reviews`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    // GET /restaurants/:id/reviews/eligibility - Check if user can review
    checkReviewEligibility: async (id: string): Promise<{ canReview: boolean }> => {
        return fetchApi<{ canReview: boolean }>(`/restaurants/${id}/reviews/eligibility`);
    },

    updateStatus: async (id: string, isOpen: boolean): Promise<Restaurant> => {
        return fetchApi<Restaurant>(`/restaurants/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ isOpen }),
        });
    },

    // GET /menu/search?q=query - Search menu items
    searchItems: async (query: string): Promise<any[]> => {
        return fetchApi<any[]>(`/menu/search?q=${encodeURIComponent(query)}`);
    },
};
