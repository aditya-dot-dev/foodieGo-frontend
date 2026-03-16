// Restaurant types
export interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  priceRange: string;
  imageUrl: string;
  isOpen: boolean;
  address?: string;
  area?: string;
  city?: string;
  openingTime?: string;
  closingTime?: string;
  averageRating?: number;
  totalReviews?: number;
  lat?: number;
  lng?: number;
}

// Menu types
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  isVeg: boolean;
  isAvailable: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  menuItems: MenuItem[];
}

export interface RestaurantWithMenu {
  restaurant: Restaurant;
  menu: MenuCategory[];
}

// Review types
export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface CreateReviewPayload {
  rating: number;
  comment?: string;
}

// Auth types
export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: string;
}

// Order types
export interface OrderItem {
  menuItemId: string;
  quantity: number;
  name?: string;
  price?: number;
}

export interface Order {
  id: string;
  restaurantId: string;
  totalAmount: number;
  status: string;
  createdAt: string;

  // Payment fields
  paymentStatus?: string;
  paymentIntentId?: string;
  paidAt?: string;

  // Cancellation fields
  cancelledAt?: string;
  cancellationReason?: string;
  cancelledBy?: string;
  refundAmount?: number;
  refundStatus?: string;

  restaurant: {
    id: string;
    name: string;
    address?: string;
    imageUrl?: string;
    description?: string;
    phone?: string;
    lat?: number;
    lng?: number;
  };

  orderItems: OrderItem[];
}


// Status history entry
export interface StatusHistoryEntry {
  from: string;
  to: string;
  timestamp: string;
  createdAt: string;
}

// Owner Order types (includes customer info)
export type OwnerOrder = {
  id: string;
  userId: string;
  restaurantId: string;
  status: string;
  totalAmount: number;
  createdAt: string;

  user: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };

  orderItems: {
    id: string;
    orderId: string;
    menuItemId: string;
    quantity: number;
    price: number;
    menuItem?: {
      id: string;
      name: string;
    };
  }[];
  statusHistory?: StatusHistoryEntry[];
};


export interface CreateOrderPayload {
  restaurantId: string;
  addressId: string;
  items: { menuItemId: string; quantity: number }[];
}

// API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  status: number;
}
// Coupon types
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
