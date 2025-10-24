import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ScheduledMeal } from "@/hooks/useScheduledMeals";
import { MealCard } from "./MealCard";
import { DndContext, DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

interface DayViewProps {
  selectedDate: Date;
  meals: ScheduledMeal[];
  onEditMeal: (meal: ScheduledMeal) => void;
  onDeleteMeal: (id: string) => void;
  onAddMeal: (date: string, mealType?: "breakfast" | "lunch" | "dinner") => void;
  onDragEnd: (event: DragEndEvent) => void;
}

export const DayView = ({
  selectedDate,
  meals,
  onEditMeal,
  onDeleteMeal,
  onAddMeal,
  onDragEnd,
}: DayViewProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const dateStr = selectedDate.toISOString().split("T")[0];
  const dateMeals = meals.filter((meal) => meal.scheduled_date === dateStr);

  const mealsByType = {
    breakfast: dateMeals.filter((m) => m.meal_type === "breakfast"),
    lunch: dateMeals.filter((m) => m.meal_type === "lunch"),
    dinner: dateMeals.filter((m) => m.meal_type === "dinner"),
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">
            {selectedDate.toLocaleDateString("en-US", { 
              weekday: "long", 
              month: "long", 
              day: "numeric" 
            })}
          </h2>
        </div>

        {(["breakfast", "lunch", "dinner"] as const).map((mealType) => (
          <Card key={mealType} className="p-4 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-foreground capitalize">
                {mealType}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-primary"
                onClick={() => onAddMeal(dateStr, mealType)}
              >
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </div>

            {mealsByType[mealType].length === 0 ? (
              <p className="text-sm text-muted-foreground">Not planned</p>
            ) : (
              <SortableContext
                items={mealsByType[mealType].map((m) => m.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {mealsByType[mealType].map((meal) => (
                    <MealCard
                      key={meal.id}
                      meal={meal}
                      onEdit={onEditMeal}
                      onDelete={onDeleteMeal}
                    />
                  ))}
                </div>
              </SortableContext>
            )}
          </Card>
        ))}
      </div>
    </DndContext>
  );
};
