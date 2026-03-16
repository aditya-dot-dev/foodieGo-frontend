import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveryApi, authApi, financeApi } from '@/lib/api';
import { useSocket } from '@/context/SocketContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package,
  MapPin,
  Phone,
  Store,
  Check,
  Loader2,
  Power,
  PowerOff,
  Bike,
  Clock,
  DollarSign,
  User,
  Navigation,
  ChevronRight,
  ShoppingBag,
  CircleDot,
  Truck,
  CheckCircle2,
  LogOut,
  RefreshCw,
  ArrowUpRight
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function DeliveryPartner() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState('available');

  // Get profile with stats
  const { data: profile } = useQuery({
    queryKey: ['delivery-profile'],
    queryFn: deliveryApi.getProfile,
  });

  // Get available orders
  const {
    data: availableOrders = [],
    isLoading: loadingAvailable,
    error: availableError
  } = useQuery({
    queryKey: ['available-orders'],
    queryFn: deliveryApi.getAvailableOrders,
  });

  // Get my orders
  const { data: myOrders, isLoading: loadingMyOrders } = useQuery({
    queryKey: ['my-orders'],
    queryFn: deliveryApi.getMyOrders,
  });

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    socket.on('NEW_AVAILABLE_ORDER', (data) => {
      queryClient.invalidateQueries({ queryKey: ['available-orders'] });
    });

    socket.on('ORDER_ACCEPTED_BY_DELIVERY_PARTNER', () => {
      queryClient.invalidateQueries({ queryKey: ['available-orders'] });
    });

    socket.on('ORDER_STATUS_UPDATE', (data) => {
      // If an order assigned to me has a status change (e.g. cancelled by restaurant)
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    });

    return () => {
      socket.off('NEW_AVAILABLE_ORDER');
      socket.off('ORDER_ACCEPTED_BY_DELIVERY_PARTNER');
      socket.off('ORDER_STATUS_UPDATE');
    };
  }, [socket, queryClient]);

  // Track and update location
  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          deliveryApi.updateLocation(
            position.coords.latitude,
            position.coords.longitude
          ).catch(console.error);
        },
        (error) => console.error("Error watching location:", error),
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // Toggle availability mutation
  const toggleAvailabilityMutation = useMutation({
    mutationFn: deliveryApi.toggleAvailability,
    onSuccess: (data) => {
      toast({
        title: data.isAvailable ? 'You are now Online' : 'You are now Offline',
        description: data.isAvailable
          ? 'You will receive new order assignments'
          : 'You will not receive new orders',
      });
      queryClient.invalidateQueries({ queryKey: ['delivery-profile'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to toggle availability',
        variant: 'destructive',
      });
    },
  });

  // Accept order mutation
  const acceptOrderMutation = useMutation({
    mutationFn: deliveryApi.acceptOrder,
    onSuccess: () => {
      toast({
        title: 'Order Accepted!',
        description: 'You have been assigned this delivery',
      });
      queryClient.invalidateQueries({ queryKey: ['available-orders'] });
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      setActiveTab('active');
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to Accept Order',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      deliveryApi.updateStatus(orderId, status),
    onSuccess: (_, variables) => {
      const statusMessages = {
        PICKED_UP: 'Order picked up from restaurant',
        OUT_FOR_DELIVERY: 'On the way to customer',
        COMPLETED: 'Order delivered successfully!',
      };
      toast({
        title: 'Status Updated',
        description: statusMessages[variables.status as keyof typeof statusMessages],
      });
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      // Invalidate wallet to show updated earnings immediately after completion
      if (variables.status === 'COMPLETED') {
        queryClient.invalidateQueries({ queryKey: ['delivery-wallet'] });
      }
    },
    onError: () => {
      toast({
        title: 'Update Failed',
        description: 'Could not update order status',
        variant: 'destructive',
      });
    },
  });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price);

  const getNextStatus = (currentStatus: string) => {
    const statusFlow = {
      READY: 'PICKED_UP',
      PICKED_UP: 'OUT_FOR_DELIVERY',
      OUT_FOR_DELIVERY: 'COMPLETED',
    };
    return statusFlow[currentStatus as keyof typeof statusFlow];
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      READY: 'Ready for Pickup',
      PICKED_UP: 'Picked Up',
      OUT_FOR_DELIVERY: 'Out for Delivery',
      COMPLETED: 'Completed',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const handleLogout = async () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNC0yIDQtMiA0LTItMi0yLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="container py-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <Bike className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Delivery Dashboard</h1>
                <p className="text-white/80">{profile?.name || 'Loading...'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Availability Toggle */}
              <Button
                onClick={() => toggleAvailabilityMutation.mutate()}
                disabled={toggleAvailabilityMutation.isPending}
                className={`${profile?.isAvailable
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-gray-500 hover:bg-gray-600'
                  } text-white shadow-lg`}
              >
                {toggleAvailabilityMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : profile?.isAvailable ? (
                  <Power className="h-4 w-4 mr-2" />
                ) : (
                  <PowerOff className="h-4 w-4 mr-2" />
                )}
                {profile?.isAvailable ? 'Online' : 'Offline'}
              </Button>
              <Button variant="outline" size="icon" onClick={handleLogout} className="bg-white/10 hover:bg-white/20 border-white/20">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="container mt-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Today</p>
                  <p className="text-3xl font-bold text-blue-600">{profile?.stats?.todayDeliveries || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Deliveries</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total</p>
                  <p className="text-3xl font-bold text-green-600">{profile?.stats?.totalDeliveries || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Lifetime Deliveries</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Vehicle</p>
                  <p className="text-xl font-bold text-purple-600">{profile?.vehicleType || 'N/A'}</p>
                  <p className="text-xs text-muted-foreground mt-1">{profile?.vehicleNumber || 'No number'}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20">
                  <Bike className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="container pb-12">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-6 gap-4">
            <TabsList className="grid flex-1 grid-cols-4">
              <TabsTrigger value="available">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Available ({availableOrders.length})
              </TabsTrigger>
              <TabsTrigger value="active">
                <Truck className="h-4 w-4 mr-2" />
                Active ({myOrders?.active?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="history">
                <Clock className="h-4 w-4 mr-2" />
                History ({myOrders?.completed?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="earnings">
                <DollarSign className="h-4 w-4 mr-2" />
                Earnings
              </TabsTrigger>
            </TabsList>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['available-orders'] });
                queryClient.invalidateQueries({ queryKey: ['my-orders'] });
                toast({ description: 'Refreshing orders...' });
              }}
              className="shrink-0 shadow-sm"
              title="Refresh Orders"
            >
              <RefreshCw className={`h-4 w-4 ${(loadingAvailable || loadingMyOrders) ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Available Orders */}
          <TabsContent value="available" className="space-y-4">
            {!profile?.isAvailable && (
              <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
                <CardContent className="p-4 flex items-center gap-3">
                  <PowerOff className="h-5 w-5 text-amber-600" />
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    You are offline. Toggle to "Online" to see available orders.
                  </p>
                </CardContent>
              </Card>
            )}

            {loadingAvailable ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : availableError ? (
              <Card className="border-destructive bg-destructive/5 text-destructive">
                <CardContent className="p-6 text-center">
                  <Package className="h-8 w-8 mx-auto mb-2" />
                  <p className="font-bold">Connection Issue</p>
                  <p className="text-sm opacity-80">
                    {(availableError as any).message?.includes('403')
                      ? "You don't have permission to view orders (403 Forbidden)."
                      : "Could not fetch orders. Please check your connection."}
                  </p>
                </CardContent>
              </Card>
            ) : (Array.isArray(availableOrders) && availableOrders.length > 0) ? (
              availableOrders.map((order: any) => (
                <Card key={order.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Store className="h-5 w-5 text-orange-500" />
                          <h3 className="font-bold text-lg">{order.restaurant.name}</h3>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{order.restaurant.address || order.restaurant.area}</span>
                          </div>
                          {order.restaurant.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <a href={`tel:${order.restaurant.phone}`} className="hover:underline">
                                {order.restaurant.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {formatPrice(order.totalAmount)}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        {order.totalItems} items
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {format(new Date(order.createdAt), 'hh:mm a')}
                      </span>
                    </div>

                    <Button
                      onClick={() => acceptOrderMutation.mutate(order.id)}
                      disabled={acceptOrderMutation.isPending || !profile?.isAvailable}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                    >
                      {acceptOrderMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Accepting...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Accept Order
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="font-medium text-lg text-foreground">No orders available right now</p>
                  <p className="text-sm mt-1">Check back in a few moments or try refreshing.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Active Deliveries */}
          <TabsContent value="active" className="space-y-4">
            {loadingMyOrders ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : myOrders?.active?.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No active deliveries</p>
                  <p className="text-sm text-muted-foreground mt-2">Accept an order to get started</p>
                </CardContent>
              </Card>
            ) : (
              myOrders?.active?.map((order: any) => {
                const nextStatus = getNextStatus(order.status);
                return (
                  <Card key={order.id} className="border-l-4 border-l-orange-500">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-orange-500">{getStatusLabel(order.status)}</Badge>
                            <span className="text-xs text-muted-foreground">#{order.id.slice(0, 8).toUpperCase()}</span>
                          </div>
                          <h3 className="font-bold text-lg">{order.restaurant.name}</h3>
                        </div>
                        <span className="font-bold text-lg">{formatPrice(order.totalAmount)}</span>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Pickup From:</p>
                          <div className="flex items-start gap-2 text-sm">
                            <Store className="h-4 w-4 mt-0.5 text-orange-500" />
                            <span>{order.restaurant.address || order.restaurant.area}</span>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Deliver To:</p>
                          <div className="flex flex-col gap-2 text-sm">
                            <div className="flex items-start gap-2">
                              <User className="h-4 w-4 mt-0.5 text-green-500" />
                              <span>{order.user.name}</span>
                            </div>
                            {order.user.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <a href={`tel:${order.user.phone}`} className="hover:underline">
                                  {order.user.phone}
                                </a>
                              </div>
                            )}
                            {order.address && (
                              <div className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                <MapPin className="h-4 w-4 mt-0.5 text-green-600" />
                                <div className="flex-1">
                                  <p className="font-semibold text-xs text-green-700 dark:text-green-400 uppercase tracking-wider">
                                    {order.address.label}
                                  </p>
                                  <p className="text-xs">{order.address.address}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {nextStatus && (
                        <Button
                          onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: nextStatus })}
                          disabled={updateStatusMutation.isPending}
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                        >
                          {updateStatusMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <ChevronRight className="h-4 w-4 mr-2" />
                          )}
                          {nextStatus === 'PICKED_UP' && 'Mark as Picked Up'}
                          {nextStatus === 'OUT_FOR_DELIVERY' && 'On the Way'}
                          {nextStatus === 'COMPLETED' && 'Mark as Delivered'}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* History */}
          <TabsContent value="history" className="space-y-4">
            {loadingMyOrders ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : myOrders?.completed?.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No delivery history yet</p>
                </CardContent>
              </Card>
            ) : (
              myOrders?.completed?.map((order: any) => (
                <Card key={order.id} className="opacity-80">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="font-medium">{order.restaurant.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(order.deliveredAt), 'MMM dd, yyyy â€¢ hh:mm a')}
                        </p>
                      </div>
                      <span className="font-bold text-green-600">{formatPrice(order.totalAmount)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="earnings">
            <EarningsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function EarningsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [payoutAmount, setPayoutAmount] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);

  // Safely fetch wallet data
  const { data: wallet, isLoading } = useQuery({
    queryKey: ['delivery-wallet'],
    queryFn: async () => {
      try {
        return await financeApi.getWallet();
      } catch (err) {
        console.error("Failed to fetch wallet:", err);
        return { balance: 0, transactions: [] };
      }
    },
    retry: 1,
  });

  const requestPayoutMutation = useMutation({
    mutationFn: (amount: number) => financeApi.requestPayout(amount),
    onSuccess: () => {
      toast({ title: 'Payout Requested', description: 'Request submitted successfully' });
      setIsRequesting(false);
      setPayoutAmount('');
      queryClient.invalidateQueries({ queryKey: ['delivery-wallet'] });
    },
    onError: (err: any) => {
      toast({ title: 'Failed', description: err.message || 'Could not request payout', variant: 'destructive' });
    }
  });

  const handleRequestPayout = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(payoutAmount);
    if (!amount || amount <= 0) return;
    if (amount > (wallet?.balance || 0)) {
      toast({ title: 'Insufficient balance', variant: 'destructive' });
      return;
    }
    requestPayoutMutation.mutate(amount);
  };

  const formatPrice = (p: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(p);

  if (isLoading) return <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1 bg-gradient-to-br from-zinc-900 to-zinc-800 text-white border-zinc-800 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <DollarSign className="h-24 w-24" />
          </div>
          <CardContent className="p-6 relative z-10">
            <p className="text-zinc-400 text-sm font-medium mb-1">Total Earnings</p>
            <h2 className="text-4xl font-bold tracking-tight">{formatPrice(wallet?.balance || 0)}</h2>
            <div className="mt-6">
              {!isRequesting ? (
                <Button
                  onClick={() => setIsRequesting(true)}
                  className="w-full bg-white text-zinc-900 hover:bg-zinc-100 font-bold"
                >
                  Withdraw Earnings
                </Button>
              ) : (
                <form onSubmit={handleRequestPayout} className="bg-white/10 p-4 rounded-xl space-y-3 backdrop-blur-sm animate-in fade-in">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-300">Amount to withdraw</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-zinc-400">₹</span>
                      <input
                        type="number"
                        className="w-full bg-zinc-950/50 border-zinc-700/50 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 text-white placeholder:text-zinc-600 transition-all"
                        placeholder="0.00"
                        value={payoutAmount}
                        onChange={e => setPayoutAmount(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="ghost" size="sm" className="flex-1 text-zinc-300 hover:text-white hover:bg-white/10" onClick={() => setIsRequesting(false)}>Cancel</Button>
                    <Button type="submit" size="sm" className="flex-1 bg-white text-zinc-900 hover:bg-zinc-200" disabled={requestPayoutMutation.isPending}>
                      {requestPayoutMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info Card (Optional context) */}
        <Card className="col-span-1 bg-white border-zinc-200 shadow-sm flex flex-col justify-between">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900">Earning Rules</p>
                <p className="text-xs text-muted-foreground">Standard delivery rates apply</p>
              </div>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Base Fare</span>
                <span className="font-medium text-zinc-900">₹40.00</span>
              </div>
              <div className="flex justify-between">
                <span>Per KM</span>
                <span className="font-medium text-zinc-900">₹10.00</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Transaction History</h3>
          <Badge variant="outline">Last 10</Badge>
        </div>

        {wallet?.transactions?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/30">
            No transactions yet
          </div>
        ) : (
          <div className="space-y-3">
            {wallet?.transactions?.map((txn: any) => (
              <div key={txn.id} className="bg-card border rounded-xl p-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${txn.type === 'ORDER_API_FEE' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                    {txn.type === 'ORDER_API_FEE' || txn.type === 'ORDER_CREDIT' ? <CheckCircle2 className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{txn.description}</p>
                    <p className="text-[10px] text-muted-foreground">{format(new Date(txn.createdAt), 'MMM dd, h:mm a')}</p>
                  </div>
                </div>
                <span className={`font-bold ${txn.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {txn.amount > 0 ? '+' : ''}{formatPrice(txn.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

