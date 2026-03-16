import { fetchApi } from './client';

export const financeApi = {
    // GET /finance/wallet - Get wallet details
    getWallet: async (restaurantId?: string): Promise<any> => {
        const query = restaurantId ? `?restaurantId=${restaurantId}` : '';
        return fetchApi(`/finance/wallet${query}`);
    },

    // POST /finance/payout/request - Request a payout
    requestPayout: async (amount: number): Promise<{ message: string; payout: any }> => {
        return fetchApi('/finance/payout/request', {
            method: 'POST',
            body: JSON.stringify({ amount }),
        });
    },

    // POST /admin/finance/payout/process - Process a payout (Admin only)
    processPayout: async (payoutId: string): Promise<any> => {
        return fetchApi('/admin/finance/payout/process', {
            method: 'POST',
            body: JSON.stringify({ payoutId }),
        });
    },
};
