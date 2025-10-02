import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { venues } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create a concise venue summary for the AI
    const venueNames = venues.map((v: any) => v.name).join(", ");
    const venueTypes = venues.flatMap((v: any) => v.types || []);
    const uniqueTypes = [...new Set(venueTypes)].join(", ");

    const prompt = `Generate a creative, romantic date night title and description for a date that includes these venues: ${venueNames}.

Venue types: ${uniqueTypes}

Requirements:
- Title: Short, catchy, and romantic (3-5 words max). Examples: "Artistic Evening Adventure", "Cultural Night Out", "Garden & Gastronomy"
- Description: One engaging sentence describing the date flow between venues (25-40 words). Be specific about what makes this combination special.

Return ONLY a JSON object with this exact structure:
{
  "title": "your creative title",
  "description": "your engaging description"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a creative date planning assistant. Always respond with valid JSON only." },
          { role: "user", content: prompt }
        ],
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      // Return fallback content
      return new Response(
        JSON.stringify({
          title: `${venues[0].name} & More`,
          description: venues.length === 2 
            ? `Begin your evening at ${venues[0].name} followed by ${venues[1].name}`
            : `Start at ${venues[0].name}, then ${venues[1].name}, and finish at ${venues[2].name}`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await response.json();
    const content = aiData.choices[0].message.content;
    
    // Parse the JSON response
    let result;
    try {
      result = JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      // Return fallback
      result = {
        title: `${venues[0].name} & More`,
        description: venues.length === 2 
          ? `Begin your evening at ${venues[0].name} followed by ${venues[1].name}`
          : `Start at ${venues[0].name}, then ${venues[1].name}, and finish at ${venues[2].name}`
      };
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-date-content:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
