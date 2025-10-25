// src/pages/Pantry.tsx
import { useEffect, useState } from "react";
import { MobileLayout } from "@/components/Layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, ChevronDown, ChevronRight, Trash2, ShoppingCart, Edit2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PantryItem {
  id: string;
  name: string;
  category: string;
  status: "good" | "low" | "expiring";
  quantity?: string;
  expires_on?: string;
}

export default function Pantry() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);

  /** Fetch Pantry items **/
  const fetchPantry = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("pantry")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load pantry items");
      console.error(error);
      return;
    }

    setItems(data || []);
    const cats = Array.from(new Set((data || []).map((i) => i.category)));
    setCategories(cats);
    setLoading(false);
  };

  useEffect(() => {
    fetchPantry();
  }, [user]);

  const toggleCategory = (category: string) => {
    setExpanded((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("pantry").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete item");
      console.error(error);
    } else {
      toast.success("Item deleted");
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const handleMoveToCart = async (item: PantryItem) => {
    if (!user) return;
    const { error } = await supabase.from("shopping_list").insert({
      user_id: user.id,
      ingredient: item.name,
    });

    if (error) {
      toast.error("Failed to move to cart");
      console.error(error);
    } else {
      toast.success(`${item.name} moved to shopping cart`);
      await handleDelete(item.id);
    }
  };

  const expiringSoon = items.filter((i) => i.status === "expiring" || i.status === "low");

  return (
    <MobileLayout>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Pantry</h1>
          <Button size="sm" className="gap-2" onClick={() => toast.info("Add item modal coming soon!")}>
            <Plus className="w-4 h-4" />
            Add Item
          </Button>
        </div>

        {expiringSoon.length > 0 && (
          <Card className="p-4 bg-accent/10 border-accent/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-accent mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Items need attention</p>
                <p className="text-sm text-muted-foreground">
                  {expiringSoon.length} item{expiringSoon.length > 1 ? "s" : ""} are running low or expiring soon
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-4">
          {loading ? (
            <Card className="p-6 text-center text-muted-foreground">Loading pantry...</Card>
          ) : items.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">Your pantry is empty.</Card>
          ) : (
            categories.map((category) => {
              const categoryItems = items.filter((i) => i.category === category);
              if (categoryItems.length === 0) return null;

              return (
                <div key={category}>
                  <button
                    onClick={() => toggleCategory(category)}
                    className="flex items-center justify-between w-full mb-2"
                  >
                    <h2 className="text-sm font-semibold text-muted-foreground">{category}</h2>
                    {expanded[category] ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>

                  {expanded[category] && (
                    <div className="space-y-2">
                      {categoryItems.map((item) => (
                        <Card key={item.id} className="p-3 flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{item.name}</span>
                            {item.quantity && (
                              <span className="text-xs text-muted-foreground">{item.quantity}</span>
                            )}
                            {item.expires_on && (
                              <span className="text-xs text-muted-foreground">
                                Expires on {new Date(item.expires_on).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {item.status !== "good" && (
                              <Badge
                                variant={item.status === "low" ? "secondary" : "destructive"}
                                className="text-xs"
                              >
                                {item.status === "low" ? "Low" : "Expiring"}
                              </Badge>
                            )}
                            <Button size="icon" variant="ghost" onClick={() => toast.info("Edit coming soon!")}>
                              <Edit2 className="w-4 h-4 text-muted-foreground" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleMoveToCart(item)}>
                              <ShoppingCart className="w-4 h-4 text-primary" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(item.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
