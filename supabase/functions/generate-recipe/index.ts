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
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get user preferences
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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
          { role: "user", content: prompt }
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
                  title: { type: "string", description: "Recipe title" },
                  ingredients: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of ingredients with quantities"
                  },
                  instructions: {
                    type: "array",
                    items: { type: "string" },
                    description: "Step-by-step cooking instructions"
                  },
                  prep_time: { type: "string", description: "Total preparation time (e.g., '30 min')" },
                  cuisine: { type: "string", description: "Cuisine type (e.g., 'Italian', 'Thai')" }
                },
                required: ["title", "ingredients", "instructions", "prep_time"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_recipe" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service unavailable. Please contact support." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices[0].message.tool_calls?.[0];
    
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "Failed to generate recipe" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const recipe = JSON.parse(toolCall.function.arguments);

    // Save recipe to database
    const { data: savedRecipe, error: saveError } = await supabase
      .from("recipes")
      .insert({
        user_id: userId,
        title: recipe.title,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        prep_time: recipe.prep_time,
        cuisine: recipe.cuisine || null
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving recipe:", saveError);
      return new Response(JSON.stringify({ error: "Failed to save recipe" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ recipe: savedRecipe }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-recipe function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});