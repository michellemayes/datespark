import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { weather, dressCode, location } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a fashion advisor helping people dress appropriately for their date. 
Provide general style guidance based on weather conditions and dress code, focusing on fabric types, layering needs, and comfort level.
Avoid naming specific clothing items. Keep recommendations concise (2-3 sentences max) and actionable.`;

    const userPrompt = `Weather: ${weather.temperature}°F, ${weather.condition} (${weather.description})
Wind: ${weather.windSpeed} mph, Humidity: ${weather.humidity}%
Dress Code: ${dressCode}
Location Type: ${location}

What general style advice would you give? Focus on breathability, layering, comfort, and formality level without mentioning specific garments.`;

    console.log('Generating clothing recommendation for:', { weather, dressCode, location });

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      console.error('AI API error:', response.status, await response.text());
      throw new Error('Failed to generate clothing recommendation');
    }

    const data = await response.json();
    const recommendation = data.choices[0].message.content;

    console.log('Generated recommendation:', recommendation);

    return new Response(
      JSON.stringify({ recommendation }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-clothing-recommendation function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
