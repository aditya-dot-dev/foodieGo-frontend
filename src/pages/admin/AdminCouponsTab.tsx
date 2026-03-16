import { Plus, TicketPercent, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface AdminCouponsTabProps {
    coupons: any[];
    loadingCoupons: boolean;
    showCouponDialog: boolean;
    setShowCouponDialog: (show: boolean) => void;
    couponData: any;
    setCouponData: (data: any) => void;
    creatingCoupon: boolean;
    handleCreateCoupon: (e: React.FormEvent) => void;
    formatPrice: (price: number) => string;
}

export function AdminCouponsTab({
    coupons,
    loadingCoupons,
    showCouponDialog,
    setShowCouponDialog,
    couponData,
    setCouponData,
    creatingCoupon,
    handleCreateCoupon,
    formatPrice
}: AdminCouponsTabProps) {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
                <div>
                    <h2 className="font-black text-lg">Platform Vouchers</h2>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Marketing & Incentives</p>
                </div>
                <Button
                    onClick={() => setShowCouponDialog(true)}
                    size="sm"
                    className="bg-zinc-900 hover:bg-black text-white rounded-2xl text-[10px] font-black uppercase h-9 gap-2 px-4 shadow-xl shadow-zinc-900/10"
                >
                    <Plus className="h-3.5 w-3.5" /> Issue Coupon
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loadingCoupons ? (
                    Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-44 w-full rounded-3xl" />)
                ) : coupons.length === 0 ? (
                    <div className="lg:col-span-3 py-24 text-center border-2 border-dashed border-zinc-200 rounded-[32px] text-zinc-300 font-black uppercase tracking-widest text-xs">
                        No active vouchers
                    </div>
                ) : coupons.map((coupon: any) => (
                    <Card key={coupon.id} className="border-none shadow-2xl bg-white rounded-[32px] overflow-hidden relative group">
                        <div className={`absolute top-0 left-0 w-1.5 h-full ${coupon.restaurantId ? 'bg-orange-400' : 'bg-indigo-600'}`} />
                        <CardHeader className="pb-3">
                            <div className="flex justify-between mb-3">
                                <Badge variant="outline" className="text-[9px] font-black border-none bg-zinc-50 rounded-md px-2">
                                    {coupon.restaurantId ? 'RESTAURANT' : 'GLOBAL'}
                                </Badge>
                                <Badge variant={coupon.isActive ? 'success' : 'outline'} className="text-[9px] font-black h-5 uppercase">
                                    {coupon.isActive ? 'Active' : 'Expired'}
                                </Badge>
                            </div>
                            <CardTitle className="text-2xl font-black tracking-tighter">{coupon.code}</CardTitle>
                            <CardDescription className="text-xs font-medium text-zinc-500">
                                {coupon.description || `Get ${coupon.discountAmount}${coupon.discountType === 'PERCENTAGE' ? '%' : ' OFF'} on your next delight`}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-3 border-t border-zinc-50 mt-2">
                            <div className="flex justify-between text-zinc-900">
                                <div>
                                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Expires</p>
                                    <span className="text-xs font-black">{new Date(coupon.expiresAt).toLocaleDateString()}</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Min Value</p>
                                    <span className="text-xs font-black">{formatPrice(coupon.minOrderValue)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={showCouponDialog} onOpenChange={setShowCouponDialog}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Create New Global Coupon</DialogTitle>
                        <DialogDescription>
                            Issue a platform-wide coupon that applies to all restaurants
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateCoupon} className="space-y-3">
                        <Input
                            placeholder="Coupon Code (e.g. SAVE50)"
                            value={couponData.code}
                            onChange={e => setCouponData((p: any) => ({ ...p, code: e.target.value.toUpperCase() }))}
                            required
                        />
                        <Textarea
                            placeholder="Description"
                            value={couponData.description}
                            onChange={e => setCouponData((p: any) => ({ ...p, description: e.target.value }))}
                        />
                        <div className="flex gap-2">
                            <Select value={couponData.discountType} onValueChange={(v: any) => setCouponData((p: any) => ({ ...p, discountType: v }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="FLAT">Flat ₹</SelectItem>
                                    <SelectItem value="PERCENTAGE">Percentage %</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input
                                type="number"
                                placeholder="Amount"
                                value={couponData.discountAmount}
                                onChange={e => setCouponData((p: any) => ({ ...p, discountAmount: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Input
                                type="number"
                                placeholder="Min Order Value"
                                value={couponData.minOrderValue}
                                onChange={e => setCouponData((p: any) => ({ ...p, minOrderValue: e.target.value }))}
                            />
                            <Input
                                type="number"
                                placeholder="Max Discount (for %)"
                                value={couponData.maxDiscount}
                                onChange={e => setCouponData((p: any) => ({ ...p, maxDiscount: e.target.value }))}
                                disabled={couponData.discountType === 'FLAT'}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Expires At</Label>
                            <Input
                                type="datetime-local"
                                value={couponData.expiresAt}
                                onChange={e => setCouponData((p: any) => ({ ...p, expiresAt: e.target.value }))}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={creatingCoupon}>
                            {creatingCoupon ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                            {creatingCoupon ? 'Creating...' : 'Create Coupon'}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
