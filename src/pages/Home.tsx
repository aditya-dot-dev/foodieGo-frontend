import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search, MapPin, ChevronRight, AlertCircle, MapPinOff,
  Clock, Truck, Users, Star, Store, Utensils, Smartphone,
  Instagram, Twitter, Facebook, Mail, ArrowRight, Sparkles,
  Pizza, Salad, Coffee, IceCream, Beef, Soup, ShoppingBag
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { RestaurantCard } from '@/components/RestaurantCard';
import { RestaurantCardSkeleton } from '@/components/Skeletons';
import { FilterBar } from '@/components/FilterBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { restaurantApi, authApi } from '@/lib/api';
import { mockRestaurants } from '@/lib/mockData';
import type { Restaurant } from '@/types';
import { useLocation } from '@/contexts/LocationContext';
import { useDeliveryAddress } from '@/contexts/DeliveryAddressContext';
import { getDistanceInKm } from '@/lib/distance';
import { useNavigate } from 'react-router-dom';

/**
 * Checks if a restaurant's address matches the user's selected location.
 * Performs case-insensitive, trimmed comparison against city OR area.
 */
function matchesLocation(
  restaurant: Restaurant,
  location: { area: string; city: string } | null
): boolean {
  // If no location selected, include all restaurants
  if (!location) return true;

  // Safely get and normalize address
  const address = (restaurant.address || '').toLowerCase().trim();
  if (!address) return false;

  // Normalize location fields
  const city = (location.city || '').toLowerCase().trim();
  const area = (location.area || '').toLowerCase().trim();

  // Match if address contains city OR area
  return (city && address.includes(city)) || (area && address.includes(area));
}

// Featured categories data
const featuredCategories = [
  { name: 'Pizza', icon: Pizza, gradient: 'from-red-500 to-orange-500', bgLight: 'from-red-50 to-orange-50', bgDark: 'dark:from-red-500/20 dark:to-orange-500/20' },
  { name: 'Biryani', icon: Soup, gradient: 'from-amber-500 to-yellow-500', bgLight: 'from-amber-50 to-yellow-50', bgDark: 'dark:from-amber-500/20 dark:to-yellow-500/20' },
  { name: 'Burger', icon: Beef, gradient: 'from-orange-500 to-red-500', bgLight: 'from-orange-50 to-red-50', bgDark: 'dark:from-orange-500/20 dark:to-red-500/20' },
  { name: 'Chinese', icon: Soup, gradient: 'from-rose-500 to-pink-500', bgLight: 'from-rose-50 to-pink-50', bgDark: 'dark:from-rose-500/20 dark:to-pink-500/20' },
  { name: 'Healthy', icon: Salad, gradient: 'from-green-500 to-emerald-500', bgLight: 'from-green-50 to-emerald-50', bgDark: 'dark:from-green-500/20 dark:to-emerald-500/20' },
  { name: 'Desserts', icon: IceCream, gradient: 'from-pink-500 to-purple-500', bgLight: 'from-pink-50 to-purple-50', bgDark: 'dark:from-pink-500/20 dark:to-purple-500/20' },
];

// Popular cuisines data
const popularCuisines = [
  'North Indian', 'South Indian', 'Chinese', 'Italian', 'Mexican',
  'Thai', 'Japanese', 'Continental', 'Street Food', 'Fast Food',
  'Desserts', 'Beverages'
];

// Trust indicators data
const trustIndicators = [
  { icon: Clock, label: '30 min', sublabel: 'Avg Delivery', color: 'text-blue-500' },
  { icon: Store, label: '5000+', sublabel: 'Restaurants', color: 'text-orange-500' },
  { icon: Users, label: '10M+', sublabel: 'Happy Orders', color: 'text-green-500' },
  { icon: Star, label: '4.8', sublabel: 'App Rating', color: 'text-amber-500' },
];

