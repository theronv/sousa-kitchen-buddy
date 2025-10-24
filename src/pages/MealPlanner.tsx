import { MobileLayout } from "@/components/Layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MealPlanner = () => {
  return (
    <MobileLayout>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Weekly Plan</h1>
          <Button variant="default" size="sm" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Generate
          </Button>
        </div>

        <div className="space-y-3">
          {days.map((day) => (
            <Card key={day} className="p-4 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">{day}</h3>
                <Button variant="ghost" size="sm" className="text-xs text-primary">
                  Add Meal
                </Button>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Breakfast: <span className="text-foreground">Not planned</span></p>
                <p>Lunch: <span className="text-foreground">Not planned</span></p>
                <p>Dinner: <span className="text-foreground">Not planned</span></p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
};

export default MealPlanner;
