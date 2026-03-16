import { Store, CheckCircle2, Ban, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface AdminPartnersTabProps {
    restaurants: any[];
    loadingRestaurants: boolean;
    onToggleStatus: (id: string) => void;
    onToggleVerification: (id: string) => void;
}

export function AdminPartnersTab({
    restaurants,
    loadingRestaurants,
    onToggleStatus,
    onToggleVerification
}: AdminPartnersTabProps) {
    return (
        <Card className="border-zinc-200 overflow-hidden rounded-2xl shadow-sm bg-white">
            <table className="w-full text-left">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase">Establishment</th>
                        <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase">Verification</th>
                        <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase">Performance</th>
                        <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase">Ops</th>
                        <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                    {loadingRestaurants ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i}>
                                <td colSpan={5} className="p-4">
                                    <Skeleton className="h-10 w-full" />
                                </td>
                            </tr>
                        ))
                    ) : restaurants.map((res: any) => (
                        <tr key={res.id} className="hover:bg-zinc-50/30 transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-zinc-100 overflow-hidden flex items-center justify-center">
                                        {res.imageUrl ? (
                                            <img src={res.imageUrl} className="h-full w-full object-cover" alt={res.name} />
                                        ) : (
                                            <Store className="h-5 w-5 text-zinc-300" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{res.name}</p>
                                        <p className="text-[10px] text-zinc-500">{res.cuisine || 'Multi-cuisine'}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div
                                    onClick={() => onToggleVerification(res.id)}
                                    className={`h-8 w-8 rounded-xl flex items-center justify-center cursor-pointer transition-all ${res.isVerified ? 'bg-emerald-50 text-emerald-500 shadow-sm' : 'bg-zinc-50 text-zinc-300 hover:bg-orange-50 hover:text-orange-500'}`}
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <span className="font-black text-sm">{res._count.orders}</span>
                                    <span className="text-[9px] font-bold text-zinc-400 uppercase">Deliveries</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <Badge variant={res.isOpen ? 'success' : 'destructive'} className="text-[9px] font-black h-5 uppercase tracking-tighter">
                                    {res.isOpen ? 'Active' : 'Halted'}
                                </Badge>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onToggleStatus(res.id)}
                                    className={`h-8 w-8 p-0 rounded-xl ${res.isOpen ? 'text-red-400 hover:bg-red-50' : 'text-emerald-400 hover:bg-emerald-50'}`}
                                >
                                    {res.isOpen ? <Ban className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Card>
    );
}
