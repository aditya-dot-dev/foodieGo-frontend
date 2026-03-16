import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { reverseGeocode } from '@/lib/mapbox';

export interface Location {
  area: string;
  city: string;
  pincode?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface LocationContextType {
  location: Location | null;
  setLocation: (location: Location) => void;
  isModalOpen: boolean;
  openLocationModal: () => void;
  closeLocationModal: () => void;
  isDetecting: boolean;
  detectLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const LOCATION_STORAGE_KEY = 'user_delivery_location';

// Mock reverse geocoding - in production, use a real API

function pickBestFeature(features: any[]) {
  return (
    features.find(f => f.place_type?.includes('neighborhood')) ||
    features.find(f => f.place_type?.includes('locality')) ||
    features.find(f => f.place_type?.includes('place')) ||
    features[0]
  );
}


export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocationState] = useState<Location | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [hasCheckedOnMount, setHasCheckedOnMount] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (saved) {
      try {
        setLocationState(JSON.parse(saved));
      } catch {
        localStorage.removeItem(LOCATION_STORAGE_KEY);
      }
    }
    setHasCheckedOnMount(true);
  }, []);

  // Auto-detect on first visit (no saved location)
  useEffect(() => {
    if (hasCheckedOnMount && !location) {
      // Open modal to start location flow
      setIsModalOpen(true);
    }
  }, [hasCheckedOnMount, location]);

  const setLocation = useCallback((loc: Location) => {
    setLocationState(loc);
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(loc));
  }, []);

  const openLocationModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeLocationModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const detectLocation = useCallback(async () => {
    setIsDetecting(true);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      const features = await reverseGeocode(latitude, longitude);

      const place = pickBestFeature(features);
      const context = place?.context || [];

      const city =
        context.find((c: any) => c.id.includes('place'))?.text ||
        context.find((c: any) => c.id.includes('district'))?.text ||
        '';

      const pincode =
        context.find((c: any) => c.id.includes('postcode'))?.text || '';

      setLocation({
        area:
          context.find((c: any) => c.id.includes('neighborhood'))?.text ||
          context.find((c: any) => c.id.includes('locality'))?.text ||
          place?.text ||
          'Unknown area',
        city,
        pincode,
        coordinates: {
          lat: latitude,
          lng: longitude,
        },
      });

      return;
    } catch (error) {
      // Geolocation failed - modal will show manual input
      throw error;
    } finally {
      setIsDetecting(false);
    }
  }, [setLocation]);

  return (
    <LocationContext.Provider
      value={{
        location,
        setLocation,
        isModalOpen,
        openLocationModal,
        closeLocationModal,
        isDetecting,
        detectLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
