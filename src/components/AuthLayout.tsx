import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header with gradient accent */}
      <header className="relative border-b border-border/50 bg-card overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-red-500/5" />
        
        <div className="container relative flex h-16 items-center">
          <Link to="/" className="group flex items-center gap-2.5">
            <div className="relative">
              {/* Glow effect on hover */}
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 opacity-0 blur group-hover:opacity-70 transition-opacity duration-300" />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/40 transition-all duration-300">
                <ShoppingBag className="h-5 w-5 text-white" />
              </div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              FoodieGo
            </span>
          </Link>
        </div>
      </header>

      {/* Main Content with decorative elements */}
      <main className="relative flex flex-1 items-center justify-center px-4 py-12 overflow-hidden">
        {/* Decorative gradient circles */}
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-red-500/10 blur-3xl" />
        
        <div className="relative w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Title section */}
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-foreground">{title}</h1>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>

          {/* Card with gradient accent bar */}
          <div className="rounded-2xl border border-border/50 bg-card shadow-xl overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-orange-500 to-red-500" />
            <div className="p-6 sm:p-8">
              {children}
            </div>
          </div>

          {/* Trust indicators */}
          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>Secure Login</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>256-bit Encryption</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/50 backdrop-blur-sm py-4">
        <div className="container text-center text-sm text-muted-foreground">
          © 2026 FoodieGo. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
