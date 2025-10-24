import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/Layout/MobileLayout";
import { Card } from "@/components/ui/card";
import { AskSousaDialog } from "@/components/AskSousaDialog";
import { RecipeCard } from "@/components/RecipeCard";
import { supabase } from "@/integrations/supabase/client";
import { Clock, ChefHat, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Recipe {
  id: string;
  title: string;
  prep_time: string;
  cuisine: string | null;
  ingredients: string[];
  instructions: string[];
}

const Recipes = () => {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /** Fetch all recipes for current user */
  const fetchRecipes = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to load recipes");
        return;
      }

      setRecipes(data || []);
    } catch (error) {
      console.error("Error fetching recipes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, [navigate]);

  return (
    <MobileLayout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Recipe Library</h1>
        </div>

        {/* Ask Sousa Card */}
        <Card className="p-6 shadow-card bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <ChefHat className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-foreground mb-1">Ask Sousa</h2>
              <p className="text-sm text-muted-foreground mb-3">
                Create custom recipes based on your preferences and pantry
              </p>
              <AskSousaDialog onRecipeGenerated={fetchRecipes} />
            </div>
          </div>
        </Card>

        {/* Recipe List */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Your Recipes</h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : recipes.length === 0 ? (
            <Card className="p-8 text-center">
              <ChefHat className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                No recipes yet. Ask Sousa to create your first recipe!
              </p>
            </Card>
          ) : (
            recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onDelete={fetchRecipes} // ✅ refresh list when deleted
              />
            ))
          )}
        </div>
      </div>
    </MobileLayout>
  );
};

export default Recipes;
