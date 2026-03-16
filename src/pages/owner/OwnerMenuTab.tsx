import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { restaurantApi } from '@/lib/api';
import { MenuCategory } from '@/types';
import { Pencil, Trash2 } from 'lucide-react';

interface OwnerMenuTabProps {
    restaurantId: string;
    categories: MenuCategory[];
    loadingCategories: boolean;
    onRefresh: () => Promise<void>;
}

export function OwnerMenuTab({
    restaurantId,
    categories,
    loadingCategories,
    onRefresh
}: OwnerMenuTabProps) {
    const { toast } = useToast();
    const [categoryData, setCategoryData] = useState({ name: '' });
    const [categoryLoading, setCategoryLoading] = useState(false);

    const [menuItemData, setMenuItemData] = useState({
        categoryId: '',
        name: '',
        description: '',
        price: '',
        isVeg: false,
        imageUrl: null as string | File | null,
    });
    const [menuItemLoading, setMenuItemLoading] = useState(false);

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        setCategoryLoading(true);
        try {
            await restaurantApi.addCategory(restaurantId, categoryData);
            toast({ title: 'Category added' });
            setCategoryData({ name: '' });
            await onRefresh();
        } finally {
            setCategoryLoading(false);
        }
    };

    const handleAddMenuItem = async (e: React.FormEvent) => {
        e.preventDefault();

        // Image validation if file selected
        if (menuItemData.imageUrl instanceof File) {
            if (menuItemData.imageUrl.size > 5 * 1024 * 1024) {
                toast({ title: 'Image too large', description: 'Max size is 5MB', variant: 'destructive' });
                return;
            }
            if (!menuItemData.imageUrl.type.startsWith('image/')) {
                toast({ title: 'Invalid file type', description: 'Please upload an image', variant: 'destructive' });
                return;
            }
        }

        setMenuItemLoading(true);
        toast({ title: 'Adding item...', description: 'Uploading item image to menu.' });

        try {
            await restaurantApi.addMenuItem(restaurantId, {
                name: menuItemData.name,
                description: menuItemData.description,
                price: parseFloat(menuItemData.price),
                categoryId: menuItemData.categoryId,
                isVeg: menuItemData.isVeg,
                imageUrl: menuItemData.imageUrl || undefined,
            });
            toast({ title: 'Menu item added successfully' });
            setMenuItemData({ categoryId: '', name: '', description: '', price: '', isVeg: false, imageUrl: null });
            await onRefresh();
        } catch (error) {
            toast({
                title: 'Addition failed',
                description: error instanceof Error ? error.message : 'Failed to add menu item',
                variant: 'destructive',
            });
        } finally {
            setMenuItemLoading(false);
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Menu Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {loadingCategories ? (
                        <p className="text-sm text-muted-foreground">Loading menu…</p>
                    ) : categories.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No categories yet</p>
                    ) : (
                        categories.map(cat => (
                            <div key={cat.id} className="border rounded-lg p-3">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="font-medium">{cat.name}</p>
                                    <span className="text-xs text-muted-foreground">
                                        {cat.menuItems?.length || 0} items
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    {cat.menuItems?.map(item => (
                                        <div key={item.id} className="flex justify-between items-center border rounded p-2">
                                            <div>
                                                <p className="text-sm font-medium">{item.name}</p>
                                                <p className="text-xs text-muted-foreground">₹{item.price}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="icon" variant="outline" disabled>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="outline" disabled>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Add Category */}
                <Card>
                    <CardHeader>
                        <CardTitle>Add Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddCategory} className="space-y-3">
                            <Input
                                placeholder="Category name"
                                value={categoryData.name}
                                onChange={e => setCategoryData({ name: e.target.value })}
                            />
                            <Button className="w-full" disabled={categoryLoading}>
                                Add Category
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Add Menu Item */}
                <Card>
                    <CardHeader>
                        <CardTitle>Add Menu Item</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddMenuItem} className="space-y-3">
                            <Select value={menuItemData.categoryId} onValueChange={v => setMenuItemData(p => ({ ...p, categoryId: v }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(c => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input placeholder="Item name" value={menuItemData.name} onChange={e => setMenuItemData(p => ({ ...p, name: e.target.value }))} />
                            <Input placeholder="Description" value={menuItemData.description} onChange={e => setMenuItemData(p => ({ ...p, description: e.target.value }))} />
                            <Input placeholder="Price" type="number" value={menuItemData.price} onChange={e => setMenuItemData(p => ({ ...p, price: e.target.value }))} />
                            <div className="space-y-2">
                                <Label className="text-xs">Item Image</Label>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setMenuItemData(p => ({ ...p, imageUrl: file }));
                                        }
                                    }}
                                />
                                {menuItemData.imageUrl && (
                                    <div className="mt-2 rounded-lg overflow-hidden border h-20 w-20">
                                        <img
                                            src={typeof menuItemData.imageUrl === 'string' ? menuItemData.imageUrl : URL.createObjectURL(menuItemData.imageUrl)}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                            </div>

                            <Button className="w-full" disabled={menuItemLoading}>
                                {menuItemLoading ? 'Adding...' : 'Add Menu Item'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
