import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Offers from "./pages/Offers";
import OrderTracking from "./pages/OrderTracking";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RestaurantDetail from "./pages/RestaurantDetail";
import Checkout from "./pages/Checkout";
import Payment from "./pages/Payment";
import Orders from "./pages/Orders";
import Owner from "./pages/Owner";
import DeliveryPartner from "./pages/DeliveryPartner";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Favorites from "./pages/Favorites";
import { RoleGuard } from "./components/RoleGuard";
import { LocationProvider } from "./contexts/LocationContext";
import { LocationSelectorModal } from "./components/LocationSelectorModal";
import { DeliveryAddressProvider } from "./contexts/DeliveryAddressContext";
import { AddressSelectorModal } from "./components/AddressSelectorModal";
import { FavoritesProvider } from "./contexts/FavoritesContext";
import { SocketProvider } from "./context/SocketContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SocketProvider>
        <LocationProvider>
          <DeliveryAddressProvider>
            <FavoritesProvider>
              <Toaster />
              <Sonner />
              <LocationSelectorModal />
              <AddressSelectorModal />
              <BrowserRouter>
                <Routes>
                  {/* Home: accessible to guests and USER, but not RESTAURANT */}
                  <Route
                    path="/"
                    element={
                      <RoleGuard allowedRoles={['GUEST', 'USER']}>
                        <Home />
                      </RoleGuard>
                    }
                  />

                  <Route path="/search" element={<Search />} />
                  <Route path="/orders/:id/track" element={<OrderTracking />} />
                  <Route path="/offers" element={<Offers />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/restaurants/:id" element={<RestaurantDetail />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/payment" element={<Payment />} />
                  <Route
                    path="/orders"
                    element={
                      <RoleGuard allowedRoles={['USER']}>
                        <Orders />
                      </RoleGuard>
                    }
                  />

                  <Route
                    path="/owner"
                    element={
                      <RoleGuard allowedRoles={['RESTAURANT']}>
                        <Owner />
                      </RoleGuard>
                    }
                  />

                  <Route
                    path="/delivery-partner"
                    element={
                      <RoleGuard allowedRoles={['DELIVERY_PARTNER']}>
                        <DeliveryPartner />
                      </RoleGuard>
                    }
                  />

                  <Route
                    path="/admin"
                    element={
                      <RoleGuard allowedRoles={['ADMIN']}>
                        <Admin />
                      </RoleGuard>
                    }
                  />

                  <Route
                    path="/favorites"
                    element={
                      <RoleGuard allowedRoles={['USER']}>
                        <Favorites />
                      </RoleGuard>
                    }
                  />

                  <Route path="/profile" element={<Profile />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </FavoritesProvider>
          </DeliveryAddressProvider>
        </LocationProvider>
      </SocketProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
