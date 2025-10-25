import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { preferences, weekStart } = await req.json();
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const supabase = createClient(supabaseUrl!, supabaseKey!);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    console.log("Generating meal plan for user:", user.id);
    console.log("Preferences:", preferences);

    // Build AI prompt
    const mealTypes = preferences.includeBreakfast ? ["breakfast", "lunch", "dinner"] : ["lunch", "dinner"];
    const cuisineList = preferences.cuisines.length > 0 ? preferences.cuisines.join(", ") : "various";
    
    const prompt = `Generate ${preferences.numMeals} meal suggestions for a week with the following preferences:
- Dietary: ${preferences.isVegetarian ? "Vegetarian" : "Regular (can include meat)"}
- Meal types: ${mealTypes.join(", ")}
- Effort level: ${preferences.effortLevel} cooking time
- Cuisines: ${cuisineList}
- Servings: ${preferences.numPeople} people

For each meal, provide:
1. Title (creative, appetizing name)
2. Meal type (breakfast/lunch/dinner)
3. Ingredients list with quantities for ${preferences.numPeople} servings
4. Brief cooking instructions (2-4 steps)
5. Prep time estimate
6. Cuisine type

Format as a JSON array of meal objects.`;

    // Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a helpful meal planning assistant. Always respond with valid JSON only, no markdown or extra text."
          },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0]?.message?.content;
    
    if (!content) throw new Error("No content from AI");

    // Parse AI response
    let meals;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      meals = JSON.parse(cleanContent);
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Invalid AI response format");
    }

    console.log("Generated meals:", meals.length);

    // Calculate dates for the week
    const startDate = new Date(weekStart);
    const dates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      return date;
    });

    let mealsCreated = 0;
    let ingredientsAdded = 0;
    const allIngredients = new Set<string>();

    // Insert meals into database
    for (let i = 0; i < Math.min(meals.length, preferences.numMeals); i++) {
      const meal = meals[i];
      const dateIndex = i % 7;
      const scheduledDate = dates[dateIndex].toISOString().split("T")[0];

      // Create recipe
      const { data: recipe, error: recipeError } = await supabase
        .from("recipes")
        .insert({
          user_id: user.id,
          title: meal.title || `Meal ${i + 1}`,
          ingredients: meal.ingredients || [],
          instructions: meal.instructions || [],
          prep_time: meal.prep_time || "30 minutes",
          cuisine: meal.cuisine || cuisineList.split(",")[0],
        })
        .select()
        .single();

      if (recipeError) {
        console.error("Error creating recipe:", recipeError);
        continue;
      }

      // Schedule meal
      const { error: mealError } = await supabase
        .from("scheduled_meals")
        .insert({
          user_id: user.id,
          recipe_id: recipe.id,
          meal_title: meal.title || `Meal ${i + 1}`,
          meal_type: meal.meal_type || mealTypes[i % mealTypes.length],
          scheduled_date: scheduledDate,
        });

      if (mealError) {
        console.error("Error scheduling meal:", mealError);
        continue;
      }

      mealsCreated++;

      // Collect unique ingredients
      if (meal.ingredients && Array.isArray(meal.ingredients)) {
        meal.ingredients.forEach((ing: string) => allIngredients.add(ing));
      }
    }

    // Add all unique ingredients to shopping list
    const ingredientInserts = Array.from(allIngredients).map(ingredient => ({
      user_id: user.id,
      ingredient,
      purchased: false,
      item_type: categorizeIngredient(ingredient),
      is_cold: isRefrigerated(ingredient),
    }));

    if (ingredientInserts.length > 0) {
      const { error: shoppingError } = await supabase
        .from("shopping_list")
        .insert(ingredientInserts);

      if (shoppingError) {
        console.error("Error adding to shopping list:", shoppingError);
      } else {
        ingredientsAdded = ingredientInserts.length;
      }
    }

    console.log(`Created ${mealsCreated} meals and added ${ingredientsAdded} ingredients`);

    return new Response(
      JSON.stringify({
        success: true,
        mealsCreated,
        ingredientsAdded,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in plan-week function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function categorizeIngredient(ingredient: string): string {
  const lower = ingredient.toLowerCase();
  if (lower.match(/milk|cheese|yogurt|butter|cream/)) return "Dairy";
  if (lower.match(/lettuce|tomato|carrot|onion|pepper|vegetable|fruit/)) return "Produce";
  if (lower.match(/chicken|beef|pork|fish|meat/)) return "Meat";
  return "Pantry";
}

function isRefrigerated(ingredient: string): boolean {
  const lower = ingredient.toLowerCase();
  return !!(lower.match(/milk|cheese|yogurt|butter|cream|meat|chicken|beef|pork|fish|egg/));
}
