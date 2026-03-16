import { useState, useMemo, useEffect } from 'react';
import { Search, SlidersHorizontal, X, Star, Clock, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Restaurant } from '@/types';

interface FilterBarProps {
  restaurants: Restaurant[];
  onFilteredChange: (filtered: Restaurant[]) => void;
  resultCount?: number;
}

type SortOption = 'none' | 'rating-desc' | 'delivery-asc';

export function FilterBar({ restaurants, onFilteredChange }: FilterBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<SortOption>('none');

  // Get unique cuisines
  const cuisines = useMemo(() => {
    const unique = [...new Set(restaurants.map(r => r.cuisine))];
    return unique.sort();
  }, [restaurants]);

  // Apply filters and sorting
  const filteredRestaurants = useMemo(() => {
    let filtered = [...restaurants];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(query) ||
        r.cuisine.toLowerCase().includes(query) ||
        (r.description && r.description.toLowerCase().includes(query))
      );
    }

    if (selectedCuisines.length > 0) {
      filtered = filtered.filter(r => selectedCuisines.includes(r.cuisine));
    }

    if (minRating > 0) {
      filtered = filtered.filter(r => (r.averageRating || r.rating) >= minRating);
    }

    if (sortBy === 'rating-desc') {
      filtered.sort((a, b) => (b.averageRating || b.rating) - (a.averageRating || a.rating));
    } else if (sortBy === 'delivery-asc') {
      filtered.sort((a, b) => {
        const parseDelivery = (time?: string | null) =>
          time ? parseInt(time.split('-')[0]) || Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
        return parseDelivery(a.deliveryTime) - parseDelivery(b.deliveryTime);
      });
    }

    return filtered;
  }, [restaurants, searchQuery, selectedCuisines, minRating, sortBy]);

  useEffect(() => {
    onFilteredChange(filteredRestaurants);
  }, [filteredRestaurants, onFilteredChange]);


  const toggleCuisine = (cuisine: string) => {
    setSelectedCuisines(prev =>
      prev.includes(cuisine)
        ? prev.filter(c => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCuisines([]);
    setMinRating(0);
    setSortBy('none');
  };

  const hasActiveFilters = searchQuery || selectedCuisines.length > 0 || minRating > 0 || sortBy !== 'none';

  return (
    <div className="sticky top-0 z-20 py-4">
      {/* Glassmorphism Background - pointer-events-none ensures it doesn't block clicks */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md rounded-2xl border shadow-sm pointer-events-none" />

      {/* Content Container - z-10 ensures it's above the background */}
      <div className="relative z-10 flex flex-col md:flex-row gap-4 p-4 items-stretch md:items-center">

        {/* Search Input - Full width on mobile, flexible on desktop */}
        <div className="relative w-full md:flex-1 md:min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search restaurants and cuisines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-11 pr-10 rounded-full border border-border/40 bg-card shadow-sm 
                       hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50 
                       transition-all duration-300 text-foreground placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Buttons Container - Horizontal scroll on mobile */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0 scrollbar-hide w-full md:w-auto no-scrollbar mask-gradient-right">

          {/* Cuisine Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className={`gap-2 h-12 rounded-full border-border/50 px-5 whitespace-nowrap transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-primary ${selectedCuisines.length > 0 ? 'bg-primary/10 border-primary/20 text-primary shadow-sm' : 'bg-card shadow-sm'}`}
              >
                <SlidersHorizontal className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap">Cuisine</span>
                {selectedCuisines.length > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                    {selectedCuisines.length}
                  </span>
                )}
                <ChevronDown className="h-3 w-3 opacity-50 ml-1 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {cuisines.map(cuisine => (
                <DropdownMenuCheckboxItem
                  key={cuisine}
                  checked={selectedCuisines.includes(cuisine)}
                  onCheckedChange={() => toggleCuisine(cuisine)}
                >
                  {cuisine}
                </DropdownMenuCheckboxItem>
              ))}
              {selectedCuisines.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSelectedCuisines([])}>
                    Clear selection
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Rating Filter */}
          <Select value={minRating.toString()} onValueChange={(v) => setMinRating(Number(v))}>
            <SelectTrigger className={`w-auto min-w-[140px] h-12 rounded-full border-border/50 px-4 whitespace-nowrap transition-all hover:border-primary/50 hover:bg-primary/5 ${minRating > 0 ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 shadow-sm' : 'bg-card shadow-sm'}`}>
              <div className="flex items-center gap-2">
                <Star className={`h-4 w-4 shrink-0 ${minRating > 0 ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground'}`} />
                <SelectValue placeholder="Rating" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Any rating</SelectItem>
              <SelectItem value="3">3+ stars</SelectItem>
              <SelectItem value="3.5">3.5+ stars</SelectItem>
              <SelectItem value="4">4+ stars</SelectItem>
              <SelectItem value="4.5">4.5+ stars</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className={`w-auto min-w-[140px] h-12 rounded-full border-border/50 px-4 whitespace-nowrap transition-all hover:border-primary/50 hover:bg-primary/5 ${sortBy !== 'none' ? 'bg-primary/10 border-primary/20 text-primary shadow-sm' : 'bg-card shadow-sm'}`}>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Default</SelectItem>
              <SelectItem value="rating-desc">
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <Star className="h-3.5 w-3.5" /> Rating (high → low)
                </span>
              </SelectItem>
              <SelectItem value="delivery-asc">
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <Clock className="h-3.5 w-3.5" /> Delivery (fast → slow)
                </span>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-1 text-muted-foreground h-12 px-4 rounded-full whitespace-nowrap hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Tags */}
      {selectedCuisines.length > 0 && (
        <div className="relative z-10 flex flex-wrap gap-2 mt-4 px-4">
          {selectedCuisines.map(cuisine => (
            <Badge
              key={cuisine}
              variant="secondary"
              className="gap-1.5 py-1.5 pl-3 pr-2 rounded-full border border-primary/10 bg-primary/5 text-primary hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all cursor-pointer group"
              onClick={() => toggleCuisine(cuisine)}
            >
              {cuisine}
              <div className="h-4 w-4 rounded-full bg-background flex items-center justify-center group-hover:bg-destructive/20">
                <X className="h-2.5 w-2.5" />
              </div>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
