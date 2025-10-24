import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MobileLayout } from "@/components/Layout/MobileLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ShoppingCart, CheckCircle2, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ShoppingItem {
  id: string;
  ingredient: string;
  purchased: boolean;
  recipe_id?: string;
}

export default function ShoppingCartPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 🧭 Fetch list
  useEffect(() => {
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

    fetchItems();
  }, [user]);

  // 🧩 Toggle purchased + add to pantry
  const togglePurchased = async (id: string, purchased: boolean) => {
    const { data: item } = await supabase
      .from("shopping_list")
      .select("*")
      .eq("id", id)
      .single();

    if (!item) return;

    // 1️⃣ Update purchased status
    const { error: updateError } = await supabase
      .from("shopping_list")
      .update({ purchased: !purchased })
      .eq("id", id);

    if (updateError) {
      toast.error("Failed to update item");
      return;
    }

    // 2️⃣ If purchased = true, move to pantry
    if (!purchased) {
      const pantryItem = {
        user_id: user?.id,
        item_name: item.ingredient,
        category: "Pantry",
        status: "Fresh",
        purchased_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase
        .from("pantry")
        .insert([pantryItem]);

      if (insertError) {
        console.error(insertError);
        toast.error("Failed to add to pantry");
      } else {
        toast.success(`Added "${item.ingredient}" to your pantry`);
      }
    }

    // 3️⃣ Update local UI
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, purchased: !purchased } : i
      )
    );
  };

  // 🧹 Clear purchased items
  const clearPurchased = async () => {
    const { error } = await supabase
      .from("shopping_list")
      .delete()
      .eq("user_id", user?.id)
      .eq("purchased", true);

    if (error) toast.error("Failed to clear items");
    else {
      toast.success("Cleared purchased items");
      setItems((prev) => prev.filter((i) => !i.purchased));
    }
  };

  return (
    <MobileLayout>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-primary" />
            Shopping Cart
          </h1>
          {items.some((i) => i.purchased) && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearPurchased}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </Button>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin w-6 h-6 text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">
            <p>Your shopping list is empty.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <Card
                key={item.id}
                className={`flex items-center justify-between p-4 transition-all ${
                  item.purchased
                    ? "opacity-60 bg-muted/40 line-through"
                    : "hover:bg-secondary/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={item.purchased}
                    onCheckedChange={() =>
                      togglePurchased(item.id, item.purchased)
                    }
                  />
                  <span className="text-sm font-medium">{item.ingredient}</span>
                </div>
                {item.purchased && (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
