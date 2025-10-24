import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Recipe } from "@/types/recipe";

export function EditRecipeForm({
  recipe,
  onClose,
}: {
  recipe: Recipe;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(recipe.title);
  const [ingredients, setIngredients] = useState(recipe.ingredients.join("\n"));
  const [instructions, setInstructions] = useState(recipe.instructions.join("\n"));
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from("recipes")
      .update({
        title,
        ingredients: ingredients.split("\n").map((s) => s.trim()).filter(Boolean),
        instructions: instructions.split("\n").map((s) => s.trim()).filter(Boolean),
      })
      .eq("id", recipe.id);

    setIsSaving(false);

    if (error) {
      toast.error("Failed to save recipe");
    } else {
      toast.success("Recipe updated!");
      onClose();
    }
  };

  return (
    <div className="mt-4 space-y-4 border-t border-border pt-4">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Recipe title"
      />

      <Textarea
        value={ingredients}
        onChange={(e) => setIngredients(e.target.value)}
        rows={6}
        placeholder="List ingredients, one per line"
      />

      <Textarea
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        rows={6}
        placeholder="List steps, one per line"
      />

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={isSaving} className="flex-1">
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
