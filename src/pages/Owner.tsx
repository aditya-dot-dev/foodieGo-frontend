"use client";

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { restaurantApi, authApi, orderApi, couponApi } from '@/lib/api';
import { useSocket } from '@/context/SocketContext';
import { useToast } from '@/hooks/use-toast';
import { searchPlaces } from '@/lib/mapbox';
import type { Restaurant, MenuCategory, OwnerOrder, StatusHistoryEntry, Coupon } from '@/types';
import {
  Store,
  Plus,
  ChefHat,
  UtensilsCrossed,
  LogOut,
  Pencil,
  Trash2,
  ClipboardList,
  User,
  Phone,
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Loader2,
  ImageIcon,
  Save,
  TicketPercent,
  DollarSign,
  Wallet,
  ShoppingBag,
  Ticket
} from 'lucide-react';
import { WalletTab } from './WalletTab';
import { OwnerOrdersTab } from './owner/OwnerOrdersTab';
import { OwnerMenuTab } from './owner/OwnerMenuTab';
import { OwnerCouponsTab } from './owner/OwnerCouponsTab';
import { OwnerSettingsTab } from './owner/OwnerSettingsTab';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';

type OwnerTab = 'menu' | 'settings' | 'orders' | 'coupons' | 'wallet';

export default function Owner() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<OwnerTab>('menu');

  const [ownerRestaurants, setOwnerRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);

  const [addressResults, setAddressResults] = useState<any[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);


  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [restaurantData, setRestaurantData] = useState({
    name: '',
    description: '',
    cuisine: '',
    address: '',
    city: '',
    area: '',
    lat: undefined as number | undefined,
    lng: undefined as number | undefined,
    imageUrl: null as string | File | null,
    openingTime: '',
    closingTime: '',
    priceRange: '',
  });

  const [restaurantLoading, setRestaurantLoading] = useState(false);

  // Settings form state
  const [settingsData, setSettingsData] = useState({
    name: '',
    description: '',
    cuisine: '',
    address: '',
    city: '',
    area: '',
    lat: undefined as number | undefined,
    lng: undefined as number | undefined,
    imageUrl: null as string | File | null,
    openingTime: '',
    closingTime: '',
    priceRange: '',
  });

  const [settingsLoading, setSettingsLoading] = useState(false);

  // Sync settings form when restaurant changes
  useEffect(() => {
    if (selectedRestaurant) {
      setSettingsData({
        name: selectedRestaurant.name || '',
        description: selectedRestaurant.description || '',
        cuisine: selectedRestaurant.cuisine || '',
        address: selectedRestaurant.address || '',
        city: (selectedRestaurant as any).city || '',
        area: (selectedRestaurant as any).area || '',
        lat: (selectedRestaurant as any).lat,
        lng: (selectedRestaurant as any).lng,
        imageUrl: selectedRestaurant.imageUrl || '',
        openingTime: selectedRestaurant.openingTime || '',
        closingTime: selectedRestaurant.closingTime || '',
        priceRange: (selectedRestaurant as any).priceRange || '',
      });

    }
  }, [selectedRestaurant]);

  const [categoryData, setCategoryData] = useState({ name: '' });
  const [categoryLoading, setCategoryLoading] = useState(false);

  const [menuItemData, setMenuItemData] = useState({
    categoryId: '',
    name: '',
    description: '',
    price: '',
    isVeg: false,
    imageUrl: null as string | File | null,
  });
  const [menuItemLoading, setMenuItemLoading] = useState(false);

  // Coupon State
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [couponData, setCouponData] = useState({
    code: '',
    discountType: 'FLAT' as 'FLAT' | 'PERCENTAGE',
    discountAmount: '',
    minOrderValue: '',
    maxDiscount: '',
    expiresAt: '',
    description: ''
  });
  const [creatingCoupon, setCreatingCoupon] = useState(false);

  const fetchOwnerRestaurants = async () => {
    setLoadingRestaurants(true);
    try {
      const restaurants = await restaurantApi.getOwnerRestaurants();
      setOwnerRestaurants(restaurants);
      if (restaurants.length > 0 && !selectedRestaurant) {
        setSelectedRestaurant(restaurants[0]);
      }
    } finally {
      setLoadingRestaurants(false);
    }
  };

  // const fetchMenuCategories = async (restaurantId: string) => {
  //   setLoadingCategories(true);
  //   try {
  //     const menuData = await restaurantApi.getMenu(restaurantId);
  //     setCategories(menuData.menu || []);
  //   } finally {
  //     setLoadingCategories(false);
  //   }
  // };
  const fetchMenuCategories = async (restaurantId: string) => {
    setLoadingCategories(true);
    try {
      const menuData = await restaurantApi.getMenu(restaurantId);

      setCategories(menuData.menu || []);

      // ✅ ONLY hydrate settings form
      if (menuData.restaurant) {
        setSettingsData({
          name: menuData.restaurant.name || '',
          description: menuData.restaurant.description || '',
          cuisine: menuData.restaurant.cuisine || '',
          address: menuData.restaurant.address || '',
          city: (menuData.restaurant as any).city || '',
          area: (menuData.restaurant as any).area || '',
          lat: (menuData.restaurant as any).lat,
          lng: (menuData.restaurant as any).lng,
          imageUrl: menuData.restaurant.imageUrl || '',
          openingTime: (menuData.restaurant as any).openingTime || '',
          closingTime: (menuData.restaurant as any).closingTime || '',
          priceRange: (menuData.restaurant as any).priceRange || '',
        });

      }
    } finally {
      setLoadingCategories(false);
    }
  };


  useEffect(() => {
    fetchOwnerRestaurants();
  }, []);

  useEffect(() => {
    if (!selectedRestaurant?.id) return;

    fetchMenuCategories(selectedRestaurant.id);
    setMenuItemData(prev => ({ ...prev, categoryId: '' }));
  }, [selectedRestaurant?.id]);


  // useEffect(() => {
  //   if (!selectedRestaurant) return;

  //   setRestaurantData({
  //     name: selectedRestaurant.name ?? '',
  //     description: selectedRestaurant.description ?? '',
  //     cuisine: selectedRestaurant.cuisine ?? '',
  //     address: selectedRestaurant.address ?? '',
  //     imageUrl: selectedRestaurant.imageUrl ?? '',
  //   });
  // }, [selectedRestaurant]);


  const handleLogout = () => {
    authApi.logout();
    toast({ title: 'Logged out successfully' });
    navigate('/login');
  };

  const handleCreateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();

    // Image validation if file selected
    if (restaurantData.imageUrl instanceof File) {
      if (restaurantData.imageUrl.size > 5 * 1024 * 1024) {
        toast({ title: 'Image too large', description: 'Max size is 5MB', variant: 'destructive' });
        return;
      }
      if (!restaurantData.imageUrl.type.startsWith('image/')) {
        toast({ title: 'Invalid file type', description: 'Please upload an image', variant: 'destructive' });
        return;
      }
    }

    setRestaurantLoading(true);
    toast({ title: 'Creating restaurant...', description: 'Setting up your store and uploading image.' });

    try {
      const result = await restaurantApi.create(restaurantData);
      toast({ title: 'Restaurant created successfully!' });

      setRestaurantData({
        name: '',
        description: '',
        cuisine: '',
        address: '',
        city: '',
        area: '',
        lat: undefined,
        lng: undefined,
        imageUrl: null,
        openingTime: '',
        closingTime: '',
        priceRange: '',
      });

      await fetchOwnerRestaurants();
      const updated = result;
      setSelectedRestaurant(updated);
      setOwnerRestaurants(prev =>
        prev.map(r => (r.id === updated.id ? updated : r))
      );
    } catch (error) {
      toast({
        title: 'Creation failed',
        description: error instanceof Error ? error.message : 'Failed to create restaurant',
        variant: 'destructive',
      });
    } finally {
      setRestaurantLoading(false);
    }
  };

  const handleToggleRestaurantStatus = async () => {
    if (!selectedRestaurant) return;

    try {
      const updated = await restaurantApi.updateStatus(
        selectedRestaurant.id,
        !selectedRestaurant.isOpen
      );

      toast({
        title: 'Status updated',
        description: `Restaurant is now ${updated.isOpen ? 'Open' : 'Closed'}`,
      });

      // 🔄 sync UI state
      setSelectedRestaurant(updated);
      setOwnerRestaurants(prev =>
        prev.map(r => (r.id === updated.id ? updated : r))
      );
    } catch (err) {
      toast({
        title: 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const fetchRestaurantCoupons = async (restaurantId: string) => {
    setLoadingCoupons(true);
    try {
      const res = await couponApi.getAll({ ownerRestaurantId: restaurantId });
      setCoupons(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCoupons(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'coupons' && selectedRestaurant) {
      fetchRestaurantCoupons(selectedRestaurant.id);
    }
  }, [activeTab, selectedRestaurant]);




  return (
    <div className="min-h-screen bg-background p-8">
      {/* <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Store className="h-6 w-6" />
          Restaurant Owner Dashboard
        </h1>
        <Button variant="outline" onClick={handleLogout} className="flex gap-2">
          <LogOut className="h-4 w-4" /> Logout
        </Button>
      </div> */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Store className="h-6 w-6" />
          Restaurant Owner Dashboard
        </h1>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/profile')}
            className="flex gap-2"
          >
            <User className="h-4 w-4" /> Profile
          </Button>

          <Button
            variant="outline"
            onClick={handleLogout}
            className="flex gap-2"
          >
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Restaurants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loadingRestaurants ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : ownerRestaurants.length === 0 ? (
                <p className="text-sm text-muted-foreground">No restaurants yet. Create one below.</p>
              ) : (
                ownerRestaurants.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRestaurant(r)}
                    className={`w-full rounded-lg border p-3 text-left flex items-center gap-3 ${selectedRestaurant?.id === r.id
                      ? 'border-primary bg-primary/10'
                      : 'hover:bg-muted'
                      }`}
                  >
                    {r.imageUrl ? (
                      <img
                        src={r.imageUrl}
                        alt={r.name}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 ${r.imageUrl ? 'hidden' : ''}`}>
                      <Store className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{r.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.cuisine}</p>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Create Restaurant</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateRestaurant} className="space-y-3">
                <Input placeholder="Restaurant Name *" value={restaurantData.name} onChange={e => setRestaurantData(p => ({ ...p, name: e.target.value }))} required />
                <Input placeholder="Cuisine Type *" value={restaurantData.cuisine} onChange={e => setRestaurantData(p => ({ ...p, cuisine: e.target.value }))} required />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Opening Time</Label>
                    <Input
                      type="time"
                      value={restaurantData.openingTime}
                      onChange={(e) =>
                        setRestaurantData(p => ({ ...p, openingTime: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Closing Time</Label>
                    <Input
                      type="time"
                      value={restaurantData.closingTime}
                      onChange={(e) =>
                        setRestaurantData(p => ({ ...p, closingTime: e.target.value }))
                      }
                    />
                  </div>
                </div>

                {/* <Input placeholder="Address *" value={restaurantData.address} onChange={e => setRestaurantData(p => ({ ...p, address: e.target.value }))} required /> */}
                <div className="space-y-2">
                  <Input
                    placeholder="Address *"
                    value={restaurantData.address}
                    onChange={async (e) => {
                      const value = e.target.value;
                      setRestaurantData(p => ({ ...p, address: value }));

                      if (value.length < 3) {
                        setAddressResults([]);
                        return;
                      }

                      setIsSearchingAddress(true);
                      const results = await searchPlaces(value);
                      setAddressResults(results);
                      setIsSearchingAddress(false);
                    }}
                    required
                  />
                  {addressResults.length > 0 && activeTab !== 'settings' && (
                    <div className="max-h-48 overflow-y-auto rounded-lg border bg-background shadow">
                      {addressResults.map((r, i) => (
                        <button
                          key={i}
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                          onClick={() => {
                            setRestaurantData(p => ({
                              ...p,
                              address: r.place_name,
                              city: r.city,
                              area: r.area,
                              lat: r.lat,
                              lng: r.lng,
                            }));
                            setAddressResults([]);
                          }}
                        >
                          {r.place_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <Input
                  placeholder="Cost for Two (e.g. ₹600 for two) *"
                  value={restaurantData.priceRange}
                  onChange={e => setRestaurantData(p => ({ ...p, priceRange: e.target.value }))}
                  required
                />
                <Input placeholder="Description" value={restaurantData.description} onChange={e => setRestaurantData(p => ({ ...p, description: e.target.value }))} />
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ImageIcon className="h-4 w-4" />
                    <span>Restaurant Image</span>
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setRestaurantData(p => ({ ...p, imageUrl: file }));
                      }
                    }}
                  />
                  {restaurantData.imageUrl && (
                    <div className="mt-2 rounded-lg overflow-hidden border">
                      <img
                        src={typeof restaurantData.imageUrl === 'string' ? restaurantData.imageUrl : URL.createObjectURL(restaurantData.imageUrl)}
                        alt="Preview"
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '';
                          e.currentTarget.parentElement?.classList.add('hidden');
                        }}
                      />
                    </div>
                  )}
                </div>
                <Button className="w-full" disabled={restaurantLoading || !restaurantData.name || !restaurantData.cuisine || !restaurantData.address}>
                  {restaurantLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Restaurant
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedRestaurant ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                Select a restaurant to manage
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={activeTab === 'menu' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('menu')}
                >
                  Menu Management
                </Button>
                <Button
                  variant={activeTab === 'orders' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('orders')}
                >
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Orders
                </Button>
                <Button
                  variant={activeTab === 'settings' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('settings')}
                >
                  Restaurant Settings
                </Button>
                <Button
                  variant={activeTab === 'coupons' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('coupons')}
                >
                  <TicketPercent className="h-4 w-4 mr-2" />
                  Coupons
                </Button>
                <Button
                  variant={activeTab === 'wallet' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('wallet')}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Wallet
                </Button>
              </div>

              {/* MENU TAB */}
              {activeTab === 'menu' && selectedRestaurant && (
                <OwnerMenuTab
                  restaurantId={selectedRestaurant.id}
                  categories={categories}
                  loadingCategories={loadingCategories}
                  onRefresh={() => fetchMenuCategories(selectedRestaurant.id)}
                />
              )}

              {activeTab === 'wallet' && selectedRestaurant && (
                <WalletTab restaurantId={selectedRestaurant.id} />
              )}

              {/* ORDERS TAB */}
              {activeTab === 'orders' && selectedRestaurant && (
                <OwnerOrdersTab restaurantId={selectedRestaurant.id} />
              )}

              {/* COUPONS TAB */}
              {activeTab === 'coupons' && selectedRestaurant && (
                <OwnerCouponsTab
                  restaurantId={selectedRestaurant.id}
                  coupons={coupons}
                  loadingCoupons={loadingCoupons}
                  onRefresh={fetchRestaurantCoupons}
                />
              )}


              {/* SETTINGS TAB */}
              {activeTab === 'settings' && selectedRestaurant && (
                <OwnerSettingsTab
                  restaurant={selectedRestaurant}
                  settingsData={settingsData}
                  setSettingsData={setSettingsData}
                  settingsLoading={settingsLoading}
                  setSettingsLoading={setSettingsLoading}
                  addressResults={addressResults}
                  setAddressResults={setAddressResults}
                  setIsSearchingAddress={setIsSearchingAddress}
                  onUpdateSuccess={(updated) => {
                    setSelectedRestaurant(updated);
                    setSettingsData({
                      name: updated.name || '',
                      description: updated.description || '',
                      cuisine: updated.cuisine || '',
                      address: updated.address || '',
                      city: (updated as any).city || '',
                      area: (updated as any).area || '',
                      lat: (updated as any).lat,
                      lng: (updated as any).lng,
                      imageUrl: updated.imageUrl || '',
                      openingTime: (updated as any).openingTime || '',
                      closingTime: (updated as any).closingTime || '',
                      priceRange: (updated as any).priceRange || '',
                    });
                  }}
                  onToggleStatus={handleToggleRestaurantStatus}
                />
              )}
            </>
          )}
        </div >
      </div >
    </div >
  );
}



// Orders Tab Component
// function OwnerOrdersTab() {
//   const { data: orders, isLoading, error } = useQuery({
//     queryKey: ['restaurantOrders'],
//     queryFn: orderApi.getRestaurantOrders,
//   });
// Placeholder line to satisfy targetContent uniqueness if needed


