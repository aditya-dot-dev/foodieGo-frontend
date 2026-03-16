import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin, ShoppingBag, AlertCircle, Loader2, ChevronRight, TicketPercent, Receipt, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { orderApi, addressApi, type UserAddress } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { useDeliveryAddress } from '@/contexts/DeliveryAddressContext';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CheckoutState {
  cart: CartItem[];
  restaurantId: string;
  restaurantName: string;
}

const CHECKOUT_CART_KEY = 'checkout_cart';
const POST_AUTH_REDIRECT_KEY = 'postAuthRedirect';

function isLoggedIn(): boolean {
  return !!localStorage.getItem('auth_token');
}

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const state = location.state as CheckoutState | null;

  // Try to restore cart from localStorage if no state passed
  const [checkoutData, setCheckoutData] = useState<CheckoutState | null>(() => {
    if (state) return state;
    const saved = localStorage.getItem(CHECKOUT_CART_KEY);
    if (saved) {
      try {
        return JSON.parse(saved) as CheckoutState;
      } catch {
        return null;
      }
    }
    return null;
  });

  // Get active delivery address from context
  const { activeAddress, setActiveAddress, openAddressModal } = useDeliveryAddress();

  // Address state - selected address ID (pre-filled from active address)
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');

  // Fetch addresses from backend (only if logged in)
  const {
    data: addresses = [],
    isLoading: isLoadingAddresses,
  } = useQuery<UserAddress[]>({
    queryKey: ['userAddresses'],
    queryFn: () => addressApi.getAll(),
    enabled: isLoggedIn(), // Only fetch if logged in
    staleTime: 30000,
  });

  // Pre-select address from active delivery address or default
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      // Priority: activeAddress > home address > first address
      if (activeAddress && addresses.find(a => a.id === activeAddress.id)) {
        setSelectedAddressId(activeAddress.id);
      } else {
        const homeAddr = addresses.find(a => a.label.toLowerCase().includes('home'));
        setSelectedAddressId(homeAddr?.id || addresses[0].id);
      }
    }
  }, [addresses, activeAddress, selectedAddressId]);

  // Sync activeAddress changes from modal back to selectedAddressId
  useEffect(() => {
    if (activeAddress && addresses.find(a => a.id === activeAddress.id)) {
      setSelectedAddressId(activeAddress.id);
    }
  }, [activeAddress, addresses]);

  // Sync selection back to active address context
  const handleAddressChange = (addressId: string) => {
    setSelectedAddressId(addressId);
    const selected = addresses.find(a => a.id === addressId);
    if (selected) {
      setActiveAddress(selected);
    }
  };

  const hasAddresses = addresses.length > 0;
  const hasSelectedAddress = !!selectedAddressId;

  // Clear saved cart after restoring
  useEffect(() => {
    if (checkoutData && localStorage.getItem(CHECKOUT_CART_KEY)) {
      localStorage.removeItem(CHECKOUT_CART_KEY);
      localStorage.removeItem(POST_AUTH_REDIRECT_KEY);
    }
  }, [checkoutData]);

  const cart = checkoutData?.cart ?? [];
  const restaurantId = checkoutData?.restaurantId ?? '';
  const restaurantName = checkoutData?.restaurantName ?? 'Restaurant';

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsApplyingCoupon(true);
    try {
      const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const res = await import('@/lib/api').then(m => m.couponApi.apply(couponCode, cartTotal));

      setAppliedCoupon({
        code: res.code,
        discount: res.discount
      });

      toast({
        title: 'Coupon Applied!',
        description: `You saved ₹${res.discount}`,
      });
    } catch (err) {
      toast({
        title: 'Invalid Coupon',
        description: err instanceof Error ? err.message : 'Failed to apply coupon',
        variant: 'destructive'
      });
      setAppliedCoupon(null);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const placeOrderMutation = useMutation({
    mutationFn: () =>
      orderApi.create({
        restaurantId,
        addressId: selectedAddressId,
        couponCode: appliedCoupon?.code,
        items: cart.map((item) => ({
          menuItemId: item.id,
          quantity: item.quantity,
        })),
      }),
    onSuccess: (data: any) => {
      localStorage.removeItem('postAuthRedirect');
      localStorage.removeItem('checkout_cart');

      toast({
        title: 'Order created!',
        description: 'Redirecting to payment...',
      });

      // Redirect to payment page
      const finalAmount = Math.max(0, cartTotal - (appliedCoupon?.discount || 0) + 40);
      navigate('/payment', {
        state: {
          orderId: data.order.id,
          amount: Math.round(finalAmount * 100), // Convert to paise
        },
        replace: true,
      });
    },

    onError: (error: Error) => {
      toast({
        title: 'Failed to place order',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handlePlaceOrder = () => {
    if (!isLoggedIn()) {
      // Save cart and redirect to login
      localStorage.setItem(CHECKOUT_CART_KEY, JSON.stringify(checkoutData));
      localStorage.setItem(POST_AUTH_REDIRECT_KEY, '/checkout');
      navigate('/login');
      return;
    }

    const role = localStorage.getItem('user_role');

    if (role === 'RESTAURANT') {
      localStorage.removeItem(CHECKOUT_CART_KEY);
      localStorage.removeItem(POST_AUTH_REDIRECT_KEY);
      navigate('/owner');
      return;
    }

    // Address validation
    if (!hasAddresses) {
      toast({
        title: 'No address available',
        description: 'Please add an address in your profile to place your order.',
        variant: 'destructive',
      });
      return;
    }

    if (!hasSelectedAddress) {
      toast({
        title: 'Address required',
        description: 'Please select a delivery address.',
        variant: 'destructive',
      });
      return;
    }

    placeOrderMutation.mutate();
  };

  // Empty Cart State
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        {/* Gradient Header */}
        <div className="relative h-32 md:h-40 bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNC0yIDQtMiA0LTItMi0yLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl" />

          {/* Back button */}
          <div className="container relative pt-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <main className="container relative -mt-16 pb-12">
          <div className="bg-card rounded-2xl border border-border/50 shadow-xl p-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/20 dark:to-red-500/20 flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="h-10 w-10 text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Add items to your cart to proceed</p>
            <Button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg"
            >
              Browse Restaurants
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Gradient Header */}
      <div className="relative h-32 md:h-40 bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNC0yIDQtMiA0LTItMi0yLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl" />

        {/* Back button */}
        <div className="container relative pt-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <main className="container relative -mt-16 md:-mt-20 pb-12 max-w-3xl">
        {/* Section Header Card */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-xl overflow-hidden mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="h-1.5 bg-gradient-to-r from-orange-500 to-red-500" />
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/20">
                <ShoppingBag className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Checkout</h1>
                <p className="text-sm text-muted-foreground">Ordering from <span className="font-medium text-foreground">{restaurantName}</span></p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Coupon Section */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '50ms' }}>
            <div className="h-1 bg-gradient-to-r from-orange-500 to-red-500" />
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/20 dark:to-red-500/20">
                  <TicketPercent className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Offers & Benefits</h3>
                  <p className="text-xs text-muted-foreground">Apply a coupon code to save more</p>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Coupon Code"
                  className="flex-1 h-11 rounded-xl border border-border/50 bg-muted/30 px-4 text-sm uppercase placeholder:text-muted-foreground placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50 transition-all disabled:opacity-50"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  disabled={!!appliedCoupon}
                />
                {appliedCoupon ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAppliedCoupon(null);
                      setCouponCode('');
                      toast({ description: 'Coupon removed' });
                    }}
                    className="rounded-xl"
                  >
                    Remove
                  </Button>
                ) : (
                  <Button
                    onClick={handleApplyCoupon}
                    disabled={!couponCode || isApplyingCoupon}
                    className="rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  >
                    {isApplyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                  </Button>
                )}
              </div>

              {appliedCoupon && (
                <div className="mt-3 flex items-center gap-2 text-sm text-orange-600 bg-orange-500/10 rounded-lg p-2">
                  <Check className="h-4 w-4" />
                  <span>Coupon applied! You saved {formatPrice(appliedCoupon.discount)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bill Details */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '100ms' }}>
            <div className="h-1 bg-gradient-to-r from-orange-500 to-red-500" />
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/20 dark:to-red-500/20">
                  <Receipt className="h-5 w-5 text-orange-500" />
                </div>
                <h3 className="font-semibold text-foreground">Bill Details</h3>
              </div>

              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.name} x {item.quantity}</span>
                    <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}

                <div className="border-t border-border/50 pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Item Total</span>
                    <span>{formatPrice(cartTotal)}</span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between text-sm text-orange-600">
                      <span>Coupon Discount</span>
                      <span>- {formatPrice(appliedCoupon.discount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery Fee</span>
                    <span>₹40</span>
                  </div>
                </div>

                <div className="border-t border-border/50 pt-3 flex items-center justify-between">
                  <span className="font-bold text-foreground text-lg">To Pay</span>
                  <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                    {formatPrice(Math.max(0, cartTotal - (appliedCoupon?.discount || 0) + 40))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '150ms' }}>
            <div className="h-1 bg-gradient-to-r from-orange-500 to-red-500" />
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/20 dark:to-red-500/20">
                  <MapPin className="h-5 w-5 text-orange-500" />
                </div>
                <h3 className="font-semibold text-foreground">Delivery Address</h3>
              </div>

              {/* Loading state */}
              {isLoggedIn() && isLoadingAddresses && (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full rounded-xl" />
                </div>
              )}

              {/* Address selector - only show if logged in and has addresses */}
              {isLoggedIn() && !isLoadingAddresses && hasAddresses && (
                <div className="space-y-3">
                  {/* Selected address card with change button */}
                  {selectedAddressId && (
                    <div className="flex items-start gap-3 p-4 rounded-xl border border-orange-500/30 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-500/10 dark:to-red-500/10">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500 shrink-0 mt-0.5">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-foreground">
                          {addresses.find(a => a.id === selectedAddressId)?.label}
                        </span>
                        <p className="text-sm text-muted-foreground mt-0.5 truncate">
                          {addresses.find(a => a.id === selectedAddressId)?.address}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openAddressModal(true)}
                        className="shrink-0 text-orange-600 hover:text-orange-700 hover:bg-orange-100"
                      >
                        Change
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* Hidden RadioGroup for form state */}
                  <RadioGroup
                    value={selectedAddressId}
                    onValueChange={handleAddressChange}
                    className="hidden"
                  >
                    {addresses.map((addr) => (
                      <RadioGroupItem key={addr.id} value={addr.id} />
                    ))}
                  </RadioGroup>
                </div>
              )}

              {/* No addresses - show CTA to add in profile */}
              {isLoggedIn() && !isLoadingAddresses && !hasAddresses && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/20 shrink-0">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    </div>
                    <p className="text-sm text-destructive">
                      Please add an address to place your order.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      navigate('/profile', {
                        state: { fromCheckout: true }
                      })
                    }
                    className="rounded-xl"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Add Address in Profile
                  </Button>
                </div>
              )}

              {/* Not logged in message */}
              {!isLoggedIn() && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/50">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Please log in to select a delivery address.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Place Order Button */}
          <Button
            className="w-full h-14 text-base font-semibold rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
            style={{ animationDelay: '200ms' }}
            onClick={handlePlaceOrder}
            disabled={placeOrderMutation.isPending || (isLoggedIn() && (!hasAddresses || !hasSelectedAddress))}
          >
            {placeOrderMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Placing Order...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Place Order • {formatPrice(Math.max(0, cartTotal - (appliedCoupon?.discount || 0) + 40))}
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
