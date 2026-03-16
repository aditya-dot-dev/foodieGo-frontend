import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { UserAddress } from '@/lib/api';

// Storage key for persisting active delivery address
const ACTIVE_ADDRESS_KEY = 'active_delivery_address';

interface DeliveryAddressContextType {
  // The currently active delivery address
  activeAddress: UserAddress | null;
  // Set active address (persisted to localStorage)
  setActiveAddress: (address: UserAddress | null) => void;
  // Modal state
  isAddressModalOpen: boolean;
  openAddressModal: (checkoutMode?: boolean) => void;
  closeAddressModal: () => void;
  // Checkout mode flag (hides 'Use current location' option)
  isCheckoutMode: boolean;
  // Pending address change (for cart guard)
  pendingAddress: UserAddress | null;
  setPendingAddress: (address: UserAddress | null) => void;
  // Confirm pending address change
  confirmPendingAddress: () => void;
  cancelPendingAddress: () => void;
}

const DeliveryAddressContext = createContext<DeliveryAddressContextType | undefined>(undefined);

/**
 * Helper to check if cart has items
 * Uses the same localStorage key as Checkout page
 */
function hasCartItems(): boolean {
  const saved = localStorage.getItem('checkout_cart');
  if (!saved) return false;
  try {
    const data = JSON.parse(saved);
    return Array.isArray(data?.cart) && data.cart.length > 0;
  } catch {
    return false;
  }
}

export function DeliveryAddressProvider({ children }: { children: React.ReactNode }) {
  // Active address state - loaded from localStorage on mount
  const [activeAddress, setActiveAddressState] = useState<UserAddress | null>(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_ADDRESS_KEY);
      if (saved) {
        return JSON.parse(saved) as UserAddress;
      }
    } catch (err) {
      console.error('Failed to parse saved delivery address:', err);
    }
    return null;
  });

  // Modal visibility state
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isCheckoutMode, setIsCheckoutMode] = useState(false);

  // Pending address for cart guard confirmation
  const [pendingAddress, setPendingAddress] = useState<UserAddress | null>(null);

  // Persist active address to localStorage whenever it changes
  useEffect(() => {
    if (activeAddress) {
      localStorage.setItem(ACTIVE_ADDRESS_KEY, JSON.stringify(activeAddress));
    } else {
      localStorage.removeItem(ACTIVE_ADDRESS_KEY);
    }
  }, [activeAddress]);

  // Set active address - handles cart guard logic
  const setActiveAddress = useCallback((address: UserAddress | null) => {
    setActiveAddressState(address);
  }, []);

  const openAddressModal = useCallback((checkoutMode = false) => {
    setIsCheckoutMode(checkoutMode);
    setIsAddressModalOpen(true);
  }, []);

  const closeAddressModal = useCallback(() => {
    setIsAddressModalOpen(false);
    setIsCheckoutMode(false);
    // Clear pending address when modal closes
    setPendingAddress(null);
  }, []);

  // Confirm pending address change (user confirmed cart warning)
  const confirmPendingAddress = useCallback(() => {
    if (pendingAddress) {
      setActiveAddressState(pendingAddress);
      setPendingAddress(null);
      setIsAddressModalOpen(false);
    }
  }, [pendingAddress]);

  // Cancel pending address change
  const cancelPendingAddress = useCallback(() => {
    setPendingAddress(null);
  }, []);

  const value = useMemo(() => ({
    activeAddress,
    setActiveAddress,
    isAddressModalOpen,
    openAddressModal,
    closeAddressModal,
    isCheckoutMode,
    pendingAddress,
    setPendingAddress,
    confirmPendingAddress,
    cancelPendingAddress,
  }), [
    activeAddress,
    setActiveAddress,
    isAddressModalOpen,
    isCheckoutMode,
    openAddressModal,
    closeAddressModal,
    pendingAddress,
    confirmPendingAddress,
    cancelPendingAddress,
  ]);

  return (
    <DeliveryAddressContext.Provider value={value}>
      {children}
    </DeliveryAddressContext.Provider>
  );
}

export function useDeliveryAddress() {
  const context = useContext(DeliveryAddressContext);
  if (context === undefined) {
    throw new Error('useDeliveryAddress must be used within a DeliveryAddressProvider');
  }
  return context;
}

// Export helper for cart check
export { hasCartItems };
