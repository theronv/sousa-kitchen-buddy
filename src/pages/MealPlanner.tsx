import { useState } from "react";
import { MobileLayout } from "@/components/Layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar, CalendarDays, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useScheduledMeals, ScheduledMeal } from "@/hooks/useScheduledMeals";
import { WeekView } from "@/components/MealPlanner/WeekView";
import { DayView } from "@/components/MealPlanner/DayView";
import { AddMealDialog } from "@/components/MealPlanner/AddMealDialog";
import { PlanWeekDialog } from "@/components/MealPlanner/PlanWeekDialog";
import { DragEndEvent } from "@dnd-kit/core";

const MealPlanner = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [planWeekOpen, setPlanWeekOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<ScheduledMeal | null>(null);
  const [dialogDefaultDate, setDialogDefaultDate] = useState<string>();
  const [dialogDefaultMealType, setDialogDefaultMealType] = useState<"breakfast" | "lunch" | "dinner">();

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const weekStart = getWeekStart(currentDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const { meals, isLoading, addMeal, updateMeal, deleteMeal } = useScheduledMeals(
    viewMode === "week" ? weekStart : currentDate,
    viewMode === "week" ? weekEnd : currentDate
  );

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "week") {
      newDate.setDate(currentDate.getDate() - 7);
    } else {
      newDate.setDate(currentDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "week") {
      newDate.setDate(currentDate.getDate() + 7);
    } else {
      newDate.setDate(currentDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleAddMeal = (date: string, mealType?: "breakfast" | "lunch" | "dinner") => {
    setEditingMeal(null);
    setDialogDefaultDate(date);
    setDialogDefaultMealType(mealType);
    setDialogOpen(true);
  };

  const handleEditMeal = (meal: ScheduledMeal) => {
    setEditingMeal(meal);
    setDialogDefaultDate(undefined);
    setDialogDefaultMealType(undefined);
    setDialogOpen(true);
  };

  const handleSaveMeal = (mealData: Omit<ScheduledMeal, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (editingMeal) {
      updateMeal({ id: editingMeal.id, ...mealData });
    } else {
      addMeal(mealData);
    }
    setEditingMeal(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const draggedMeal = meals.find((m) => m.id === active.id);
    if (!draggedMeal) return;

    // In a real implementation, you would determine the new date/time based on where it was dropped
    // For now, we'll just show a toast
    console.log("Meal dragged:", draggedMeal);
  };

  const getDateRangeText = () => {
    if (viewMode === "week") {
      const start = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const end = weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      return `${start} - ${end}`;
    } else {
      return currentDate.toLocaleDateString("en-US", { 
        weekday: "long", 
        month: "long", 
        day: "numeric", 
        year: "numeric" 
      });
    }
  };

  return (
    <MobileLayout>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Meal Planner</h1>
          <div className="flex gap-2">
            <Button variant="default" size="sm" onClick={() => setPlanWeekOpen(true)} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Plan Week
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
          </div>
        </div>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "week" | "day")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="week" className="gap-2">
              <CalendarDays className="w-4 h-4" />
              Week
            </TabsTrigger>
            <TabsTrigger value="day" className="gap-2">
              <Calendar className="w-4 h-4" />
              Day
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center justify-between py-4">
            <Button variant="ghost" size="icon" onClick={handlePrevious}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <p className="text-sm font-medium text-foreground">{getDateRangeText()}</p>
            <Button variant="ghost" size="icon" onClick={handleNext}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          <TabsContent value="week" className="mt-0">
            {isLoading ? (
              <p className="text-center text-muted-foreground">Loading...</p>
            ) : (
              <WeekView
                weekStart={weekStart}
                meals={meals}
                onEditMeal={handleEditMeal}
                onDeleteMeal={deleteMeal}
                onAddMeal={handleAddMeal}
                onDragEnd={handleDragEnd}
              />
            )}
          </TabsContent>

          <TabsContent value="day" className="mt-0">
            {isLoading ? (
              <p className="text-center text-muted-foreground">Loading...</p>
            ) : (
              <DayView
                selectedDate={currentDate}
                meals={meals}
                onEditMeal={handleEditMeal}
                onDeleteMeal={deleteMeal}
                onAddMeal={handleAddMeal}
                onDragEnd={handleDragEnd}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AddMealDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveMeal}
        editingMeal={editingMeal}
        defaultDate={dialogDefaultDate}
        defaultMealType={dialogDefaultMealType}
      />

      <PlanWeekDialog
        open={planWeekOpen}
        onOpenChange={setPlanWeekOpen}
        onComplete={() => {
          // Refresh meals after planning
        }}
        weekStart={weekStart}
      />
    </MobileLayout>
  );
};

export default MealPlanner;
