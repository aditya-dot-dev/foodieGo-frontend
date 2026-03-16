import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ClipboardList, XCircle, User, Phone, Package, Clock, ArrowRight } from 'lucide-react';
import { orderApi } from '@/lib/api';
import { useSocket } from '@/context/SocketContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
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
import { OwnerOrder, StatusHistoryEntry } from '@/types';

// Status configuration
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
    PLACED: { label: 'Placed', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    ACCEPTED: { label: 'Accepted', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
    PREPARING: { label: 'Preparing', color: 'text-amber-700', bgColor: 'bg-amber-100' },
    READY: { label: 'Ready', color: 'text-purple-700', bgColor: 'bg-purple-100' },
    COMPLETED: { label: 'Completed', color: 'text-green-700', bgColor: 'bg-green-100' },
    REJECTED: { label: 'Rejected', color: 'text-red-700', bgColor: 'bg-red-100' },
};

// Get next actions based on current status
function getStatusActions(status: string): { action: string; label: string; variant: 'default' | 'destructive' | 'outline' }[] {
    switch (status) {
        case 'PLACED':
            return [
                { action: 'ACCEPTED', label: 'Accept', variant: 'default' },
                { action: 'REJECTED', label: 'Reject', variant: 'destructive' },
            ];
        case 'ACCEPTED':
            return [{ action: 'PREPARING', label: 'Start Preparing', variant: 'default' }];
        case 'PREPARING':
            return [{ action: 'READY', label: 'Mark Ready', variant: 'default' }];
        case 'READY':
            return [{ action: 'COMPLETED', label: 'Mark Delivered (Self/Pickup)', variant: 'outline' }];
        default:
            return [];
    }
}

export function OwnerOrdersTab({ restaurantId }: { restaurantId: string }) {
    const queryClient = useQueryClient();
    const { socket } = useSocket();

    const { data: orders, isLoading, error } = useQuery({
        queryKey: ['restaurantOrders', restaurantId],
        queryFn: () => orderApi.getRestaurantOrdersByRestaurant(restaurantId),
        enabled: !!restaurantId,
    });

    useEffect(() => {
        if (!socket || !restaurantId) return;

        // Join the restaurant-specific room
        socket.emit('join_restaurant_room', restaurantId);

        const handleNewOrder = (data: any) => {
            // If the new order is for this restaurant, refresh list
            queryClient.invalidateQueries({ queryKey: ['restaurantOrders', restaurantId] });
        };

        socket.on('NEW_ORDER', handleNewOrder);
        socket.on('ORDER_CANCELLED', handleNewOrder);
        socket.on('ORDER_STATUS_UPDATE', handleNewOrder);
        socket.on('ORDER_ACCEPTED_BY_DELIVERY_PARTNER', handleNewOrder);

        return () => {
            socket.off('NEW_ORDER', handleNewOrder);
            socket.off('ORDER_CANCELLED', handleNewOrder);
            socket.off('ORDER_STATUS_UPDATE', handleNewOrder);
            socket.off('ORDER_ACCEPTED_BY_DELIVERY_PARTNER', handleNewOrder);
        };
    }, [socket, restaurantId, queryClient]);

    if (isLoading) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <Loader2 className="h-8 w-8 mx-auto text-muted-foreground mb-4 animate-spin" />
                    <p className="text-muted-foreground">Loading orders...</p>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <XCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
                    <p className="text-destructive">Failed to load orders</p>
                </CardContent>
            </Card>
        );
    }

    if (!orders || orders.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No orders yet</p>
                </CardContent>
            </Card>
        );
    }

    // Sort orders: active first, then by date
    const sortedOrders = [...orders].sort((a, b) => {
        const aTerminal = a.status === 'COMPLETED' || a.status === 'REJECTED';
        const bTerminal = b.status === 'COMPLETED' || b.status === 'REJECTED';
        if (aTerminal !== bTerminal) return aTerminal ? 1 : -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const activeCount = orders.filter(o => o.status !== 'COMPLETED' && o.status !== 'REJECTED').length;

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ClipboardList className="h-5 w-5" />
                        Incoming Orders ({orders.length})
                        {activeCount > 0 && (
                            <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary">
                                {activeCount} active
                            </Badge>
                        )}
                    </CardTitle>
                </CardHeader>
            </Card>

            {sortedOrders.map((order) => (
                <OwnerOrderCard key={order.id} order={order} />
            ))}
        </div>
    );
}

