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
    const { venues, preferences } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create context about the venues
    const venueList = venues.map((v: any, i: number) => 
      `${i + 1}. ${v.name} - Types: ${v.types?.join(', ') || 'unknown'}`
    ).join('\n');

    const prompt = `You are helping filter venues for a date based on these preferences:
- Time: ${preferences.duration} (e.g., "evening" = dinner/drinks, "afternoon" = lunch/coffee)
- Budget: $${preferences.budget}
- Dress code: ${preferences.dressCode}

Venues available:
${venueList}

Return a JSON array of venue indices (0-based) that are appropriate for this date. Consider:
- Evening dates: prioritize restaurants, bars, theaters. Avoid coffee shops.
- Afternoon dates: cafes, museums, parks, lunch spots are great
- Morning dates: cafes, breakfast spots, parks
- Budget appropriateness
- Variety (mix of activities)

Return ONLY a JSON array like: [0, 2, 5, 7, 9]
Pick 6-12 venues maximum that create a well-rounded date experience.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a date planning assistant. Always respond with valid JSON only." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      // Return all venues if AI fails
      return new Response(
        JSON.stringify({ indices: venues.map((_: any, i: number) => i) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await response.json();
    let content = aiData.choices[0].message.content;
    
    // Strip markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Parse the JSON response
    let indices;
    try {
      indices = JSON.parse(content);
      
      // Validate it's an array
      if (!Array.isArray(indices)) {
        throw new Error("Response is not an array");
      }
      
      // Filter out invalid indices
      indices = indices.filter((i: number) => i >= 0 && i < venues.length);
      
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      // Return all venues as fallback
      indices = venues.map((_: any, i: number) => i);
    }

    return new Response(
      JSON.stringify({ indices }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in filter-venues:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
