import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ScheduledMeal } from "@/hooks/useScheduledMeals";
import { MealCard } from "./MealCard";
import { DndContext, DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

interface WeekViewProps {
  weekStart: Date;
  meals: ScheduledMeal[];
  onEditMeal: (meal: ScheduledMeal) => void;
  onDeleteMeal: (id: string) => void;
  onAddMeal: (date: string, mealType?: "breakfast" | "lunch" | "dinner") => void;
  onDragEnd: (event: DragEndEvent) => void;
}

export const WeekView = ({
  weekStart,
  meals,
  onEditMeal,
  onDeleteMeal,
  onAddMeal,
  onDragEnd,
}: WeekViewProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const getDaysOfWeek = (start: Date) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const getMealsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return meals.filter((meal) => meal.scheduled_date === dateStr);
  };

  const getMealsByType = (dateMeals: ScheduledMeal[]) => {
    return {
      breakfast: dateMeals.filter((m) => m.meal_type === "breakfast"),
      lunch: dateMeals.filter((m) => m.meal_type === "lunch"),
      dinner: dateMeals.filter((m) => m.meal_type === "dinner"),
    };
  };

  const days = getDaysOfWeek(weekStart);
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <div className="space-y-3">
        {days.map((day, index) => {
          const dateMeals = getMealsForDate(day);
          const mealsByType = getMealsByType(dateMeals);
          const dateStr = day.toISOString().split("T")[0];

          return (
            <Card key={dateStr} className="p-4 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground">{dayNames[index]}</h3>
                  <p className="text-xs text-muted-foreground">
                    {day.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-primary"
                  onClick={() => onAddMeal(dateStr)}
                >
                  <Plus className="w-4 h-4" />
                  Add Meal
                </Button>
              </div>

              <div className="space-y-3">
                {(["breakfast", "lunch", "dinner"] as const).map((mealType) => (
                  <div key={mealType} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-muted-foreground capitalize">
                        {mealType}
                      </p>
                      {mealsByType[mealType].length === 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => onAddMeal(dateStr, mealType)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add
                        </Button>
                      )}
                    </div>
                    
                    {mealsByType[mealType].length === 0 ? (
                      <p className="text-sm text-muted-foreground pl-2">Not planned</p>
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
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </DndContext>
  );
};
