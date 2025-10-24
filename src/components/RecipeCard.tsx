// src/components/RecipeCard.tsx
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Recipe } from "@/types/recipe";

export const RecipeCard = ({ recipe }: { recipe: Recipe }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    // Navigate to a full recipe view (Chef tab / recipe detail page)
    navigate(`/recipe/${recipe.id}`);
  };

  return (
    <Card
      onClick={handleClick}
      className="p-4 space-y-2 shadow-card hover:shadow-lg transition cursor-pointer"
    >
      {/* Title */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          {recipe.title}
        </h2>
        {recipe.cuisine && (
          <span className="text-xs text-muted-foreground uppercase tracking-wide">
            {recipe.cuisine}
          </span>
        )}
      </div>

      {/* Metadata */}
      {recipe.prep_time && (
        <p className="text-xs text-muted-foreground">⏱ {recipe.prep_time}</p>
      )}

      {/* Preview Snippet */}
      {recipe.ingredients?.length > 0 && (
        <p className="text-xs text-muted-foreground truncate">
          {recipe.ingredients.slice(0, 3).join(", ")}...
        </p>
      )}
    </Card>
  );
};
