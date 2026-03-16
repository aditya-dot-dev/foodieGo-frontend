import { Link } from 'react-router-dom';
import { Star, Clock, MapPin, Users, Heart } from 'lucide-react';
import type { Restaurant } from '@/types';
import { isRestaurantOpenNow } from '@/utils/restaurantTime';
import { useFavorites } from '@/contexts/FavoritesContext';
import { Button } from '@/components/ui/button';

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const displayRating = restaurant.averageRating ?? restaurant.rating;
  const hasReviews = (restaurant.totalReviews ?? 0) > 0;
  const isOpenNow =
    restaurant.isOpen &&
    isRestaurantOpenNow(restaurant.openingTime, restaurant.closingTime);

  const { isFavorited, toggleFavorite } = useFavorites();
  const favorited = isFavorited(restaurant.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(restaurant.id);
  };

  return (
    <Link
      to={isOpenNow ? `/restaurants/${restaurant.id}` : '#'}
      onClick={(e) => {
        if (!isOpenNow) e.preventDefault();
      }}

      className={`group h-full w-full block transition-all duration-500 ease-out hover:-translate-y-2 hover:scale-[1.02]
  ${isOpenNow ? '' : 'grayscale opacity-90'}
`}
    >
      <article className="relative h-full overflow-hidden rounded-[1.5rem] bg-card border-0 shadow-sm transition-all duration-300 group-hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] group-hover:shadow-primary/10">
        {/* Image Container */}
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={restaurant.imageUrl}
            alt={restaurant.name}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            loading="lazy"
          />

          {/* Gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Status Badge */}
          <div className="absolute right-2 sm:right-3 top-2 sm:top-3">
            <span
              className={`inline-flex items-center gap-1 sm:gap-1.5 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold backdrop-blur-md border border-white/10 shadow-sm ${isOpenNow
                ? 'bg-black/60 text-white'
                : 'bg-black/60 text-white/70'}
`}
            >
              <span
                className={`h-1.5 sm:h-2 w-1.5 sm:w-2 rounded-full ${isOpenNow ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
                  }`}
              />
              {isOpenNow
                ? 'Open'
                : restaurant.openingTime
                  ? `Opens ${restaurant.openingTime}`
                  : 'Closed'}

            </span>
          </div>

          {/* Favorite Button */}
          <div className="absolute left-2 sm:left-3 top-2 sm:top-3">
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card shadow-sm transition-all duration-300 ${favorited ? 'text-red-500' : 'text-foreground/70 hover:text-red-500'}`}
              onClick={handleFavoriteClick}
            >
              <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${favorited ? 'fill-current' : ''}`} />
            </Button>
          </div>

          {/* Delivery Time Badge */}
          <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3">
            <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-lg bg-card/95 px-2 sm:px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-foreground backdrop-blur-md shadow-sm">
              <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
              {restaurant.deliveryTime}
            </span>
          </div>

          {/* Price Range Badge */}
          <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3">
            <span className="inline-flex items-center rounded-lg bg-card/95 px-2 sm:px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-bold text-foreground backdrop-blur-md shadow-sm">
              {restaurant.priceRange}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4">
          {/* Title & Rating Row */}
          <div className="mb-2 flex items-start justify-between gap-2">
            <h3 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 min-w-0 flex-1">
              {restaurant.name}
            </h3>
            <div className="flex shrink-0 items-center gap-1 sm:gap-1.5 rounded-lg bg-success/10 px-1.5 sm:px-2 py-0.5 sm:py-1">
              <Star className="h-3 sm:h-3.5 w-3 sm:w-3.5 fill-success text-success" />
              <span className="text-xs sm:text-sm font-bold text-success">
                {typeof displayRating === 'number' ? displayRating.toFixed(1) : 'New'}
              </span>
            </div>
          </div>

          {/* Reviews count */}
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {hasReviews ? (
                <span>{restaurant.totalReviews} review{restaurant.totalReviews !== 1 ? 's' : ''}</span>
              ) : (
                <span className="text-orange-600 font-medium">New</span>
              )}
            </span>
          </div>



          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 sm:px-2.5 py-0.5 sm:py-1 font-medium text-secondary-foreground">
              {restaurant.cuisine}
            </span>
            {(restaurant.area || restaurant.city) && (
              <span className="flex items-center gap-1 min-w-0 flex-1">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate text-[11px] sm:text-xs">{restaurant.area || restaurant.city}</span>
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
