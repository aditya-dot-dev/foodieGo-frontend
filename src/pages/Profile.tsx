import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, LogOut, ShieldCheck, Pencil, Camera, X, Check, Loader2, MapPin, Plus, Trash2, Calendar, ChevronRight, Navigation, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Navbar } from '@/components/Navbar';
import { profileApi, authApi, addressApi, type ProfileData, type UserAddress } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocation as useRouterLocation } from 'react-router-dom';
import { useLocation as useGeoLocation } from '@/contexts/LocationContext';
import { searchPlaces } from '@/lib/mapbox';


export default function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const routerLocation = useRouterLocation();
  const { detectLocation } = useGeoLocation();
  const fromCheckout = routerLocation.state?.fromCheckout === true;
  const personalInfoRef = useRef<HTMLDivElement>(null);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Avatar states
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);

  // Address states
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState('');
  const [newAddressText, setNewAddressText] = useState('');
  const [newAddressCoords, setNewAddressCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [editAddressLabel, setEditAddressLabel] = useState('');
  const [editAddressText, setEditAddressText] = useState('');
  const [editAddressCoords, setEditAddressCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null);

  // Search states
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await profileApi.getMe();
        setUser(data);
        setEditName(data.name || '');
        setEditPhone(data.phone || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
        if (err instanceof Error && err.message.includes('401')) {
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    const fetchAddresses = async () => {
      try {
        const data = await addressApi.getAll();
        setAddresses(data);
      } catch (err) {
        // Silently fail - user may not have addresses yet
        console.error('Failed to load addresses:', err);
      } finally {
        setIsLoadingAddresses(false);
      }
    };

    fetchProfile();
    fetchAddresses();
  }, [navigate]);

  const handleLogout = () => {
    authApi.logout();
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out.',
    });
    navigate('/login');
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const res = await profileApi.updateMe({
        name: editName,
        phone: editPhone || undefined,
      });

      const updatedUser = res.user;

      setUser(updatedUser);
      setEditName(updatedUser.name || '');
      setEditPhone(updatedUser.phone || '');

      setIsEditing(false);
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (err) {
      toast({
        title: 'Update failed',
        description: err instanceof Error ? err.message : 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditName(user?.name || '');
    setEditPhone(user?.phone || '');
    setIsEditing(false);
  };

  const handleSaveAvatar = async () => {
    if (!avatarFile) return;

    // Client-side validation
    if (avatarFile.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Image size must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    if (!avatarFile.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingAvatar(true);
    toast({
      title: 'Uploading...',
      description: 'Your profile picture is being uploaded.',
    });

    try {
      const res = await profileApi.updateAvatar({ profile_image: avatarFile });
      setUser(res.user);

      setAvatarDialogOpen(false);
      setAvatarFile(null);
      setAvatarPreview('');
      toast({
        title: 'Avatar updated',
        description: 'Your profile image has been updated successfully.',
      });
    } catch (err) {
      toast({
        title: 'Update failed',
        description: err instanceof Error ? err.message : 'Failed to update avatar',
        variant: 'destructive',
      });
    } finally {
      setIsSavingAvatar(false);
    }
  };

  // Address handlers
  const handleAddressSearch = async (query: string, isEdit: boolean = false) => {
    if (isEdit) setEditAddressText(query);
    else setNewAddressText(query);

    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchPlaces(query);
      setSearchResults(results);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result: any, isEdit: boolean = false) => {
    if (isEdit) {
      setEditAddressText(result.place_name);
      setEditAddressCoords({ lat: result.lat, lng: result.lng });
    } else {
      setNewAddressText(result.place_name);
      setNewAddressCoords({ lat: result.lat, lng: result.lng });
    }
    setSearchResults([]);
  };

  const handleUseCurrentLocation = async (isEdit: boolean = false) => {
    setIsDetecting(true);
    try {
      // We want to use the detectLocation from context which already has the logic
      // But we need to capture the result. Since LocationContext.detectLocation
      // sets the global location, we can't easily get the value back directly
      // unless we modify the context or re-implement.
      // Actually, detectLocation in context doesn't return anything.

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      const { reverseGeocode } = await import('@/lib/mapbox');
      const features = await reverseGeocode(latitude, longitude);
      const place = features[0];

      if (isEdit) {
        setEditAddressText(place?.place_name || `${latitude}, ${longitude}`);
        setEditAddressCoords({ lat: latitude, lng: longitude });
      } else {
        setNewAddressText(place?.place_name || `${latitude}, ${longitude}`);
        setNewAddressCoords({ lat: latitude, lng: longitude });
      }

      toast({ title: 'Location detected' });
    } catch (err) {
      toast({
        title: 'Detection failed',
        description: 'Please allow location access or search manually.',
        variant: 'destructive'
      });
    } finally {
      setIsDetecting(false);
    }
  };

  const handleAddAddress = async () => {
    if (!newAddressLabel.trim() || !newAddressText.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Please enter both label and address.',
        variant: 'destructive',
      });
      return;
    }
    setIsSavingAddress(true);
    try {
      const newAddress = await addressApi.create({
        label: newAddressLabel.trim(),
        address: newAddressText.trim(),
        lat: newAddressCoords?.lat,
        lng: newAddressCoords?.lng,
      });
      setAddresses((prev) => [...prev, newAddress]);
      setNewAddressLabel('');
      setNewAddressText('');
      setNewAddressCoords(null);
      setShowAddAddressForm(false);
      toast({ title: 'Address added', description: 'Your new address has been saved.' });
    } catch (err) {
      toast({
        title: 'Failed to add address',
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: 'destructive',
      });
      if (fromCheckout) {
        navigate('/checkout', { replace: true });
      }
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleEditAddress = (addr: UserAddress) => {
    setEditingAddressId(addr.id);
    setEditAddressLabel(addr.label);
    setEditAddressText(addr.address);
    setEditAddressCoords(addr.lat && addr.lng ? { lat: addr.lat, lng: addr.lng } : null);
  };

  const handleSaveEditAddress = async () => {
    if (!editingAddressId || !editAddressLabel.trim() || !editAddressText.trim()) return;
    setIsSavingAddress(true);
    try {
      const updated = await addressApi.update(editingAddressId, {
        label: editAddressLabel.trim(),
        address: editAddressText.trim(),
        lat: editAddressCoords?.lat,
        lng: editAddressCoords?.lng,
      });
      setAddresses((prev) => prev.map((a) => (a.id === editingAddressId ? updated : a)));
      setEditingAddressId(null);
      setEditAddressCoords(null);
      toast({ title: 'Address updated', description: 'Your address has been updated.' });
    } catch (err) {
      toast({
        title: 'Failed to update address',
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    setDeletingAddressId(id);
    try {
      await addressApi.delete(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast({ title: 'Address deleted', description: 'Your address has been removed.' });
    } catch (err) {
      toast({
        title: 'Failed to delete address',
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setDeletingAddressId(null);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const handleEditProfileClick = () => {
    setIsEditing(true);
    setTimeout(() => {
      personalInfoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const roleColors: Record<string, string> = {
    USER: 'bg-primary/10 text-primary border-primary/20',
    RESTAURANT: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    ADMIN: 'bg-red-500/10 text-red-600 border-red-500/20',
  };

  const roleGradients: Record<string, string> = {
    USER: 'from-primary/20 to-primary/5',
    RESTAURANT: 'from-orange-500/20 to-orange-500/5',
    ADMIN: 'from-red-500/20 to-red-500/5',
  };

  // Loading State - Two Column Layout
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        {/* Gradient Header */}
        <div className="relative h-32 md:h-48 bg-gradient-to-r from-orange-500 via-orange-600 to-red-500">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNC0yIDQtMiA0LTItMi0yLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        </div>

        <main className="container relative -mt-16 md:-mt-24 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sidebar Skeleton */}
            <div className="lg:col-span-4 xl:col-span-3">
              <div className="bg-card rounded-2xl border border-border/50 shadow-xl p-6 space-y-6">
                <div className="flex flex-col items-center text-center">
                  <Skeleton className="h-28 w-28 rounded-full" />
                  <Skeleton className="h-6 w-32 mt-4" />
                  <Skeleton className="h-5 w-20 mt-2 rounded-full" />
                </div>
                <div className="space-y-3 pt-4 border-t border-border/50">
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              </div>
            </div>

            {/* Main Content Skeleton */}
            <div className="lg:col-span-8 xl:col-span-9 space-y-6">
              <div className="bg-card rounded-2xl border border-border/50 shadow-lg overflow-hidden">
                <Skeleton className="h-14 w-full" />
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-5 w-40" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-card rounded-2xl border border-border/50 shadow-lg overflow-hidden">
                <Skeleton className="h-14 w-full" />
                <div className="p-6 space-y-3">
                  <Skeleton className="h-20 w-full rounded-xl" />
                  <Skeleton className="h-20 w-full rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Error State
  if (error && !user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="relative h-32 md:h-48 bg-gradient-to-r from-orange-500 via-orange-600 to-red-500" />
        <main className="container relative -mt-16 md:-mt-24 pb-12">
          <div className="bg-card rounded-2xl border border-border/50 shadow-xl p-8 max-w-md mx-auto text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <X className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => navigate('/login')} className="mt-4">
              Go to Login
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Gradient Header Background */}
      <div className="relative h-32 md:h-48 bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNC0yIDQtMiA0LTItMi0yLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl" />
      </div>

      <main className="container relative -mt-16 md:-mt-24 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Sidebar */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="bg-card rounded-2xl border border-border/50 shadow-xl overflow-hidden lg:sticky lg:top-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Gradient accent top */}
              <div className={`h-2 bg-gradient-to-r ${user.role ? (user.role === 'RESTAURANT' ? 'from-orange-500 to-red-500' : user.role === 'ADMIN' ? 'from-red-500 to-pink-500' : 'from-primary to-primary/70') : 'from-primary to-primary/70'}`} />

              <div className="p-6">
                {/* Avatar Section */}
                <div className="flex flex-col items-center text-center">
                  <div className="relative group">
                    <div className={`absolute -inset-1 rounded-full bg-gradient-to-r ${user.role === 'RESTAURANT' ? 'from-orange-500 to-red-500' : user.role === 'ADMIN' ? 'from-red-500 to-pink-500' : 'from-primary to-primary/70'} opacity-75 blur group-hover:opacity-100 transition-opacity`} />
                    <Avatar className="relative h-28 w-28 border-4 border-background shadow-xl">
                      {user.profile_image ? (
                        <AvatarImage src={user.profile_image} alt={user.name} className="object-cover" />
                      ) : null}
                      <AvatarFallback className="bg-gradient-to-br from-orange-100 to-red-100 text-orange-600 text-3xl font-bold">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Camera Button */}
                    <Dialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          size="icon"
                          className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full shadow-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 border-2 border-background transition-transform hover:scale-110"
                        >
                          <Camera className="h-4 w-4 text-white" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Update Profile Image</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="avatar-file">Profile Image</Label>
                            <Input
                              id="avatar-file"
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setAvatarFile(file);
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setAvatarPreview(reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </div>
                          {avatarPreview && (
                            <div className="flex justify-center">
                              <Avatar className="h-24 w-24 border-2 border-border">
                                <AvatarImage src={avatarPreview} alt="Preview" />
                                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                              </Avatar>
                            </div>
                          )}
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setAvatarDialogOpen(false);
                                setAvatarFile(null);
                                setAvatarPreview('');
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleSaveAvatar}
                              disabled={!avatarFile || isSavingAvatar}
                              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                            >
                              {isSavingAvatar && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Save
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Name & Role */}
                  <h2 className="mt-4 text-xl font-bold text-foreground">{user.name || 'User'}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>

                  {user.role && (
                    <Badge
                      variant="outline"
                      className={`mt-3 ${roleColors[user.role] || ''} font-medium px-3 py-1`}
                    >
                      <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                      {user.role}
                    </Badge>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="mt-6 pt-6 border-t border-border/50">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Member since 2024</span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-6 space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-between group hover:border-primary/50 hover:bg-primary/5 transition-all"
                    onClick={handleEditProfileClick}
                  >
                    <span className="flex items-center gap-2">
                      <Pencil className="h-4 w-4" />
                      Edit Profile
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-between text-destructive hover:text-destructive hover:border-destructive/50 hover:bg-destructive/5 transition-all"
                    onClick={handleLogout}
                  >
                    <span className="flex items-center gap-2">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </span>
                    <ChevronRight className="h-4 w-4 opacity-50" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">

            {/* Personal Information Card */}
            <div
              ref={personalInfoRef}
              className="bg-card rounded-2xl border border-border/50 shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: '100ms' }}
            >
              {/* Gradient Header */}
              <div className="relative px-6 py-4 bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-transparent border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/20">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Personal Information</h3>
                      <p className="text-xs text-muted-foreground">Manage your account details</p>
                    </div>
                  </div>
                  {!isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="text-muted-foreground hover:text-foreground hover:bg-orange-500/10"
                    >
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>

              <div className="p-6">
                {isEditing ? (
                  /* Edit Mode */
                  <div className="space-y-5 animate-in fade-in duration-300">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name" className="text-sm font-medium">Full Name</Label>
                      <Input
                        id="edit-name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Enter your name"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-email" className="text-sm font-medium">Email Address</Label>
                      <Input
                        id="edit-email"
                        value={user.email}
                        disabled
                        className="h-11 bg-muted/50"
                      />
                      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-phone" className="text-sm font-medium">Phone Number</Label>
                      <Input
                        id="edit-phone"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="Enter phone number"
                        className="h-11"
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                      <Button
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                      >
                        <X className="mr-1.5 h-4 w-4" />
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                      >
                        {isSaving ? (
                          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="mr-1.5 h-4 w-4" />
                        )}
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div className="space-y-4 animate-in fade-in duration-300">
                    {/* Name */}
                    <div className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-muted/50 to-transparent p-4 hover:from-muted/70 transition-colors">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/20 dark:to-red-500/20">
                        <User className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Full Name</p>
                        <p className="font-semibold text-foreground truncate mt-0.5">
                          {user.name || <span className="text-muted-foreground italic font-normal">Not provided</span>}
                        </p>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-muted/50 to-transparent p-4 hover:from-muted/70 transition-colors">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/20 dark:to-red-500/20">
                        <Mail className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email Address</p>
                        <p className="font-semibold text-foreground truncate mt-0.5">
                          {user.email || <span className="text-muted-foreground italic font-normal">Not provided</span>}
                        </p>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-muted/50 to-transparent p-4 hover:from-muted/70 transition-colors">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/20 dark:to-red-500/20">
                        <Phone className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone Number</p>
                        <p className="font-semibold text-foreground truncate mt-0.5">
                          {user.phone || <span className="text-muted-foreground italic font-normal">Not provided</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Saved Addresses Card */}
            <div
              className="bg-card rounded-2xl border border-border/50 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: '200ms' }}
            >
              {/* Gradient Header */}
              <div className="relative px-6 py-4 bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-transparent border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/20">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Saved Addresses</h3>
                      <p className="text-xs text-muted-foreground">Manage your delivery locations</p>
                    </div>
                  </div>
                  {!showAddAddressForm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddAddressForm(true)}
                      className="text-muted-foreground hover:text-foreground hover:bg-orange-500/10"
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Add New
                    </Button>
                  )}
                </div>
              </div>

              <div className="p-6">
                {/* Loading state */}
                {isLoadingAddresses && (
                  <div className="space-y-3">
                    <Skeleton className="h-20 w-full rounded-xl" />
                    <Skeleton className="h-20 w-full rounded-xl" />
                  </div>
                )}

                {/* No addresses */}
                {!isLoadingAddresses && addresses.length === 0 && !showAddAddressForm && (
                  <div className="text-center py-8 animate-in fade-in duration-300">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/20 dark:to-red-500/20 flex items-center justify-center mx-auto mb-4">
                      <MapPin className="h-7 w-7 text-orange-500" />
                    </div>
                    <h4 className="font-medium text-foreground">No addresses saved</h4>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">
                      Add an address to speed up checkout
                    </p>
                    <Button
                      onClick={() => setShowAddAddressForm(true)}
                      className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Address
                    </Button>
                  </div>
                )}

                {/* Address list */}
                {!isLoadingAddresses && addresses.length > 0 && (
                  <div className="space-y-3">
                    {addresses.map((addr, index) => (
                      <div
                        key={addr.id}
                        className="rounded-xl border border-border/50 bg-gradient-to-r from-muted/30 to-transparent p-4 hover:border-orange-500/30 hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom-2 duration-300"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {editingAddressId === addr.id ? (
                          /* Edit mode for this address */
                          <div className="space-y-3 relative">
                            <Input
                              value={editAddressLabel}
                              onChange={(e) => setEditAddressLabel(e.target.value)}
                              placeholder="Label (e.g. Home, Work)"
                              className="h-10"
                            />
                            <div className="relative">
                              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                value={editAddressText}
                                onChange={(e) => handleAddressSearch(e.target.value, true)}
                                placeholder="Full Address"
                                className="h-10 pl-9 pr-10"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1 h-8 w-8 text-primary"
                                onClick={() => handleUseCurrentLocation(true)}
                                disabled={isDetecting}
                              >
                                {isDetecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                              </Button>
                            </div>

                            {/* Edit Search Results */}
                            {searchResults.length > 0 && editingAddressId === addr.id && (
                              <div className="absolute z-50 left-0 right-0 top-[88px] mt-1 rounded-xl border border-border bg-popover p-1 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                                {searchResults.map((result, idx) => (
                                  <button
                                    key={idx}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                                    onClick={() => handleSelectSearchResult(result, true)}
                                  >
                                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-foreground truncate">{result.area}</p>
                                      <p className="text-xs text-muted-foreground truncate">{result.place_name}</p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={handleSaveEditAddress}
                                disabled={isSavingAddress}
                                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                              >
                                {isSavingAddress && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingAddressId(null);
                                  setSearchResults([]);
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          /* View mode */
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/20 dark:to-red-500/20 shrink-0 mt-0.5">
                                <MapPin className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <Badge variant="secondary" className="mb-1.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 border-0">
                                  {addr.label}
                                </Badge>
                                <p className="text-sm text-muted-foreground line-clamp-2">{addr.address}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 hover:bg-orange-500/10 hover:text-orange-600"
                                onClick={() => handleEditAddress(addr)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteAddress(addr.id)}
                                disabled={deletingAddressId === addr.id}
                              >
                                {deletingAddressId === addr.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add address form */}
                {showAddAddressForm && (
                  <div className="rounded-xl border-2 border-dashed border-orange-500/30 bg-gradient-to-r from-orange-500/5 to-transparent p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 relative">
                    <div className="space-y-2">
                      <Label htmlFor="new-addr-label" className="text-sm font-medium">Label</Label>
                      <Input
                        id="new-addr-label"
                        value={newAddressLabel}
                        onChange={(e) => setNewAddressLabel(e.target.value)}
                        placeholder="e.g. Home, Work, Office"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2 relative">
                      <Label htmlFor="new-addr-text" className="text-sm font-medium">Full Address</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="new-addr-text"
                          value={newAddressText}
                          onChange={(e) => handleAddressSearch(e.target.value)}
                          placeholder="Search for your address..."
                          className="h-11 pl-9 pr-10"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1.5 h-8 w-8 text-primary"
                          onClick={() => handleUseCurrentLocation(false)}
                          disabled={isDetecting}
                        >
                          {isDetecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                        </Button>
                      </div>

                      {/* Add Search Results */}
                      {searchResults.length > 0 && !editingAddressId && (
                        <div className="absolute z-50 left-0 right-0 top-[76px] mt-1 rounded-xl border border-border bg-popover p-1 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                          {searchResults.map((result, idx) => (
                            <button
                              key={idx}
                              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                              onClick={() => handleSelectSearchResult(result, false)}
                            >
                              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{result.area}</p>
                                <p className="text-xs text-muted-foreground truncate">{result.place_name}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={handleAddAddress}
                        disabled={isSavingAddress}
                        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                      >
                        {isSavingAddress && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Address
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAddAddressForm(false);
                          setNewAddressLabel('');
                          setNewAddressText('');
                          setSearchResults([]);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile-only Logout Button */}
            <div className="lg:hidden">
              <Button
                variant="outline"
                size="lg"
                className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
