import { MobileLayout } from "@/components/Layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Clock, Users } from "lucide-react";

const recipes = [
  {
    title: "Mediterranean Quinoa Bowl",
    prepTime: "20 min",
    servings: "4",
    cuisine: "Mediterranean",
  },
  {
    title: "Thai Green Curry",
    prepTime: "35 min",
    servings: "4",
    cuisine: "Thai",
  },
  {
    title: "Italian Pasta Primavera",
    prepTime: "25 min",
    servings: "4",
    cuisine: "Italian",
  },
];

const Recipes = () => {
  return (
    <MobileLayout>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Recipe Library</h1>
        </div>

        {/* AI Recipe Generator Card */}
        <Card className="p-6 shadow-card bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-foreground mb-1">Ask Sousa</h2>
              <p className="text-sm text-muted-foreground mb-3">
                Create custom recipes based on your preferences and pantry
              </p>
              <Button className="w-full gap-2">
                <Sparkles className="w-4 h-4" />
                Generate Recipe
              </Button>
            </div>
          </div>
        </Card>

        {/* Recipe List */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Your Recipes</h2>
          {recipes.map((recipe) => (
            <Card key={recipe.title} className="p-4 shadow-card hover:shadow-lg transition-shadow">
              <h3 className="font-semibold text-foreground mb-2">{recipe.title}</h3>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {recipe.prepTime}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {recipe.servings}
                </div>
                <span className="ml-auto text-primary font-medium">{recipe.cuisine}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
};

export default Recipes;
