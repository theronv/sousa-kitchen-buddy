import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, GripVertical } from "lucide-react";
import { ScheduledMeal } from "@/hooks/useScheduledMeals";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface MealCardProps {
  meal: ScheduledMeal;
  onEdit: (meal: ScheduledMeal) => void;
  onDelete: (id: string) => void;
}

export const MealCard = ({ meal, onEdit, onDelete }: MealCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: meal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getMealTypeColor = (type: string) => {
    switch (type) {
      case "breakfast":
        return "bg-amber-100 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800";
      case "lunch":
        return "bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
      case "dinner":
        return "bg-purple-100 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800";
      default:
        return "bg-muted";
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-3 shadow-card ${getMealTypeColor(meal.meal_type)} border-2`}
    >
      <div className="flex items-start gap-2">
        <button
          className="cursor-grab active:cursor-grabbing mt-1 text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-sm text-foreground truncate">
              {meal.meal_title}
            </h4>
            <span className="text-xs text-muted-foreground capitalize ml-2 flex-shrink-0">
              {meal.meal_type}
            </span>
          </div>
          
          {meal.scheduled_time && (
            <p className="text-xs text-muted-foreground mb-1">
              {meal.scheduled_time}
            </p>
          )}
          
          {meal.notes && (
            <p className="text-xs text-muted-foreground truncate">
              {meal.notes}
            </p>
          )}
        </div>

        <div className="flex gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(meal)}
          >
            <Pencil className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => onDelete(meal.id)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
