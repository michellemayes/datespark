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
    if (preferences.duration === 'full') numActivities = 5;
    else if (preferences.duration === 'half') numActivities = 3;
    else if (preferences.duration === 'evening') numActivities = 2;
    else if (preferences.duration === 'quick') numActivities = 1;
    
    console.log(`Duration: "${preferences.duration}", Activities: ${numActivities}`);

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

    // Adjust number of ideas based on available venues
    const maxPossibleIdeas = Math.floor(venues.length / numActivities);
    const numIdeas = Math.min(4, Math.max(1, maxPossibleIdeas));
    
    console.log(`Available venues: ${venues.length}, Activities per idea: ${numActivities}, Max possible ideas: ${maxPossibleIdeas}, Generating: ${numIdeas} ideas`);

    const prompt = `Create ${numIdeas} diverse date ideas using ONLY the venues listed below. Duration: "${preferences.duration}" requires EXACTLY ${numActivities} activities per idea.

PREFERENCES:
- Duration: ${preferences.duration} → ${numActivities} activities required
- Budget: $${preferences.budget}
- Dress Code: ${preferences.dressCode}

DRESS CODE ALIGNMENT - CRITICAL:
${preferences.dressCode === 'casual' ? '- Casual: Pick relaxed venues like parks, casual cafes, food trucks, bowling alleys, outdoor activities' : ''}
${preferences.dressCode === 'smart-casual' ? '- Smart-Casual: Pick nice restaurants, wine bars, art galleries, museums, theaters, nicer cafes' : ''}
${preferences.dressCode === 'formal' ? '- Formal: Pick upscale restaurants, fine dining, cocktail bars, opera, symphony, high-end venues only' : ''}

AVAILABLE VENUES (TOTAL: ${venues.length}):
${venueList}

⚠️ CRITICAL INDEX RULES:
- You have ${venues.length} venues numbered 0 to ${venues.length - 1}
- ONLY use indices from 0 to ${venues.length - 1}
- DO NOT use any index >= ${venues.length}
- Each date needs exactly ${numActivities} different venues

DURATION REQUIREMENTS:
${preferences.duration === 'quick' ? '- Quick (1-2 hours): Pick exactly ONE simple activity like a cafe, park, hiking trail, or museum visit' : ''}
${preferences.duration === 'half' ? '- Half Day (3-4 hours): Pick exactly THREE activities suitable for daytime (12pm-5pm). Include lunch spot + 2 activities like museums, parks, hiking trails, outdoor activities, cafes, shopping' : ''}
${preferences.duration === 'evening' ? '- Evening (2-3 hours): Pick exactly TWO activities suitable for evening (6pm-10pm). Must include dinner OR drinks. Can include parks for sunset views or evening walks. NO cafes/coffee shops. Focus on restaurants, bars, theaters, entertainment, scenic viewpoints' : ''}
${preferences.duration === 'full' ? '- Full Day (5+ hours): Pick exactly FOUR TO FIVE activities spanning morning through evening. Include: breakfast/brunch spot, outdoor activities like hiking or parks, lunch, and evening activity. Prioritize nature and outdoor experiences when available' : ''}

CRITICAL RULES:
1. Each date idea MUST have exactly ${numActivities} venues in venueIndices array
2. ONLY use indices 0 to ${venues.length - 1} (you have ${venues.length} venues)
3. NO venue used twice across all ${numIdeas} ideas
4. NEVER use the same venue twice within a single date idea
5. Activities must be within 5 miles of each other
6. MAX 1 restaurant per date idea${numActivities < 3 ? ' (and for dates with less than 3 activities, avoid having 2 food/drink places - mix in other activities)' : ''}
7. Pick variety of categories (don't do identical dates)
8. MATCH VENUE TYPES TO TIME OF DAY - ${preferences.duration === 'evening' ? 'ONLY evening-appropriate venues (restaurants, bars, entertainment)' : preferences.duration === 'half' ? 'ONLY daytime-appropriate venues (lunch spots, museums, parks)' : 'time-appropriate venues'}

Return JSON with ${numIdeas} ideas (verify indices are 0-${venues.length - 1} and each has ${numActivities} items):
{
  "dateIdeas": [
    {
      "venueIndices": [0, 2],
      "theme": "Example Theme"
    }
  ]
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
      
      // Track all used venues across ALL ideas to prevent duplicates
      const allUsedVenues = new Set<number>();
      
      // Validate each date idea and check for duplicates
      result.dateIdeas = result.dateIdeas.filter((idea: any) => {
        if (!idea.venueIndices || !Array.isArray(idea.venueIndices) || idea.venueIndices.length === 0) {
          return false;
        }
        
        // Check all indices are valid
        const validIndices = idea.venueIndices.every((i: number) => i >= 0 && i < venues.length);
        if (!validIndices) {
          console.log(`Removing date idea with invalid indices: ${idea.venueIndices}`);
          return false;
        }
        
        // Check for duplicates within this single date idea
        const uniqueIndices = new Set(idea.venueIndices);
        if (uniqueIndices.size !== idea.venueIndices.length) {
          console.log(`Removing date idea with duplicate venues within idea: ${idea.venueIndices}`);
          return false;
        }
        
        // Check if any venue was already used in a previous idea
        for (const venueIdx of idea.venueIndices) {
          if (allUsedVenues.has(venueIdx)) {
            console.log(`Removing date idea - venue ${venueIdx} (${venues[venueIdx]?.name}) already used in another idea`);
            return false;
          }
        }
        
        // If all checks pass, mark these venues as used
        idea.venueIndices.forEach((idx: number) => allUsedVenues.add(idx));
        return true;
      });
      
      console.log(`After validation: ${result.dateIdeas.length} unique date ideas with no duplicate venues`);
      
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      // Return simple fallback
      result = {
        dateIdeas: [
          { venueIndices: [0], theme: "Simple Date" },
          { venueIndices: [1], theme: "Casual Outing" }
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
