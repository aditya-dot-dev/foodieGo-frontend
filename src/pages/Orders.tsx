import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';
import { Package, Clock, Store, ChevronRight, RefreshCw, Utensils, Receipt, CreditCard, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Navbar } from '@/components/Navbar';
import { CancelOrderButton } from '@/components/CancelOrderButton';
import { orderApi } from '@/lib/api';
import type { Order } from '@/types';

// Status color mapping for different order statuses
const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  PLACED: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  CONFIRMED: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  ACCEPTED: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  PREPARING: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  READY: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  OUT_FOR_DELIVERY: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  COMPLETED: 'bg-green-500/10 text-green-600 border-green-500/20',
  DELIVERED: 'bg-green-500/10 text-green-600 border-green-500/20',
  CANCELLED: 'bg-red-500/10 text-red-600 border-red-500/20',
  REJECTED: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

// Status icon backgrounds
const statusIconColors: Record<string, string> = {
  PENDING: 'from-amber-100 to-amber-50 dark:from-amber-500/20 dark:to-amber-500/10',
  PLACED: 'from-blue-100 to-blue-50 dark:from-blue-500/20 dark:to-blue-500/10',
  CONFIRMED: 'from-blue-100 to-blue-50 dark:from-blue-500/20 dark:to-blue-500/10',
  ACCEPTED: 'from-emerald-100 to-emerald-50 dark:from-emerald-500/20 dark:to-emerald-500/10',
  PREPARING: 'from-orange-100 to-orange-50 dark:from-orange-500/20 dark:to-orange-500/10',
  READY: 'from-purple-100 to-purple-50 dark:from-purple-500/20 dark:to-purple-500/10',
  OUT_FOR_DELIVERY: 'from-purple-100 to-purple-50 dark:from-purple-500/20 dark:to-purple-500/10',
  COMPLETED: 'from-green-100 to-green-50 dark:from-green-500/20 dark:to-green-500/10',
  DELIVERED: 'from-green-100 to-green-50 dark:from-green-500/20 dark:to-green-500/10',
  CANCELLED: 'from-red-100 to-red-50 dark:from-red-500/20 dark:to-red-500/10',
  REJECTED: 'from-gray-100 to-gray-50 dark:from-gray-500/20 dark:to-gray-500/10',
};

