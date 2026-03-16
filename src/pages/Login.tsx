"use client";

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, AlertCircle, Eye, EyeOff, Sparkles } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthLayout } from '@/components/AuthLayout';
import { authApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const loginSchema = z.object({
  email: z.string().trim().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Validate form
    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.login({ email: result.data.email, password: result.data.password });
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });

      // Handle post-auth redirect
      const postAuthRedirect = localStorage.getItem('postAuthRedirect');

      if (response.user?.role === 'RESTAURANT') {
        // Clear any saved cart data for restaurant owners
        localStorage.removeItem('checkout_cart');
        localStorage.removeItem('postAuthRedirect');
        navigate('/owner');
      } else if (response.user?.role === 'DELIVERY_PARTNER') {
        // Clear any saved cart data for delivery partners
        localStorage.removeItem('checkout_cart');
        localStorage.removeItem('postAuthRedirect');
        navigate('/delivery-partner');
      } else if (postAuthRedirect) {
        localStorage.removeItem('postAuthRedirect');
        navigate(postAuthRedirect);
      } else {
        navigate('/');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to order your favorite food"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-3 rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/20 shrink-0">
              <AlertCircle className="h-4 w-4" />
            </div>
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">Email</Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/20 dark:to-red-500/20">
              <Mail className="h-4 w-4 text-orange-500" />
            </div>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              className={`pl-14 h-12 rounded-xl border-border/50 bg-muted/30 focus:border-orange-500/50 focus:ring-orange-500/20 transition-all ${fieldErrors.email ? 'border-destructive focus:border-destructive' : ''}`}
              disabled={isLoading}
              autoComplete="email"
            />
          </div>
          {fieldErrors.email && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3" />
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">Password</Label>
            <Link
              to="#"
              className="text-xs font-medium text-orange-500 hover:text-orange-600 hover:underline transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/20 dark:to-red-500/20">
              <Lock className="h-4 w-4 text-orange-500" />
            </div>
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className={`pl-14 pr-12 h-12 rounded-xl border-border/50 bg-muted/30 focus:border-orange-500/50 focus:ring-orange-500/20 transition-all ${fieldErrors.password ? 'border-destructive focus:border-destructive' : ''}`}
              disabled={isLoading}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3" />
              {fieldErrors.password}
            </p>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all duration-300"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Signing in...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Sign in
            </>
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground pt-2">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-orange-500 hover:text-orange-600 hover:underline transition-colors">
            Sign up
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
