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

    // Calculate distance between two coordinates
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 3959; // miles
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    // Determine activities count based on duration
    let numActivities = 2;
    if (preferences.duration === 'full-day') numActivities = 4;
    else if (preferences.duration === 'afternoon') numActivities = 3;
    else if (preferences.duration === 'evening') numActivities = 2;
    else if (preferences.duration === 'quick') numActivities = 1;

    // Create venue info with categories
    const venueList = venues.map((v: any, i: number) => {
      const lat = v.geometry?.location?.lat;
      const lng = v.geometry?.location?.lng;
      const distance = lat && lng && userLocation 
        ? calculateDistance(userLocation.lat, userLocation.lng, lat, lng).toFixed(1)
        : 'N/A';
      
      const types = v.types || [];
      let category = 'activity';
      if (types.includes('restaurant')) category = 'restaurant';
      else if (types.includes('cafe')) category = 'cafe';
      else if (types.includes('bar')) category = 'bar';
      
      return `${i}. ${v.name} [${category}] - ${distance}mi away - Rating: ${v.rating || 'N/A'} - Types: ${types.slice(0, 3).join(', ')}`;
    }).join('\n');

    const prompt = `Create 4 diverse date ideas using these venues.

PREFERENCES:
- Duration: ${preferences.duration}
- Budget: $${preferences.budget}
- Dress Code: ${preferences.dressCode}
- Dietary: ${preferences.dietaryRestrictions?.join(', ') || 'none'}

VENUES (${venues.length} available):
${venueList}

RULES:
1. Each idea has exactly ${numActivities} activities
2. Activities must be within 5 miles of each other
3. NO venue used twice across all ideas
4. NEVER use the same venue twice within a single date idea
5. MAX 1 restaurant per date idea
6. Pick variety of categories (don't do 4 identical dates)
6. Consider flow based on duration:
   - quick (1 activity): simple, standalone activity
   - afternoon (3 activities): lunch + 2 activities OR activity + lunch + activity
   - evening (2 activities): dinner + one activity OR activity + drinks
   - full-day (4 activities): breakfast/brunch + activity + lunch + activity

Return JSON:
{
  "dateIdeas": [
    {
      "venueIndices": [0, 15],
      "theme": "Cultural Evening"
    },
    {
      "venueIndices": [3, 8],
      "theme": "Casual Fun"
    }
  ]
}

Make each date feel different. Prioritize highly-rated venues close together.`;


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
      result.dateIdeas = result.dateIdeas.filter((idea: any) => {
        if (!idea.venueIndices || !Array.isArray(idea.venueIndices) || idea.venueIndices.length === 0) {
          return false;
        }
        
        // Check all indices are valid
        const validIndices = idea.venueIndices.every((i: number) => i >= 0 && i < venues.length);
        if (!validIndices) return false;
        
        // Check for duplicates within this single date idea
        const uniqueIndices = new Set(idea.venueIndices);
        if (uniqueIndices.size !== idea.venueIndices.length) {
          console.log(`Removing date idea with duplicate venues: ${idea.venueIndices}`);
          return false;
        }
        
        return true;
      });
      
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