export default function Orders() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['my-orders'],
    queryFn: orderApi.getMyOrders,
  });

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    };

    socket.on('ORDER_STATUS_UPDATE', handleUpdate);
    socket.on('ORDER_CANCELLED', handleUpdate);
    socket.on('PAYMENT_SUCCEEDED', handleUpdate);
    socket.on('ORDER_ACCEPTED_BY_DELIVERY_PARTNER', handleUpdate);

    return () => {
      socket.off('ORDER_STATUS_UPDATE', handleUpdate);
      socket.off('ORDER_CANCELLED', handleUpdate);
      socket.off('PAYMENT_SUCCEEDED', handleUpdate);
      socket.off('ORDER_ACCEPTED_BY_DELIVERY_PARTNER', handleUpdate);
    };
  }, [socket, queryClient]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        {/* Gradient Header */}
        <div className="relative h-32 md:h-40 bg-gradient-to-r from-orange-500 via-orange-600 to-red-500">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNC0yIDQtMiA0LTItMi0yLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          {/* Decorative circles */}
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl" />
        </div>

        <main className="container relative -mt-16 md:-mt-20 pb-12">
          {/* Page Title Card Skeleton */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-xl p-6 mb-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>

          {/* Order Cards Skeleton */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-card rounded-2xl border border-border/50 shadow-lg overflow-hidden"
              >
                <Skeleton className="h-3 w-full" />
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-xl" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-border/50">
                    <Skeleton className="h-10 flex-1 rounded-xl" />
                    <Skeleton className="h-10 flex-1 rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="relative h-32 md:h-40 bg-gradient-to-r from-orange-500 via-orange-600 to-red-500">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNC0yIDQtMiA0LTItMi0yLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
        </div>
        <main className="container relative -mt-16 md:-mt-20 pb-12">
          <div className="bg-card rounded-2xl border border-border/50 shadow-xl p-8 max-w-md mx-auto text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <Package className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold">Failed to load orders</h2>
            <p className="text-muted-foreground">Something went wrong while fetching your orders.</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Empty State
  if (orders && orders.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="relative h-32 md:h-40 bg-gradient-to-r from-orange-500 via-orange-600 to-red-500">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNC0yIDQtMiA0LTItMi0yLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl" />
        </div>

        <main className="container relative -mt-16 md:-mt-20 pb-12">
          {/* Page Title Card */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-xl overflow-hidden mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="h-2 bg-gradient-to-r from-orange-500 to-red-500" />
            <div className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/20">
                  <Receipt className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Your Orders</h1>
                  <p className="text-sm text-muted-foreground">Track and manage your orders</p>
                </div>
              </div>
            </div>
          </div>

          {/* Empty State Card */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-lg p-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '100ms' }}>
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/20 dark:to-red-500/20 flex items-center justify-center mx-auto mb-6">
              <Package className="h-10 w-10 text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
              Looks like you haven't placed any orders yet. Start exploring restaurants and order your favorite food!
            </p>
            <Button
              onClick={() => navigate('/')}
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all"
            >
              <Utensils className="mr-2 h-5 w-5" />
              Browse Restaurants
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Main Orders View
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Gradient Header Background */}
      <div className="relative h-32 md:h-40 bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNC0yIDQtMiA0LTItMi0yLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl" />
      </div>

      <main className="container relative -mt-16 md:-mt-20 pb-12">
        {/* Page Title Card */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-xl overflow-hidden mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="h-2 bg-gradient-to-r from-orange-500 to-red-500" />
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/20">
                  <Receipt className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Your Orders</h1>
                  <p className="text-sm text-muted-foreground">
                    {orders?.length} order{orders && orders.length !== 1 ? 's' : ''} placed
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="hidden md:flex items-center gap-2 hover:border-orange-500/50 hover:bg-orange-500/5"
              >
                <Utensils className="h-4 w-4" />
                Order More
              </Button>
            </div>
          </div>
        </div>

        {/* Order Cards Grid */}
        {Array.isArray(orders) && orders.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {orders.map((order: Order, index: number) => (
              <div
                key={order.id}
                className="bg-card rounded-2xl border border-border/50 shadow-lg overflow-hidden hover:border-orange-500/30 hover:shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 50}ms`, animationDuration: '500ms' }}
              >
                {/* Card Top Accent - Color based on status */}
                <div className={`h-1.5 bg-gradient-to-r ${order.status === 'DELIVERED' ? 'from-green-500 to-emerald-500' :
                  order.status === 'CANCELLED' ? 'from-red-500 to-rose-500' :
                    order.status === 'OUT_FOR_DELIVERY' ? 'from-purple-500 to-violet-500' :
                      order.status === 'PREPARING' ? 'from-orange-500 to-amber-500' :
                        order.status === 'CONFIRMED' ? 'from-blue-500 to-cyan-500' :
                          'from-orange-500 to-red-500'
                  }`} />

                <div className="p-5">
                  {/* Restaurant Info */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${statusIconColors[order.status] || 'from-orange-100 to-red-100 dark:from-orange-500/20 dark:to-red-500/20'} shrink-0`}>
                        <Store className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                          {order.restaurant.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{formatDate(order.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-foreground whitespace-nowrap ml-2">
                      {formatPrice(order.totalAmount)}
                    </span>
                  </div>

                  {/* Status & Items */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`${statusColors[order.status] || 'bg-primary/10 text-primary border-primary/20'} font-medium px-2.5 py-0.5`}
                      >
                        {order.status.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Utensils className="h-3.5 w-3.5" />
                        {order.orderItems.length} item{order.orderItems.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    {/* Payment Status */}
                    {(order as any).paymentStatus && (
                      <div className="flex items-center gap-1.5 text-xs">
                        {(order as any).paymentStatus === 'SUCCEEDED' ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                            <span className="text-green-600 font-medium">Paid</span>
                          </>
                        ) : (order as any).paymentStatus === 'PENDING' ? (
                          <>
                            <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                            <span className="text-amber-600 font-medium">Payment Pending</span>
                          </>
                        ) : (order as any).paymentStatus === 'FAILED' ? (
                          <>
                            <XCircle className="h-3.5 w-3.5 text-red-600" />
                            <span className="text-red-600 font-medium">Payment Failed</span>
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground font-medium">{(order as any).paymentStatus}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-4 border-t border-border/50">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 h-10 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-md hover:shadow-lg transition-all"
                        onClick={() => navigate(`/orders/${order.id}/track`)}
                      >
                        Track Order
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-10 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all"
                        onClick={() => navigate(`/restaurants/${order.restaurantId}`)}
                      >
                        <Store className="h-4 w-4 mr-1.5" />
                        Restaurant
                      </Button>
                    </div>

                    {/* Cancel Button - Shows only if cancellable */}
                    <CancelOrderButton
                      orderId={order.id}
                      orderStatus={order.status}
                      orderAmount={order.totalAmount}
                      createdAt={order.createdAt}
                      paymentStatus={(order as any).paymentStatus}
                      variant="outline"
                      size="sm"
                      className="w-full h-10 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-200 dark:hover:border-red-500/30"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mobile Order More Button */}
        <div className="mt-8 md:hidden animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '200ms' }}>
          <Button
            onClick={() => navigate('/')}
            size="lg"
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg"
          >
            <Utensils className="mr-2 h-5 w-5" />
            Order More Food
          </Button>
        </div>
      </main>
    </div>
  );
}
