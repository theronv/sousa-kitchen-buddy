// src/pages/RecipeDetail.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MobileLayout } from "@/components/Layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pencil, ArrowLeft } from "lucide-react";
import { Recipe } from "@/types/recipe";
import { EditRecipeForm } from "@/components/EditRecipeForm";

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchRecipe = async () => {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", id)
        .single();
      if (!error && data) setRecipe(data);
    };
    fetchRecipe();
  }, [id]);

  if (!recipe) return <div className="p-6">Loading recipe...</div>;

  return (
    <MobileLayout>
      <div className="p-6 space-y-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <h1 className="text-3xl font-bold text-foreground">{recipe.title}</h1>
        {recipe.cuisine && (
          <p className="text-sm text-muted-foreground uppercase">{recipe.cuisine}</p>
        )}
        {recipe.prep_time && (
          <p className="text-sm text-muted-foreground">⏱ {recipe.prep_time}</p>
        )}

        <Card className="p-4 space-y-3 shadow-card">
          <div>
            <h2 className="font-semibold text-foreground mb-2">Ingredients</h2>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              {recipe.ingredients.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-semibold text-foreground mb-2">Instructions</h2>
            <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
              {recipe.instructions.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            variant="default"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2"
          >
            <Pencil className="w-4 h-4" />
            Edit Recipe
          </Button>
        </div>

        {isEditing && (
          <EditRecipeForm recipe={recipe} onClose={() => setIsEditing(false)} />
        )}
      </div>
    </MobileLayout>
  );
}
