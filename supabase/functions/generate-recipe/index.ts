import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, userId } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_vegetarian, cuisines")
      .eq("user_id", userId)
      .single();

    const dietaryInfo = profile?.is_vegetarian ? "vegetarian-friendly" : "any dietary preference";
    const cuisineInfo = profile?.cuisines?.length
      ? `focusing on ${profile.cuisines.join(", ")} cuisines`
      : "";

    const systemPrompt = `You are Sousa, a friendly meal planning assistant. Create structured recipes that are ${dietaryInfo} ${cuisineInfo}.
Always return recipes with clear ingredients and step-by-step instructions.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_recipe",
              description: "Generate a structured recipe based on the user's request",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  ingredients: { type: "array", items: { type: "string" } },
                  instructions: { type: "array", items: { type: "string" } },
                  prep_time: { type: "string" },
                  cuisine: { type: "string" },
                },
                required: ["title", "ingredients", "instructions", "prep_time"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_recipe" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Error:", errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices[0].message.tool_calls?.[0];
    if (!toolCall) throw new Error("No recipe returned by AI");

    const recipe = JSON.parse(toolCall.function.arguments);

    // ✅ Save recipe
    const { data: savedRecipe, error: saveError } = await supabase
      .from("recipes")
      .insert({
        user_id: userId,
        title: recipe.title,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        prep_time: recipe.prep_time,
        cuisine: recipe.cuisine || null,
      })
      .select()
      .single();

    if (saveError) throw saveError;

    // ✅ Add to meal_plan (Dinner for today)
    const today = new Date().toISOString().split("T")[0];
    await supabase.from("meal_plan").insert({
      user_id: userId,
      date: today,
      meal_type: "Dinner",
      recipe_id: savedRecipe.id,
    });

    // ✅ Add to shopping_list (one row per ingredient)
    if (recipe.ingredients?.length > 0) {
      const shoppingItems = recipe.ingredients.map((ingredient: string) => ({
        user_id: userId,
        recipe_id: savedRecipe.id,
        ingredient,
      }));

      const { error: listError } = await supabase
        .from("shopping_list")
        .insert(shoppingItems);

      if (listError) console.error("Shopping list insert failed:", listError);
    }

    return new Response(JSON.stringify({ recipe: savedRecipe }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-recipe:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
