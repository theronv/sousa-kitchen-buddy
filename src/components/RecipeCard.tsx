// src/components/RecipeCard.tsx
import { Card } from "@/components/ui/card";
import { Recipe } from "@/types/recipe";

export const RecipeCard = ({ recipe }: { recipe: Recipe }) => {
  return (
    <Card className="p-4 space-y-3 shadow-card hover:shadow-lg transition">
      {/* Title */}
      <h2 className="text-lg font-semibold text-foreground">{recipe.title}</h2>

      {/* Cuisine Tag */}
      {recipe.cuisine && (
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          {recipe.cuisine}
        </p>
      )}

      {/* Ingredients */}
      <div>
        <h3 className="font-medium text-foreground mt-2">🧂 Ingredients</h3>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
          {recipe.ingredients.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>

      {/* Instructions */}
      <div>
        <h3 className="font-medium text-foreground mt-2">👩‍🍳 Instructions</h3>
        <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
          {recipe.instructions.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>

      {/* Metadata */}
      {recipe.prep_time && (
        <p className="text-xs text-muted-foreground mt-2">
          ⏱ {recipe.prep_time}
        </p>
      )}
    </Card>
  );
};
