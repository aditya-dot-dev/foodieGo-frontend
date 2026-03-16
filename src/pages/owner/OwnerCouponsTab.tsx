import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { couponApi } from '@/lib/api';
import { Coupon } from '@/types';

interface OwnerCouponsTabProps {
    restaurantId: string;
    coupons: Coupon[];
    loadingCoupons: boolean;
    onRefresh: (id: string) => Promise<void>;
}

export function OwnerCouponsTab({
    restaurantId,
    coupons,
    loadingCoupons,
    onRefresh
}: OwnerCouponsTabProps) {
    const { toast } = useToast();
    const [creatingCoupon, setCreatingCoupon] = useState(false);
    const [couponData, setCouponData] = useState({
        code: '',
        discountType: 'FLAT' as 'FLAT' | 'PERCENTAGE',
        discountAmount: '',
        minOrderValue: '',
        maxDiscount: '',
        expiresAt: '',
        description: ''
    });

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
                restaurantId: restaurantId
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
            await onRefresh(restaurantId);
        } catch (error) {
            toast({ title: 'Failed to create coupon', variant: 'destructive' });
        } finally {
            setCreatingCoupon(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* List */}
            <Card>
                <CardHeader>
                    <CardTitle>Active Coupons</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {loadingCoupons ? <p>Loading...</p> : coupons.length === 0 ? <p className="text-muted-foreground">No coupons found.</p> : (
                        coupons.map(coupon => (
                            <div key={coupon.id} className="border p-3 rounded-lg flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-primary">{coupon.code}</p>
                                    <p className="text-sm">{coupon.description}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {coupon.discountType === 'FLAT' ? `₹${coupon.discountAmount} OFF` : `${coupon.discountAmount}% OFF`}
                                        {' '}| Min Order: ₹{coupon.minOrderValue}
                                    </p>
                                </div>
                                <Badge variant={coupon.isActive ? 'default' : 'secondary'}>
                                    {coupon.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            {/* Create Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Create New Coupon</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreateCoupon} className="space-y-3">
                        <Input
                            placeholder="Coupon Code (e.g. SAVE50)"
                            value={couponData.code}
                            onChange={e => setCouponData(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                            required
                        />
                        <Textarea
                            placeholder="Description"
                            value={couponData.description}
                            onChange={e => setCouponData(p => ({ ...p, description: e.target.value }))}
                        />
                        <div className="flex gap-2">
                            <Select value={couponData.discountType} onValueChange={(v: any) => setCouponData(p => ({ ...p, discountType: v }))}>
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
                                onChange={e => setCouponData(p => ({ ...p, discountAmount: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Input
                                type="number"
                                placeholder="Min Order Value"
                                value={couponData.minOrderValue}
                                onChange={e => setCouponData(p => ({ ...p, minOrderValue: e.target.value }))}
                            />
                            <Input
                                type="number"
                                placeholder="Max Discount (for %)"
                                value={couponData.maxDiscount}
                                onChange={e => setCouponData(p => ({ ...p, maxDiscount: e.target.value }))}
                                disabled={couponData.discountType === 'FLAT'}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Expires At</Label>
                            <Input
                                type="datetime-local"
                                value={couponData.expiresAt}
                                onChange={e => setCouponData(p => ({ ...p, expiresAt: e.target.value }))}
                                required
                            />
                        </div>
                        <Button className="w-full" disabled={creatingCoupon}>
                            {creatingCoupon ? <Loader2 className="animate-spin h-4 w-4" /> : 'Create Coupon'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
