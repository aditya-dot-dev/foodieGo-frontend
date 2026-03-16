
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
    DollarSign,
    TrendingUp,
    History,
    ArrowUpRight,
    ArrowDownLeft,
    Wallet,
    Building2,
    Loader2,
    AlertCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface WalletTabProps {
    restaurantId: string;
}

export function WalletTab({ restaurantId }: WalletTabProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [payoutAmount, setPayoutAmount] = useState('');
    const [isRequestingPayout, setIsRequestingPayout] = useState(false);

    // Fetch wallet data
    const { data: walletData, isLoading, error } = useQuery({
        queryKey: ['wallet', restaurantId],
        queryFn: () => financeApi.getWallet(restaurantId),
    });

    // Request Payout Mutation
    const requestPayoutMutation = useMutation({
        mutationFn: (amount: number) => financeApi.requestPayout(amount),
        onSuccess: () => {
            toast({
                title: 'Payout Requested',
                description: 'Your request has been submitted to admin for processing.',
            });
            setIsRequestingPayout(false);
            setPayoutAmount('');
            queryClient.invalidateQueries({ queryKey: ['wallet', restaurantId] });
        },
        onError: (error: any) => {
            toast({
                title: 'Request Failed',
                description: error.message || 'Could not submit payout request',
                variant: 'destructive',
            });
        },
    });

    const handlePayoutRequest = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(payoutAmount);
        if (!amount || amount <= 0) return;
        if (amount > (walletData?.balance || 0)) {
            toast({ title: 'Insufficient Balance', variant: 'destructive' });
            return;
        }
        requestPayoutMutation.mutate(amount);
    };

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(price);

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <Card className="border-destructive bg-destructive/5 text-destructive">
                <CardContent className="p-6 text-center">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p className="font-bold">Error loading wallet</p>
                    <p className="text-sm opacity-80">{(error as any).message}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Wallet Overview Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 border-none shadow-xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-[24px] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Wallet className="h-32 w-32" />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-indigo-100 uppercase tracking-widest text-xs font-bold">Total Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                            <div>
                                <h2 className="text-5xl font-black tracking-tighter mb-2">{formatPrice(walletData?.balance || 0)}</h2>
                                <p className="text-indigo-200 text-sm font-medium">Available for payout</p>
                            </div>

                            <Dialog open={isRequestingPayout} onOpenChange={setIsRequestingPayout}>
                                <DialogTrigger asChild>
                                    <Button className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold rounded-xl shadow-lg border-2 border-transparent hover:border-indigo-200 transition-all">
                                        <ArrowUpRight className="mr-2 h-4 w-4" /> Request Payout
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px] rounded-2xl">
                                    <DialogHeader>
                                        <DialogTitle>Request Payout</DialogTitle>
                                        <DialogDescription>
                                            Withdraw funds from your wallet to your registered bank account.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handlePayoutRequest} className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="amount" className="text-right">Amount (INR)</Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-gray-500 font-bold">₹</span>
                                                <Input
                                                    id="amount"
                                                    type="number"
                                                    placeholder="0.00"
                                                    className="pl-8 font-bold text-lg"
                                                    value={payoutAmount}
                                                    onChange={(e) => setPayoutAmount(e.target.value)}
                                                    max={walletData?.balance}
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground text-right">Max available: {formatPrice(walletData?.balance || 0)}</p>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" disabled={requestPayoutMutation.isPending} className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl h-11">
                                                {requestPayoutMutation.isPending ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing
                                                    </>
                                                ) : 'Confirm Withdrawal'}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Stats or Pending Payout Info */}
                <Card className="border-none shadow-lg bg-white rounded-[24px]">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Pending Payouts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {walletData?.payouts?.filter((p: any) => p.status === 'PENDING').length > 0 ? (
                            <div className="space-y-4">
                                {walletData.payouts.filter((p: any) => p.status === 'PENDING').map((payout: any) => (
                                    <div key={payout.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                                        <div>
                                            <p className="font-bold text-amber-900">{formatPrice(payout.amount)}</p>
                                            <p className="text-[10px] text-amber-700">{format(new Date(payout.createdAt), 'MMM dd')}</p>
                                        </div>
                                        <Badge variant="outline" className="bg-white text-amber-600 border-amber-200 text-[10px] font-bold">PENDING</Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-2">
                                <Building2 className="h-10 w-10 text-muted-foreground" />
                                <p className="text-xs font-semibold">No pending requests</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
                {/* Transaction History */}
                <div className="lg:col-span-2">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <History className="h-5 w-5 text-gray-400" /> Recent Transactions
                    </h3>
                    <div className="space-y-3">
                        {walletData?.transactions?.length === 0 ? (
                            <Card className="border-dashed bg-gray-50/50">
                                <CardContent className="py-12 text-center text-muted-foreground">
                                    No transactions yet.
                                </CardContent>
                            </Card>
                        ) : (
                            walletData?.transactions?.map((txn: any) => (
                                <Card key={txn.id} className="group hover:shadow-md transition-all border-l-4 border-l-transparent hover:border-l-indigo-500 overflow-hidden">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${txn.type === 'ORDER_CREDIT' || txn.type === 'ADD_FUNDS' || txn.type === 'REFUND'
                                                ? 'bg-green-100 text-green-600'
                                                : 'bg-red-100 text-red-600'
                                                }`}>
                                                {txn.type === 'ORDER_CREDIT' ? <TrendingUp className="h-5 w-5" /> :
                                                    txn.type === 'PAYOUT' ? <ArrowUpRight className="h-5 w-5" /> :
                                                        <DollarSign className="h-5 w-5" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{txn.description}</p>
                                                <p className="text-xs text-muted-foreground">{format(new Date(txn.createdAt), 'PPP p')}</p>
                                            </div>
                                        </div>
                                        <div className={`text-right font-black ${txn.type === 'ORDER_CREDIT' || txn.type === 'ADD_FUNDS' || txn.type === 'REFUND'
                                            ? 'text-green-600'
                                            : 'text-zinc-900'
                                            }`}>
                                            {txn.type === 'ORDER_CREDIT' ? '+' : '-'} {formatPrice(txn.amount)}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div>

                {/* Payout History */}
                <div>
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-gray-400" /> Payout History
                    </h3>
                    <div className="space-y-3">
                        {walletData?.payouts?.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No payout history.</p>
                        ) : (
                            walletData?.payouts?.map((payout: any) => (
                                <div key={payout.id} className="flex justify-between items-center p-3 text-sm bg-white border rounded-xl shadow-sm">
                                    <div>
                                        <p className="font-bold">{formatPrice(payout.amount)}</p>
                                        <p className="text-[10px] text-muted-foreground">{format(new Date(payout.createdAt), 'MMM dd, yyyy')}</p>
                                    </div>
                                    <Badge variant={payout.status === 'PROCESSED' ? 'success' : payout.status === 'REJECTED' ? 'destructive' : 'outline'} className="text-[10px] h-5">
                                        {payout.status}
                                    </Badge>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
