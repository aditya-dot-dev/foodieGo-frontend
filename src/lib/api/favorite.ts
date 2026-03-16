import type { Restaurant } from '@/types';
import { fetchApi } from './client';

export const favoriteApi = {
    // POST /favorites/:restaurantId - Toggle favorite
    toggle: async (restaurantId: string): Promise<{ favorited: boolean; message: string }> => {
        return fetchApi<{ favorited: boolean; message: string }>(`/favorites/${restaurantId}`, {
            method: 'POST',
        });
    },

    // GET /favorites - Get favorited restaurants
    getAll: async (): Promise<Restaurant[]> => {
        return fetchApi<Restaurant[]>('/favorites');
    },

    // GET /favorites/ids - Get IDs of favorited restaurants
    getIds: async (): Promise<string[]> => {
        return fetchApi<string[]>('/favorites/ids');
    },
};
