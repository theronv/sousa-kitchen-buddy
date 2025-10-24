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
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  /** Save updated recipe **/
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Recipe title cannot be empty");
      return;
    }

    setIsSaving(true);
    const { error } = await supabase
      .from("recipes")
      .update({
        title: title.trim(),
        ingredients: ingredients
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        instructions: instructions
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      })
      .eq("id", recipe.id);

    setIsSaving(false);

    if (error) {
      console.error(error);
      toast.error("Failed to save recipe");
    } else {
      toast.success("Recipe updated!");
      onClose();
    }
  };

  /** Delete recipe with confirmation **/
  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      toast.message("Click Delete again to confirm");
      return;
    }

    setIsDeleting(true);
    const { error } = await supabase.from("recipes").delete().eq("id", recipe.id);
    setIsDeleting(false);

    if (error) {
      console.error(error);
      toast.error("Failed to delete recipe");
    } else {
      toast.success("Recipe deleted");
      window.history.back();
    }
  };

  return (
    <div className="mt-4 space-y-4 border-t border-border pt-4">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Recipe title"
        className="text-base font-medium"
      />

      <Textarea
        value={ingredients}
        onChange={(e) => setIngredients(e.target.value)}
        rows={6}
        placeholder="List ingredients, one per line"
        className="resize-none"
      />

      <Textarea
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        rows={6}
        placeholder="List steps, one per line"
        className="resize-none"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <div className="flex flex-1 gap-2">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 font-medium"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>

        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={isDeleting}
          className="sm:w-auto"
        >
          {isDeleting ? "Deleting..." : confirmDelete ? "Confirm Delete" : "Delete"}
        </Button>
      </div>
    </div>
  );
}
