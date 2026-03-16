
import React, { forwardRef } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onClear?: () => void;
    wrapperClassName?: string;
}

const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
    ({ className, wrapperClassName, value, onClear, onChange, ...props }, ref) => {
        return (
            <div className={cn("relative flex items-center w-full", wrapperClassName)}>
                <SearchIcon className="absolute left-4 h-5 w-5 text-muted-foreground" />
                <input
                    ref={ref}
                    type="text"
                    className={cn(
                        "flex h-12 w-full rounded-xl border border-input bg-background px-12 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                        className
                    )}
                    value={value}
                    onChange={onChange}
                    {...props}
                />
                {value && onClear && (
                    <button
                        type="button"
                        onClick={onClear}
                        className="absolute right-4 rounded-full p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Clear search</span>
                    </button>
                )}
            </div>
        );
    }
);

SearchBar.displayName = "SearchBar";

export { SearchBar };
