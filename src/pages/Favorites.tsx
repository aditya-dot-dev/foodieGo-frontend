import { useQuery } from '@tanstack/react-query';
import { Heart, Search, RefreshCw, Utensils, Sparkles } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { RestaurantCard } from '@/components/RestaurantCard';
import { RestaurantCardSkeleton } from '@/components/Skeletons';
import { Button } from '@/components/ui/button';
import { favoriteApi } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

export default function Favorites() {
    const navigate = useNavigate();

    const {
        data: favorites,
        isLoading,
        error
    } = useQuery({
        queryKey: ['favorites'],
        queryFn: favoriteApi.getAll,
        staleTime: 0
    });

    // Loading State
    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                {/* Gradient Header */}
                <div className="relative h-32 md:h-40 bg-gradient-to-r from-orange-500 via-orange-600 to-red-500">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNC0yIDQtMiA0LTItMi0yLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl" />
                </div>

                <main className="container relative -mt-16 md:-mt-20 pb-12">
                    {/* Section Header Skeleton */}
                    <div className="bg-card rounded-2xl border border-border/50 shadow-xl overflow-hidden mb-6">
                        <div className="h-1.5 bg-gradient-to-r from-orange-500 to-red-500" />
                        <div className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-xl bg-muted animate-pulse" />
                                <div className="space-y-2">
                                    <div className="h-7 w-40 bg-muted rounded animate-pulse" />
                                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Restaurant Grid Skeleton */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <RestaurantCardSkeleton key={i} />
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
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/20 dark:to-red-500/20 flex items-center justify-center mx-auto">
                            <Heart className="h-8 w-8 text-orange-500" />
                        </div>
                        <h2 className="text-xl font-semibold">Oops! Something went wrong</h2>
                        <p className="text-muted-foreground">We couldn't load your favorites. Please try again.</p>
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
    if (favorites?.length === 0) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="relative h-32 md:h-40 bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 overflow-hidden">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNC0yIDQtMiA0LTItMi0yLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl" />
                </div>

                <main className="container relative -mt-16 md:-mt-20 pb-12">
                    {/* Section Header Card */}
                    <div className="bg-card rounded-2xl border border-border/50 shadow-xl overflow-hidden mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="h-1.5 bg-gradient-to-r from-orange-500 to-red-500" />
                        <div className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/20">
                                    <Heart className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-foreground">Your Favorites</h1>
                                    <p className="text-sm text-muted-foreground">Restaurants you love</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Empty State Card */}
                    <div className="bg-card rounded-2xl border border-border/50 shadow-lg p-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '100ms' }}>
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/20 dark:to-red-500/20 flex items-center justify-center mx-auto mb-6">
                            <Heart className="h-12 w-12 text-orange-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground mb-3">No Favorites Yet</h2>
                        <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
                            When you find a restaurant you love, tap the heart icon to save it here for quick access.
                        </p>
                        <Button
                            size="lg"
                            onClick={() => navigate('/')}
                            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all"
                        >
                            <Utensils className="mr-2 h-5 w-5" />
                            Start Exploring
                        </Button>
                    </div>
                </main>
            </div>
        );
    }

    // Main Favorites View
    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            {/* Gradient Header */}
            <div className="relative h-32 md:h-40 bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNC0yIDQtMiA0LTItMi0yLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

                {/* Decorative circles */}
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
                                    <Heart className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                                        Your Favorites
                                        <Sparkles className="h-5 w-5 text-orange-500" />
                                    </h1>
                                    <p className="text-sm text-muted-foreground">
                                        {favorites?.length} restaurant{favorites?.length !== 1 ? 's' : ''} saved
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={() => navigate('/')}
                                variant="outline"
                                className="hidden md:flex items-center gap-2 hover:border-orange-500/50 hover:bg-orange-500/5 hover:text-orange-600 transition-all"
                            >
                                <Search className="h-4 w-4" />
                                Discover More
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Restaurant Grid */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {favorites?.map((restaurant, index) => (
                        <div 
                            key={restaurant.id} 
                            className="animate-in fade-in slide-in-from-bottom-4"
                            style={{ animationDelay: `${index * 50}ms`, animationDuration: '500ms' }}
                        >
                            <RestaurantCard restaurant={restaurant} />
                        </div>
                    ))}
                </div>

                {/* Mobile Discover More Button */}
                <div className="mt-8 md:hidden animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '200ms' }}>
                    <Button
                        onClick={() => navigate('/')}
                        size="lg"
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg"
                    >
                        <Search className="mr-2 h-5 w-5" />
                        Discover More Restaurants
                    </Button>
                </div>
            </main>
        </div>
    );
}
