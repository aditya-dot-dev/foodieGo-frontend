import { DollarSign, CreditCard, ShoppingBag, Bike, TrendingUp, Activity, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface AdminOverviewTabProps {
    stats: any;
    loadingStats: boolean;
    fleet: any[];
    setActiveTab: (tab: string) => void;
    pendingVerificationCount: number;
    formatPrice: (price: number) => string;
}

export function AdminOverviewTab({
    stats,
    loadingStats,
    fleet,
    setActiveTab,
    pendingVerificationCount,
    formatPrice
}: AdminOverviewTabProps) {
    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Platform Revenue', value: formatPrice(stats?.totalRevenue || 0), sub: 'Gross merchandise value', icon: DollarSign, color: 'from-blue-600 to-indigo-700' },
                    { label: 'Platform Earnings', value: formatPrice(stats?.platformCommission || 0), sub: '20% platform commission', icon: CreditCard, color: 'from-emerald-600 to-teal-700' },
                    { label: 'Total Orders', value: stats?.totalOrders || 0, sub: 'All-time platform orders', icon: ShoppingBag, color: 'from-orange-500 to-red-600' },
                    { label: 'Active Fleet', value: fleet.filter((f: any) => f.isAvailable).length, sub: 'Online delivery partners', icon: Bike, color: 'from-zinc-800 to-black' },
                ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-xl bg-gradient-to-br transition-transform hover:scale-[1.02] duration-300 overflow-hidden text-white relative">
                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.color}`} />
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <stat.icon className="h-20 w-20" />
                        </div>
                        <CardHeader className="relative pb-2">
                            <CardTitle className="text-white/70 text-[10px] font-bold uppercase tracking-wider">{stat.label}</CardTitle>
                        </CardHeader>
                        <CardContent className="relative">
                            <div className="text-2xl font-black">{loadingStats ? <Skeleton className="h-8 w-24 bg-white/20" /> : stat.value}</div>
                            <p className="text-white/60 text-[10px] mt-1 font-medium">{stat.sub}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
                                <TrendingUp className="h-4 w-4 text-orange-500" />
                                Platform Insights
                            </CardTitle>
                            <Badge variant="outline" className="rounded-full bg-white dark:bg-zinc-800 text-[10px]">Real-time</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">User Demographics</p>
                                {stats?.usersByRole.map((item: any) => (
                                    <div key={item.role} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-2 w-2 rounded-full ${item.role === 'ADMIN' ? 'bg-zinc-950' : 'bg-orange-500'}`} />
                                            <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 capitalize">{item.role.toLowerCase().replace('_', ' ')}</span>
                                        </div>
                                        <span className="font-black text-sm">{item._count}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Order Pipeline</p>
                                {stats?.ordersByStatus.map((item: any) => (
                                    <div key={item.status} className="space-y-1.5">
                                        <div className="flex items-center justify-between text-[11px] font-bold">
                                            <span className="text-zinc-500">{item.status}</span>
                                            <span className="text-zinc-900">{item._count}</span>
                                        </div>
                                        <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${item.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-orange-500'}`}
                                                style={{ width: `${stats.totalOrders > 0 ? (item._count / stats.totalOrders) * 100 : 0}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-orange-200 bg-orange-50/20 shadow-sm rounded-2xl">
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2 text-orange-600 font-black uppercase tracking-tighter">
                            <Activity className="h-4 w-4" />
                            System Alerts
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {pendingVerificationCount > 0 && (
                            <div className="p-4 rounded-xl bg-white border border-orange-100 shadow-sm">
                                <p className="text-sm font-bold text-zinc-900">{pendingVerificationCount} New Partners</p>
                                <p className="text-[11px] text-zinc-500 mt-1">Pending verification applications</p>
                                <Button onClick={() => setActiveTab('verifications')} className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-xs font-bold h-8 rounded-lg">Review Applications</Button>
                            </div>
                        )}
                        <div className="p-4 rounded-xl bg-white/50 border border-zinc-100">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-zinc-500">API Latency</span>
                                <Badge variant="success" className="h-5 text-[9px]">Normal</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
