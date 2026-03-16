import type { Order } from '@/types';
import { fetchApi } from './client';

export const paymentApi = {
    // POST /payment/create-intent - Create payment intent
    createIntent: async (orderId: string): Promise<{
        clientSecret: string;
        paymentIntentId: string;
        amount: number;
    }> => {
        return fetchApi('/payment/create-intent', {
            method: 'POST',
            body: JSON.stringify({ orderId }),
        });
    },

    // POST /payment/confirm - Confirm payment
    confirmPayment: async (paymentIntentId: string): Promise<{
        message: string;
        order: Order;
    }> => {
        return fetchApi('/payment/confirm', {
            method: 'POST',
            body: JSON.stringify({ paymentIntentId }),
        });
    },

    // GET /payment/status/:orderId - Get payment status
    getStatus: async (orderId: string): Promise<{
        id: string;
        paymentStatus: string;
        paymentIntentId: string | null;
        paidAt: string | null;
        payment: {
            status: string;
            paymentMethod: string | null;
            failureReason: string | null;
        } | null;
    }> => {
        return fetchApi(`/payment/status/${orderId}`);
    },
};
