// src/components/RecipeCard.tsx
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Clock } from "lucide-react";
import { Recipe } from "@/types/recipe";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RecipeCardProps {
  recipe: Recipe;
  onDelete?: () => void;
}

export const RecipeCard = ({ recipe, onDelete }: RecipeCardProps) => {
  const navigate = useNavigate();

  /** Navigate to recipe detail */
  const handleClick = () => {
    navigate(`/recipe/${recipe.id}`);
  };

  /** Delete recipe and associated data */
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent navigation
    if (!confirm(`Delete "${recipe.title}"? This will also remove it from your meal plan and shopping list.`)) {
      return;
    }

    // Delete related records first
    await supabase.from("shopping_list").delete().eq("recipe_id", recipe.id);
    await supabase.from("meal_plan").delete().eq("recipe_id", recipe.id);

    const { error } = await supabase.from("recipes").delete().eq("id", recipe.id);
    if (error) {
      console.error(error);
      toast.error("Failed to delete recipe");
    } else {
      toast.success("Recipe deleted");
      onDelete?.();
    }
  };

  /** Edit recipe — goes to detail view with Edit form */
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent click propagation
    navigate(`/recipe/${recipe.id}`);
  };

  return (
    <Card
      onClick={handleClick}
      className="p-4 flex justify-between items-center shadow-card hover:shadow-lg transition cursor-pointer"
    >
      {/* Left side: recipe info */}
      <div className="flex flex-col flex-1 min-w-0 pr-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground truncate">
            {recipe.title}
          </h2>
          {recipe.cuisine && (
            <span className="text-xs text-muted-foreground uppercase tracking-wide ml-2 whitespace-nowrap">
              {recipe.cuisine}
            </span>
          )}
        </div>

        {recipe.prep_time && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <Clock className="w-3 h-3" />
            <span>{recipe.prep_time}</span>
          </div>
        )}

        {recipe.ingredients?.length > 0 && (
          <p className="text-xs text-muted-foreground truncate mt-1">
            {recipe.ingredients.slice(0, 3).join(", ")}...
          </p>
        )}
      </div>

      {/* Right side*
