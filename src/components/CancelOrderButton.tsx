import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { orderApi } from '@/lib/api';
import { XCircle, Loader2, AlertTriangle, DollarSign, Clock } from 'lucide-react';

interface CancelOrderButtonProps {
  orderId: string;
  orderStatus: string;
  orderAmount: number;
  createdAt: string;
  paymentStatus?: string;
  variant?: 'default' | 'outline' | 'destructive' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  onCancelSuccess?: () => void;
}

export function CancelOrderButton({
  orderId,
  orderStatus,
  orderAmount,
  createdAt,
  paymentStatus,
  variant = 'destructive',
  size = 'default',
  className = '',
  onCancelSuccess,
}: CancelOrderButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [cancellationReason, setCancellationReason] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Check if order can be cancelled
  const canCancel = () => {
    // Must be PLACED or ACCEPTED
    if (!['PLACED', 'ACCEPTED'].includes(orderStatus)) {
      return false;
    }

    // Must be paid
    if (paymentStatus !== 'SUCCEEDED') {
      return false;
    }

    // Must be within 5 minutes
    const minutesSinceOrder = Math.floor(
      (new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60)
    );

    return minutesSinceOrder <= 5;
  };

  // Calculate refund amount and percentage
  const getRefundInfo = () => {
    const minutesSinceOrder = Math.floor(
      (new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60)
    );

    if (minutesSinceOrder <= 2) {
      return { percentage: 100, amount: orderAmount };
    } else if (minutesSinceOrder <= 5) {
      return { percentage: 90, amount: orderAmount * 0.9 };
    }

    return { percentage: 0, amount: 0 };
  };

  const cancelMutation = useMutation({
    mutationFn: () => orderApi.cancel(orderId, cancellationReason || undefined),
    onSuccess: (data) => {
      toast({
        title: 'Order Cancelled Successfully',
        description: `Refund of ${formatPrice(data.refundAmount)} (${data.refundPercentage}%) will be processed within 5-10 business days.`,
      });

      // Invalidate queries to refresh order list
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });

      setIsDialogOpen(false);
      setCancellationReason('');

      if (onCancelSuccess) {
        onCancelSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Cancellation Failed',
        description: error.message || 'Failed to cancel order. Please try again.',
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

  const handleCancel = () => {
    cancelMutation.mutate();
  };

  // Don't show button if order cannot be cancelled
  if (!canCancel()) {
    return null;
  }

  const refundInfo = getRefundInfo();

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <XCircle className="h-4 w-4 mr-2" />
          Cancel Order
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-500/20 dark:to-orange-500/20">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <AlertDialogTitle className="text-xl">Cancel Order?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-4 pt-2">
            <p className="text-foreground">
              Are you sure you want to cancel this order?
            </p>

            {/* Refund Information */}
            <div className="rounded-xl border border-border/50 bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Refund Amount</span>
                <span className="text-lg font-bold text-green-600 flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {formatPrice(refundInfo.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Refund Percentage</span>
                <span className="font-semibold text-foreground">{refundInfo.percentage}%</span>
              </div>
            </div>

            {/* Cancellation Policy */}
            <div className="rounded-xl border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 p-3">
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                  <p className="font-semibold">Cancellation Policy:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-blue-600 dark:text-blue-300">
                    <li>100% refund within 2 minutes</li>
                    <li>90% refund within 5 minutes</li>
                    <li>Refund processed in 5-10 business days</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Reason Input */}
            <div className="space-y-2">
              <Label htmlFor="cancellation-reason" className="text-sm font-medium">
                Reason for cancellation (optional)
              </Label>
              <Textarea
                id="cancellation-reason"
                placeholder="Let us know why you're cancelling..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="resize-none h-20"
                disabled={cancelMutation.isPending}
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={cancelMutation.isPending}>
            Keep Order
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleCancel();
            }}
            disabled={cancelMutation.isPending}
            className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
          >
            {cancelMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cancelling...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Yes, Cancel Order
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
