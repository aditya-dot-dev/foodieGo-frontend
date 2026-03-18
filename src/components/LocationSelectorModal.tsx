import { useState, useEffect } from 'react';
import { MapPin, Navigation, Search, Check, Loader2, X } from 'lucide-react';
import { useLocation as useRouterLocation } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocation as useDeliveryLocation, Location } from '@/contexts/LocationContext';
import { useDeliveryAddress } from '@/contexts/DeliveryAddressContext';
import { geocodeAddress } from '@/lib/mapbox';



type ModalState = 'detecting' | 'confirm' | 'manual';

export function LocationSelectorModal() {
  const {
    location,
    setLocation,
    isModalOpen,
    closeLocationModal,
    isDetecting,
    detectLocation,
  } = useDeliveryLocation();
  const { pathname } = useRouterLocation();

  const { setActiveAddress } = useDeliveryAddress();

  const [modalState, setModalState] = useState<ModalState>('detecting');
  const [detectedLocation, setDetectedLocation] = useState<Location | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredResults, setFilteredResults] = useState<Location[]>([]);
  const [geoError, setGeoError] = useState(false);
  const suppressedRoutePrefixes = ['/login', '/register', '/admin', '/owner', '/delivery-partner'];
  const shouldSuppressAutoModal = suppressedRoutePrefixes.some((prefix) => pathname.startsWith(prefix));

  // Reset state when modal opens
  useEffect(() => {
    if (isModalOpen && !shouldSuppressAutoModal) {
      setGeoError(false);
      setSearchQuery('');
      setFilteredResults([]);

      // If no location set, try to detect
      if (!location) {
        setModalState('detecting');
        handleDetectLocation();
      } else {
        // If location already exists, show manual search for changing
        setModalState('manual');
      }
    }
  }, [isModalOpen, location, shouldSuppressAutoModal]);

  // Filter search results
  useEffect(() => {
    let active = true;

    const fetchLocations = async () => {
      if (searchQuery.trim().length < 2) {
        setFilteredResults([]);
        return;
      }

      try {
        const results = await geocodeAddress(searchQuery);

        if (!active) return;

        const locations: Location[] = results.map((item: any) => {
          const context = item.context || [];

          const city =
            context.find((c: any) => c.id.includes('place'))?.text ||
            context.find((c: any) => c.id.includes('district'))?.text ||
            '';

          const pincode =
            context.find((c: any) => c.id.includes('postcode'))?.text || '';

          // Extract coordinates from Mapbox center array [lng, lat]
          const coordinates = item.center ? {
            lat: item.center[1],
            lng: item.center[0]
          } : undefined;

          return {
            area: item.text,
            city,
            pincode,
            coordinates,
          };
        });

        setFilteredResults(locations);
      } catch {
        setFilteredResults([]);
      }
    };

    fetchLocations();

    return () => {
      active = false;
    };
  }, [searchQuery]);


  const handleDetectLocation = async () => {
    try {
      await detectLocation();
      // After detection, the location is already set in context
      // We need to get the detected location for confirmation
      // Also clear any active saved address so the new location takes precedence
      setActiveAddress(null);

      setModalState('confirm');
    } catch {
      setGeoError(true);
      setModalState('manual');
    }
  };

  const handleConfirmLocation = () => {
    // Ensure active address is cleared
    setActiveAddress(null);
    closeLocationModal();
  };

  const handleChangeLocation = () => {
    setModalState('manual');
  };

  const handleSelectLocation = (loc: Location) => {
    setLocation(loc);
    setActiveAddress(null); // Clear active saved address
    closeLocationModal();
  };

  const handleUseCurrentLocation = () => {
    setGeoError(false);
    setModalState('detecting');
    handleDetectLocation();
  };

  if (shouldSuppressAutoModal) {
    return null;
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeLocationModal()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {modalState === 'detecting' && 'Detecting your location...'}
            {modalState === 'confirm' && 'Confirm your location'}
            {modalState === 'manual' && 'Select delivery location'}
          </DialogTitle>
        </DialogHeader>

        {/* Detecting State */}
        {modalState === 'detecting' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Navigation className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <Loader2 className="absolute -bottom-1 -right-1 h-6 w-6 text-primary animate-spin" />
            </div>
            <p className="text-muted-foreground text-center">
              Please allow location access when prompted
            </p>
          </div>
        )}

        {/* Confirm State */}
        {modalState === 'confirm' && location && (
          <div className="space-y-6 py-4">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/50 border border-border">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">{location.area}</p>
                <p className="text-sm text-muted-foreground">
                  {location.city}{location.pincode ? ` - ${location.pincode}` : ''}
                </p>
              </div>
              <Check className="h-5 w-5 text-primary shrink-0" />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleChangeLocation}
              >
                Change
              </Button>
              <Button
                variant="gradient"
                className="flex-1"
                onClick={handleConfirmLocation}
              >
                Confirm
              </Button>
            </div>
          </div>
        )}

        {/* Manual Search State */}
        {modalState === 'manual' && (
          <div className="space-y-4 py-2">
            {/* Geolocation error message */}
            {geoError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <X className="h-4 w-4 shrink-0" />
                <span>Couldn't detect location. Please search manually.</span>
              </div>
            )}

            {/* Use current location button */}
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={handleUseCurrentLocation}
              disabled={isDetecting}
            >
              {isDetecting ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <Navigation className="h-5 w-5 text-primary" />
              )}
              <span>Use current location</span>
            </Button>

            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for area, city, or pincode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>

            {/* Search results */}
            {filteredResults.length > 0 && (
              <div className="max-h-64 overflow-y-auto space-y-1 border border-border rounded-lg p-1">
                {filteredResults.map((loc, index) => (
                  <button
                    key={`${loc.area}-${loc.pincode}-${index}`}
                    onClick={() => handleSelectLocation(loc)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left cursor-pointer"
                  >
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{loc.area}</p>
                      <p className="text-sm text-muted-foreground">
                        {loc.city}{loc.pincode ? ` - ${loc.pincode}` : ''}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Empty state when searching */}
            {searchQuery.trim().length > 0 && filteredResults.length === 0 && (
              <p className="text-center text-muted-foreground py-4 text-sm">
                No locations found for "{searchQuery}"
              </p>
            )}

          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
