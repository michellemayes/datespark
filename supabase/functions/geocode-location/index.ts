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
    const { address } = await req.json();
    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');

    if (!apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    console.log('Geocoding address:', address);

    const geocodeUrl = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    geocodeUrl.searchParams.append('address', address);
    geocodeUrl.searchParams.append('key', apiKey);

    const response = await fetch(geocodeUrl.toString());
    const data = await response.json();

    console.log('Geocoding API response status:', data.status);

    if (data.status !== 'OK') {
      console.error('Geocoding API error:', data);
      throw new Error(`Geocoding failed: ${data.status}`);
    }

    const result = data.results[0];
    const location = {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formatted_address: result.formatted_address,
    };

    return new Response(
      JSON.stringify(location),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in geocode-location function:', error);
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
