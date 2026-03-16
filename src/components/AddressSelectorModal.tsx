import { useEffect, useState } from 'react';
import { MapPin, Navigation, Plus, Check, AlertTriangle, Loader2, Home, Briefcase, MapPinned } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
// import { useNavigate } from 'react-router-dom';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { addressApi, type UserAddress, authApi } from '@/lib/api';
import { useDeliveryAddress, hasCartItems } from '@/contexts/DeliveryAddressContext';
import { useLocation } from '@/contexts/LocationContext';
import { useToast } from '@/hooks/use-toast';

/**
 * Get icon based on address label
 */
function getAddressIcon(label: string) {
  const lowerLabel = label.toLowerCase();
  if (lowerLabel.includes('home')) return Home;
  if (lowerLabel.includes('work') || lowerLabel.includes('office')) return Briefcase;
  return MapPinned;
}

export function AddressSelectorModal() {
  // const navigate = useNavigate();
  const isAuthenticated = authApi.isAuthenticated();
  const { toast } = useToast();

  const {
    activeAddress,
    setActiveAddress,
    isAddressModalOpen,
    closeAddressModal,
    isCheckoutMode,
    pendingAddress,
    setPendingAddress,
    confirmPendingAddress,
    cancelPendingAddress,
  } = useDeliveryAddress();

  const { location, openLocationModal, detectLocation } = useLocation();

  // Loading state for location detection
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Fetch saved addresses (only if authenticated)
  const {
    data: addresses = [],
    isLoading,
    refetch,
  } = useQuery<UserAddress[]>({
    queryKey: ['userAddresses'],
    queryFn: () => addressApi.getAll(),
    enabled: isAuthenticated && isAddressModalOpen,
    staleTime: 30000,
  });

  // Refetch addresses when modal opens
  useEffect(() => {
    if (isAddressModalOpen && isAuthenticated) {
      refetch();
    }
  }, [isAddressModalOpen, isAuthenticated, refetch]);

  // Auto-select default address ONLY if no address is active AND no location is set
  useEffect(() => {
    if (!activeAddress && !location && addresses.length > 0) {
      // Try to find a "Home" address as default, otherwise use first
      const homeAddress = addresses.find(
        (addr) => addr.label.toLowerCase().includes('home')
      );
      setActiveAddress(homeAddress || addresses[0]);
    }
  }, [addresses, activeAddress, setActiveAddress, location]);

  // Cleanup stale active address (if deleted remotely)
  useEffect(() => {
    if (activeAddress && addresses.length > 0 && !isLoading) {
      const exists = addresses.find(a => a.id === activeAddress.id);
      if (!exists) {
        setActiveAddress(null);
      }
    }
  }, [activeAddress, addresses, isLoading, setActiveAddress]);

  /**
   * Handle address selection with cart guard
   */
  const handleSelectAddress = (address: UserAddress) => {
    // If cart has items and address is changing, show confirmation
    if (hasCartItems() && activeAddress && activeAddress.id !== address.id) {
      setPendingAddress(address);
      return;
    }

    // No cart or same address - apply directly
    setActiveAddress(address);
    closeAddressModal();
  };

  /**
   * Handle "Use current location" - detect location directly with toast feedback
   */
  const handleUseCurrentLocation = async () => {
    setIsDetectingLocation(true);
    try {
      await detectLocation();
      // Location is now set in context
      // Clear active saved address so location takes precedence
      setActiveAddress(null);
      closeAddressModal();
      // Small delay to ensure location context is updated
      setTimeout(() => {
        toast({
          title: 'Location updated',
          description: 'Your delivery location has been updated',
        });
      }, 100);
    } catch (error) {
      toast({
        title: 'Could not detect location',
        description: 'Please try again or search manually',
        variant: 'destructive',
      });
      // Fall back to opening location modal for manual search
      closeAddressModal();
      openLocationModal();
    } finally {
      setIsDetectingLocation(false);
    }
  };

  /**
   * Navigate to profile to add new address
   */
  const handleAddNewAddress = () => {
    closeAddressModal();
    // navigate('/profile', { state: { fromCheckout: true, scrollToAddresses: true } });
    window.location.href = '/profile';
  };

  return (
    <>
      {/* Main Address Selection Modal */}
      <Dialog open={isAddressModalOpen} onOpenChange={(open) => !open && closeAddressModal()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Select delivery address
            </DialogTitle>
            <DialogDescription>
              Choose where you want your food delivered
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Use Current Location Option - NOT shown in checkout mode */}
            {!isCheckoutMode && (
              <>
                <button
                  onClick={handleUseCurrentLocation}
                  disabled={isDetectingLocation}
                  className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    {isDetectingLocation ? (
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    ) : (
                      <Navigation className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {isDetectingLocation ? 'Detecting location...' : 'Use current location'}
                    </p>
                    {location && !isDetectingLocation && (
                      <p className="text-sm text-muted-foreground">
                        {location.area}, {location.city}
                      </p>
                    )}
                  </div>
                </button>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Saved addresses
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Loading State */}
            {isAuthenticated && isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Not Logged In State */}
            {!isAuthenticated && (
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Log in to see your saved addresses
                </p>
                <Button variant="outline" size="sm" onClick={() => {
                  closeAddressModal();
                  // navigate('/login');
                  window.location.href = '/login';
                }}>
                  Log in
                </Button>
              </div>
            )}

            {/* Empty State */}
            {isAuthenticated && !isLoading && addresses.length === 0 && (
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <MapPin className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-3">
                  No saved addresses yet
                </p>
                <Button variant="outline" size="sm" onClick={handleAddNewAddress}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add address
                </Button>
              </div>
            )}

            {/* Address List */}
            {isAuthenticated && !isLoading && addresses.length > 0 && (
              <div className="space-y-2 max-h-[280px] overflow-y-auto">
                {addresses.map((addr) => {
                  const Icon = getAddressIcon(addr.label);
                  const isSelected = activeAddress?.id === addr.id;

                  return (
                    <button
                      key={addr.id}
                      onClick={() => handleSelectAddress(addr)}
                      className={`flex w-full items-start gap-3 rounded-lg border-2 p-3 text-left transition-all cursor-pointer ${isSelected
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50 hover:bg-accent/50'
                        }`}
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}>
                        <Icon className={`h-5 w-5 ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                            }`}>
                            {addr.label}
                          </span>
                          {isSelected && (
                            <Check className="h-4 w-4 text-primary shrink-0" />
                          )}
                        </div>
                        <p className="mt-1 text-sm text-foreground break-words line-clamp-2 text-left leading-snug">
                          {addr.address}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Add New Address Button */}
            {isAuthenticated && !isLoading && addresses.length > 0 && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleAddNewAddress}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add new address
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cart Change Warning Dialog */}
      <AlertDialog open={!!pendingAddress} onOpenChange={(open) => !open && cancelPendingAddress()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Change delivery address?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Changing your address may affect restaurant availability. Your current cart items might not be deliverable to the new location.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelPendingAddress}>
              Keep current address
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmPendingAddress}>
              Change anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
