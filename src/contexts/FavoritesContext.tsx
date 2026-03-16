import React, { createContext, useContext, useState, useEffect } from 'react';
import { favoriteApi, authApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface FavoritesContextType {
    favorites: string[];
    toggleFavorite: (restaurantId: string) => Promise<void>;
    isFavorited: (restaurantId: string) => boolean;
    loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
    const [favorites, setFavorites] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const isAuthenticated = authApi.isAuthenticated();

    const fetchFavorites = async () => {
        if (!isAuthenticated) {
            setFavorites([]);
            return;
        }
        setLoading(true);
        try {
            const ids = await favoriteApi.getIds();
            setFavorites(ids);
        } catch (error) {
            console.error('Failed to fetch favorites:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFavorites();
    }, [isAuthenticated]);

    const toggleFavorite = async (restaurantId: string) => {
        if (!isAuthenticated) {
            toast({
                title: 'Authentication Required',
                description: 'Please login to add favorites',
                variant: 'destructive',
            });
            return;
        }

        try {
            const res = await favoriteApi.toggle(restaurantId);
            if (res.favorited) {
                setFavorites(prev => [...prev, restaurantId]);
                toast({
                    title: 'Added to favorites',
                    description: res.message,
                });
            } else {
                setFavorites(prev => prev.filter(id => id !== restaurantId));
                toast({
                    title: 'Removed from favorites',
                    description: res.message,
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update favorites',
                variant: 'destructive',
            });
        }
    };

    const isFavorited = (restaurantId: string) => {
        return favorites.includes(restaurantId);
    };

    return (
        <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorited, loading }}>
            {children}
        </FavoritesContext.Provider>
    );
}

export function useFavorites() {
    const context = useContext(FavoritesContext);
    if (context === undefined) {
        throw new Error('useFavorites must be used within a FavoritesProvider');
    }
    return context;
}
