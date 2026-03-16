"use client";

import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Star,
  Clock,
  MapPin,
  AlertCircle,
  ChevronDown,
  ShoppingCart,
  X,
  Plus,
  Minus,
  TicketPercent,
  Copy,
  Heart,
  Utensils,
  Sparkles
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { MenuItem } from '@/components/MenuItem';
import { ReviewsSection } from '@/components/ReviewsSection';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { restaurantApi, couponApi } from '@/lib/api';
import { getMockRestaurantWithMenu } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';
import { useFavorites } from '@/contexts/FavoritesContext';
import type { MenuItem as MenuItemType } from '@/types';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export default function RestaurantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [justAdded, setJustAdded] = useState<string | null>(null);

  const mockData = useMemo(() => id ? getMockRestaurantWithMenu(id) : null, [id]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['restaurant', id, 'menu'],
    queryFn: () => restaurantApi.getMenu(id!),
    enabled: !!id,
    placeholderData: mockData ?? undefined,
  });

  // Use mock data as fallback if API fails or returns empty
  const displayData = data ?? mockData;
  const restaurant = displayData?.restaurant;
  const menu = displayData?.menu ?? [];

  const { isFavorited, toggleFavorite } = useFavorites();
  const favorited = restaurant?.id ? isFavorited(restaurant.id) : false;

  useEffect(() => {
    if (menu.length > 0) {
      const categoriesWithItems = new Set(
        menu.filter(c => (c.menuItems?.length ?? 0) > 0).map(c => c.name)
      );
      setExpandedCategories(categoriesWithItems);
    }
  }, [menu]);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(categoryName) ? next.delete(categoryName) : next.add(categoryName);
      return next;
    });
  };

  const isRestaurantClosed = restaurant ? !restaurant.isOpen : true;

  const addToCart = (item: MenuItemType) => {
    if (isRestaurantClosed || item.isAvailable === false) return;

    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevCart, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });

    setJustAdded(item.id);
    setTimeout(() => setJustAdded(null), 600);
  };

  const removeFromCart = (itemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prevCart =>
      prevCart
        .map(item =>
          item.id === itemId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price);

  const handleCheckout = () => {
    navigate('/checkout', {
      state: {
        cart,
        restaurantId: id,
        restaurantName: restaurant?.name ?? 'Restaurant',
      },
    });
  };

  if (!id) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold">Restaurant not found</h1>
          <Link to="/" className="mt-4 inline-flex text-primary hover:underline">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Back Navigation */}
      <div className="container py-4">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to restaurants
        </Link>
      </div>

      {isLoading ? (
        <RestaurantDetailSkeleton />
      ) : error && !restaurant ? (
        <div className="container py-12 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-500/20 dark:to-orange-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Failed to load restaurant</h1>
          <p className="text-muted-foreground mb-6">Please try again later</p>
          <Button onClick={() => navigate('/')} className="bg-gradient-to-r from-orange-500 to-red-500">
            Go Home
          </Button>
        </div>
      ) : restaurant ? (
        <>
          {/* HEADER */}
          <section className="relative border-b border-border/50 bg-card overflow-hidden">
            {/* Gradient overlay at top */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 to-red-500" />

            <div className="container py-8">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Restaurant Image */}
                <div className="relative h-48 w-full md:w-72 rounded-2xl overflow-hidden shadow-xl">
                  <img
                    src={restaurant.imageUrl}
                    alt={restaurant.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                  {/* Status badge on image */}
                  <div className="absolute top-3 right-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold backdrop-blur-md ${restaurant.isOpen
                        ? 'bg-green-500/90 text-white'
                        : 'bg-black/60 text-white/80'
                      }`}>
                      <span className={`h-2 w-2 rounded-full ${restaurant.isOpen ? 'bg-white animate-pulse' : 'bg-gray-400'}`} />
                      {restaurant.isOpen ? 'Open Now' : 'Closed'}
                    </span>
                  </div>
                </div>

                {/* Restaurant Info */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl md:text-3xl font-bold text-foreground">{restaurant.name}</h1>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-10 w-10 rounded-full border transition-all duration-300 ${favorited
                            ? 'text-red-500 border-red-200 bg-red-50 dark:bg-red-500/10'
                            : 'text-muted-foreground hover:text-red-500 hover:border-red-200 hover:bg-red-50'
                          }`}
                        onClick={() => restaurant?.id && toggleFavorite(restaurant.id)}
                      >
                        <Heart className={`h-5 w-5 ${favorited ? 'fill-current' : ''}`} />
                      </Button>
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-4 line-clamp-2">{restaurant.description}</p>

                  {/* Rating & Reviews */}
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    {restaurant.totalReviews && restaurant.totalReviews > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1.5 rounded-lg shadow-sm">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="font-bold">{restaurant.averageRating?.toFixed(1)}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {restaurant.totalReviews} review{restaurant.totalReviews > 1 ? 's' : ''}
                        </span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-500/10 dark:to-red-500/10 px-3 py-1.5 rounded-lg text-orange-600 font-medium">
                        <Sparkles className="h-4 w-4" />
                        New Restaurant
                      </span>
                    )}

                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span>{restaurant.deliveryTime}</span>
                    </div>

                    <span className="text-sm font-bold text-foreground bg-muted/50 px-3 py-1.5 rounded-lg">
                      {restaurant.priceRange}
                    </span>
                  </div>

                  {/* Cuisine & Address */}
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-500/20 dark:to-red-500/20 px-3 py-1.5 font-medium text-orange-700 dark:text-orange-400">
                      <Utensils className="h-3.5 w-3.5" />
                      {restaurant.cuisine}
                    </span>
                    {(restaurant.area || restaurant.city) && (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="h-4 w-4 text-orange-500" />
                        <span className="truncate max-w-xs">{restaurant.area || restaurant.city}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* COUPONS SECTION */}
          <RestaurantCoupons restaurantId={id} />

          {/* MENU + CART */}
          <div className="container py-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* MENU */}
              <section className="flex-1">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/20">
                    <Utensils className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold">Menu</h2>
                </div>

                {menu.length === 0 ? (
                  <div className="text-center py-12 border border-border/50 rounded-2xl bg-card">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/20 dark:to-red-500/20 flex items-center justify-center mx-auto mb-4">
                      <Utensils className="h-8 w-8 text-orange-500" />
                    </div>
                    <p className="text-muted-foreground">No menu items available yet.</p>
                  </div>
                ) : (
                  menu.map((category, catIndex) => {
                    const isExpanded = expandedCategories.has(category.name);
                    const hasItems = (category.menuItems?.length ?? 0) > 0;

                    return (
                      <div
                        key={category.name}
                        className="bg-card border border-border/50 rounded-2xl mb-4 overflow-hidden shadow-sm hover:shadow-md transition-shadow animate-in fade-in slide-in-from-bottom-2"
                        style={{ animationDelay: `${catIndex * 30}ms` }}
                      >
                        <button
                          onClick={() => toggleCategory(category.name)}
                          className="sticky top-0 z-10 flex w-full items-center justify-between px-5 py-4 text-left bg-card hover:bg-muted/30 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <h3 className="font-bold text-foreground">{category.name}</h3>
                            {hasItems && (
                              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                {category.menuItems?.length} items
                              </span>
                            )}
                          </div>
                          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>

                        {isExpanded && (
                          <div className="border-t border-border/50 p-4 space-y-3 bg-muted/10">
                            {!hasItems ? (
                              <p className="text-center py-4 text-muted-foreground text-sm">
                                No items in this category
                              </p>
                            ) : (
                              category.menuItems?.map((item, itemIndex) => (
                                <div key={item.id} className="animate-in fade-in" style={{ animationDelay: `${itemIndex * 20}ms` }}>
                                  <MenuItem
                                    item={item}
                                    onAddToCart={addToCart}
                                    isJustAdded={justAdded === item.id}
                                  />
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </section>

              {/* CART SIDEBAR */}
              <aside className="hidden lg:block w-80">
                <div className="sticky top-4 bg-card border border-border/50 rounded-2xl flex flex-col max-h-[80vh] shadow-lg overflow-hidden">
                  {/* Cart Header */}
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        <h2 className="font-bold">Your Cart</h2>
                      </div>
                      {cart.length > 0 && (
                        <button onClick={clearCart} className="text-xs text-white/80 hover:text-white transition-colors cursor-pointer">
                          Clear All
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                          <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground text-sm">Your cart is empty</p>
                        <p className="text-xs text-muted-foreground mt-1">Add items to get started</p>
                      </div>
                    ) : (
                      cart.map(item => (
                        <div key={item.id} className="bg-muted/30 border border-border/50 p-3 rounded-xl">
                          <div className="flex justify-between items-start">
                            <p className="font-medium text-sm text-foreground line-clamp-1">{item.name}</p>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-muted-foreground hover:text-destructive transition-colors p-1 cursor-pointer"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <div className="flex items-center gap-2 bg-card rounded-lg border border-border/50">
                              <button
                                onClick={() => updateQuantity(item.id, -1)}
                                className="p-1.5 hover:bg-muted rounded-l-lg transition-colors cursor-pointer"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, 1)}
                                className="p-1.5 hover:bg-muted rounded-r-lg transition-colors cursor-pointer"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <span className="font-semibold text-sm">{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Cart Footer */}
                  <div className="border-t border-border/50 p-4 bg-muted/20">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-foreground">Total</span>
                      <span className="text-lg font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                        {formatPrice(cartTotal)}
                      </span>
                    </div>
                    <Button
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg"
                      disabled={cart.length === 0}
                      onClick={handleCheckout}
                    >
                      Proceed to Checkout
                    </Button>
                  </div>
                </div>
              </aside>
            </div>

            {/* REVIEWS SECTION - Below Menu */}
            <ReviewsSection restaurantId={id} />
          </div>
        </>
      ) : null}

      {/* MOBILE CART */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 shadow-2xl shadow-orange-500/30">
            <div className="container flex justify-between items-center py-4 px-6">
              <div className="text-white">
                <p className="font-bold text-lg">{cartItemCount} items • {formatPrice(cartTotal)}</p>
                <p className="text-xs text-white/80">From {restaurant?.name}</p>
              </div>
              <Button
                onClick={handleCheckout}
                className="bg-white text-orange-600 hover:bg-white/90 font-semibold shadow-lg"
              >
                Checkout
                <ChevronDown className="h-4 w-4 ml-1 -rotate-90" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RestaurantCoupons({ restaurantId }: { restaurantId: string }) {
  const { toast } = useToast();
  const { data: coupons } = useQuery({
    queryKey: ['coupons', restaurantId],
    queryFn: () => couponApi.getAll({ restaurantId })
  });

  if (!coupons || coupons.length === 0) return null;

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied!", description: `${code} copied to clipboard` });
  };

  return (
    <div className="container py-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-500/20 dark:to-emerald-500/20">
          <TicketPercent className="h-4 w-4 text-green-600" />
        </div>
        <h3 className="font-bold text-lg text-foreground">Deals for you</h3>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {coupons.map(coupon => (
          <div
            key={coupon.id}
            className="min-w-[260px] bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-500/10 dark:to-emerald-500/10 border border-green-200/50 dark:border-green-500/20 p-4 rounded-xl group hover:shadow-md hover:border-green-300 transition-all"
          >
            <div className="flex justify-between items-start mb-2">
              <p className="font-bold text-green-700 dark:text-green-400 text-lg">
                {coupon.discountType === 'FLAT' ? `₹${coupon.discountAmount} OFF` : `${coupon.discountAmount}% OFF`}
              </p>
              <button
                onClick={() => copyCode(coupon.code)}
                className="p-1.5 hover:bg-green-200/50 dark:hover:bg-green-500/20 rounded-lg text-green-700 dark:text-green-400 transition-colors cursor-pointer"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm font-bold font-mono text-foreground mb-1">{coupon.code}</p>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{coupon.description}</p>
            <div className="pt-2 border-t border-green-200/50 dark:border-green-500/20">
              <p className="text-[11px] text-muted-foreground">
                Min Order: ₹{coupon.minOrderValue}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RestaurantDetailSkeleton() {
  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <Skeleton className="h-48 w-full md:w-72 rounded-2xl" />
        <div className="flex-1 space-y-4">
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="flex gap-3">
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-lg" />
            <Skeleton className="h-9 w-20 rounded-lg" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-48 rounded-lg" />
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-16 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
