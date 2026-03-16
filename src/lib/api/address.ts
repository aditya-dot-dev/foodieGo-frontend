import { fetchApi } from './client';
import { UserAddress, CreateAddressPayload, UpdateAddressPayload } from './types';

export const addressApi = {
    // GET /addresses - Get all addresses for current user
    getAll: async (): Promise<UserAddress[]> => {
        return fetchApi<UserAddress[]>('/addresses');
    },

    // POST /addresses - Create new address
    create: async (payload: CreateAddressPayload): Promise<UserAddress> => {
        return fetchApi<UserAddress>('/addresses', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    // PUT /addresses/:id - Update address
    update: async (id: string, payload: UpdateAddressPayload): Promise<UserAddress> => {
        return fetchApi<UserAddress>(`/addresses/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    },

    // DELETE /addresses/:id - Delete address
    delete: async (id: string): Promise<void> => {
        return fetchApi<void>(`/addresses/${id}`, {
            method: 'DELETE',
        });
    },
};
