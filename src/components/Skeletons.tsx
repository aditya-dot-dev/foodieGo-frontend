export function RestaurantCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {/* Image skeleton */}
      <div className="relative aspect-[16/10] animate-pulse bg-muted" />
      
      {/* Content skeleton */}
      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="h-6 w-2/3 animate-pulse rounded-md bg-muted" />
          <div className="h-6 w-12 animate-pulse rounded-md bg-muted" />
        </div>
        
        <div className="mb-3 space-y-2">
          <div className="h-4 w-full animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-3/4 animate-pulse rounded-md bg-muted" />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
          <div className="h-5 w-8 animate-pulse rounded-md bg-muted" />
        </div>
      </div>
    </div>
  );
}

export function MenuItemSkeleton() {
  return (
    <div className="flex gap-4 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-1 flex-col">
        <div className="mb-1.5 flex items-center gap-2">
          <div className="h-4 w-4 animate-pulse rounded border-2 border-muted bg-muted" />
        </div>
        <div className="mb-1 h-5 w-1/2 animate-pulse rounded-md bg-muted" />
        <div className="mb-2 h-6 w-16 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-full animate-pulse rounded-md bg-muted" />
      </div>
      <div className="flex flex-col items-center justify-end">
        <div className="h-9 w-16 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}
