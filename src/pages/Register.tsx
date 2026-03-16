"use client";

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Loader2, AlertCircle, Phone, Store, Eye, EyeOff, Sparkles, Bike } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AuthLayout } from '@/components/AuthLayout';
import { authApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';

const registerSchema = z.object({
  name: z.string().trim().min(2, { message: 'Name must be at least 2 characters' }).max(50, { message: 'Name must be less than 50 characters' }),
  email: z.string().trim().email({ message: 'Please enter a valid email address' }),
  phone: z.string().trim().min(10, { message: 'Phone must be at least 10 digits' }).max(15, { message: 'Phone must be less than 15 digits' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function Register() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    vehicleType: '',
    vehicleNumber: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  // Role selection
  const [selectedRole, setSelectedRole] = useState<'USER' | 'RESTAURANT' | 'DELIVERY_PARTNER'>('USER');
  const [isRestaurantOwner, setIsRestaurantOwner] = useState(false); // Keep for backward compatibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const result = registerSchema.safeParse(formData);
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

    // Validate delivery partner fields
    if (selectedRole === 'DELIVERY_PARTNER') {
      if (!formData.vehicleType || !formData.vehicleNumber) {
        setFieldErrors({
          vehicleType: !formData.vehicleType ? 'Please select vehicle type' : '',
          vehicleNumber: !formData.vehicleNumber ? 'Please enter vehicle number' : '',
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      // Prepare registration data
      const registrationData: any = {
        name: result.data.name,
        email: result.data.email,
        phone: result.data.phone,
        password: result.data.password,
        role: selectedRole,
      };

      // Add delivery partner specific fields
      if (selectedRole === 'DELIVERY_PARTNER') {
        registrationData.vehicleType = formData.vehicleType;
        registrationData.vehicleNumber = formData.vehicleNumber;
      }

      const response = await authApi.register(registrationData);

      // Log response for debugging
      console.log('Registration response:', response);

      // Check if registration requires verification (no token returned or explicit message)
      if (!response.token) {
        toast({
          title: 'Registration Successful',
          description: 'Your account is pending admin approval. You will be able to login once verified.',
          duration: 5000,
        });

        // Redirect to login after a delay
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      toast({
        title: 'Account created!',
        description: selectedRole === 'RESTAURANT'
          ? 'Welcome to FoodieGo. Set up your restaurant now.'
          : selectedRole === 'DELIVERY_PARTNER'
            ? 'Welcome to FoodieGo. Start delivering now.'
            : 'Welcome to FoodieGo. Start ordering now.',
      });

      // Handle post-auth redirect based on role
      const postAuthRedirect = localStorage.getItem('postAuthRedirect');

      if (selectedRole === 'RESTAURANT') {
        // Clear any saved cart data for restaurant owners
        localStorage.removeItem('checkout_cart');
        localStorage.removeItem('postAuthRedirect');
        navigate('/owner');
      } else if (selectedRole === 'DELIVERY_PARTNER') {
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
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Input field component for consistency
  const InputField = ({
    id,
    label,
    icon: Icon,
    type = "text",
    placeholder,
    autoComplete,
    showToggle = false,
    isVisible = false,
    onToggle = () => { }
  }: {
    id: string;
    label: string;
    icon: any;
    type?: string;
    placeholder: string;
    autoComplete?: string;
    showToggle?: boolean;
    isVisible?: boolean;
    onToggle?: () => void;
  }) => (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/20 dark:to-red-500/20">
          <Icon className="h-4 w-4 text-orange-500" />
        </div>
        <Input
          id={id}
          name={id}
          type={showToggle ? (isVisible ? 'text' : 'password') : type}
          placeholder={placeholder}
          value={formData[id as keyof typeof formData]}
          onChange={handleChange}
          className={`pl-14 ${showToggle ? 'pr-12' : ''} h-12 rounded-xl border-border/50 bg-muted/30 focus:border-orange-500/50 focus:ring-orange-500/20 transition-all ${fieldErrors[id] ? 'border-destructive focus:border-destructive' : ''}`}
          disabled={isLoading}
          autoComplete={autoComplete}
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {fieldErrors[id] && (
        <p className="text-xs text-destructive flex items-center gap-1 mt-1">
          <AlertCircle className="h-3 w-3" />
          {fieldErrors[id]}
        </p>
      )}
    </div>
  );

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Join FoodieGo to order delicious food"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-3 rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/20 shrink-0">
              <AlertCircle className="h-4 w-4" />
            </div>
            <p>{error}</p>
          </div>
        )}

        <InputField id="name" label="Full Name" icon={User} placeholder="John Doe" autoComplete="name" />
        <InputField id="email" label="Email" icon={Mail} type="email" placeholder="you@example.com" autoComplete="email" />
        <InputField id="phone" label="Phone Number" icon={Phone} type="tel" placeholder="1234567890" autoComplete="tel" />
        <InputField
          id="password"
          label="Password"
          icon={Lock}
          placeholder="••••••••"
          autoComplete="new-password"
          showToggle
          isVisible={showPassword}
          onToggle={() => setShowPassword(!showPassword)}
        />
        <InputField
          id="confirmPassword"
          label="Confirm Password"
          icon={Lock}
          placeholder="••••••••"
          autoComplete="new-password"
          showToggle
          isVisible={showConfirmPassword}
          onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
        />

        {/* Role Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Register as</Label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedRole('USER');
                setIsRestaurantOwner(false);
              }}
              className={`p-4 rounded-xl border-2 transition-all ${selectedRole === 'USER'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                  : 'border-border/50 hover:border-blue-300'
                }`}
              disabled={isLoading}
            >
              <User className={`h-6 w-6 mx-auto mb-2 ${selectedRole === 'USER' ? 'text-blue-500' : 'text-muted-foreground'}`} />
              <p className="text-sm font-medium">Customer</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRole('RESTAURANT');
                setIsRestaurantOwner(true);
              }}
              className={`p-4 rounded-xl border-2 transition-all ${selectedRole === 'RESTAURANT'
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10'
                  : 'border-border/50 hover:border-orange-300'
                }`}
              disabled={isLoading}
            >
              <Store className={`h-6 w-6 mx-auto mb-2 ${selectedRole === 'RESTAURANT' ? 'text-orange-500' : 'text-muted-foreground'}`} />
              <p className="text-sm font-medium">Restaurant</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRole('DELIVERY_PARTNER');
                setIsRestaurantOwner(false);
              }}
              className={`p-4 rounded-xl border-2 transition-all ${selectedRole === 'DELIVERY_PARTNER'
                  ? 'border-green-500 bg-green-50 dark:bg-green-500/10'
                  : 'border-border/50 hover:border-green-300'
                }`}
              disabled={isLoading}
            >
              <Bike className={`h-6 w-6 mx-auto mb-2 ${selectedRole === 'DELIVERY_PARTNER' ? 'text-green-500' : 'text-muted-foreground'}`} />
              <p className="text-sm font-medium">Delivery</p>
            </button>
          </div>
        </div>

        {/* Delivery Partner Vehicle Fields */}
        {selectedRole === 'DELIVERY_PARTNER' && (
          <div className="space-y-4 p-4 rounded-xl border border-green-200 bg-green-50 dark:bg-green-500/10">
            <div>
              <Label htmlFor="vehicleType" className="text-sm font-medium">Vehicle Type</Label>
              <Select
                value={formData.vehicleType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, vehicleType: value }))}
                disabled={isLoading}
              >
                <SelectTrigger className={`mt-1.5 h-12 ${fieldErrors.vehicleType ? 'border-destructive' : ''}`}>
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bike">Bike</SelectItem>
                  <SelectItem value="scooter">Scooter</SelectItem>
                  <SelectItem value="bicycle">Bicycle</SelectItem>
                </SelectContent>
              </Select>
              {fieldErrors.vehicleType && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {fieldErrors.vehicleType}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="vehicleNumber" className="text-sm font-medium">Vehicle Number</Label>
              <Input
                id="vehicleNumber"
                name="vehicleNumber"
                placeholder="e.g., MH12AB1234"
                value={formData.vehicleNumber}
                onChange={handleChange}
                className={`mt-1.5 h-12 ${fieldErrors.vehicleNumber ? 'border-destructive' : ''}`}
                disabled={isLoading}
              />
              {fieldErrors.vehicleNumber && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {fieldErrors.vehicleNumber}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Old Restaurant Owner Checkbox - Hidden but kept for backward compatibility */}
        <div className="hidden">
          <Checkbox
            id="isRestaurantOwner"
            checked={isRestaurantOwner}
            onCheckedChange={(checked) => setIsRestaurantOwner(checked === true)}
            disabled={isLoading}
            className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-orange-500 data-[state=checked]:to-red-500 data-[state=checked]:border-orange-500"
          />
          <div className="flex items-center gap-3 flex-1">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${isRestaurantOwner
                ? 'bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/20'
                : 'bg-muted'
              }`}>
              <Store className={`h-5 w-5 ${isRestaurantOwner ? 'text-white' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <Label
                htmlFor="isRestaurantOwner"
                className="cursor-pointer text-sm font-semibold"
              >
                Register as Restaurant Owner
              </Label>
              <p className="text-xs text-muted-foreground">
                List your restaurant and start receiving orders
              </p>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all duration-300 mt-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Creating account...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              {isRestaurantOwner ? 'Create Restaurant Account' : 'Create Account'}
            </>
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground pt-2">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-orange-500 hover:text-orange-600 hover:underline transition-colors">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
