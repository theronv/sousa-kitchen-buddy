// src/pages/Pantry.tsx
import { useState } from "react";
import { MobileLayout } from "@/components/Layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, ChevronDown, ChevronRight, Trash2, ShoppingCart, Edit2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface PantryItem {
  id: string;
  name: string;
  category: string;
  status: "good" | "low" | "expiring";
  quantity: string;
  expires_on?: string;
}

const initialItems: PantryItem[] = [
  { id: "1", name: "Olive Oil", category: "Pantry", status: "good", quantity: "1 bottle" },
  { id: "2", name: "Pasta", category: "Pantry", status: "low", quantity: "1 bag" },
  { id: "3", name: "Tomatoes", category: "Produce", status: "expiring", quantity: "3" },
  { id: "4", name: "Milk", category: "Dairy", status: "good", quantity: "1 gallon" },
];

export default function Pantry() {
  const [categories, setCategories] = useState(["Produce", "Dairy", "Pantry"]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [items, setItems] = useState(initialItems);

  const toggleCategory = (category: string) => {
    setExpanded((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const handleEdit = (id: string) => {
    toast.info("Edit mode not yet implemented — coming soon!");
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    toast.success("Item removed from pantry");
  };

  const handleMoveToCart = (item: PantryItem) => {
    toast.success(`${item.name} moved to shopping cart`);
  };

  const expiringSoon = items.filter((i) => i.status === "expiring" || i.status === "low");

  return (
    <MobileLayout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Pantry</h1>
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Item
          </Button>
        </div>

        {/* Smart Dashboard */}
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

        {/* Collapsible Pantry Categories */}
        <div className="space-y-4">
          {categories.map((category) => {
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
                          <span className="text-xs text-muted-foreground">{item.quantity}</span>
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
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(item.id)}>
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
          })}
        </div>
      </div>
    </MobileLayout>
  );
}
