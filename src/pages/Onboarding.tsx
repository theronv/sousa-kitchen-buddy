import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ChefHat, ArrowRight } from "lucide-react";

const CUISINE_OPTIONS = [
  "Italian",
  "Thai",
  "Indian",
  "Mexican",
  "Mediterranean",
  "Japanese",
  "Chinese",
  "French",
  "Korean",
  "Vietnamese",
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isVegetarian, setIsVegetarian] = useState(false);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get current user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);

      // Check if user already has a profile
      supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            navigate("/");
          }
        });
    });
  }, [navigate]);

  const toggleCuisine = (cuisine: string) => {
    setSelectedCuisines((prev) =>
      prev.includes(cuisine)
        ? prev.filter((c) => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  const handleContinue = () => {
    if (step === 1) {
      setStep(2);
    } else {
      handleSavePreferences();
    }
  };

  const handleSavePreferences = async () => {
    if (!userId) {
      toast.error("User session not found. Please sign in again.");
      navigate("/auth");
      return;
    }

    if (selectedCuisines.length === 0) {
      toast.error("Please select at least one cuisine");
      return;
    }

    try {
      setIsLoading(true);

      const { error } = await supabase.from("profiles").insert({
        user_id: userId,
        is_vegetarian: isVegetarian,
        cuisines: selectedCuisines,
      });

      if (error) {
        toast.error("Failed to save preferences: " + error.message);
        return;
      }

      toast.success("Preferences saved! Welcome to Sousa!");
      navigate("/");
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg p-8 space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <ChefHat className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Let's personalize your experience</h1>
          <p className="text-sm text-muted-foreground">
            Step {step} of 2
          </p>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label className="text-base font-semibold">Are you vegetarian?</Label>
              <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                <div>
                  <p className="font-medium text-foreground">Vegetarian</p>
                  <p className="text-sm text-muted-foreground">
                    We'll suggest vegetarian recipes
                  </p>
                </div>
                <Switch
                  checked={isVegetarian}
                  onCheckedChange={setIsVegetarian}
                />
              </div>
            </div>

            <Button onClick={handleContinue} className="w-full" size="lg">
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold">What cuisines do you enjoy?</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Select all that apply
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {CUISINE_OPTIONS.map((cuisine) => (
                  <Badge
                    key={cuisine}
                    variant={selectedCuisines.includes(cuisine) ? "default" : "outline"}
                    className="cursor-pointer text-sm py-2 px-4 transition-all hover:scale-105"
                    onClick={() => toggleCuisine(cuisine)}
                  >
                    {cuisine}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1"
                disabled={isLoading}
              >
                Back
              </Button>
              <Button
                onClick={handleContinue}
                className="flex-1"
                disabled={isLoading || selectedCuisines.length === 0}
              >
                {isLoading ? "Saving..." : "Get Started"}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Onboarding;