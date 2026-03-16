import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { restaurantApi } from '@/lib/api';
import { searchPlaces } from '@/lib/mapbox';
import { Restaurant } from '@/types';
import { Pencil, ImageIcon, Store, Save, Loader2 } from 'lucide-react';

interface OwnerSettingsTabProps {
    restaurant: Restaurant;
    settingsData: any;
    setSettingsData: React.Dispatch<React.SetStateAction<any>>;
    settingsLoading: boolean;
    setSettingsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    addressResults: any[];
    setAddressResults: React.Dispatch<React.SetStateAction<any[]>>;
    setIsSearchingAddress: React.Dispatch<React.SetStateAction<boolean>>;
    onUpdateSuccess: (updated: any) => void;
    onToggleStatus: () => Promise<void>;
}

export function OwnerSettingsTab({
    restaurant,
    settingsData,
    setSettingsData,
    settingsLoading,
    setSettingsLoading,
    addressResults,
    setAddressResults,
    setIsSearchingAddress,
    onUpdateSuccess,
    onToggleStatus
}: OwnerSettingsTabProps) {
    const { toast } = useToast();

    const handleUpdateSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!restaurant) return;

        // Image validation if file selected
        if (settingsData.imageUrl instanceof File) {
            if (settingsData.imageUrl.size > 5 * 1024 * 1024) {
                toast({ title: 'Image too large', description: 'Max size is 5MB', variant: 'destructive' });
                return;
            }
            if (!settingsData.imageUrl.type.startsWith('image/')) {
                toast({ title: 'Invalid file type', description: 'Please upload an image', variant: 'destructive' });
                return;
            }
        }

        setSettingsLoading(true);
        toast({ title: 'Updating...', description: 'Saving changes and uploading new image if changed.' });

        try {
            const result = await restaurantApi.update(restaurant.id, settingsData);
            toast({ title: 'Restaurant updated successfully' });
            onUpdateSuccess(result);
        } catch (error) {
            toast({ title: 'Failed to update restaurant', variant: 'destructive' });
        } finally {
            setSettingsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Pencil className="h-5 w-5" />
                    Restaurant Settings
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleUpdateSettings} className="space-y-4">
                    {/* Restaurant Image Preview */}
                    <div className="space-y-3">
                        <Label className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" />
                            Restaurant Image
                        </Label>
                        <div className="flex items-start gap-4">
                            <div className="relative w-32 h-32 rounded-lg overflow-hidden border bg-muted flex-shrink-0">
                                {settingsData.imageUrl ? (
                                    <img
                                        src={typeof settingsData.imageUrl === 'string' ? settingsData.imageUrl : URL.createObjectURL(settingsData.imageUrl)}
                                        alt={settingsData.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                        }}
                                    />
                                ) : null}
                                <div className={`absolute inset-0 flex items-center justify-center bg-muted ${settingsData.imageUrl ? 'hidden' : ''}`}>
                                    <Store className="h-10 w-10 text-muted-foreground" />
                                </div>
                            </div>
                            <div className="flex-1 space-y-2">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setSettingsData((p: any) => ({ ...p, imageUrl: file }));
                                        }
                                    }}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Upload a high-quality image of your restaurant. This will be shown to customers.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="settings-name">Restaurant Name</Label>
                            <Input
                                id="settings-name"
                                value={settingsData.name}
                                onChange={e => setSettingsData((p: any) => ({ ...p, name: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="settings-cuisine">Cuisine Type</Label>
                            <Input
                                id="settings-cuisine"
                                value={settingsData.cuisine}
                                onChange={e => setSettingsData((p: any) => ({ ...p, cuisine: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="settings-price">Cost for Two</Label>
                            <Input
                                id="settings-price"
                                placeholder="e.g. ₹600 for two"
                                value={settingsData.priceRange}
                                onChange={e => setSettingsData((p: any) => ({ ...p, priceRange: e.target.value }))}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="settings-address">Address</Label>
                        <Input
                            id="settings-address"
                            placeholder="Search restaurant address"
                            value={settingsData.address}
                            onChange={async (e) => {
                                const value = e.target.value;
                                setSettingsData((p: any) => ({ ...p, address: value }));

                                if (value.length < 3) {
                                    setAddressResults([]);
                                    return;
                                }

                                setIsSearchingAddress(true);
                                const results = await searchPlaces(value);
                                setAddressResults(results);
                                setIsSearchingAddress(false);
                            }}
                            required
                        />
                        {addressResults.length > 0 && (
                            <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border bg-background shadow">
                                {addressResults.map((r, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                                        onClick={() => {
                                            setSettingsData((p: any) => ({
                                                ...p,
                                                address: r.place_name,
                                                city: r.city,
                                                area: r.area,
                                                lat: r.lat,
                                                lng: r.lng,
                                            }));
                                            setAddressResults([]);
                                        }}
                                    >
                                        {r.place_name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="settings-description">Description</Label>
                        <Textarea
                            id="settings-description"
                            value={settingsData.description}
                            onChange={e => setSettingsData((p: any) => ({ ...p, description: e.target.value }))}
                            placeholder="Tell customers about your restaurant..."
                            rows={3}
                        />
                    </div>

                    <div className="pt-2">
                        <Button
                            type="submit"
                            className="w-full md:w-auto"
                            disabled={settingsLoading || !settingsData.name || !settingsData.cuisine || !settingsData.address}
                        >
                            {settingsLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Status Display (read-only) */}
                    <div className="pt-4 mt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                            <strong>Status:</strong>{' '}
                            <span className={restaurant.isOpen ? 'text-green-600' : 'text-red-500'}>
                                {restaurant.isOpen ? 'Open' : 'Closed'}
                            </span>
                        </p>

                        <Button
                            type="button"
                            variant={restaurant.isOpen ? 'destructive' : 'default'}
                            className="mt-2"
                            onClick={onToggleStatus}
                        >
                            {restaurant.isOpen ? 'Mark as Closed' : 'Mark as Open'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
