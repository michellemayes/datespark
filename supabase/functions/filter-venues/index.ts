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
    const { venues, preferences, userLocation } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Calculate distance between two coordinates using Haversine formula
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 3959; // Earth's radius in miles
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    // Create detailed venue information with distances
    const venueList = venues.map((v: any, i: number) => {
      const lat = v.geometry?.location?.lat;
      const lng = v.geometry?.location?.lng;
      const distance = lat && lng && userLocation 
        ? calculateDistance(userLocation.lat, userLocation.lng, lat, lng).toFixed(1)
        : 'unknown';
      
      return `${i}. ${v.name}
   Type: ${v.types?.join(', ') || 'unknown'}
   Distance: ${distance} miles
   Rating: ${v.rating || 'N/A'}
   Coordinates: ${lat},${lng}`;
    }).join('\n\n');

    // Determine number of activities based on duration
    let numActivities = 2;
    if (preferences.duration === 'full-day' || preferences.duration === 'evening') {
      numActivities = 3;
    } else if (preferences.duration === 'quick') {
      numActivities = 1;
    }

    const prompt = `You are a date planning expert. Create ${numActivities === 1 ? '3-4' : '4'} unique date ideas using these venues.

USER PREFERENCES:
- Duration: ${preferences.duration}
- Budget: $${preferences.budget} per person
- Dress code: ${preferences.dressCode}
- Dietary restrictions: ${preferences.dietaryRestrictions?.join(', ') || 'none'}
- Location: ${preferences.location}

AVAILABLE VENUES:
${venueList}

CRITICAL RULES:
1. Each date idea needs exactly ${numActivities} activities
2. Activities in the same date MUST be within 5 miles of each other
3. NEVER use the same venue in multiple date ideas
4. Pick venues that create a cohesive theme/experience
5. Consider timing (${preferences.duration}):
   - quick: 1-2 hours, simple activities
   - afternoon: 3-4 hours, lunch + activity
   - evening: 4-5 hours, dinner + entertainment
   - full-day: 6+ hours, multiple activities with variety

Return a JSON object with this structure:
{
  "dateIdeas": [
    {
      "venueIndices": [1, 5, 12],
      "theme": "Romantic Evening Out"
    }
  ]
}

Pick venues that:
- Match the budget and dress code
- Are geographically close (within 5 miles)
- Create a natural flow (e.g., coffee → museum → dinner)
- Fit the time of day and duration
- Offer variety across the ${numActivities === 1 ? '3-4' : '4'} different date ideas`;


    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an expert date planner. Always respond with valid JSON only." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      // Return simple fallback structure
      return new Response(
        JSON.stringify({ 
          dateIdeas: [
            { venueIndices: [0, 1], theme: "Simple Date" },
            { venueIndices: [2, 3], theme: "Casual Outing" }
          ]
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await response.json();
    let content = aiData.choices[0].message.content;
    
    // Strip markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Parse the JSON response
    let result;
    try {
      result = JSON.parse(content);
      
      // Validate it has the expected structure
      if (!result.dateIdeas || !Array.isArray(result.dateIdeas)) {
        throw new Error("Invalid response structure");
      }
      
      // Validate each date idea
      result.dateIdeas = result.dateIdeas.filter((idea: any) => 
        idea.venueIndices && 
        Array.isArray(idea.venueIndices) && 
        idea.venueIndices.length > 0 &&
        idea.venueIndices.every((i: number) => i >= 0 && i < venues.length)
      );
      
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      // Return simple fallback
      result = {
        dateIdeas: [
          { venueIndices: [0, 1], theme: "Simple Date" },
          { venueIndices: [2, 3], theme: "Casual Outing" }
        ]
      };
    }

    return new Response(
      JSON.stringify(result),
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
