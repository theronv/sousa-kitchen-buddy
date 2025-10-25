// src/components/EditPantryItemDialog.tsx
import { ReactNode, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type PantryStatus = "good" | "low" | "expiring";

interface PantryItem {
  id: string;
  name: string;
  category: string;
  status: PantryStatus;
  quantity?: string | null;
  expires_on?: string | null; // ISO
  cold_item?: boolean | null;
}

export function EditPantryItemDialog({
  item,
  onUpdated,
  children,
}: {
  item: PantryItem;
  onUpdated: (updated: PantryItem) => void;
  children: ReactNode; // trigger button
}) {
  const [open, setOpen] = useState(false);

  // Local form state seeded from item
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState(item.category || "Pantry");
  const [status, setStatus] = useState<PantryStatus>(item.status);
  const [quantity, setQuantity] = useState(item.quantity || "");
  const [expiresOn, setExpiresOn] = useState(
    // Convert ISO to yyyy-mm-dd for <input type="date" />
    item.expires_on ? new Date(item.expires_on).toISOString().slice(0, 10) : ""
  );
  const [cold, setCold] = useState<boolean>(!!item.cold_item);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName(item.name);
    setCategory(item.category || "Pantry");
    setStatus(item.status);
    setQuantity(item.quantity || "");
    setExpiresOn(item.expires_on ? new Date(item.expires_on).toISOString().slice(0, 10) : "");
    setCold(!!item.cold_item);
  };

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) reset();
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter an item name");
      return;
    }
    setSaving(true);

    // Normalize date: empty -> null, else ISO string
    const expiresISO = expiresOn ? new Date(expiresOn).toISOString() : null;

    const updatePayload = {
      name: name.trim(),
      category,
      status,
      quantity: quantity || null,
      expires_on: expiresISO,
      cold_item: cold,
    };

    const { data, error } = await supabase
      .from("pantry")
      .update(updatePayload)
      .eq("id", item.id)
      .select()
      .maybeSingle();

    setSaving(false);

    if (error) {
      console.error(error);
      toast.error("Failed to update item");
      return;
    }

    toast.success("Pantry item updated");
    // Inform parent so it can update list without re-fetch
    onUpdated({ ...(item as PantryItem), ...(data as PantryItem) });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Pantry Item</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            placeholder="Item name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />

          {/* Category */}
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Produce">Produce</SelectItem>
              <SelectItem value="Dairy">Dairy</SelectItem>
              <SelectItem value="Pantry">Pantry</SelectItem>
              <SelectItem value="Bakery">Bakery</SelectItem>
              <SelectItem value="Meat">Meat</SelectItem>
              <SelectItem value="Frozen">Frozen</SelectItem>
              <SelectItem value="Beverages">Beverages</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>

          {/* Status */}
          <Select value={status} onValueChange={(v: PantryStatus) => setStatus(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="expiring">Expiring</SelectItem>
            </SelectContent>
          </Select>

          {/* Quantity */}
          <Input
            placeholder="Quantity (e.g., 2 packs, 500g)"
            value={quantity || ""}
            onChange={(e) => setQuantity(e.target.value)}
          />

          {/* Expiration */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Expiration date</span>
            <Input
              type="date"
              value={expiresOn}
              onChange={(e) => setExpiresOn(e.target.value)}
            />
          </div>

          {/* Cold item */}
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={cold} onCheckedChange={(v: boolean) => setCold(!!v)} />
            Cold item (refrigerated/frozen)
          </label>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
