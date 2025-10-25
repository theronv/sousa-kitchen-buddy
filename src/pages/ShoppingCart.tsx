import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MobileLayout } from "@/components/Layout/MobileLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ShoppingCart, CheckCircle2, Trash2, Edit2, Check, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ShoppingItem {
  id: string;
  ingredient: string;
  purchased: boolean;
  recipe_id?: string;
  item_type: string;
  expiration_date?: string;
  is_cold: boolean;
}

export default function ShoppingCartPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<ShoppingItem>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ShoppingItem | null>(null);

  useEffect(() => {
    fetchItems();
  }, [user]);

  const fetchItems = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("shopping_list")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) toast.error("Failed to load shopping list");
    else setItems(data || []);
    setLoading(false);
  };

  const startEdit = (item: ShoppingItem) => {
    setEditingId(item.id);
    setEditValues({
      ingredient: item.ingredient,
      item_type: item.item_type,
      expiration_date: item.expiration_date,
      is_cold: item.is_cold,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const saveEdit = async (id: string) => {
    const { error } = await supabase
      .from("shopping_list")
      .update(editValues)
      .eq("id", id);

    if (error) {
      toast.error("Failed to update item");
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ...editValues } : item
      )
    );
    toast.success("Item updated");
    cancelEdit();
  };

  const handleDelete = (item: ShoppingItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async (addToInventory: boolean) => {
    if (!itemToDelete) return;

    if (addToInventory) {
      const pantryItem = {
        user_id: user?.id,
        item_name: itemToDelete.ingredient,
        category: itemToDelete.item_type,
        status: "Fresh",
        purchased_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase
        .from("pantry")
        .insert([pantryItem]);

      if (insertError) {
        toast.error("Failed to add to pantry");
        return;
      }
    }

    const { error } = await supabase
      .from("shopping_list")
      .delete()
      .eq("id", itemToDelete.id);

    if (error) {
      toast.error("Failed to remove item");
      return;
    }

    setItems((prev) => prev.filter((i) => i.id !== itemToDelete.id));
    toast.success(
      addToInventory
        ? `Moved "${itemToDelete.ingredient}" to pantry`
        : "Item removed"
    );
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const markAllAsShopped = async () => {
    if (!user) return;

    const unpurchasedItems = items.filter((item) => !item.purchased);
    
    if (unpurchasedItems.length === 0) {
      toast.info("No items to shop");
      return;
    }

    // Add all items to pantry
    const pantryInserts = unpurchasedItems.map((item) => ({
      user_id: user.id,
      item_name: item.ingredient,
      category: item.item_type,
      status: "Fresh",
      purchased_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from("pantry")
      .insert(pantryInserts);

    if (insertError) {
      toast.error("Failed to add items to pantry");
      return;
    }

    // Delete all items from cart
    const { error: deleteError } = await supabase
      .from("shopping_list")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      toast.error("Failed to clear cart");
      return;
    }

    setItems([]);
    toast.success(`Moved ${unpurchasedItems.length} items to pantry`);
  };

  const groupedItems = items.reduce((acc, item) => {
    const type = item.item_type || "Other";
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  return (
    <MobileLayout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-primary" />
            Shopping Cart
          </h1>
          {items.length > 0 && (
            <Button
              onClick={markAllAsShopped}
              className="flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark as Shopped
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin w-6 h-6 text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">
            <p>Your shopping list is empty.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedItems).map(([type, typeItems]) => (
              <div key={type}>
                <h2 className="text-sm font-semibold text-muted-foreground mb-2">{type}</h2>
                <div className="space-y-2">
                  {typeItems.map((item) => (
                    <Card key={item.id} className="p-3 shadow-card">
                      {editingId === item.id ? (
                        <div className="space-y-2">
                          <Input
                            value={editValues.ingredient || ""}
                            onChange={(e) =>
                              setEditValues({ ...editValues, ingredient: e.target.value })
                            }
                            placeholder="Item name"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Select
                              value={editValues.item_type}
                              onValueChange={(v) =>
                                setEditValues({ ...editValues, item_type: v })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Produce">Produce</SelectItem>
                                <SelectItem value="Dairy">Dairy</SelectItem>
                                <SelectItem value="Meat">Meat</SelectItem>
                                <SelectItem value="Pantry">Pantry</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              type="date"
                              value={editValues.expiration_date || ""}
                              onChange={(e) =>
                                setEditValues({ ...editValues, expiration_date: e.target.value })
                              }
                              placeholder="Expiration"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEdit}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => saveEdit(item.id)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <span className="font-medium text-foreground">{item.ingredient}</span>
                            {item.is_cold && (
                              <span className="ml-2 text-xs text-primary">❄️ Cold</span>
                            )}
                            {item.expiration_date && (
                              <p className="text-xs text-muted-foreground">
                                Exp: {new Date(item.expiration_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEdit(item)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(item)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Item</AlertDialogTitle>
            <AlertDialogDescription>
              Do you want to add "{itemToDelete?.ingredient}" to your inventory before removing it from the cart?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => confirmDelete(false)}>
              Just Remove
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDelete(true)}>
              Add to Inventory
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MobileLayout>
  );
}
