import { useEffect, useMemo, useState } from "react";
import { MobileLayout } from "@/components/Layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Trash2,
  ShoppingCart,
  Edit2,
  AlertCircle,
  SlidersHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AddPantryItemDialog } from "@/components/AddPantryItemDialog";
import { EditPantryItemDialog } from "@/components/EditPantryItemDialog";

type PantryStatus = "good" | "low" | "expiring";

interface PantryItem {
  id: string;
  user_id?: string;
  name: string;
  category: string;
  status: PantryStatus;
  quantity?: string | null;
  expires_on?: string | null; // ISO date string
  cold_item?: boolean | null;
  created_at?: string;
}

type SortKey = "newest" | "name-asc" | "expires-soon";

const toDate = (d?: string | null) => (d ? new Date(d) : undefined);

const StatusBadge = ({ status }: { status: PantryStatus }) => {
  if (status === "good") return null;
  const isLow = status === "low";
  return (
    <Badge variant={isLow ? "secondary" : "destructive"} className="text-xs">
      {isLow ? "Low" : "Expiring"}
    </Badge>
  );
};

export default function Pantry() {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<"All" | PantryStatus>("All");
  const [sortKey, setSortKey] = useState<SortKey>("newest");

  /** Fetch Pantry items **/
  const fetchPantry = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("pantry")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load pantry items");
      console.error(error);
      setLoading(false);
      return;
    }

    setItems(
  (data || []).map((d: any) => ({
    id: d.id,
    name: d.item_name,             // maps to your DB column
    category: d.category,
    status: d.status || "good",
    quantity: d.quantity,
    expires_on: d.expiration_date, // maps correctly
    created_at: d.created_at,
  }))
);

  useEffect(() => {
    fetchPantry();
  }, [user]);

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category || "Uncategorized"));
    return ["All", ...Array.from(set)];
  }, [items]);

  const expiringSoon = items.filter(
    (i) => i.status === "expiring" || i.status === "low"
  );

  const filteredSorted = useMemo(() => {
    let list = [...items];

    if (filterCategory !== "All") {
      list = list.filter(
        (i) => (i.category || "Uncategorized") === filterCategory
      );
    }
    if (filterStatus !== "All") {
      list = list.filter((i) => i.status === filterStatus);
    }

    list.sort((a, b) => {
      if (sortKey === "name-asc") return a.name.localeCompare(b.name);
      if (sortKey === "expires-soon") {
        const ad = toDate(a.expires_on)?.getTime() ?? Number.POSITIVE_INFINITY;
        const bd = toDate(b.expires_on)?.getTime() ?? Number.POSITIVE_INFINITY;
        return ad - bd;
      }
      const at = toDate(a.created_at)?.getTime() ?? 0;
      const bt = toDate(b.created_at)?.getTime() ?? 0;
      return bt - at;
    });

    return list;
  }, [items, filterCategory, filterStatus, sortKey]);

  const visibleCategories = useMemo(() => {
    const set = new Set(
      filteredSorted.map(
        (i) => (i.category && i.category.length ? i.category : "Uncategorized")
      )
    );
    return Array.from(set);
  }, [filteredSorted]);

  const toggleCategory = (category: string) =>
    setExpanded((prev) => ({ ...prev, [category]: !prev[category] }));

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

    const { data: existing, error: checkError } = await supabase
      .from("shopping_list")
      .select("id")
      .eq("user_id", user.id)
      .eq("ingredient", item.name)
      .maybeSingle();

    if (checkError) {
      console.error("Cart check failed:", checkError);
      toast.error("Error checking cart");
      return;
    }

    if (existing) {
      toast.info(`${item.name} is already in your shopping cart`);
      return;
    }

    const { error } = await supabase.from("shopping_list").insert({
      user_id: user.id,
      ingredient: item.name,
      purchased: false,
    });

    if (error) {
      console.error("Move to cart failed:", error);
      toast.error("Failed to move to cart");
    } else {
      toast.success(`${item.name} moved to shopping cart`);
      const { error: deleteError } = await supabase
        .from("pantry")
        .delete()
        .eq("id", item.id);
      if (deleteError) console.error("Failed to remove from pantry:", deleteError);
      else setItems((prev) => prev.filter((i) => i.id !== item.id));
    }
  };

  const applyLocalUpdate = (updated: PantryItem) => {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? { ...i, ...updated } : i)));
  };

  return (
    <MobileLayout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Pantry</h1>
          <AddPantryItemDialog onItemAdded={fetchPantry} />
        </div>

        {/* Smart Alert */}
        {expiringSoon.length > 0 && (
          <Card className="p-4 bg-accent/10 border-accent/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-accent mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Items need attention</p>
                <p className="text-sm text-muted-foreground">
                  {expiringSoon.length} item{expiringSoon.length > 1 ? "s" : ""} are running
                  low or expiring soon
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Filters */}
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Category</span>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Status</span>
                <Select
                  value={filterStatus}
                  onValueChange={(v: any) => setFilterStatus(v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="expiring">Expiring</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Sort By</span>
                <Select value={sortKey} onValueChange={(v: SortKey) => setSortKey(v)}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Newest" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="name-asc">Name (A–Z)</SelectItem>
                    <SelectItem value="expires-soon">Expires Soon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </Card>

        {/* Main Content */}
        <div className="space-y-4">
          {loading ? (
            <Card className="p-6 text-center text-muted-foreground">Loading pantry...</Card>
          ) : filteredSorted.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">
              No pantry items match your filters.
            </Card>
          ) : (
            visibleCategories.map((category) => {
              const categoryItems = filteredSorted.filter(
                (i) =>
                  (i.category && i.category.length ? i.category : "Uncategorized") ===
                  category
              );
              if (categoryItems.length === 0) return null;

              return (
                <div key={category}>
                  <button
                    onClick={() => toggleCategory(category)}
                    className="flex items-center justify-between w-full mb-2"
                  >
                    <h2 className="text-sm font-semibold text-muted-foreground">
                      {category}
                    </h2>
                    {expanded[category] ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>

                  {expanded[category] && (
                    <div className="space-y-3 mt-1">
                      {categoryItems.map((item) => (
                        <Card
                          key={item.id}
                          className="flex items-center justify-between px-4 py-3 rounded-xl shadow-sm hover:shadow-md transition-all bg-card"
                        >
                          {/* Left: info */}
                          <div className="flex flex-col min-w-0 flex-1 pr-3">
                            <span className="font-medium text-foreground truncate">
                              {item.name || "Unnamed Item"}
                            </span>
                            {item.quantity && (
                              <span className="text-xs text-muted-foreground truncate">
                                Quantity: {item.quantity}
                              </span>
                            )}
                            {item.expires_on && (
                              <span className="text-xs text-muted-foreground">
                                Expires on{" "}
                                {new Date(item.expires_on).toLocaleDateString()}
                              </span>
                            )}
                            {item.cold_item && (
                              <span className="text-[10px] w-fit mt-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                Cold item
                              </span>
                            )}
                          </div>

                          {/* Right: status + actions */}
                          <div className="flex items-center flex-shrink-0 gap-2">
                            {item.status && item.status !== "good" && (
                              <Badge
                                variant={
                                  item.status === "low" ? "secondary" : "destructive"
                                }
                                className="text-xs px-2 py-0.5 whitespace-nowrap"
                              >
                                {item.status === "low" ? "Low" : "Expiring"}
                              </Badge>
                            )}

                            <EditPantryItemDialog
                              item={item}
                              onUpdated={(updated) => applyLocalUpdate(updated)}
                            >
                              <Button
                                size="icon"
                                variant="ghost"
                                className="hover:bg-muted/50"
                              >
                                <Edit2 className="w-4 h-4 text-muted-foreground" />
                              </Button>
                            </EditPantryItemDialog>

                            <Button
                              size="icon"
                              variant="ghost"
                              className="hover:bg-muted/50"
                              onClick={() => handleMoveToCart(item)}
                            >
                              <ShoppingCart className="w-4 h-4 text-primary" />
                            </Button>

                            <Button
                              size="icon"
                              variant="ghost"
                              className="hover:bg-muted/50"
                              onClick={() => handleDelete(item.id)}
                            >
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
