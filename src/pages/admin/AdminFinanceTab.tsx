import { DollarSign } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AdminFinanceTabProps {
    stats: any;
    onProcessPayout: (payoutId: string) => Promise<void>;
    formatPrice: (price: number) => string;
}

export function AdminFinanceTab({
    stats,
    onProcessPayout,
    formatPrice
}: AdminFinanceTabProps) {
    const pendingPayouts = stats?.pendingPayouts || [];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl relative overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-white/70 text-[10px] font-bold uppercase tracking-wider">Total Platform Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{formatPrice(stats?.totalRevenue || 0)}</div>
                        <p className="text-white/60 text-[10px] mt-1 font-medium">Accumulated Commission (20%)</p>
                    </CardContent>
                    <DollarSign className="absolute -bottom-4 -right-4 h-24 w-24 opacity-10" />
                </Card>
            </div>

            <Card className="border-zinc-200 overflow-hidden rounded-2xl bg-white shadow-sm">
                <CardHeader className="border-b border-zinc-100 bg-zinc-50/50">
                    <CardTitle className="text-base text-zinc-900">Pending Payout Requests</CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-50 border-b border-zinc-200">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase">Requester</th>
                                <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase">Amount</th>
                                <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase">Requested At</th>
                                <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {pendingPayouts.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center text-muted-foreground py-8">
                                        No pending payout requests
                                    </td>
                                </tr>
                            ) : (
                                pendingPayouts.map((payout: any) => (
                                    <tr key={payout.id} className="hover:bg-zinc-50/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm text-zinc-900">
                                                    {payout.wallet.restaurant ? payout.wallet.restaurant.name : payout.wallet.user?.name || 'Unknown'}
                                                </span>
                                                <span className="text-[10px] text-zinc-500">
                                                    {payout.wallet.restaurant ? 'Restaurant Partner' : 'Delivery Partner'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-black text-sm">{formatPrice(payout.amount)}</td>
                                        <td className="px-6 py-4 text-xs font-medium text-zinc-500">{new Date(payout.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                size="sm"
                                                className="bg-zinc-900 text-white hover:bg-black h-8 text-xs font-bold"
                                                onClick={() => onProcessPayout(payout.id)}
                                            >
                                                Process Payout
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
