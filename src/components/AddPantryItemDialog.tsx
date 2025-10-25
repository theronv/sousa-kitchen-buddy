import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function AddPantryItemDialog({ onItemAdded }: { onItemAdded: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Pantry");
  const [quantity, setQuantity] = useState("");
  const [status, setStatus] = useState("good");

  const handleAdd = async () => {
    if (!user) return;
    if (!name.trim()) {
      toast.error("Please enter an item name");
      return;
    }

    const { error } = await supabase.from("pantry").insert({
      user_id: user.id,
      name: name.trim(),
      category,
      quantity,
      status,
    });

    if (error) {
      console.error(error);
      toast.error("Failed to add item");
    } else {
      toast.success(`${name} added to pantry`);
      setOpen(false);
      setName("");
      onItemAdded();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          Add Item
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Pantry Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Item name" value={name} onChange={(e) => setName(e.target.value)} />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Produce">Produce</SelectItem>
              <SelectItem value="Dairy">Dairy</SelectItem>
              <SelectItem value="Pantry">Pantry</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="expiring">Expiring</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button onClick={handleAdd}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
