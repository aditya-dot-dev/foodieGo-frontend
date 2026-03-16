import type {
    Restaurant,
    RestaurantWithMenu,
    AuthResponse,
    LoginCredentials,
    RegisterCredentials,
    Order,
    OwnerOrder,
    Review,
    CreateReviewPayload
} from '@/types';

export interface CreateOrderPayload {
    restaurantId: string;
    items: {
        menuItemId: string;
        quantity: number;
    }[];
    addressId: string;
    couponCode?: string; // ✅ Optional coupon code
}

// Profile types
export interface ProfileData {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: 'USER' | 'RESTAURANT' | 'ADMIN';
    profile_image?: string;
}

export interface UpdateProfilePayload {
    name?: string;
    phone?: string;
}

export interface UpdateAvatarPayload {
    profile_image: string | File;
}

// Address types
export interface UserAddress {
    id: string;
    label: string;
    address: string;
    lat?: number;
    lng?: number;
    userId?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateAddressPayload {
    label: string;
    address: string;
    lat?: number;
    lng?: number;
}

export interface UpdateAddressPayload {
    label?: string;
    address?: string;
    lat?: number;
    lng?: number;
}

export interface Coupon {
    id: string;
    code: string;
    description?: string;
    discountType: 'FLAT' | 'PERCENTAGE';
    discountAmount: number;
    minOrderValue: number;
    maxDiscount?: number;
    expiresAt: string;
    isActive?: boolean;
    restaurantId?: string;
}

export interface ApplyCouponResponse {
    code: string;
    discount: number;
    finalTotal: number;
    message: string;
}
