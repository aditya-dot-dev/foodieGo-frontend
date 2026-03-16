import { Bike } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AdminFleetTabProps {
    fleet: any[];
}

export function AdminFleetTab({ fleet }: AdminFleetTabProps) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-zinc-900 text-white border-none shadow-xl rounded-2xl p-6 relative overflow-hidden">
                    <Bike className="absolute -bottom-4 -right-4 h-24 w-24 opacity-10" />
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total Fleet</p>
                    <p className="text-3xl font-black mt-1">{fleet.length}</p>
                </Card>
                <Card className="bg-white border-zinc-200 shadow-sm rounded-2xl p-6">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Available Now</p>
                    <div className="flex items-center gap-2">
                        <p className="text-3xl font-black mt-1 text-emerald-600">
                            {fleet.filter((f: any) => f.isAvailable).length}
                        </p>
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse mt-1" />
                    </div>
                </Card>
            </div>

            <Card className="border-zinc-200 overflow-hidden rounded-2xl">
                <table className="w-full text-left">
                    <thead className="bg-zinc-50 border-b border-zinc-200">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase">Partner</th>
                            <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase">Contact</th>
                            <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase">Live Status</th>
                            <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase text-right">Activity</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {fleet.map((f: any) => (
                            <tr key={f.id} className="hover:bg-zinc-50/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center font-black text-zinc-400">
                                            {f.name.charAt(0)}
                                        </div>
                                        <span className="font-bold text-sm">{f.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-xs font-semibold">{f.email}</p>
                                    <p className="text-[10px] text-zinc-500">{f.phone || 'No Phone'}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <Badge variant={f.isAvailable ? 'success' : 'outline'} className="text-[9px] font-black h-5">
                                        {f.isAvailable ? 'ONLINE • AVAILABLE' : 'OFFLINE'}
                                    </Badge>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="font-black text-sm">{f._count.deliveryOrders}</span>
                                    <span className="text-[9px] text-zinc-400 ml-1 uppercase">Jobs</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}
