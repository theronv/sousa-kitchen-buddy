// src/pages/RecipeDetail.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MobileLayout } from "@/components/Layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pencil, ArrowLeft, ShoppingCart } from "lucide-react";
import { Recipe } from "@/types/recipe";
import { EditRecipeForm } from "@/components/EditRecipeForm";
import { toast } from "sonner";

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

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

  /** 🛒 Add all ingredients to shopping_list */
  const handleAddToCart = async () => {
    if (!recipe?.ingredients?.length) {
      toast.error("This recipe has no ingredients to add");
      return;
    }

    setAddingToCart(true);

    // Get current user
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;

    if (!userId) {
      toast.error("You must be signed in");
      setAddingToCart(false);
      return;
    }

    try {
      // Fetch current shopping list items to avoid duplicates
      const { data: existingItems } = await supabase
        .from("shopping_list")
        .select("ingredient, purchased")
        .eq("user_id", userId);

      const existingNames = existingItems?.map(i => i.ingredient.toLowerCase()) || [];

      // Filter only new ingredients
      const newItems = recipe.ingredients
        .filter(ing => !existingNames.includes(ing.toLowerCase()))
        .map(ingredient => ({
          user_id: userId,
          recipe_id: recipe.id,
          ingredient: ingredient.trim(),
          purchased: false,
        }));

      if (newItems.length === 0) {
        toast.message("All ingredients are already in your shopping list");
      } else {
        const { error } = await supabase.from("shopping_list").insert(newItems);
        if (error) {
          console.error(error);
          toast.error("Failed to add ingredients");
        } else {
          toast.success(`Added ${newItems.length} ingredients to cart`);
        }
      }
    } catch (err) {
      console.error("Error adding ingredients:", err);
      toast.error("Something went wrong");
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <MobileLayout>
      <div className="p-6 space-y-4">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        {/* Title */}
        <h1 className="text-3xl font-bold text-foreground">{recipe.title}</h1>
        {recipe.cuisine && (
          <p className="text-sm text-muted-foreground uppercase">{recipe.cuisine}</p>
        )}
        {recipe.prep_time && (
          <p className="text-sm text-muted-foreground">⏱ {recipe.prep_time}</p>
        )}

        {/* Recipe content */}
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

        {/* Actions */}
        <div className="flex flex-wrap justify-end gap-3">
          <Button
            variant="default"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </Button>

          <Button
            onClick={handleAddToCart}
            disabled={addingToCart}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            {addingToCart ? "Adding..." : "Add to Cart"}
          </Button>
        </div>

        {isEditing && (
          <EditRecipeForm recipe={recipe} onClose={() => setIsEditing(false)} />
        )}
      </div>
    </MobileLayout>
  );
}
