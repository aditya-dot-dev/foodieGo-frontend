import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface AdminUsersTabProps {
    users: any[];
    loadingUsers: boolean;
}

export function AdminUsersTab({
    users,
    loadingUsers
}: AdminUsersTabProps) {
    return (
        <Card className="border-zinc-200 overflow-hidden rounded-2xl bg-white">
            <table className="w-full text-left">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase">User Identity</th>
                        <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase">System Rank</th>
                        <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase text-right">Engagement</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                    {loadingUsers ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i}>
                                <td colSpan={3} className="p-4">
                                    <Skeleton className="h-10 w-full" />
                                </td>
                            </tr>
                        ))
                    ) : users.map((user: any) => (
                        <tr key={user.id} className="hover:bg-zinc-50/30 transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-zinc-100 to-zinc-200 flex items-center justify-center font-black text-zinc-500 border border-white shadow-sm">
                                        {user.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{user.name}</p>
                                        <p className="text-[10px] text-zinc-500">{user.email}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <Badge
                                    variant="outline"
                                    className={`text-[10px] font-black border-none px-2 h-5 ${user.role === 'ADMIN' ? 'bg-zinc-900 text-white' : 'bg-zinc-50 text-zinc-500'}`}
                                >
                                    {user.role}
                                </Badge>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <span className="font-black text-sm">{user._count.orders}</span>
                                <span className="text-[9px] text-zinc-400 ml-1 font-bold uppercase">Orders</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Card>
    );
}
