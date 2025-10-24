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
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Initialize Supabase service role client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch user dietary preferences
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_vegetarian, cuisines")
      .eq("user_id", userId)
      .single();

    const dietaryInfo = profile?.is_vegetarian
      ? "vegetarian-friendly"
      : "any dietary preference";
    const cuisineInfo = profile?.cuisines?.length
      ? `focusing on ${profile.cuisines.join(", ")} cuisines`
      : "";

    const systemPrompt = `You are Sousa, a warm and friendly meal planning assistant. 
Create a structured, easy-to-follow recipe that is ${dietaryInfo} ${cuisineInfo}.
Always include: a title, full list of ingredients, and clear step-by-step instructions.`;

    // 🔹 Call Lovable AI Gateway
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
          {
            role: "user",
            content: `${prompt} (for dinner tonight — include complete ingredients and steps)`,
          },
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
      console.error("AI Gateway error:", errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices[0].message.tool_calls?.[0];
    if (!toolCall) throw new Error("Recipe generation failed.");

    const recipe = JSON.parse(toolCall.function.arguments);

    // 🔹 Save Recipe
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

    // 🔹 Add to Meal Plan (for tonight)
    const today = new Date().toISOString().split("T")[0];
    await supabase.from("meal_plan").insert({
      user_id: userId,
      date: today,
      meal_type: "Dinner",
      recipe_id: savedRecipe.id,
    });

    // 🔹 Generate Shopping List Items
    const listItems = recipe.ingredients.map((item: string) => ({
      user_id: userId,
      ingredient: item,
      recipe_id: savedRecipe.id,
      purchased: false,
    }));

    const { error: listError } = await supabase.from("shopping_list").insert(listItems);
    if (listError) console.error("Shopping list error:", listError);

    // ✅ Return final recipe
    return new Response(JSON.stringify({ recipe: savedRecipe }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-recipe function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
