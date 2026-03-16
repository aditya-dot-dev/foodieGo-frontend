import { useState, useEffect } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2, Lock, CreditCard } from 'lucide-react';

interface StripePaymentFormProps {
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  amount: number;
}

export function StripePaymentForm({
  onSuccess,
  onError,
  amount,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!stripe || !elements) {
      return;
    }

    // Check if payment element is ready
    elements.getElement(PaymentElement)?.on('ready', () => {
      setIsReady(true);
    });
  }, [stripe, elements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/orders`,
        },
        redirect: 'if_required',
      });

      if (error) {
        // Payment failed
        setMessage(error.message || 'Payment failed. Please try again.');
        onError(error.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded
        onSuccess(paymentIntent.id);
      } else {
        // Payment requires additional action
        setMessage('Payment is being processed. Please wait...');
      }
    } catch (err: any) {
      setMessage('An unexpected error occurred. Please try again.');
      onError(err.message || 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price / 100);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Element */}
      <div className="rounded-xl border border-border/50 p-4 bg-card">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-500/20 dark:to-indigo-500/20">
            <CreditCard className="h-4 w-4 text-blue-600" />
          </div>
          <h3 className="font-semibold text-foreground">Payment Details</h3>
        </div>

        <PaymentElement
          id="payment-element"
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      {/* Error Message */}
      {message && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{message}</p>
        </div>
      )}

      {/* Amount Display */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-500/10 dark:to-red-500/10 border border-orange-200/50 dark:border-orange-500/20">
        <span className="font-semibold text-foreground">Total Amount</span>
        <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
          {formatPrice(amount)}
        </span>
      </div>

      {/* Pay Button */}
      <Button
        type="submit"
        disabled={isLoading || !stripe || !elements || !isReady}
        className="w-full h-14 text-base font-semibold rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 transition-all duration-300"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <Lock className="mr-2 h-5 w-5" />
            Pay {formatPrice(amount)}
          </>
        )}
      </Button>

      {/* Security Note */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" />
        <span>Secured by Stripe. Your payment information is encrypted.</span>
      </div>
    </form>
  );
}
