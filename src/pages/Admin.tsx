import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, orderApi, couponApi, financeApi, authApi } from '@/lib/api';
import { AdminOverviewTab } from './admin/AdminOverviewTab';
import { AdminOrdersTab } from './admin/AdminOrdersTab';
import { AdminVerificationsTab } from './admin/AdminVerificationsTab';
import { AdminFleetTab } from './admin/AdminFleetTab';
import { AdminPartnersTab } from './admin/AdminPartnersTab';
import { AdminUsersTab } from './admin/AdminUsersTab';
import { AdminCouponsTab } from './admin/AdminCouponsTab';
import { AdminFinanceTab } from './admin/AdminFinanceTab';
import { useToast } from '@/hooks/use-toast';
import { useSocket } from '@/context/SocketContext';
import {
    Users,
    Store,
    ShoppingBag,
    DollarSign,
    Search,
    ShieldCheck,
    RefreshCw,
    LayoutDashboard,
    LogOut,
    TicketPercent,
    CheckCircle,
    Bike
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';


export default function Admin() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { socket } = useSocket();
    const [activeTab, setActiveTab] = useState('overview');
    const [searchTerm, setSearchTerm] = useState('');

    // Coupon State
    const [showCouponDialog, setShowCouponDialog] = useState(false);
    const [couponData, setCouponData] = useState({
        code: '',
        discountType: 'FLAT' as 'FLAT' | 'PERCENTAGE',
        discountAmount: '',
        minOrderValue: '',
        maxDiscount: '',
        expiresAt: '',
        description: ''
    });
    const [creatingCoupon, setCreatingCoupon] = useState(false);

    useEffect(() => {
        if (!socket) return;

        const handleNewOrder = (data: any) => {
            toast({
                title: 'New Order Received',
                description: data.message,
            });
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        };

        const handleNewUser = (data: any) => {
            toast({
                title: 'New User Registered',
                description: data.message,
            });
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        };

        const handleNewRestaurant = (data: any) => {
            toast({
                title: 'New Restaurant Created',
                description: data.message,
            });
            queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        };

        const handlePartnerStatusUpdate = (data: any) => {
            // Optional: toast notification for status change? Maybe too noisy.
            // But we must invalidate the queries to update the UI
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        };

        socket.on('NEW_ORDER', handleNewOrder);
        socket.on('NEW_USER', handleNewUser);
        socket.on('NEW_RESTAURANT', handleNewRestaurant);
        socket.on('PARTNER_STATUS_UPDATE', handlePartnerStatusUpdate);

        return () => {
            socket.off('NEW_ORDER', handleNewOrder);
            socket.off('NEW_USER', handleNewUser);
            socket.off('NEW_RESTAURANT', handleNewRestaurant);
            socket.off('PARTNER_STATUS_UPDATE', handlePartnerStatusUpdate);
        };
    }, [socket, queryClient, toast]);

    // Queries
    const { data: stats, isLoading: loadingStats } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: adminApi.getStats,
    });

    const { data: restaurants = [], isLoading: loadingRestaurants } = useQuery({
        queryKey: ['admin-restaurants'],
        queryFn: adminApi.getRestaurants,
    });

    const { data: users = [], isLoading: loadingUsers } = useQuery({
        queryKey: ['admin-users'],
        queryFn: () => adminApi.getUsers(),
    });

    const { data: coupons = [], isLoading: loadingCoupons } = useQuery({
        queryKey: ['admin-coupons'],
        queryFn: adminApi.getCoupons,
        enabled: activeTab === 'coupons',
    });

    const { data: orders = [], isLoading: loadingOrders } = useQuery({
        queryKey: ['admin-orders'],
        queryFn: adminApi.getOrders,
        enabled: activeTab === 'orders' || activeTab === 'overview',
    });

    // Mutations
    const toggleRestaurantStatusMutation = useMutation({
        mutationFn: adminApi.toggleRestaurantStatus,
        onSuccess: (data) => {
            toast({ title: 'Status Updated', description: data.message });
            queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] });
        },
    });

    const toggleVerificationMutation = useMutation({
        mutationFn: adminApi.toggleRestaurantVerification,
        onSuccess: (data) => {
            toast({
                title: data.restaurant.isVerified ? 'Restaurant Approved' : 'Verification Revoked',
                description: data.message
            });
            queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        },
    });

    const cancelOrderMutation = useMutation({
        mutationFn: (orderId: string) => orderApi.updateStatus(orderId, 'CANCELLED'),
        onSuccess: () => {
            toast({ title: 'Order Cancelled', description: 'The order has been successfully cancelled and refund initiated.' });
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        },
        onError: (error: any) => {
            toast({ title: 'Cancellation Failed', description: error.message || 'Could not cancel order', variant: 'destructive' });
        }
    });

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(price);

    const handleCreateCoupon = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingCoupon(true);
        try {
            await couponApi.create({
                ...couponData,
                discountAmount: Number(couponData.discountAmount),
                minOrderValue: Number(couponData.minOrderValue),
                maxDiscount: couponData.maxDiscount ? Number(couponData.maxDiscount) : undefined,
                expiresAt: new Date(couponData.expiresAt).toISOString(),
                // Global coupon - no restaurantId
            });
            toast({ title: 'Coupon Created Successfully' });
            setCouponData({
                code: '',
                discountType: 'FLAT',
                discountAmount: '',
                minOrderValue: '',
                maxDiscount: '',
                expiresAt: '',
                description: ''
            });
            setShowCouponDialog(false);
            queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
        } catch (error) {
            toast({ title: 'Failed to create coupon', variant: 'destructive' });
        } finally {
            setCreatingCoupon(false);
        }
    };

    const filteredRestaurants = restaurants.filter((r: any) =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.owner.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const pendingRestaurantVerifications = restaurants.filter((r: any) => !r.isVerified);

    const { data: pendingUsers = [], isLoading: loadingPendingUsers, refetch: refetchPendingUsers } = useQuery({
        queryKey: ['admin-pending-users'],
        queryFn: () => adminApi.getUsers({ status: 'pending' }),
        enabled: true,
    });

    useEffect(() => {
        if (activeTab === 'verifications') {
            refetchPendingUsers();
        }
    }, [activeTab, refetchPendingUsers]);

    const verifyUserMutation = useMutation({
        mutationFn: adminApi.verifyUser,
        onSuccess: (data) => {
            toast({
                title: 'User Verified',
                description: `${data.user.name} has been verified successfully.`
            });
            queryClient.invalidateQueries({ queryKey: ['admin-pending-users'] });
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        },
    });

    const rejectUserMutation = useMutation({
        mutationFn: adminApi.rejectUser,
        onSuccess: (data) => {
            toast({
                title: 'Application Rejected',
                description: 'The user application has been rejected and removed.',
                variant: 'destructive'
            });
            queryClient.invalidateQueries({ queryKey: ['admin-pending-users'] });
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        },
    });

    // Combine pending verifications (pending restaurant entities + pending user applications)
    const allPendingVerifications = [
        ...pendingRestaurantVerifications.map((r: any) => ({ ...r, type: 'RESTAURANT', verificationKind: 'RESTAURANT_ENTITY' })),
        ...pendingUsers.map((u: any) => ({ ...u, type: u.role, verificationKind: 'USER_APPLICATION', owner: { name: u.name, email: u.email }, area: 'N/A', city: 'N/A' }))
    ];

    const filteredUsers = users.filter((u: any) =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredOrders = orders.filter((o: any) =>
        o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.restaurant.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const fleet = users.filter((u: any) => u.role === 'DELIVERY_PARTNER');
    const filteredFleet = fleet.filter((f: any) =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#FDFCFB] dark:bg-zinc-950 pb-20">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-zinc-900 border-b border-zinc-800 text-white overflow-hidden shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-red-500/10 opacity-50" />
                <div className="container py-4 relative">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/20">
                                <ShieldCheck className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight">Admin Console</h1>
                                <p className="text-zinc-400 text-xs hidden sm:block">Control Center • FoodieGo Platform</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    queryClient.invalidateQueries();
                                    toast({ description: 'Data refreshed' });
                                }}
                                className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-white h-9 px-3"
                            >
                                <RefreshCw className="h-3.5 w-3.5 mr-2" />
                                Refresh
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    authApi.logout();
                                    navigate('/login');
                                }}
                                className="hover:bg-zinc-800 text-zinc-400 hover:text-white h-9 w-9"
                            >
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mt-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                    {/* Navigation Bar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-x-auto no-scrollbar">
                        <TabsList className="bg-transparent border-none p-0 h-auto flex gap-1">
                            {[
                                { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                                { id: 'orders', label: 'Orders', icon: ShoppingBag },
                                { id: 'verifications', label: 'Verifications', icon: CheckCircle, badge: allPendingVerifications.length },
                                { id: 'fleet', label: 'Fleet', icon: Bike },
                                { id: 'restaurants', label: 'Partners', icon: Store },
                                { id: 'users', label: 'Users', icon: Users },
                                { id: 'coupons', label: 'Coupons', icon: TicketPercent },
                                { id: 'finance', label: 'Finance', icon: DollarSign },
                            ].map((tab) => (
                                <TabsTrigger
                                    key={tab.id}
                                    value={tab.id}
                                    className="data-[state=active]:bg-zinc-900 data-[state=active]:text-white rounded-xl py-2 px-4 font-medium transition-all flex items-center gap-2 whitespace-nowrap"
                                >
                                    <tab.icon className="h-4 w-4" />
                                    {tab.label}
                                    {tab.badge ? (
                                        <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] text-white font-bold">
                                            {tab.badge}
                                        </span>
                                    ) : null}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {(activeTab !== 'overview') && (activeTab !== 'verifications') && (
                            <div className="relative flex items-center gap-2">
                                <Search className="absolute left-3 h-4 w-4 text-zinc-400" />
                                <Input
                                    placeholder="Search records..."
                                    className="pl-9 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl text-sm w-full md:w-64"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    <TabsContent value="overview">
                        <AdminOverviewTab
                            stats={stats}
                            loadingStats={loadingStats}
                            fleet={fleet}
                            setActiveTab={setActiveTab}
                            pendingVerificationCount={allPendingVerifications.length}
                            formatPrice={formatPrice}
                        />
                    </TabsContent>

                    <TabsContent value="orders">
                        <AdminOrdersTab
                            orders={filteredOrders}
                            loadingOrders={loadingOrders}
                            onCancelOrder={(id) => cancelOrderMutation.mutate(id)}
                            formatPrice={formatPrice}
                        />
                    </TabsContent>

                    <TabsContent value="fleet">
                        <AdminFleetTab fleet={filteredFleet} />
                    </TabsContent>

                    <TabsContent value="verifications">
                        <AdminVerificationsTab
                            pendingVerification={allPendingVerifications}
                            isLoading={loadingPendingUsers || loadingRestaurants}
                            onReject={(id) => {
                                const item = allPendingVerifications.find(i => i.id === id);
                                if (item?.verificationKind === 'USER_APPLICATION') {
                                    rejectUserMutation.mutate(id);
                                } else {
                                    toggleRestaurantStatusMutation.mutate(id);
                                }
                            }}
                            onVerify={(item) => {
                                if (item.verificationKind === 'USER_APPLICATION') {
                                    verifyUserMutation.mutate(item.id);
                                } else {
                                    toggleVerificationMutation.mutate(item.id);
                                }
                            }}
                        />
                    </TabsContent>

                    <TabsContent value="restaurants">
                        <AdminPartnersTab
                            restaurants={filteredRestaurants}
                            loadingRestaurants={loadingRestaurants}
                            onToggleStatus={(id) => toggleRestaurantStatusMutation.mutate(id)}
                            onToggleVerification={(id) => toggleVerificationMutation.mutate(id)}
                        />
                    </TabsContent>

                    <TabsContent value="users">
                        <AdminUsersTab
                            users={filteredUsers}
                            loadingUsers={loadingUsers}
                        />
                    </TabsContent>

                    <TabsContent value="coupons">
                        <AdminCouponsTab
                            coupons={coupons}
                            loadingCoupons={loadingCoupons}
                            showCouponDialog={showCouponDialog}
                            setShowCouponDialog={setShowCouponDialog}
                            couponData={couponData}
                            setCouponData={setCouponData}
                            creatingCoupon={creatingCoupon}
                            handleCreateCoupon={handleCreateCoupon}
                            formatPrice={formatPrice}
                        />
                    </TabsContent>

                    <TabsContent value="finance">
                        <AdminFinanceTab
                            stats={stats}
                            onProcessPayout={async (payoutId) => {
                                try {
                                    await financeApi.processPayout(payoutId);
                                    toast({ title: 'Payout Processed', description: 'Funds have been deducted from wallet.' });
                                    queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
                                } catch (err) {
                                    toast({ title: 'Failed', description: 'Could not process payout', variant: 'destructive' });
                                }
                            }}
                            formatPrice={formatPrice}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div >
    );
}
