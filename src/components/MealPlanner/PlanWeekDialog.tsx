import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface PlanWeekDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  weekStart: Date;
}

interface PlanPreferences {
  isVegetarian: boolean;
  numMeals: number;
  includeBreakfast: boolean;
  effortLevel: "quick" | "medium" | "elaborate";
  cuisines: string[];
  numPeople: number;
}

const CUISINE_OPTIONS = [
  "Italian", "Mexican", "Asian", "Mediterranean", 
  "American", "Indian", "Thai", "French"
];

export const PlanWeekDialog = ({ open, onOpenChange, onComplete, weekStart }: PlanWeekDialogProps) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<PlanPreferences>({
    isVegetarian: false,
    numMeals: 7,
    includeBreakfast: false,
    effortLevel: "medium",
    cuisines: [],
    numPeople: 2,
  });

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("plan-week", {
        body: {
          preferences,
          weekStart: weekStart.toISOString(),
        },
      });

      if (error) throw error;

      toast.success(`Generated ${data.mealsCreated} meals and added ingredients to cart!`);
      onComplete();
      onOpenChange(false);
      setStep(1);
    } catch (error) {
      console.error("Error planning week:", error);
      toast.error("Failed to generate meal plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleCuisine = (cuisine: string) => {
    setPreferences(prev => ({
      ...prev,
      cuisines: prev.cuisines.includes(cuisine)
        ? prev.cuisines.filter(c => c !== cuisine)
        : [...prev.cuisines, cuisine]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Plan Your Week - Step {step} of 6</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {step === 1 && (
            <div className="space-y-3">
              <Label>Dietary Preference</Label>
              <RadioGroup
                value={preferences.isVegetarian ? "vegetarian" : "regular"}
                onValueChange={(v) => setPreferences({ ...preferences, isVegetarian: v === "vegetarian" })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="regular" id="regular" />
                  <Label htmlFor="regular" className="font-normal">Regular</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="vegetarian" id="vegetarian" />
                  <Label htmlFor="vegetarian" className="font-normal">Vegetarian</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <Label htmlFor="numMeals">Number of Meals to Plan</Label>
              <Input
                id="numMeals"
                type="number"
                min="1"
                max="21"
                value={preferences.numMeals}
                onChange={(e) => setPreferences({ ...preferences, numMeals: parseInt(e.target.value) || 1 })}
              />
              <p className="text-sm text-muted-foreground">Plan 1-21 meals for the week</p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="breakfast"
                  checked={preferences.includeBreakfast}
                  onCheckedChange={(checked) => 
                    setPreferences({ ...preferences, includeBreakfast: checked as boolean })
                  }
                />
                <Label htmlFor="breakfast" className="font-normal">Include breakfast meals?</Label>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <Label>Effort/Time Level</Label>
              <RadioGroup
                value={preferences.effortLevel}
                onValueChange={(v) => setPreferences({ ...preferences, effortLevel: v as any })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="quick" id="quick" />
                  <Label htmlFor="quick" className="font-normal">Quick (15-30 min)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="medium" />
                  <Label htmlFor="medium" className="font-normal">Medium (30-60 min)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="elaborate" id="elaborate" />
                  <Label htmlFor="elaborate" className="font-normal">Elaborate (60+ min)</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3">
              <Label>Preferred Cuisines (select multiple)</Label>
              <div className="grid grid-cols-2 gap-2">
                {CUISINE_OPTIONS.map((cuisine) => (
                  <div key={cuisine} className="flex items-center space-x-2">
                    <Checkbox
                      id={cuisine}
                      checked={preferences.cuisines.includes(cuisine)}
                      onCheckedChange={() => toggleCuisine(cuisine)}
                    />
                    <Label htmlFor={cuisine} className="font-normal">{cuisine}</Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-3">
              <Label htmlFor="numPeople">Number of People</Label>
              <Input
                id="numPeople"
                type="number"
                min="1"
                max="12"
                value={preferences.numPeople}
                onChange={(e) => setPreferences({ ...preferences, numPeople: parseInt(e.target.value) || 1 })}
              />
              <p className="text-sm text-muted-foreground">Servings per meal</p>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1 || loading}
            >
              Back
            </Button>
            {step < 6 ? (
              <Button onClick={handleNext}>Next</Button>
            ) : (
              <Button onClick={handleGenerate} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Plan"
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