function StatusTimeline({ history }: { history?: StatusHistoryEntry[] }) {
    // Filter out invalid entries (missing required fields)
    const validHistory = (history ?? []).filter(
        (entry) => entry && entry.to && entry.createdAt
    );

    if (validHistory.length === 0) {
        return (
            <div className="text-sm text-muted-foreground italic py-2">
                No status history available
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {validHistory.map((entry, idx) => {
                const toConfig = STATUS_CONFIG[entry.to] || { label: entry.to, color: 'text-muted-foreground', bgColor: 'bg-muted' };
                const isLatest = idx === validHistory.length - 1;

                // Safely parse date
                let formattedDate = 'Unknown';
                try {
                    const date = new Date(entry.createdAt);
                    if (!isNaN(date.getTime())) {
                        formattedDate = format(date, 'dd MMM, hh:mm a');
                    }
                } catch {
                    // Keep default 'Unknown'
                }

                return (
                    <div key={idx} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full ${isLatest ? 'bg-primary ring-2 ring-primary/30' : 'bg-muted-foreground/40'}`} />
                            {idx < validHistory.length - 1 && (
                                <div className="w-0.5 h-8 bg-border" />
                            )}
                        </div>
                        <div className="flex-1 -mt-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                                {entry.from && (
                                    <>
                                        <span className="text-xs text-muted-foreground">{entry.from}</span>
                                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                    </>
                                )}
                                <span className={`text-xs font-medium px-2 py-0.5 rounded ${toConfig.bgColor} ${toConfig.color}`}>
                                    {toConfig.label}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {formattedDate}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}


function OwnerOrderCard({ order }: { order: OwnerOrder }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
    const [showTimeline, setShowTimeline] = useState(false);
    const [rejectOrderId, setRejectOrderId] = useState<string | null>(null);

    const updateStatusMutation = useMutation({
        mutationFn: ({ orderId, status }: { orderId: string; status: string; restaurantId: string }) =>
            orderApi.updateStatus(orderId, status),
        onSuccess: (_, variables) => {
            toast({
                title: 'Status Updated',
                description: `Order updated to ${variables.status}`,
            });
            // Invalidate with restaurantId to refresh correct orders list
            queryClient.invalidateQueries({ queryKey: ['restaurantOrders', variables.restaurantId] });
        },
        onError: (error: Error) => {
            toast({
                title: 'Update Failed',
                description: error.message || 'Failed to update order status',
                variant: 'destructive',
            });
        },
        onSettled: () => {
            setUpdatingStatus(null);
        },
    });

    const handleStatusUpdate = (orderId: string, newStatus: string) => {
        setUpdatingStatus(newStatus);
        // Pass restaurantId for proper query invalidation
        updateStatusMutation.mutate({ orderId, status: newStatus, restaurantId: order.restaurantId });
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(price);
    };

    const shortenId = (id: string) => {
        return id.length > 8 ? `#${id.slice(0, 8).toUpperCase()}` : `#${id.toUpperCase()}`;
    };

    const statusConfig = STATUS_CONFIG[order.status] || { label: order.status, color: 'text-muted-foreground', bgColor: 'bg-muted' };
    const actions = getStatusActions(order.status);
    const isTerminal = order.status === 'COMPLETED' || order.status === 'REJECTED';

    return (
        <Card className={isTerminal ? 'opacity-75' : ''}>
            <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    {/* Order Header */}
                    <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-mono font-bold text-foreground">
                                {shortenId(order.id)}
                            </span>
                            <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}>
                                {statusConfig.label}
                            </Badge>
                            {order.status === 'READY' && (
                                <Badge variant="outline" className="text-[10px] text-purple-600 border-purple-200 bg-purple-50 animate-pulse">
                                    Waiting for Driver
                                </Badge>
                            )}
                        </div>

                        <p className="text-sm text-muted-foreground">
                            {format(new Date(order.createdAt), 'dd MMM yyyy, hh:mm a')}
                        </p>

                        {/* Customer Details */}
                        <div className="flex flex-wrap gap-4 text-sm pt-2">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>{order?.user?.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{order?.user?.phone}</span>
                            </div>
                        </div>
                    </div>

                    {/* Total & Actions */}
                    <div className="flex flex-col items-end gap-3">
                        <p className="text-xl font-bold text-primary">
                            {formatPrice(order.totalAmount)}
                        </p>

                        {/* Action Buttons */}
                        {actions.length > 0 && (
                            <div className="flex gap-2 flex-wrap justify-end">
                                {actions.map((actionItem) => (
                                    <Button
                                        key={actionItem.action}
                                        variant={actionItem.variant}
                                        size="sm"
                                        disabled={updatingStatus !== null}
                                        onClick={() => {
                                            if (actionItem.action === 'REJECTED') {
                                                setRejectOrderId(order.id);
                                            } else {
                                                handleStatusUpdate(order.id, actionItem.action);
                                            }
                                        }}
                                        className="min-w-[100px]"
                                    >
                                        {updatingStatus === actionItem.action ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                                Updating...
                                            </>
                                        ) : (
                                            actionItem.label
                                        )}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Items List */}
                <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Package className="h-4 w-4" />
                        <span>Order Items</span>
                    </div>
                    <div className="space-y-2">
                        {order?.orderItems.map((item, idx) => (
                            <div
                                key={idx}
                                className="flex justify-between items-center text-sm bg-muted/50 rounded-lg px-3 py-2"
                            >
                                <span className="font-medium">
                                    {item?.menuItem?.name || `Item ${item.menuItemId.slice(0, 6)}`}
                                </span>
                                <div className="flex items-center gap-4">
                                    <span className="text-muted-foreground">×{item.quantity}</span>
                                    {item.price && (
                                        <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Status Timeline Toggle - only show if valid history entries exist */}
                <div className="mt-4 pt-4 border-t border-border">
                    {/* Check for valid history entries before showing toggle */}
                    {order.statusHistory?.some((entry) => entry && entry.to && entry.createdAt) && (
                        <button
                            onClick={() => setShowTimeline(!showTimeline)}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <Clock className="h-4 w-4" />
                            <span>{showTimeline ? 'Hide' : 'Show'} Status History</span>
                        </button>
                    )}
                    {showTimeline && (
                        <div className="mt-3 pl-1">
                            <StatusTimeline history={order.statusHistory} />
                        </div>
                    )}
                </div>

                {/* Rejection Alert Dialog inside Card or outside... better outside but for simplicity inside works if controlled */}
                <AlertDialog open={!!rejectOrderId} onOpenChange={(open) => !open && setRejectOrderId(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                                <XCircle className="h-5 w-5" /> Reject Order?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="space-y-3">
                                <p>Are you sure you want to reject this order?</p>
                                <div className="bg-destructive/10 text-destructive p-3 rounded-md border border-destructive/20 text-sm font-medium flex gap-2 items-start">
                                    <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <span className="font-bold">Warning:</span> Rejecting a paid order will automatically initiate a <span className="underline">100% refund</span> to the customer. This action cannot be undone.
                                    </div>
                                </div>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => {
                                    if (rejectOrderId) {
                                        handleStatusUpdate(rejectOrderId, 'REJECTED');
                                        setRejectOrderId(null);
                                    }
                                }}
                            >
                                Yes, Reject & Refund
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    );
}