// How it works steps
const howItWorksSteps = [
  { icon: MapPin, title: 'Choose Location', description: 'Select your delivery address to find nearby restaurants', color: 'from-blue-500 to-cyan-500' },
  { icon: Store, title: 'Pick Restaurant', description: 'Browse menus and pick your favorite dishes', color: 'from-orange-500 to-red-500' },
  { icon: Utensils, title: 'Enjoy Food', description: 'Track your order and enjoy hot, fresh food', color: 'from-green-500 to-emerald-500' },
];

export default function Home() {
  const navigate = useNavigate();
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const { location, openLocationModal } = useLocation();
  const { activeAddress, openAddressModal } = useDeliveryAddress();
  const isAuthenticated = authApi.isAuthenticated();
  const DELIVERY_RADIUS_KM = 8;

  /**
   * Get delivery display text (same logic as navbar)
   * Priority: activeAddress > location > fallback
   */
  const getDeliveryDisplayText = () => {
    if (activeAddress) {
      const addressParts = activeAddress.address.split(',').map(p => p.trim());
      const area = addressParts[0] || '';
      const city = addressParts.length > 1 ? addressParts[addressParts.length - 1] : '';
      const isValidArea = area && !/^[A-Z]{1,3}\d+[A-Z]?$/i.test(area);
      if (isValidArea && city) return `${area}, ${city}`;
      if (city) return city;
      if (isValidArea) return area;
      return activeAddress.label;
    }
    if (location) {
      const area = location.area?.trim();
      const city = location.city?.trim();
      if (area && city) return `${area}, ${city}`;
      return city || area || 'Select Location';
    }
    return 'Select your location';
  };

  /**
   * Handle address button click
   * Opens AddressSelectorModal if authenticated, otherwise LocationSelectorModal
   */
  const handleAddressClick = () => {
    if (isAuthenticated) {
      openAddressModal();
    } else {
      openLocationModal();
    }
  };

  // Fetch restaurants from API
  const {
    data: restaurants,
    isLoading,
    error
  } = useQuery({
    queryKey: ['restaurants'],
    queryFn: restaurantApi.getAll,
    placeholderData: mockRestaurants
  });

  // Use mock data if API fails or returns empty array
  const displayRestaurants = restaurants?.length ? restaurants : mockRestaurants;

  /**
   * Determine effective location for filtering
   * Priority: activeAddress (authenticated users) > location (guest users) > null
   */
  const effectiveLocation = useMemo(() => {
    // Authenticated user with saved address
    if (activeAddress?.lat && activeAddress?.lng) {
      const addressParts = activeAddress.address.split(',').map(p => p.trim());
      const area = addressParts[0] || '';
      const city = addressParts.length > 1 ? addressParts[addressParts.length - 1] : '';
      return {
        coordinates: { lat: activeAddress.lat, lng: activeAddress.lng },
        area: area && !/^[A-Z]{1,3}\d+[A-Z]?$/i.test(area) ? area : '',
        city: city || ''
      };
    }
    // Guest user location from LocationContext
    return location;
  }, [activeAddress, location]);

  /**
   * Multi-tier location-based filtering:
   * - Tier 1 (Preferred): Distance-based filtering using coordinates
   * - Tier 2 (Fallback): Text-based city/area matching
   * - Tier 3 (Default): Show all restaurants if no location is set
   */
  const locationFilteredRestaurants = useMemo(() => {
    // No location selected → show all restaurants
    if (!effectiveLocation) return displayRestaurants;

    const hasCoordinates = effectiveLocation.coordinates?.lat && effectiveLocation.coordinates?.lng;

    return displayRestaurants.filter((restaurant) => {
      // Data Cleaning: Skip invalid entries
      if (!restaurant.name || !restaurant.imageUrl) return false;

      // Tier 1: Distance-based filtering (if both have coordinates)
      if (hasCoordinates && restaurant.lat && restaurant.lng) {
        const distance = getDistanceInKm(
          effectiveLocation.coordinates.lat,
          effectiveLocation.coordinates.lng,
          restaurant.lat,
          restaurant.lng
        );
        return distance <= DELIVERY_RADIUS_KM;
      }

      // Tier 2: Text-based matching (fallback when coordinates are missing)
      const address = (restaurant.address || '').toLowerCase().trim();
      if (!address) return false;

      const city = (effectiveLocation.city || '').toLowerCase().trim();
      const area = (effectiveLocation.area || '').toLowerCase().trim();

      // Match if address contains city OR area
      return (city && address.includes(city)) || (area && address.includes(area));
    });
  }, [displayRestaurants, effectiveLocation]);

  // Track if location filtering resulted in no matches
  const hasNoLocationMatches = effectiveLocation && locationFilteredRestaurants.length === 0;

  // Initialize filtered restaurants with location-filtered data
  useEffect(() => {
    setFilteredRestaurants(hasNoLocationMatches ? displayRestaurants : locationFilteredRestaurants);
  }, [locationFilteredRestaurants, hasNoLocationMatches, displayRestaurants]);

  const handleFilteredChange = useCallback((filtered: Restaurant[]) => {
    setFilteredRestaurants(filtered);
  }, []);

  const handleMarkerClick = useCallback((id: string) => {
    setSelectedRestaurantId(id);
    // Scroll to card
    const card = cardRefs.current[id];
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ==================== HERO SECTION ==================== */}
      <section className="relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-orange-600 to-red-500">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNC0yIDQtMiA0LTItMi0yLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-orange-400/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-72 h-72 rounded-full bg-yellow-400/10 blur-3xl animate-pulse" />

        {/* Floating Food Elements (decorative) */}
        <div className="absolute top-20 right-[15%] w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm animate-bounce" style={{ animationDuration: '3s' }} />
        <div className="absolute bottom-32 left-[10%] w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
        <div className="absolute top-40 left-[20%] w-8 h-8 rounded-full bg-white/15 backdrop-blur-sm animate-bounce" style={{ animationDuration: '2s', animationDelay: '1s' }} />

        <div className="container relative z-10 pt-12 pb-24 md:pt-20 md:pb-32">
          <div className="mx-auto max-w-4xl text-center">
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-md px-4 py-2 text-sm text-white shadow-lg mb-8 animate-fade-in border border-white/20">
              <Sparkles className="h-4 w-4 text-yellow-300" />
              <span className="font-medium">Trusted by 10 million+ food lovers</span>
            </div>

            {/* Main Heading */}
            <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-white md:text-7xl lg:text-8xl animate-fade-in">
              Craving something{' '}
              <span className="relative">
                <span className="text-yellow-300 drop-shadow-lg">delicious?</span>
                <svg className="absolute -bottom-2 left-0 w-full h-3 text-yellow-300/50" viewBox="0 0 200 12" preserveAspectRatio="none">
                  <path d="M0 9c50-6 100-6 200 0" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <p className="mb-10 text-xl text-white/90 md:text-2xl animate-fade-in max-w-2xl mx-auto leading-relaxed" style={{ animationDelay: '0.1s' }}>
              Order from the best restaurants near you.{' '}
              <span className="text-yellow-200 font-semibold">Fast delivery. Great prices. Unlimited choices.</span>
            </p>

            {/* Search Pill */}
            <div
              className="flex flex-col gap-3 sm:flex-row sm:items-center p-2 sm:p-3 rounded-[2rem] bg-white/95 dark:bg-card/95 backdrop-blur-xl shadow-2xl shadow-black/20 animate-fade-in-up max-w-2xl mx-auto border border-white/50"
              style={{ animationDelay: '0.2s' }}
            >
              <button
                onClick={handleAddressClick}
                className="group relative flex-1 flex items-center gap-3 h-14 rounded-[1.5rem] bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-500/10 dark:to-red-500/10 px-5 text-left hover:from-orange-100 hover:to-red-100 dark:hover:from-orange-500/20 dark:hover:to-red-500/20 transition-all duration-300 cursor-pointer"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Delivering to</span>
                  <span className={`text-sm font-semibold truncate ${(activeAddress || location) ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {getDeliveryDisplayText()}
                  </span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 group-hover:text-orange-500 transition-all" />
              </button>

              <Button
                size="lg"
                className="h-14 rounded-[1.5rem] px-8 text-lg font-bold bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] transition-all duration-300"
                onClick={() => navigate('/search')}
              >
                <Search className="h-5 w-5 mr-2" />
                Find Food
              </Button>
            </div>

            {/* Quick Category Pills */}
            <div className="mt-8 flex flex-wrap justify-center gap-2 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              {['Pizza', 'Burger', 'Biryani', 'Chinese', 'Healthy', 'Desserts'].map((tag, index) => (
                <button
                  key={tag}
                  onClick={() => navigate(`/search?q=${tag}`)}
                  className="group px-5 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-sm font-semibold text-white hover:bg-white hover:text-orange-500 transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer"
                  style={{ animationDelay: `${0.3 + index * 0.05}s` }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== TRUST INDICATORS BANNER ==================== */}
      <section className="relative -mt-8 z-20">
        <div className="container">
          <div className="bg-card rounded-2xl border border-border/50 shadow-xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {trustIndicators.map((item, index) => (
                <div
                  key={item.label}
                  className="flex items-center gap-4 justify-center md:justify-start animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${100 + index * 50}ms`, animationDuration: '500ms' }}
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/20 dark:to-red-500/20 ${item.color}`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.sublabel}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FEATURED CATEGORIES ==================== */}
      <section className="container py-12 md:py-16">
        <div className="mb-8 animate-fade-in">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            What are you craving?
          </h2>
          <p className="mt-2 text-lg text-muted-foreground">
            Explore food by category
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {featuredCategories.map((category, index) => (
            <button
              key={category.name}
              onClick={() => navigate(`/search?q=${category.name}`)}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 text-center hover:border-orange-500/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 cursor-pointer"
              style={{ animationDelay: `${200 + index * 50}ms`, animationDuration: '500ms' }}
            >
              {/* Gradient Background on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${category.bgLight} ${category.bgDark} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

              <div className="relative z-10">
                <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${category.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <category.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-semibold text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                  {category.name}
                </h3>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ==================== RESTAURANTS SECTION ==================== */}
      <section className="container pb-12 md:pb-16">
        {/* Section Header Card */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-lg overflow-hidden mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="h-1.5 bg-gradient-to-r from-orange-500 to-red-500" />
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/20">
                  <Store className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    Restaurants Near You
                    <span className="flex h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
                  </h2>
                  <p className="text-muted-foreground">
                    {filteredRestaurants.length} premium places to order from
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate('/search')}
                className="hidden md:flex items-center gap-2 hover:border-orange-500/50 hover:bg-orange-500/5 hover:text-orange-600 transition-all"
              >
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="font-medium text-destructive">Couldn't load restaurants</p>
              <p className="text-sm text-muted-foreground">
                Showing demo data. Set VITE_API_URL to connect to your backend.
              </p>
            </div>
          </div>
        )}

        {/* Out-of-area alert banner */}
        {hasNoLocationMatches && (
          <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-orange-200 bg-orange-50/50 p-4 dark:border-orange-900/50 dark:bg-orange-900/10 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-800/50">
                <MapPinOff className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100">
                  No restaurants in {effectiveLocation?.area && effectiveLocation?.city ? `${effectiveLocation.area}, ${effectiveLocation.city}` : effectiveLocation?.city || effectiveLocation?.area || 'this area'}
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Showing other restaurants. You can still explore and order for a different location!
                </p>
              </div>
            </div>
            <Button
              onClick={handleAddressClick}
              className="shrink-0 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg text-white"
            >
              <MapPin className="mr-2 h-4 w-4" />
              Change Location
            </Button>
          </div>
        )}

        {/* Filter Bar */}
        <div className="mb-6">
          <FilterBar
            restaurants={hasNoLocationMatches ? displayRestaurants : locationFilteredRestaurants}
            onFilteredChange={handleFilteredChange}
            resultCount={filteredRestaurants.length}
          />
        </div>

        {/* Restaurant Grid */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <RestaurantCardSkeleton key={i} />)
          ) : filteredRestaurants.length === 0 ? (
            <div className="col-span-full">
              <div className="bg-card rounded-2xl border border-border/50 shadow-lg p-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/20 dark:to-red-500/20 flex items-center justify-center mx-auto mb-6">
                  <Search className="h-10 w-10 text-orange-500" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">No matches found</h3>
                <p className="text-muted-foreground mb-6">No restaurants match your current filters.</p>
                <Button
                  variant="outline"
                  onClick={() => setFilteredRestaurants(hasNoLocationMatches ? displayRestaurants : locationFilteredRestaurants)}
                  className="hover:border-orange-500/50"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          ) : (
            filteredRestaurants.map((restaurant, index) => (
              <div
                key={restaurant.id}
                ref={(el) => { cardRefs.current[restaurant.id] = el; }}
                className={`animate-in fade-in slide-in-from-bottom-4 transition-all duration-300 ${selectedRestaurantId === restaurant.id
                  ? 'ring-2 ring-orange-500 ring-offset-2 rounded-2xl'
                  : ''
                  }`}
                style={{ animationDelay: `${index * 50}ms`, animationDuration: '500ms' }}
                onClick={() => setSelectedRestaurantId(restaurant.id)}
              >
                <RestaurantCard restaurant={restaurant} />
              </div>
            ))
          )}
        </div>

        {/* Mobile View All Button */}
        <div className="mt-8 text-center md:hidden">
          <Button
            onClick={() => navigate('/search')}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg gap-2"
          >
            View All Restaurants
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-muted/30 to-background">
        <div className="container">
          <div className="text-center mb-12 animate-fade-in">
            <Badge variant="outline" className="mb-4 px-4 py-1.5 text-sm font-medium border-orange-500/30 text-orange-600 dark:text-orange-400">
              Simple & Easy
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get your favorite food delivered in just 3 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection Lines (Desktop) */}
            <div className="hidden md:block absolute top-24 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-orange-500/50 via-orange-500 to-orange-500/50" style={{ backgroundSize: '20px 2px' }} />

            {howItWorksSteps.map((step, index) => (
              <div
                key={step.title}
                className="relative text-center animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${300 + index * 100}ms`, animationDuration: '500ms' }}
              >
                {/* Step Number */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-sm shadow-lg">
                    {index + 1}
                  </span>
                </div>

                <div className="bg-card rounded-2xl border border-border/50 shadow-lg p-8 pt-10 hover:shadow-xl hover:border-orange-500/30 transition-all duration-300 hover:-translate-y-1">
                  <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${step.color} shadow-xl`}>
                    <step.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== POPULAR CUISINES ==================== */}
      <section className="container py-12 md:py-16">
        <div className="mb-8 animate-fade-in">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Explore Popular Cuisines
          </h2>
          <p className="mt-2 text-lg text-muted-foreground">
            Discover flavors from around the world
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {popularCuisines.map((cuisine, index) => (
            <button
              key={cuisine}
              onClick={() => navigate(`/search?q=${cuisine}`)}
              className="group px-5 py-2.5 rounded-full bg-card border border-border/50 text-sm font-medium text-foreground hover:bg-gradient-to-r hover:from-orange-500 hover:to-red-500 hover:text-white hover:border-transparent hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 cursor-pointer"
              style={{ animationDelay: `${index * 30}ms`, animationDuration: '400ms' }}
            >
              {cuisine}
            </button>
          ))}
        </div>
      </section>

      {/* ==================== APP DOWNLOAD CTA ==================== */}
      <section className="container py-12 md:py-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNC0yIDQtMiA0LTItMi0yLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-2 text-sm text-white mb-4">
                <Smartphone className="h-4 w-4" />
                <span className="font-medium">Available on iOS & Android</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Order on the go!
              </h2>
              <p className="text-white/90 text-lg max-w-md mb-6">
                Download our app for a seamless food ordering experience. Track orders in real-time and get exclusive deals!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <Button
                  size="lg"
                  className="bg-white text-orange-600 hover:bg-white/90 font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  <svg className="h-6 w-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                  App Store
                </Button>
                <Button
                  size="lg"
                  className="bg-white text-orange-600 hover:bg-white/90 font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  <svg className="h-6 w-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 20.5v-17c0-.83.67-1.5 1.5-1.5h.27c.34 0 .67.12.93.33L18.3 12 5.7 21.67c-.26.21-.59.33-.93.33h-.27c-.83 0-1.5-.67-1.5-1.5zM19.5 12L5.7 2.33 18.8 11.2c.44.34.7.87.7 1.43 0 .56-.26 1.09-.7 1.43L5.7 21.67 19.5 12z" />
                  </svg>
                  Play Store
                </Button>
              </div>
            </div>

            {/* Phone Mockup */}
            <div className="relative w-48 md:w-64">
              <div className="relative bg-gradient-to-b from-gray-900 to-gray-800 rounded-[2.5rem] p-2 shadow-2xl">
                <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-[2rem] p-4 aspect-[9/16] flex flex-col items-center justify-center">
                  <ShoppingBag className="h-16 w-16 text-white mb-4" />
                  <span className="text-white font-bold text-xl">FoodieGo</span>
                  <span className="text-white/80 text-sm">Your Food, Delivered</span>
                </div>
              </div>
              {/* Floating notification */}
              <div className="absolute -top-4 -right-4 bg-white rounded-xl p-3 shadow-xl animate-bounce" style={{ animationDuration: '2s' }}>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-green-500 flex items-center justify-center">
                    <Truck className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Order Arriving</p>
                    <p className="text-xs text-gray-500">5 mins away</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="border-t border-border bg-card">
        {/* Gradient Accent */}
        <div className="h-1 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500" />

        <div className="container py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
                  <ShoppingBag className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gradient">FoodieGo</span>
              </div>
              <p className="text-muted-foreground mb-6 max-w-xs">
                Your favorite food, delivered fast. Experience the best restaurants in your city.
              </p>
              {/* Social Links */}
              <div className="flex gap-3">
                {[
                  { icon: Instagram, label: 'Instagram' },
                  { icon: Twitter, label: 'Twitter' },
                  { icon: Facebook, label: 'Facebook' },
                ].map((social) => (
                  <a
                    key={social.label}
                    href="#"
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted hover:bg-orange-500 hover:text-white transition-all duration-300"
                    aria-label={social.label}
                  >
                    <social.icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Company</h3>
              <ul className="space-y-3 text-sm">
                {['About Us', 'Careers', 'Blog', 'Press'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-muted-foreground hover:text-orange-500 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Support</h3>
              <ul className="space-y-3 text-sm">
                {['Help Center', 'Contact Us', 'FAQs', 'Partner with Us'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-muted-foreground hover:text-orange-500 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Legal</h3>
              <ul className="space-y-3 text-sm">
                {['Terms of Service', 'Privacy Policy', 'Cookie Policy', 'Refund Policy'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-muted-foreground hover:text-orange-500 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Newsletter */}
          <div className="mt-12 pt-8 border-t border-border">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h3 className="font-semibold text-foreground mb-1">Subscribe to our newsletter</h3>
                <p className="text-sm text-muted-foreground">Get exclusive offers and updates delivered to your inbox.</p>
              </div>
              <div className="flex gap-2 max-w-md">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="rounded-xl"
                />
                <Button className="rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shrink-0">
                  <Mail className="h-4 w-4 mr-2" />
                  Subscribe
                </Button>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 pt-8 border-t border-border flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} FoodieGo. All rights reserved.</p>
            <p>Made with love for food lovers everywhere</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
