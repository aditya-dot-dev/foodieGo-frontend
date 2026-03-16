import { useState } from 'react';
import { ShoppingBag, Store, Ban } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
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

interface AdminOrdersTabProps {
    orders: any[];
    loadingOrders: boolean;
    onCancelOrder: (orderId: string) => void;
    formatPrice: (price: number) => string;
}

export function AdminOrdersTab({
    orders,
    loadingOrders,
    onCancelOrder,
    formatPrice
}: AdminOrdersTabProps) {
    const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);

    return (
        <Card className="border-zinc-200 overflow-hidden rounded-2xl shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-zinc-50 border-b border-zinc-200">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase">Order ID</th>
                            <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase">Entity Pair</th>
                            <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase">Total</th>
                            <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {loadingOrders ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}>
                                    <td colSpan={5} className="p-4">
                                        <Skeleton className="h-10 w-full" />
                                    </td>
                                </tr>
                            ))
                        ) : orders.map((order: any) => (
                            <tr key={order.id} className="hover:bg-zinc-50/30 transition-colors">
                                <td className="px-6 py-4 font-mono text-[11px] text-zinc-400">
                                    #{order.id.split('-')[0]}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-zinc-900">{order.user.name}</span>
                                        <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                                            <Store className="h-2.5 w-2.5" /> {order.restaurant.name}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-black text-sm">{formatPrice(order.totalAmount)}</td>
                                <td className="px-6 py-4">
                                    <Badge
                                        variant={order.status === 'COMPLETED' ? 'success' : order.status === 'CANCELLED' ? 'destructive' : 'secondary'}
                                        className="text-[9px] font-black px-2 h-5"
                                    >
                                        {order.status}
                                    </Badge>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {['PLACED', 'ACCEPTED', 'PREPARING', 'READY'].includes(order.status) && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setCancelOrderId(order.id)}
                                            className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 rounded-full"
                                        >
                                            <Ban className="h-4 w-4" />
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <AlertDialog open={!!cancelOrderId} onOpenChange={(open) => !open && setCancelOrderId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <Ban className="h-5 w-5" /> Cancel Order?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3">
                            <p>Are you sure you want to cancel this order?</p>
                            <div className="bg-destructive/10 text-destructive p-3 rounded-md border border-destructive/20 text-sm font-medium flex gap-2 items-start">
                                <Ban className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <div>
                                    <span className="font-bold">Warning:</span> Cancelling a paid order will automatically initiate a <span className="underline">100% refund</span> to the customer. This action cannot be undone.
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>No, Keep Order</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                if (cancelOrderId) {
                                    onCancelOrder(cancelOrderId);
                                    setCancelOrderId(null);
                                }
                            }}
                        >
                            Yes, Cancel & Refund
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
