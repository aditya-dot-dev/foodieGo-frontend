import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Loader2, CheckCircle, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { restaurantApi, authApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { Review } from '@/types';

// Helper to extract user ID from JWT token
function getCurrentUserId(): string | null {
  const token = localStorage.getItem('auth_token');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || payload.userId || payload.id || null;
  } catch {
    return null;
  }
}

interface ReviewsSectionProps {
  restaurantId: string;
  hideWriteReview?: boolean;
}

export function ReviewsSection({ restaurantId, hideWriteReview = false }: ReviewsSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isLoggedIn = authApi.isAuthenticated();
  const currentUserId = getCurrentUserId();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['reviews', restaurantId],
    queryFn: () => restaurantApi.getReviews(restaurantId),
  });

  const { data: eligibility, isLoading: eligibilityLoading } = useQuery({
    queryKey: ['reviewEligibility', restaurantId],
    queryFn: () => restaurantApi.checkReviewEligibility(restaurantId),
    enabled: isLoggedIn,
  });

  // Check if current user has already reviewed this restaurant
  const hasAlreadyReviewed = isLoggedIn && currentUserId && reviews.length > 0
    ? reviews.some((review) => review.userId === currentUserId)
    : false;

  const displayedReviews = reviews.slice(0, 10); // Show up to 10 reviews

  // Calculate average rating from reviews
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const handleReviewSuccess = () => {
    setIsModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ['reviews', restaurantId] });
    queryClient.invalidateQueries({ queryKey: ['restaurant', restaurantId, 'menu'] });
  };

  return (
    <section className="border-t pt-12 mt-12 bg-background">
      <div className="flex items-center gap-3 mb-8">
        <MessageSquare className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold tracking-tight">Customer Reviews</h2>
      </div>

      {/* Reviews Summary & Rating Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 bg-muted/20 p-8 rounded-[2rem] border border-muted shadow-sm">
        {/* Left: Overall Rating */}
        <div className="flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r pb-8 md:pb-0 md:pr-12">
          <div className="text-6xl font-black text-foreground mb-3">
            {reviews.length > 0 ? averageRating.toFixed(1) : '–'}
          </div>
          <div className="flex items-center gap-1.5 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-6 w-6 ${star <= Math.round(averageRating)
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-muted-foreground/30'
                  }`}
              />
            ))}
          </div>
          <div className="text-muted-foreground font-medium text-lg">
            {reviews.length > 0 ? (
              <span>Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
            ) : (
              <span>No reviews yet</span>
            )}
          </div>
        </div>

        {/* Right: Distribution Bars */}
        <div className="flex-1 space-y-3 justify-center flex flex-col">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = reviews.filter(r => Math.floor(r.rating) === rating).length;
            const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
            return (
              <div key={rating} className="flex items-center gap-4 group">
                <span className="text-sm font-bold w-4 text-foreground/80">{rating}</span>
                <Star className="h-4 w-4 fill-amber-400/50 text-amber-400/50 group-hover:fill-amber-400 transition-colors" />
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-amber-400 transition-all duration-700 ease-out rounded-full shadow-[0_0_10px_rgba(251,191,36,0.2)]"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-muted-foreground w-10 text-right">
                  {Math.round(percentage)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold text-foreground/90">Community Feedback</h3>

        {/* Write Review Button */}
        {!hideWriteReview && (
          isLoggedIn ? (
            hasAlreadyReviewed ? (
              <div className="flex items-center gap-2.5 px-4 py-2 bg-success/10 text-success rounded-full border border-success/20 animate-in fade-in slide-in-from-right-2">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-semibold">Already Reviewed</span>
              </div>
            ) : (
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    className="rounded-full px-8 shadow-lg shadow-primary/20 hover:shadow-xl transition-all"
                    disabled={eligibilityLoading || !eligibility?.canReview}
                  >
                    Share Your Experience
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-[2rem]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Write a Review</DialogTitle>
                  </DialogHeader>
                  <WriteReviewForm
                    restaurantId={restaurantId}
                    onSuccess={handleReviewSuccess}
                  />
                </DialogContent>
              </Dialog>
            )
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button disabled size="lg" className="rounded-full">Write a Review</Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Please login to write a review</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        )}
      </div>

      {/* Eligibility Notice */}
      {!hideWriteReview && isLoggedIn && !eligibilityLoading && !eligibility?.canReview && !hasAlreadyReviewed && (
        <div className="bg-amber-50 border border-amber-100 text-amber-800 text-sm px-5 py-4 rounded-2xl mb-8 flex items-center gap-3 animate-pulse">
          <Star className="h-5 w-5 fill-amber-500" />
          <span>Only customers who have ordered from this restaurant can write reviews.</span>
        </div>
      )}

      {/* Reviews List */}
      {reviewsLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary/60" />
          <p className="text-muted-foreground font-medium">Loading reviews...</p>
        </div>
      ) : displayedReviews.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-[2rem] bg-muted/10">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-6">
            <Star className="h-10 w-10 text-muted-foreground/40" />
          </div>
          <h4 className="text-xl font-bold mb-2">No reviews yet</h4>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Be the first one to share your feedback and help others discover great food!
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayedReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </section>
  );
}

function WriteReviewForm({
  restaurantId,
  onSuccess,
}: {
  restaurantId: string;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');

  const { mutate: submitReview, isPending } = useMutation({
    mutationFn: () =>
      restaurantApi.createReview(restaurantId, {
        rating,
        comment: comment.trim() || undefined,
      }),
    onSuccess: () => {
      toast({ title: 'Review submitted successfully!' });
      setRating(0);
      setComment('');
      onSuccess();
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to submit review', description: error.message, variant: 'destructive' });
    },
  });

  return (
    <div className="space-y-6 pt-4">
      {/* Star Rating */}
      <div className="text-center">
        <label className="text-base font-bold mb-4 block text-foreground/80 italic">
          {rating === 0 ? "How was your meal?" :
            rating === 5 ? "Amazing! 🌟🌟🌟🌟🌟" :
              rating === 4 ? "Very Good! ✨" :
                rating === 3 ? "Good enough." :
                  rating === 2 ? "Could be better." : "Disappointing."}
        </label>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-1 transition-all hover:scale-125 hover:-translate-y-1 active:scale-95 cursor-pointer"
            >
              <Star
                className={`h-12 w-12 transition-colors ${star <= (hoveredRating || rating)
                  ? 'fill-amber-400 text-amber-400 drop-shadow-md'
                  : 'text-muted-foreground/30'
                  }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-foreground/70 ml-1">Optional Details</label>
        <Textarea
          placeholder="What did you love or what could be improved? Mention your favorite dishes!"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="resize-none rounded-2xl border-muted-foreground/20 focus:border-primary/40 focus:ring-primary/20 transition-all p-4"
          rows={5}
        />
      </div>

      <Button
        onClick={() => submitReview()}
        disabled={rating === 0 || isPending}
        className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-xl transition-all"
      >
        {isPending ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : 'Submit Your Feedback'}
      </Button>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const relativeDate = formatDistanceToNow(new Date(review.createdAt), { addSuffix: true });
  // The backend populates user object, so we access review.user.name
  const initials = review.user?.name
    ? review.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="group border rounded-3xl p-6 bg-card hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col border-muted/60">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary font-bold text-base border border-primary/10 group-hover:scale-110 transition-transform">
            {initials}
          </div>
          <div>
            <p className="font-bold text-foreground group-hover:text-primary transition-colors">{review.user?.name || 'Happy Foodie'}</p>
            <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest">{relativeDate}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-success/10 px-2.5 py-1 rounded-full border border-success/20">
          <span className="text-xs font-black text-success">{review.rating}</span>
          <Star className="h-3 w-3 fill-success text-success" />
        </div>
      </div>

      {/* Star Rating Blocks */}
      <div className="flex items-center gap-1 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i < review.rating ? 'bg-amber-400' : 'bg-muted'}`}
          />
        ))}
      </div>

      {review.comment && (
        <div className="relative">
          <span className="absolute -left-2 -top-1 text-4xl text-primary/10 font-serif leading-none">“</span>
          <p className="text-sm text-muted-foreground leading-relaxed italic relative z-10 pl-2">
            {review.comment}
          </p>
        </div>
      )}

      {!review.comment && (
        <p className="text-xs text-muted-foreground italic mt-auto">Rater provided no comment.</p>
      )}
    </div>
  );
}
