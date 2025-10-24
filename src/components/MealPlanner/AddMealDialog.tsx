import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScheduledMeal } from "@/hooks/useScheduledMeals";

interface AddMealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (meal: Omit<ScheduledMeal, "id" | "user_id" | "created_at" | "updated_at">) => void;
  editingMeal?: ScheduledMeal | null;
  defaultDate?: string;
  defaultMealType?: "breakfast" | "lunch" | "dinner";
}

export const AddMealDialog = ({
  open,
  onOpenChange,
  onSave,
  editingMeal,
  defaultDate,
  defaultMealType,
}: AddMealDialogProps) => {
  const [formData, setFormData] = useState({
    meal_title: "",
    meal_type: defaultMealType || "breakfast" as "breakfast" | "lunch" | "dinner",
    scheduled_date: defaultDate || new Date().toISOString().split("T")[0],
    scheduled_time: "",
    notes: "",
  });

  useEffect(() => {
    if (editingMeal) {
      setFormData({
        meal_title: editingMeal.meal_title,
        meal_type: editingMeal.meal_type,
        scheduled_date: editingMeal.scheduled_date,
        scheduled_time: editingMeal.scheduled_time || "",
        notes: editingMeal.notes || "",
      });
    } else if (open) {
      setFormData({
        meal_title: "",
        meal_type: defaultMealType || "breakfast",
        scheduled_date: defaultDate || new Date().toISOString().split("T")[0],
        scheduled_time: "",
        notes: "",
      });
    }
  }, [editingMeal, open, defaultDate, defaultMealType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      scheduled_time: formData.scheduled_time || undefined,
      notes: formData.notes || undefined,
      recipe_id: undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingMeal ? "Edit Meal" : "Add Meal"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meal_title">Meal Title</Label>
            <Input
              id="meal_title"
              value={formData.meal_title}
              onChange={(e) => setFormData({ ...formData, meal_title: e.target.value })}
              placeholder="e.g., Grilled Chicken Salad"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meal_type">Meal Type</Label>
            <Select
              value={formData.meal_type}
              onValueChange={(value: "breakfast" | "lunch" | "dinner") =>
                setFormData({ ...formData, meal_type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduled_date">Date</Label>
            <Input
              id="scheduled_date"
              type="date"
              value={formData.scheduled_date}
              onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduled_time">Time (Optional)</Label>
            <Input
              id="scheduled_time"
              type="time"
              value={formData.scheduled_time}
              onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add ingredients, calories, or other notes..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingMeal ? "Update" : "Add"} Meal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
