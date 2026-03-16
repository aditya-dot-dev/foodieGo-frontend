import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '@/lib/api';
import { useSocket } from '@/context/SocketContext';
import { useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { OrderTracker } from '@/components/OrderTracker';
import { LiveMap } from '@/components/LiveMap';
import { CancelOrderButton } from '@/components/CancelOrderButton';
import { MapPin, Loader2, Phone, MessageSquare, Package, ShoppingBag, Clock, Store, Receipt, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function OrderTracking() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { socket } = useSocket();

    const { data: order, isLoading, error } = useQuery({
        queryKey: ['order', id],
        queryFn: () => orderApi.getById(id!),
        enabled: !!id,
    });

    useEffect(() => {
        if (!socket || !id) return;

        // Join the specific order room
        socket.emit('join_order_room', id);

        const handleStatusUpdate = (data: any) => {
            if (data.orderId === id) {
                queryClient.invalidateQueries({ queryKey: ['order', id] });
            }
        };

        const handleLocationUpdate = (data: any) => {
            if (data.orderId === id) {
                // We could update the map state directly here if we had a more granular state
                // For now, let's just invalidate or let the LiveMap handle it via socket itself if needed
                console.log('Location update received:', data);
            }
        };

        socket.on('ORDER_STATUS_UPDATE', handleStatusUpdate);
        socket.on('LOCATION_UPDATE', handleLocationUpdate);
        socket.on('ORDER_ACCEPTED_BY_DELIVERY_PARTNER', handleStatusUpdate);

        return () => {
            socket.off('ORDER_STATUS_UPDATE', handleStatusUpdate);
            socket.off('LOCATION_UPDATE', handleLocationUpdate);
            socket.off('ORDER_ACCEPTED_BY_DELIVERY_PARTNER', handleStatusUpdate);
        };
    }, [socket, id, queryClient]);

    // Loading State
    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                {/* Gradient Header */}
                <div className="relative h-32 md:h-40 bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 overflow-hidden">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNC0yIDQtMiA0LTItMi0yLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
                    <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl" />
                </div>

                <main className="container relative -mt-16 md:-mt-20 pb-12">
                    {/* Header Skeleton */}
                    <div className="bg-card rounded-2xl border border-border/50 shadow-xl overflow-hidden mb-6">
                        <div className="h-1.5 bg-gradient-to-r from-orange-500 to-red-500" />
                        <div className="p-6">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-14 w-14 rounded-xl" />
                                <div className="space-y-2">
                                    <Skeleton className="h-7 w-40" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1 space-y-6">
                            <Skeleton className="h-48 w-full rounded-2xl" />
                            <Skeleton className="h-[300px] w-full rounded-2xl" />
                            <Skeleton className="h-24 w-full rounded-2xl" />
                        </div>
                        <div className="w-full lg:w-[380px]">
                            <Skeleton className="h-96 w-full rounded-2xl" />
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // Error State
    if (error || !order) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="relative h-32 md:h-40 bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 overflow-hidden">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNC0yIDQtMiA0LTItMi0yLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
                    <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
                </div>

                <main className="container relative -mt-16 md:-mt-20 pb-12">
                    <div className="bg-card rounded-2xl border border-border/50 shadow-xl p-12 text-center max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-500/20 dark:to-orange-500/20 flex items-center justify-center mx-auto mb-6">
                            <ShoppingBag className="h-10 w-10 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Order Not Found</h1>
                        <p className="text-muted-foreground mb-6">
                            We couldn't find the order you're looking for.
                        </p>
                        <Button
                            onClick={() => navigate('/')}
                            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg"
                        >
                            Go Home
                        </Button>
                    </div>
                </main>
            </div>
        );
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(price);
    };

    // Calculate total items
    const totalItems = order.orderItems.reduce((acc, item) => acc + item.quantity, 0);

    // Status colors
    const statusColors: Record<string, string> = {
        PLACED: 'from-slate-500 to-slate-700',
        ACCEPTED: 'from-blue-500 to-indigo-500',
        CONFIRMED: 'from-blue-500 to-indigo-500',
        PREPARING: 'from-orange-500 to-red-500',
        READY: 'from-emerald-500 to-teal-500',
        PICKED_UP: 'from-teal-500 to-cyan-500',
        OUT_FOR_DELIVERY: 'from-purple-500 to-pink-500',
        DELIVERED: 'from-green-500 to-emerald-500',
        COMPLETED: 'from-green-500 to-emerald-500',
        CANCELLED: 'from-red-500 to-rose-500',
        REJECTED: 'from-red-500 to-rose-500',
    };

    const currentGradient = statusColors[order.status] || 'from-orange-500 to-red-500';

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            {/* Gradient Header */}
            <div className={`relative h-32 md:h-40 bg-gradient-to-r ${currentGradient} overflow-hidden`}>
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNC0yIDQtMiA0LTItMi0yLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
            </div>

            <main className="container relative -mt-16 md:-mt-20 pb-12">
                {/* Section Header Card */}
                <div className="bg-card rounded-2xl border border-border/50 shadow-xl overflow-hidden mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className={`h-1.5 bg-gradient-to-r ${currentGradient}`} />
                    <div className="p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${currentGradient} shadow-lg`}>
                                    <Package className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-foreground">Track Order</h1>
                                    <p className="text-sm text-muted-foreground font-mono">#{order.id.slice(0, 8).toUpperCase()}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate('/orders')}
                                    className="rounded-xl"
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    All Orders
                                </Button>
                                <CancelOrderButton
                                    orderId={order.id}
                                    orderStatus={order.status}
                                    orderAmount={order.totalAmount}
                                    createdAt={order.createdAt}
                                    paymentStatus={(order as any).paymentStatus}
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-200 dark:hover:border-red-500/30"
                                    onCancelSuccess={() => navigate('/orders')}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Column: Status & Map */}
                    <div className="flex-1 space-y-6">
                        {/* Tracker Steps Card */}
                        <div className="bg-card rounded-2xl border border-border/50 shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '50ms' }}>
                            <div className={`h-1 bg-gradient-to-r ${currentGradient}`} />
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/20 dark:to-red-500/20">
                                        <Clock className="h-5 w-5 text-orange-500" />
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-foreground">
                                            {order.status === 'COMPLETED' || order.status === 'DELIVERED' ? 'Order Delivered!' :
                                                order.status === 'REJECTED' || order.status === 'CANCELLED' ? 'Order Cancelled' :
                                                    `Estimated: ${format(new Date(new Date().getTime() + 30 * 60000), 'hh:mm a')}`}
                                        </h2>
                                        <p className="text-sm text-muted-foreground">
                                            {totalItems} items from <span className="font-medium text-foreground">{order.restaurant.name}</span>
                                        </p>
                                    </div>
                                </div>

                                <OrderTracker status={order.status} />
                            </div>
                        </div>

                        {/* Live Map */}
                        <div className="h-[300px] md:h-[350px] w-full rounded-2xl overflow-hidden shadow-lg border border-border/50 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '100ms' }}>
                            <LiveMap />
                        </div>

                        {/* Delivery Partner Info */}
                        <div className="bg-card rounded-2xl border border-border/50 shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '150ms' }}>
                            <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
                            <div className="p-5">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-purple-500/30">
                                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Driver" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-card flex items-center justify-center">
                                            <div className="w-2 h-2 rounded-full bg-white" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-foreground">Ramesh Kumar</h3>
                                        <p className="text-sm text-muted-foreground">Your Delivery Partner</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="icon" variant="outline" className="rounded-full h-11 w-11 hover:bg-purple-500/10 hover:border-purple-500/30 hover:text-purple-600">
                                            <MessageSquare className="h-5 w-5" />
                                        </Button>
                                        <Button size="icon" className="rounded-full h-11 w-11 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg">
                                            <Phone className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Order Details */}
                    <div className="w-full lg:w-[380px] space-y-6">
                        {/* Order Summary Card */}
                        <div className="bg-card rounded-2xl border border-border/50 shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '100ms' }}>
                            <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                            <div className="p-5">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-500/20 dark:to-indigo-500/20">
                                        <Receipt className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <h3 className="font-bold text-foreground">Order Summary</h3>
                                </div>

                                <div className="space-y-3">
                                    {order.orderItems.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-start text-sm">
                                            <div className="flex gap-2">
                                                <div className={`mt-1 w-3 h-3 rounded border flex items-center justify-center flex-shrink-0 ${item.menuItem.isVeg !== false ? 'border-green-600' : 'border-red-600'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${item.menuItem.isVeg !== false ? 'bg-green-600' : 'bg-red-600'}`} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground">{item.menuItem.name}</p>
                                                    <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                                                </div>
                                            </div>
                                            <span className="text-sm text-muted-foreground">
                                                {formatPrice(item.menuItem.price * item.quantity)}
                                            </span>
                                        </div>
                                    ))}

                                    <div className="border-t border-border/50 pt-3 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Item Total</span>
                                            <span>{formatPrice(order.totalAmount)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Delivery Fee</span>
                                            <span>₹40</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Platform Fee</span>
                                            <span>₹5</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">GST & Charges</span>
                                            <span>₹{Math.round(order.totalAmount * 0.05)}</span>
                                        </div>
                                    </div>

                                    <div className="border-t border-border/50 pt-3 flex justify-between items-center">
                                        <span className="font-bold text-lg">Total Paid</span>
                                        <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                                            {formatPrice(order.totalAmount + 40 + 5 + Math.round(order.totalAmount * 0.05))}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Delivery Address Card */}
                        <div className="bg-card rounded-2xl border border-border/50 shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '150ms' }}>
                            <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
                            <div className="p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-500/20 dark:to-emerald-500/20">
                                        <MapPin className="h-5 w-5 text-green-600" />
                                    </div>
                                    <h4 className="font-bold text-foreground">Delivery Address</h4>
                                </div>
                                <p className="text-sm text-muted-foreground pl-13">
                                    Home • Flat 402, Sunshine Apartments, Indiranagar, Bangalore
                                </p>
                            </div>
                        </div>

                        {/* Restaurant Info Card */}
                        <div className="bg-card rounded-2xl border border-border/50 shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '200ms' }}>
                            <div className="h-1 bg-gradient-to-r from-orange-500 to-red-500" />
                            <div className="p-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/20 dark:to-red-500/20">
                                        <Store className="h-5 w-5 text-orange-500" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-foreground">{order.restaurant.name}</h4>
                                        <p className="text-sm text-muted-foreground">{order.restaurant.address || 'Restaurant Address'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
