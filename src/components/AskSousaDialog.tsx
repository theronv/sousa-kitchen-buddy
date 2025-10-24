import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";

interface AskSousaDialogProps {
  onRecipeGenerated?: () => void;
}

export const AskSousaDialog = ({ onRecipeGenerated }: AskSousaDialogProps) => {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a recipe request");
      return;
    }

    try {
      setIsGenerating(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to generate recipes");
        return;
      }

      const { data, error } = await supabase.functions.invoke("generate-recipe", {
        body: {
          prompt: prompt.trim(),
          userId: session.user.id,
        },
      });

      if (error) {
        if (error.message.includes("Rate limit")) {
          toast.error("Too many requests. Please try again in a moment.");
        } else {
          toast.error("Failed to generate recipe: " + error.message);
        }
        return;
      }

      if (data?.recipe) {
        toast.success("Recipe created! Check your recipe library.");
        setPrompt("");
        setOpen(false);
        onRecipeGenerated?.();
      }
    } catch (error) {
      console.error("Error generating recipe:", error);
      toast.error("Failed to generate recipe");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-lg" size="lg">
          <Sparkles className="w-5 h-5" />
          Ask Sousa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Ask Sousa
          </DialogTitle>
          <DialogDescription>
            Describe what you'd like to cook and I'll create a personalized recipe for you.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="E.g., 'A quick Thai curry with tofu' or 'Italian pasta with seasonal vegetables'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="resize-none"
            disabled={isGenerating}
          />
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Recipe
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};