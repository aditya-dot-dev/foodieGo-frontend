import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { couponApi, type Coupon } from '@/lib/api';
import { TicketPercent, Copy, Check, Clock, Sparkles, RefreshCw, Gift } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function Offers() {
    const { toast } = useToast();
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const { data: coupons, isLoading, error, refetch } = useQuery({
        queryKey: ['coupons'],
        queryFn: () => couponApi.getAll(),
    });

    const handleCopy = (code: string, id: string) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        toast({
            title: 'Copied!',
            description: `Coupon code ${code} copied to clipboard`,
        });
        setTimeout(() => setCopiedId(null), 2000);
    };

    const formatDiscount = (coupon: Coupon) => {
        if (coupon.discountType === 'FLAT') {
            return `₹${coupon.discountAmount} OFF`;
        }
        return `${coupon.discountAmount}% OFF`;
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            {/* Gradient Header */}
            <div className="relative h-32 md:h-40 bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNC0yIDQtMiA0LTItMi0yLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl" />
            </div>

            <main className="container relative -mt-16 md:-mt-20 pb-12">
                {/* Section Header Card */}
                <div className="bg-card rounded-2xl border border-border/50 shadow-xl overflow-hidden mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="h-1.5 bg-gradient-to-r from-orange-500 to-red-500" />
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/20">
                                    <TicketPercent className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                                        Best Offers for You
                                        <Sparkles className="h-5 w-5 text-orange-500" />
                                    </h1>
                                    <p className="text-sm text-muted-foreground">Save more on your favorite food with exclusive deals</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="bg-card rounded-2xl border border-border/50 overflow-hidden">
                                <div className="h-1 bg-gradient-to-r from-orange-500 to-red-500" />
                                <div className="p-5 space-y-4">
                                    <div className="flex justify-between">
                                        <Skeleton className="h-8 w-24" />
                                        <Skeleton className="h-10 w-10 rounded-xl" />
                                    </div>
                                    <Skeleton className="h-6 w-32" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-2/3" />
                                    <Skeleton className="h-10 w-full rounded-xl" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-card rounded-2xl border border-border/50 shadow-lg p-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/20 dark:to-red-500/20 flex items-center justify-center mx-auto mb-6">
                            <TicketPercent className="h-10 w-10 text-orange-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">Failed to load offers</h2>
                        <p className="text-muted-foreground mb-6">Please try again later</p>
                        <Button 
                            onClick={() => refetch()}
                            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Try Again
                        </Button>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && coupons && coupons.length === 0 && (
                    <div className="bg-card rounded-2xl border border-border/50 shadow-lg p-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/20 dark:to-red-500/20 flex items-center justify-center mx-auto mb-6">
                            <Gift className="h-12 w-12 text-orange-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground mb-3">No Active Offers</h2>
                        <p className="text-muted-foreground mb-2 max-w-md mx-auto">
                            Check back later for exciting deals and discounts!
                        </p>
                    </div>
                )}

                {/* Offers Grid */}
                {!isLoading && coupons && coupons.length > 0 && (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {coupons.map((coupon, index) => (
                            <div 
                                key={coupon.id} 
                                className="group bg-card rounded-2xl border border-border/50 shadow-lg overflow-hidden hover:shadow-xl hover:border-orange-500/30 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
                                style={{ animationDelay: `${index * 50}ms`, animationDuration: '500ms' }}
                            >
                                <div className="h-1 bg-gradient-to-r from-orange-500 to-red-500 group-hover:h-1.5 transition-all" />
                                <div className="p-5 relative">
                                    {/* Background decoration */}
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <TicketPercent className="h-28 w-28 -rotate-12" />
                                    </div>

                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-4 relative">
                                        <div>
                                            <p className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                                                {formatDiscount(coupon)}
                                            </p>
                                            <p className="text-lg font-bold text-foreground mt-1 font-mono tracking-wide">
                                                {coupon.code}
                                            </p>
                                        </div>
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/20 shrink-0">
                                            <TicketPercent className="h-6 w-6 text-white" />
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                        {coupon.description || 'Save on your order with this exclusive deal'}
                                    </p>

                                    {/* Terms */}
                                    <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                                        {coupon.minOrderValue > 0 && (
                                            <p className="flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                                Min Order: ₹{coupon.minOrderValue}
                                            </p>
                                        )}
                                        {coupon.maxDiscount && (
                                            <p className="flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                                Max Discount: ₹{coupon.maxDiscount}
                                            </p>
                                        )}
                                        <p className="flex items-center gap-1.5 text-amber-600">
                                            <Clock className="h-3.5 w-3.5" />
                                            Expires {format(new Date(coupon.expiresAt), 'MMM dd, yyyy')}
                                        </p>
                                    </div>

                                    {/* Copy Button */}
                                    <Button
                                        className={`w-full rounded-xl gap-2 transition-all ${
                                            copiedId === coupon.id 
                                                ? 'bg-orange-600 hover:bg-orange-600' 
                                                : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg shadow-orange-500/20'
                                        }`}
                                        onClick={() => handleCopy(coupon.code, coupon.id)}
                                    >
                                        {copiedId === coupon.id ? (
                                            <>
                                                <Check className="h-4 w-4" />
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="h-4 w-4" />
                                                Copy Code
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
