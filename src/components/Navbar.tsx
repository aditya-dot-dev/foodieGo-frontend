"use client";

import { Link, useLocation as useRouterLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Menu,
  X,
  User,
  MapPin,
  ShoppingBag,
  ClipboardList,
  LogOut,
  ChevronDown,
  Search,
  TicketPercent,
  Heart,
  Home,
  ChevronRight,
  Bike,
  Store,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { authApi } from "@/lib/api";
import { useLocation } from "@/contexts/LocationContext";
import { useDeliveryAddress } from "@/contexts/DeliveryAddressContext";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const routerLocation = useRouterLocation();
  const navigate = useNavigate();
  const isAuthenticated = authApi.isAuthenticated();
  const role = localStorage.getItem("user_role"); // "USER" | "RESTAURANT"
  const userName = localStorage.getItem("user_name") || "User";
  const userEmail = localStorage.getItem("user_email") || "";
  const { location, openLocationModal } = useLocation();
  const { activeAddress, openAddressModal } = useDeliveryAddress();

  /**
   * Lock background scroll when mobile menu is open
   * Prevents horizontal overflow and maintains scroll position
   */
  useEffect(() => {
    if (isMenuOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflowY = 'scroll'; // Prevent layout shift
    } else {
      // Restore scroll position
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflowY = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }

    return () => {
      // Cleanup on unmount
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflowY = '';
    };
  }, [isMenuOpen]);

  /**
   * Format delivery display text
   * Format: "Delivering to: {Area}, {City}" (Swiggy-like)
   * Priority: Active saved address > Detected location > Fallback
   */
  const getDeliveryDisplayText = () => {
    if (activeAddress) {
      // Extract area from address (first part before comma) and use label context
      const addressParts = activeAddress.address.split(',').map(p => p.trim());
      const area = addressParts[0] || '';
      // Try to extract city (usually last meaningful part)
      const city = addressParts.length > 1 ? addressParts[addressParts.length - 1] : '';

      // Format: "Area, City" - skip if area looks like a raw code
      const isValidArea = area && !/^[A-Z]{1,3}\d+[A-Z]?$/i.test(area);
      if (isValidArea && city) {
        return `${area}, ${city}`;
      }
      if (city) return city;
      if (isValidArea) return area;
      // Fallback to label if address parsing fails
      return activeAddress.label;
    }
    if (location) {
      // Format: "{Area}, {City}" - fallback to city only if area missing
      const area = location.area?.trim();
      const city = location.city?.trim();
      if (area && city) return `${area}, ${city}`;
      return city || area || 'Select Location';
    }
    return 'Select Location';
  };

  /**
   * Handle delivery location click
   * Opens address modal if authenticated, otherwise location modal
   */
  const handleDeliveryClick = () => {
    if (isAuthenticated) {
      openAddressModal();
    } else {
      openLocationModal();
    }
  };

  const isActive = (path: string) => routerLocation.pathname === path;

  const handleLogout = () => {
    authApi.logout();
    navigate("/");
  };

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  // Check if user is on USER role (not RESTAURANT)
  const isUserRole = role !== "RESTAURANT";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 transition-all duration-300">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo - Enhanced with hover effect */}
        <Link to="/" className="group flex items-center gap-2.5">
          <div className="relative">
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 opacity-0 blur group-hover:opacity-70 transition-opacity duration-300" />
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/40 transition-all duration-300">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            FoodieGo
          </span>
        </Link>

        {/* Desktop Nav - USER role only */}
        {isUserRole && (
          <nav className="hidden items-center gap-1 md:flex">
            {/* Navigation Pills Container */}
            <div className="flex items-center gap-1 rounded-full bg-muted/50 p-1">
              <Link
                to="/"
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${isActive("/")
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-background"
                  }`}
              >
                <Home className="h-4 w-4" />
                Home
              </Link>
              <Link
                to="/search"
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${isActive('/search')
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-background"
                  }`}
              >
                <Search className="h-4 w-4" />
                Search
              </Link>
              <Link
                to="/offers"
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${isActive('/offers')
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-background"
                  }`}
              >
                <TicketPercent className="h-4 w-4" />
                Offers
              </Link>
              {isAuthenticated && (
                <Link
                  to="/favorites"
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${isActive('/favorites')
                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-background"
                    }`}
                >
                  <Heart className="h-4 w-4" />
                  Favorites
                </Link>
              )}
            </div>

            {/* Location Selector - Gradient Pill Style */}
            <button
              onClick={handleDeliveryClick}
              className="group flex items-center gap-2 ml-4 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-500/10 dark:to-red-500/10 border border-orange-200/50 dark:border-orange-500/20 hover:shadow-md hover:border-orange-300 dark:hover:border-orange-500/40 transition-all duration-300"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500 shadow-sm group-hover:shadow-md transition-shadow">
                <MapPin className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold leading-none">
                  Deliver to
                </span>
                <span className="text-xs font-semibold text-foreground max-w-[120px] truncate leading-tight">
                  {getDeliveryDisplayText()}
                </span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-orange-500 transition-colors" />
            </button>
          </nav>
        )}

        {/* Desktop Auth Section */}
        <div className="hidden items-center gap-3 md:flex">
          {!isAuthenticated ? (
            /* Unauthenticated - Login/Sign Up buttons */
            <>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="font-medium hover:text-orange-500 transition-colors"
              >
                <Link to="/login">Login</Link>
              </Button>
              <Button
                size="sm"
                asChild
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-md shadow-orange-500/20 hover:shadow-orange-500/40 transition-all"
              >
                <Link to="/register">Sign Up</Link>
              </Button>
            </>
          ) : (
            /* Authenticated - Avatar Dropdown */
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="group flex items-center gap-2 p-1.5 pr-3 rounded-full hover:bg-muted/50 transition-all duration-300">
                  {/* Avatar with gradient ring */}
                  <div className="relative">
                    <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 opacity-75 group-hover:opacity-100 transition-opacity" />
                    <Avatar className="relative h-8 w-8 border-2 border-background">
                      <AvatarFallback className="bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/20 dark:to-red-500/20 text-orange-600 dark:text-orange-400 font-semibold text-sm">
                        {getInitials(userName)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-64 rounded-2xl border border-border/50 bg-card p-2 shadow-xl z-50"
              >
                {/* User Info Header */}
                <div className="px-3 py-3 mb-2 rounded-xl bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-500/10 dark:to-red-500/10">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 opacity-75" />
                      <Avatar className="relative h-10 w-10 border-2 border-background">
                        <AvatarFallback className="bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/20 dark:to-red-500/20 text-orange-600 dark:text-orange-400 font-bold">
                          {getInitials(userName)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{userName}</p>
                      {userEmail && (
                        <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Restaurant Owner Dashboard Link */}
                {role === "RESTAURANT" && (
                  <DropdownMenuItem
                    className="rounded-xl p-3 font-medium transition-colors hover:bg-orange-500/10 hover:text-orange-600 cursor-pointer focus:bg-orange-500/10 focus:text-orange-600"
                    onClick={() => navigate("/owner")}
                  >
                    <Store className="h-4 w-4 mr-2" />
                    Restaurant Dashboard
                  </DropdownMenuItem>
                )}

                {/* Delivery Partner Dashboard Link */}
                {role === "DELIVERY_PARTNER" && (
                  <DropdownMenuItem
                    className="rounded-xl p-3 font-medium transition-colors hover:bg-green-500/10 hover:text-green-600 cursor-pointer focus:bg-green-500/10 focus:text-green-600"
                    onClick={() => navigate("/delivery-partner")}
                  >
                    <Bike className="mr-3 h-4 w-4" />
                    Delivery Dashboard
                  </DropdownMenuItem>
                )}

                {/* Admin Dashboard Link */}
                {role === "ADMIN" && (
                  <DropdownMenuItem
                    className="rounded-xl p-3 font-medium transition-colors hover:bg-zinc-900/10 hover:text-zinc-900 cursor-pointer focus:bg-zinc-900/10 focus:text-zinc-900"
                    onClick={() => navigate("/admin")}
                  >
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Admin Dashboard
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem
                  className="rounded-xl p-3 font-medium transition-colors hover:bg-orange-500/10 hover:text-orange-600 cursor-pointer focus:bg-orange-500/10 focus:text-orange-600"
                  onClick={() => navigate("/profile")}
                >
                  <User className="mr-3 h-4 w-4" />
                  Profile
                </DropdownMenuItem>

                {isUserRole && (
                  <DropdownMenuItem
                    className="rounded-xl p-3 font-medium transition-colors hover:bg-orange-500/10 hover:text-orange-600 cursor-pointer focus:bg-orange-500/10 focus:text-orange-600"
                    onClick={() => navigate("/orders")}
                  >
                    <ClipboardList className="mr-3 h-4 w-4" />
                    Orders
                  </DropdownMenuItem>
                )}

                <div className="my-2 border-t border-border/50" />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="rounded-xl p-3 font-medium text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive cursor-pointer focus:bg-destructive/10 focus:text-destructive"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-muted/50 md:hidden transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setIsMenuOpen(false)}
      />

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed right-0 top-0 h-[100dvh] z-[100] w-80 border-l border-border/50 shadow-2xl md:hidden transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        style={{ backgroundColor: 'hsl(var(--background))' }}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-md">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              FoodieGo
            </span>
          </div>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="p-2 rounded-xl hover:bg-muted/50 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col h-[calc(100%-65px)] overflow-y-auto">
          {/* User Section (when authenticated) */}
          {isAuthenticated && (
            <div className="p-4 border-b border-border/50">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-500/10 dark:to-red-500/10">
                <div className="relative">
                  <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 opacity-75" />
                  <Avatar className="relative h-12 w-12 border-2 border-background">
                    <AvatarFallback className="bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/20 dark:to-red-500/20 text-orange-600 dark:text-orange-400 font-bold text-lg">
                      {getInitials(userName)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{userName}</p>
                  {userEmail && (
                    <p className="text-sm text-muted-foreground truncate">{userEmail}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Location Selector - Mobile */}
          {isUserRole && (
            <div className="p-4 border-b border-border/50">
              <button
                onClick={() => {
                  handleDeliveryClick();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-500/10 dark:to-red-500/10 border border-orange-200/50 dark:border-orange-500/20 hover:shadow-md transition-all"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-md">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Deliver to</p>
                  <p className="font-semibold text-foreground truncate">{getDeliveryDisplayText()}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          )}

          {/* Navigation Items */}
          <div className="flex-1 p-4 space-y-2">
            {/* USER Navigation */}
            {isUserRole && (
              <>
                <button
                  onClick={() => {
                    navigate("/");
                    setIsMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-300 ${isActive("/")
                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
                    : "bg-card border border-border/50 hover:border-orange-500/30 hover:shadow-md"
                    }`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isActive("/")
                    ? "bg-white/20"
                    : "bg-gradient-to-br from-orange-500 to-red-500"
                    }`}>
                    <Home className={`h-5 w-5 ${isActive("/") ? "text-white" : "text-white"}`} />
                  </div>
                  <span className="font-medium">Home</span>
                </button>

                <button
                  onClick={() => {
                    navigate("/search");
                    setIsMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-300 ${isActive("/search")
                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
                    : "bg-card border border-border/50 hover:border-orange-500/30 hover:shadow-md"
                    }`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isActive("/search")
                    ? "bg-white/20"
                    : "bg-gradient-to-br from-orange-500 to-red-500"
                    }`}>
                    <Search className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium">Search</span>
                </button>

                <button
                  onClick={() => {
                    navigate("/offers");
                    setIsMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-300 ${isActive("/offers")
                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
                    : "bg-card border border-border/50 hover:border-orange-500/30 hover:shadow-md"
                    }`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isActive("/offers")
                    ? "bg-white/20"
                    : "bg-gradient-to-br from-orange-500 to-red-500"
                    }`}>
                    <TicketPercent className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium">Offers</span>
                </button>

                {isAuthenticated && (
                  <>
                    <button
                      onClick={() => {
                        navigate("/favorites");
                        setIsMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-300 ${isActive("/favorites")
                        ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
                        : "bg-card border border-border/50 hover:border-orange-500/30 hover:shadow-md"
                        }`}
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isActive("/favorites")
                        ? "bg-white/20"
                        : "bg-gradient-to-br from-orange-500 to-red-500"
                        }`}>
                        <Heart className="h-5 w-5 text-white" />
                      </div>
                      <span className="font-medium">Favorites</span>
                    </button>

                    <button
                      onClick={() => {
                        navigate("/orders");
                        setIsMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-300 ${isActive("/orders")
                        ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
                        : "bg-card border border-border/50 hover:border-orange-500/30 hover:shadow-md"
                        }`}
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isActive("/orders")
                        ? "bg-white/20"
                        : "bg-gradient-to-br from-orange-500 to-red-500"
                        }`}>
                        <ClipboardList className="h-5 w-5 text-white" />
                      </div>
                      <span className="font-medium">Orders</span>
                    </button>

                    <button
                      onClick={() => {
                        navigate("/profile");
                        setIsMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-300 ${isActive("/profile")
                        ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
                        : "bg-card border border-border/50 hover:border-orange-500/30 hover:shadow-md"
                        }`}
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isActive("/profile")
                        ? "bg-white/20"
                        : "bg-gradient-to-br from-orange-500 to-red-500"
                        }`}>
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <span className="font-medium">Profile</span>
                    </button>
                  </>
                )}
              </>
            )}

            {/* DELIVERY_PARTNER Navigation */}
            {role === "DELIVERY_PARTNER" && isAuthenticated && (
              <>
                <button
                  onClick={() => {
                    if (isMenuOpen) setIsMenuOpen(false);
                    navigate('/delivery-partner');
                  }}
                  className="w-full flex items-center gap-4 p-3 rounded-xl bg-card border border-border/50 hover:border-green-500/30 hover:shadow-md transition-all"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
                    <Bike className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium">Delivery Dashboard</span>
                </button>
              </>
            )}

            {/* ADMIN Navigation */}
            {role === "ADMIN" && isAuthenticated && (
              <>
                <button
                  onClick={() => {
                    navigate("/admin");
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-4 p-3 rounded-xl bg-card border border-border/50 hover:border-zinc-500/30 hover:shadow-md transition-all"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800">
                    <ShieldCheck className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium">Admin Dashboard</span>
                </button>
              </>
            )}

            {/* RESTAURANT Owner Navigation */}
            {role === "RESTAURANT" && isAuthenticated && (
              <>
                <button
                  onClick={() => {
                    navigate("/owner");
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-4 p-3 rounded-xl bg-card border border-border/50 hover:border-orange-500/30 hover:shadow-md transition-all"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
                    <ShoppingBag className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium">Owner Dashboard</span>
                </button>

                <button
                  onClick={() => {
                    navigate("/profile");
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-4 p-3 rounded-xl bg-card border border-border/50 hover:border-orange-500/30 hover:shadow-md transition-all"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium">Profile</span>
                </button>
              </>
            )}
          </div>

          {/* Auth Section */}
          <div className="p-4 border-t border-border/50 mt-auto">
            {!isAuthenticated ? (
              <div className="space-y-2">
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="block w-full p-3 rounded-xl text-center font-medium text-foreground bg-muted hover:bg-muted/80 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="block w-full p-3 rounded-xl text-center font-semibold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg transition-all"
                >
                  Sign Up
                </Link>
              </div>
            ) : (
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
