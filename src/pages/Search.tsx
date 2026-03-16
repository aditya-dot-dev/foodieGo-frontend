import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/Navbar';
import { RestaurantCard } from '@/components/RestaurantCard';
import { RestaurantCardSkeleton } from '@/components/Skeletons';
import { MenuItem } from '@/components/MenuItem';
import { restaurantApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Search as SearchIcon, 
    SearchX, 
    ShoppingCart, 
    Store, 
    Utensils,
    X,
    ChevronRight,
    Sparkles,
    Pizza,
    Beef,
    IceCream,
    Cake,
    Soup,
    Salad,
    Coffee
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

// Popular cuisines with icons
const popularCuisines = [
    { name: 'Biryani', icon: Soup },
    { name: 'Pizza', icon: Pizza },
    { name: 'Burger', icon: Beef },
    { name: 'Chinese', icon: Soup },
    { name: 'Ice Cream', icon: IceCream },
    { name: 'Cake', icon: Cake },
    { name: 'Healthy', icon: Salad },
    { name: 'Coffee', icon: Coffee },
];

export default function Search() {
    const [searchParams] = useSearchParams();
    const initialQuery = searchParams.get('q') || '';
    const [query, setQuery] = useState(initialQuery);
    const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
    const [activeTab, setActiveTab] = useState('restaurants');

    // Cart logic
    const navigate = useNavigate();
    const { toast } = useToast();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [currentRestaurant, setCurrentRestaurant] = useState<{ id: string; name: string } | null>(null);
    const [justAdded, setJustAdded] = useState<string | null>(null);

    const addToCart = (item: any) => {
        if (!item.restaurant) return;

        // Conflict Check
        if (currentRestaurant && currentRestaurant.id !== item.restaurant.id) {
            toast({
                title: "Different Restaurant",
                description: `Your cart contains items from ${currentRestaurant.name}. Clear cart to add items from ${item.restaurant.name}.`,
                variant: "destructive",
                action: (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setCart([]);
                            setCurrentRestaurant(null);
                            toast({ description: "Cart cleared" });
                        }}
                    >
                        Clear
                    </Button>
                )
            });
            return;
        }

        // Add
        if (!currentRestaurant) {
            setCurrentRestaurant({ id: item.restaurant.id, name: item.restaurant.name });
        }

        setCart(prev => {
            const existing = prev.find(p => p.id === item.id);
            if (existing) {
                return prev.map(p => p.id === item.id ? { ...p, quantity: p.quantity + 1 } : p);
            }
            return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
        });

        setJustAdded(item.id);
        setTimeout(() => setJustAdded(null), 600);
    };

    const handleCheckout = () => {
        if (!currentRestaurant) return;
        navigate('/checkout', {
            state: {
                cart,
                restaurantId: currentRestaurant.id,
                restaurantName: currentRestaurant.name,
            }
        });
    };

    const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(price);

    // Debounce logic
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 500);
        return () => clearTimeout(timer);
    }, [query]);

    // Search Restaurants
    const {
        data: restaurants = [],
        isLoading: loadingRestaurants
    } = useQuery({
        queryKey: ['search', 'restaurants', debouncedQuery],
        queryFn: async () => {
            if (!debouncedQuery) return [];
            const all = await restaurantApi.getAll();
            return all.filter(r =>
                r.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
                r.cuisine.toLowerCase().includes(debouncedQuery.toLowerCase())
            );
        },
        enabled: !!debouncedQuery
    });

    // Search Dishes
    const {
        data: dishes = [],
        isLoading: loadingDishes
    } = useQuery({
        queryKey: ['search', 'dishes', debouncedQuery],
        queryFn: () => restaurantApi.searchItems(debouncedQuery),
        enabled: !!debouncedQuery
    });

    const isLoading = loadingRestaurants || loadingDishes;
    const hasResults = restaurants.length > 0 || dishes.length > 0;

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

            <main className="container relative -mt-16 md:-mt-20 pb-24 max-w-5xl">
                {/* Section Header Card with Search */}
                <div className="bg-card rounded-2xl border border-border/50 shadow-xl overflow-hidden mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="h-1.5 bg-gradient-to-r from-orange-500 to-red-500" />
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/20 shrink-0">
                                    <SearchIcon className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-foreground">Search</h1>
                                    <p className="text-sm text-muted-foreground">Find restaurants and dishes</p>
                                </div>
                            </div>
                            
                            {/* Enhanced Search Input */}
                            <div className="flex-1 md:ml-4">
                                <div className="relative">
                                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Search for restaurants, cuisines, or dishes..."
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        autoFocus
                                        className="w-full h-12 pl-12 pr-12 rounded-xl border border-border/50 bg-muted/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50 transition-all"
                                    />
                                    {query && (
                                        <button
                                            onClick={() => setQuery('')}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors cursor-pointer"
                                        >
                                            <X className="h-4 w-4 text-muted-foreground" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {!debouncedQuery ? (
                    /* Popular Cuisines Section */
                    <div className="bg-card rounded-2xl border border-border/50 shadow-lg p-6 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '100ms' }}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/20 dark:to-red-500/20">
                                <Sparkles className="h-5 w-5 text-orange-500" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-foreground">Popular Cuisines</h2>
                                <p className="text-sm text-muted-foreground">Quick search suggestions</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {popularCuisines.map((cuisine, index) => (
                                <button
                                    key={cuisine.name}
                                    onClick={() => setQuery(cuisine.name)}
                                    className="group flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-gradient-to-r from-muted/30 to-transparent hover:from-orange-50 hover:to-red-50 dark:hover:from-orange-500/10 dark:hover:to-red-500/10 hover:border-orange-500/30 hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 cursor-pointer"
                                    style={{ animationDelay: `${150 + index * 50}ms` }}
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-md group-hover:scale-110 transition-transform">
                                        <cuisine.icon className="h-5 w-5 text-white" />
                                    </div>
                                    <span className="font-medium text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                        {cuisine.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Search Results */
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '100ms' }}>
                        <Tabs defaultValue="restaurants" value={activeTab} onValueChange={setActiveTab} className="w-full">
                            {/* Modern Tabs */}
                            <div className="bg-card rounded-2xl border border-border/50 shadow-lg p-2 mb-6">
                                <TabsList className="grid w-full grid-cols-2 bg-muted/50 rounded-xl p-1">
                                    <TabsTrigger 
                                        value="restaurants"
                                        className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
                                    >
                                        <Store className="h-4 w-4 mr-2" />
                                        Restaurants ({restaurants.length})
                                    </TabsTrigger>
                                    <TabsTrigger 
                                        value="dishes"
                                        className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
                                    >
                                        <Utensils className="h-4 w-4 mr-2" />
                                        Dishes ({dishes.length})
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            {isLoading ? (
                                /* Loading Skeletons */
                                <div className="space-y-6">
                                    {activeTab === 'restaurants' ? (
                                        <div className="grid gap-6 sm:grid-cols-2">
                                            {Array.from({ length: 4 }).map((_, i) => (
                                                <RestaurantCardSkeleton key={i} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            {Array.from({ length: 4 }).map((_, i) => (
                                                <div key={i} className="bg-card rounded-2xl border border-border/50 p-4">
                                                    <Skeleton className="h-4 w-24 mb-3" />
                                                    <Skeleton className="h-5 w-3/4 mb-2" />
                                                    <Skeleton className="h-4 w-full mb-2" />
                                                    <div className="flex justify-between items-center mt-4">
                                                        <Skeleton className="h-6 w-16" />
                                                        <Skeleton className="h-9 w-20 rounded-lg" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : !hasResults ? (
                                /* No Results State */
                                <div className="bg-card rounded-2xl border border-border/50 shadow-lg p-12 text-center">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/20 dark:to-red-500/20 flex items-center justify-center mx-auto mb-6">
                                        <SearchX className="h-10 w-10 text-orange-500" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-foreground mb-2">No results found</h3>
                                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                                        We couldn't find anything matching "{debouncedQuery}". Try a different search term.
                                    </p>
                                    <Button
                                        onClick={() => setQuery('')}
                                        variant="outline"
                                        className="hover:border-orange-500/50 hover:bg-orange-500/5"
                                    >
                                        Clear Search
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <TabsContent value="restaurants" className="space-y-6 mt-0">
                                        {restaurants.length === 0 ? (
                                            <div className="bg-card rounded-2xl border border-border/50 shadow-lg p-8 text-center">
                                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/20 dark:to-red-500/20 flex items-center justify-center mx-auto mb-4">
                                                    <Store className="h-8 w-8 text-orange-500" />
                                                </div>
                                                <h3 className="text-lg font-bold text-foreground mb-2">No restaurants found</h3>
                                                <p className="text-muted-foreground">Try searching for dishes instead.</p>
                                            </div>
                                        ) : (
                                            <div className="grid gap-6 sm:grid-cols-2">
                                                {restaurants.map((restaurant, index) => (
                                                    <div
                                                        key={restaurant.id}
                                                        className="animate-in fade-in slide-in-from-bottom-4"
                                                        style={{ animationDelay: `${index * 50}ms`, animationDuration: '500ms' }}
                                                    >
                                                        <RestaurantCard restaurant={restaurant} />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="dishes" className="space-y-4 mt-0">
                                        {dishes.length === 0 ? (
                                            <div className="bg-card rounded-2xl border border-border/50 shadow-lg p-8 text-center">
                                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/20 dark:to-red-500/20 flex items-center justify-center mx-auto mb-4">
                                                    <Utensils className="h-8 w-8 text-orange-500" />
                                                </div>
                                                <h3 className="text-lg font-bold text-foreground mb-2">No dishes found</h3>
                                                <p className="text-muted-foreground">Try a different search term.</p>
                                            </div>
                                        ) : (
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                {dishes.map((item, index) => (
                                                    <div 
                                                        key={item.id} 
                                                        className="bg-card rounded-2xl border border-border/50 shadow-md hover:shadow-lg hover:border-orange-500/30 transition-all duration-300 overflow-hidden animate-in fade-in slide-in-from-bottom-4"
                                                        style={{ animationDelay: `${index * 50}ms`, animationDuration: '500ms' }}
                                                    >
                                                        <div className="h-1 bg-gradient-to-r from-orange-500 to-red-500" />
                                                        <div className="p-4">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/20 dark:to-red-500/20">
                                                                    <Store className="h-3 w-3 text-orange-500" />
                                                                </div>
                                                                <span className="text-sm font-medium text-muted-foreground truncate">
                                                                    {item.restaurant?.name}
                                                                </span>
                                                            </div>
                                                            <MenuItem
                                                                item={item}
                                                                onAddToCart={() => addToCart(item)}
                                                                isJustAdded={justAdded === item.id}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </TabsContent>
                                </>
                            )}
                        </Tabs>
                    </div>
                )}
            </main>

            {/* Floating Cart Footer */}
            {cart.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 shadow-2xl shadow-orange-500/30">
                        <div className="container max-w-5xl flex justify-between items-center py-4 px-6">
                            <div className="text-white">
                                <p className="font-bold text-lg">
                                    {cartCount} item{cartCount > 1 ? 's' : ''} | {formatPrice(cartTotal)}
                                </p>
                                <p className="text-sm text-white/80">
                                    From {currentRestaurant?.name}
                                </p>
                            </div>
                            <Button 
                                onClick={handleCheckout} 
                                className="bg-white text-orange-600 hover:bg-white/90 font-semibold shadow-lg gap-2"
                            >
                                View Cart
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
