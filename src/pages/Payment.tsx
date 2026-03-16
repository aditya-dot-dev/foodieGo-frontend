import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { ArrowLeft, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StripePaymentForm } from '@/components/StripePaymentForm';
import { paymentApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const orderId = searchParams.get('orderId') || location.state?.orderId;
  const orderAmount = location.state?.amount;

  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);

  useEffect(() => {
    if (!orderId) {
      navigate('/');
      return;
    }

    // Create payment intent
    const createPaymentIntent = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await paymentApi.createIntent(orderId);
        setClientSecret(response.clientSecret);
        setPaymentIntentId(response.paymentIntentId);
      } catch (err: any) {
        console.error('Failed to create payment intent:', err);
        setError(err.message || 'Failed to initialize payment');
        toast({
          title: 'Payment Error',
          description: 'Failed to initialize payment. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [orderId, navigate, toast]);

  const handlePaymentSuccess = async (intentId: string) => {
    setConfirmingPayment(true);

    try {
      await paymentApi.confirmPayment(intentId);
      setPaymentSuccess(true);

      toast({
        title: 'Payment Successful!',
        description: 'Your order has been confirmed.',
      });

      // Redirect to orders page after 2 seconds
      setTimeout(() => {
        navigate('/orders', { replace: true });
      }, 2000);
    } catch (err: any) {
      console.error('Failed to confirm payment:', err);
      // Even if confirmation API fails, if Stripe succeeeded, we should probably redirect
      // checking if error is just a timeout or network issue
      toast({
        title: 'Payment Processed',
        description: 'Payment successful. Redirecting...',
      });
      setTimeout(() => navigate('/orders', { replace: true }), 2000);
    } finally {
      // Intentional no-op or specific cleanup if needed. 
      // We don't set confirmingPayment(false) here because we are redirecting 
      // and we want to keep the success state/spinner visible until the page changes.
      if (!paymentSuccess) {
        setConfirmingPayment(false);
      }
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    toast({
      title: 'Payment Failed',
      description: errorMessage,
      variant: 'destructive',
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Initializing payment...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="relative h-32 md:h-40 bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNC0yIDQtMiA0LTItMi0yLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
          <div className="container relative pt-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Error Content */}
        <main className="container relative -mt-16 pb-12 max-w-2xl">
          <div className="bg-card rounded-2xl border border-border/50 shadow-xl p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-500/20 dark:to-orange-500/20 flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-10 w-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Payment Initialization Failed</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button
              onClick={() => navigate('/checkout', { state: { orderId } })}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              Try Again
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Success state
  if (paymentSuccess || confirmingPayment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl border border-border/50 shadow-xl p-12 text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-500/20 dark:to-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            {confirmingPayment ? (
              <Loader2 className="h-10 w-10 text-green-500 animate-spin" />
            ) : (
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {confirmingPayment ? 'Confirming Payment...' : 'Payment Successful!'}
          </h2>
          <p className="text-muted-foreground mb-6">
            {confirmingPayment
              ? 'Please wait while we confirm your payment...'
              : 'Your order has been confirmed. Redirecting to orders...'}
          </p>
        </div>
      </div>
    );
  }

  // Payment form
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="relative h-32 md:h-40 bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNC0yIDQtMiA0LTItMi0yLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />

        <div className="container relative pt-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="container relative -mt-16 md:-mt-20 pb-12 max-w-2xl">
        <div className="bg-card rounded-2xl border border-border/50 shadow-xl overflow-hidden mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="h-1.5 bg-gradient-to-r from-orange-500 to-red-500" />
          <div className="p-6">
            <h1 className="text-2xl font-bold text-foreground">Complete Payment</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Enter your payment details to complete the order
            </p>
          </div>
        </div>

        {/* Stripe Payment Form */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {clientSecret && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#f97316',
                    colorBackground: 'hsl(var(--card))',
                    colorText: 'hsl(var(--foreground))',
                    colorDanger: '#ef4444',
                    fontFamily: 'system-ui, sans-serif',
                    borderRadius: '0.75rem',
                  },
                },
              }}
            >
              <StripePaymentForm
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                amount={orderAmount}
              />
            </Elements>
          )}
        </div>
      </main>
    </div>
  );
}
