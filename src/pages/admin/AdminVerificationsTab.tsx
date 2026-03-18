import { Store, ShieldCheck, User, Bike } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AdminVerificationsTabProps {
    pendingVerification: any[];
    isLoading?: boolean;
    onReject: (id: string) => void;
    onVerify: (item: any) => void;
}

export function AdminVerificationsTab({
    pendingVerification,
    isLoading = false,
    onReject,
    onVerify
}: AdminVerificationsTabProps) {
    if (isLoading) {
        return (
            <div className="bg-white rounded-3xl border border-zinc-200 py-16 text-center">
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Loading Pending Verifications</p>
                <p className="text-zinc-400 text-xs mt-1">Please wait while we fetch the latest applicants.</p>
            </div>
        );
    }

    if (pendingVerification.length === 0) {
        return (
            <div className="bg-white rounded-3xl border-2 border-dashed border-zinc-200 py-24 text-center">
                <ShieldCheck className="h-16 w-16 mx-auto text-zinc-200 mb-4" />
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">No Pending Reviews</p>
                <p className="text-zinc-400 text-xs mt-1">System is clean and partners are verified.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pendingVerification.map((res: any) => (
                <Card key={res.id} className="border-none shadow-2xl bg-white rounded-3xl overflow-hidden group">
                    <div className="h-44 bg-zinc-100 relative">
                        {res.imageUrl ? (
                            <img src={res.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" alt={res.name} />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200">
                                {res.role === 'DELIVERY_PARTNER' ? (
                                    <Bike className="h-12 w-12 text-zinc-300" />
                                ) : res.type === 'USER' ? (
                                    <User className="h-12 w-12 text-zinc-300" />
                                ) : (
                                    <Store className="h-12 w-12 text-zinc-300" />
                                )}
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-4 left-4">
                            <h3 className="text-white font-black text-xl">{res.name}</h3>
                            <div className="flex items-center gap-2">
                                <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest">{res.area !== 'N/A' ? `${res.area}, ${res.city}` : 'New Registration'}</p>
                                {res.role && (
                                    <Badge className="bg-white/20 text-white border-none text-[8px] uppercase backdrop-blur-sm">
                                        {res.role}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                    <CardContent className="p-6">
                        <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                            <p className="text-[10px] font-black text-zinc-400 uppercase mb-2">
                                {res.type === 'USER' ? 'Applicant Details' : 'Owner Profile'}
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center font-black text-xs text-zinc-500">
                                    {res.owner?.name?.charAt(0) || res.name?.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-bold">{res.owner?.name || res.name}</p>
                                    <p className="text-[10px] text-zinc-500">{res.owner?.email || res.email}</p>
                                </div>
                            </div>

                            {/* Vehicle Details for Delivery Partners */}
                            {res.vehicleType && (
                                <div className="mt-3 pt-3 border-t border-zinc-200">
                                    <p className="text-[10px] font-black text-zinc-400 uppercase mb-1">Vehicle Info</p>
                                    <div className="flex justify-between items-center text-xs font-bold text-zinc-600">
                                        <span className="capitalize">{res.vehicleType}</span>
                                        <span className="bg-zinc-200 px-2 py-0.5 rounded text-[10px]">{res.vehicleNumber}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-8">
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={() => onReject(res.id)}
                                className="rounded-2xl border-zinc-200 text-xs font-black uppercase text-zinc-500 hover:bg-red-50 hover:text-red-500 h-10 transition-all"
                            >
                                Reject
                            </Button>
                            <Button
                                size="lg"
                                onClick={() => onVerify(res)}
                                className="rounded-2xl bg-zinc-900 hover:bg-black text-white font-black uppercase text-[10px] h-10 shadow-lg shadow-zinc-900/20"
                            >
                                Verify {res.type === 'USER' ? 'User' : 'Partner'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
