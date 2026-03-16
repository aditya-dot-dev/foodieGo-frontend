// import { Plus, Leaf, Check } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import type { MenuItem as MenuItemType } from '@/types';

// interface MenuItemProps {
//   item: MenuItemType;
//   onAddToCart?: (item: MenuItemType) => void;
//   isJustAdded?: boolean;
// }

// export function MenuItem({ item, onAddToCart, isJustAdded }: MenuItemProps) {
//   const formatPrice = (price: number) => {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       minimumFractionDigits: 0,
//     }).format(price);
//   };

//   return (
//     <div
//       className={`group flex gap-4 rounded-xl border bg-card p-4 transition-all duration-200 ${
//         !item.isAvailable 
//           ? 'opacity-50 border-border' 
//           : isJustAdded
//             ? 'border-success shadow-[0_0_0_1px_hsl(var(--success))] bg-success/5'
//             : 'border-border hover:border-primary/30 hover:shadow-card'
//       }`}
//     >
//       {/* Content */}
//       <div className="flex flex-1 flex-col min-w-0">
//         <div className="mb-1.5 flex items-center gap-2">
//           {/* Veg/Non-veg indicator */}
//           <div
//             className={`flex h-4 w-4 items-center justify-center rounded border-2 shrink-0 ${
//               item.isVeg ? 'border-success' : 'border-destructive'
//             }`}
//           >
//             <div
//               className={`h-2 w-2 rounded-full ${
//                 item.isVeg ? 'bg-success' : 'bg-destructive'
//               }`}
//             />
//           </div>

//           {item.isVeg && (
//             <span className="flex items-center gap-0.5 text-xs font-medium text-success">
//               <Leaf className="h-3 w-3" />
//               Veg
//             </span>
//           )}

//           {!item.isAvailable && (
//             <span className="text-xs font-medium text-destructive">
//               Unavailable
//             </span>
//           )}
//         </div>

//         <h4 className="mb-2 text-base font-semibold text-foreground leading-tight">
//           {item.name}
//         </h4>

//         <p className="mb-3 text-lg font-bold text-foreground">
//           {formatPrice(item.price)}
//         </p>

//         {item.description && (
//           <p className="text-sm text-muted-foreground line-clamp-2">
//             {item.description}
//           </p>
//         )}
//       </div>

//       {/* Image & Add button */}
//       <div className="relative flex flex-col items-center justify-end shrink-0">
//         {item.imageUrl && (
//           <div className={`mb-2 h-20 w-20 overflow-hidden rounded-lg bg-muted ${!item.isAvailable ? 'grayscale' : ''}`}>
//             <img
//               src={item.imageUrl}
//               alt={item.name}
//               className="h-full w-full object-cover"
//               loading="lazy"
//             />
//           </div>
//         )}

//         <Button
//           size="sm"
//           variant={item.isAvailable ? 'default' : 'outline'}
//           disabled={!item.isAvailable}
//           className={`gap-1 min-w-[80px] transition-all duration-200 ${
//             item.isAvailable 
//               ? 'hover:scale-105 hover:shadow-md active:scale-95' 
//               : 'cursor-not-allowed'
//           } ${isJustAdded ? 'bg-success hover:bg-success' : ''}`}
//           onClick={() => onAddToCart?.(item)}
//         >
//           {!item.isAvailable ? (
//             'Unavailable'
//           ) : isJustAdded ? (
//             <>
//               <Check className="h-4 w-4" />
//               Added
//             </>
//           ) : (
//             <>
//               <Plus className="h-4 w-4" />
//               Add
//             </>
//           )}
//         </Button>
//       </div>
//     </div>
//   );
// }

import { Plus, Leaf, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MenuItem as MenuItemType } from '@/types';

interface MenuItemProps {
  item: MenuItemType;
  onAddToCart?: (item: MenuItemType) => void;
  isJustAdded?: boolean;
}

export function MenuItem({ item, onAddToCart, isJustAdded }: MenuItemProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div
      className={`group flex gap-4 rounded-xl border bg-card p-4 transition-all duration-200 ${!item.isAvailable
          ? 'opacity-50 border-border'
          : isJustAdded
            ? 'border-success shadow-[0_0_0_1px_hsl(var(--success))] bg-success/5'
            : 'border-border hover:border-primary/30 hover:shadow-card'
        }`}
    >
      {/* LEFT CONTENT */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Veg / status row */}
        {/* <div className="mb-1.5 flex items-center gap-2">
          <div
            className={`flex h-4 w-4 items-center justify-center rounded border-2 shrink-0 ${
              item.isVeg ? 'border-success' : 'border-destructive'
            }`}
          >
            <div
              className={`h-2 w-2 rounded-full ${
                item.isVeg ? 'bg-success' : 'bg-destructive'
              }`}
            />
          </div>

          {item.isVeg && (
            <span className="flex items-center gap-0.5 text-xs font-medium text-success">
              <Leaf className="h-3 w-3" />
              Veg
            </span>
          )}

          {!item.isAvailable && (
            <span className="text-xs font-medium text-destructive">
              Unavailable
            </span>
          )}
        </div> */}

        {!item.isAvailable && (
          <span className="mb-1 text-xs font-medium text-destructive">
            Unavailable
          </span>
        )}


        {/* Name */}
        <h4 className="mb-1 text-base font-semibold text-foreground leading-tight">
          {item.name}
        </h4>

        {/* Description */}
        {item.description && (
          <p className="mb-2 text-sm text-muted-foreground line-clamp-2">
            {item.description}
          </p>
        )}
      </div>

      {/* RIGHT SIDE (Price + Image + Button) */}
      <div className="flex flex-col items-end justify-between shrink-0">
        {/* Price (right aligned) */}
        <span className="mb-2 text-lg font-bold text-foreground">
          {formatPrice(item.price)}
        </span>

        {item.imageUrl && (
          <div
            className={`mb-2 h-20 w-20 overflow-hidden rounded-lg bg-muted ${!item.isAvailable ? 'grayscale' : ''
              }`}
          >
            <img
              src={item.imageUrl}
              alt={item.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        <Button
          size="sm"
          variant={item.isAvailable ? 'default' : 'outline'}
          disabled={!item.isAvailable}
          className={`gap-1 min-w-[80px] transition-all duration-200 ${item.isAvailable
              ? 'hover:scale-105 hover:shadow-md active:scale-95'
              : 'cursor-not-allowed'
            } ${isJustAdded ? 'bg-success hover:bg-success' : ''}`}
          onClick={() => onAddToCart?.(item)}
        >
          {!item.isAvailable ? (
            'Unavailable'
          ) : isJustAdded ? (
            <>
              <Check className="h-4 w-4" />
              Added
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Add
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
