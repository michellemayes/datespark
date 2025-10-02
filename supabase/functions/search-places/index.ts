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
    const { location, radius, type, budget } = await req.json();
    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');

    if (!apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    console.log('Searching places with params:', { location, radius, type, budget });

    // Search for places using Google Places API (Nearby Search)
    const searchUrl = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
    searchUrl.searchParams.append('location', location);
    searchUrl.searchParams.append('radius', radius.toString());
    searchUrl.searchParams.append('type', type || 'restaurant');
    searchUrl.searchParams.append('key', apiKey);

    // Add price level filter based on budget per person
    if (budget) {
      let minPriceLevel = 0;
      let maxPriceLevel = 4;
      
      if (budget < 20) {
        minPriceLevel = 0;
        maxPriceLevel = 1; // Inexpensive
      } else if (budget < 40) {
        minPriceLevel = 0;
        maxPriceLevel = 2; // Moderate
      } else if (budget < 75) {
        minPriceLevel = 1;
        maxPriceLevel = 3; // Expensive
      } else {
        minPriceLevel = 2;
        maxPriceLevel = 4; // Very Expensive
      }
      
      searchUrl.searchParams.append('minprice', minPriceLevel.toString());
      searchUrl.searchParams.append('maxprice', maxPriceLevel.toString());
    }

    const response = await fetch(searchUrl.toString());
    const data = await response.json();

    console.log('Google Places API response status:', data.status);

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data);
      throw new Error(`Google Places API error: ${data.status}`);
    }

    // Get details for top places
    const placesWithDetails = await Promise.all(
      (data.results || []).slice(0, 5).map(async (place: any) => {
        const detailsUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
        detailsUrl.searchParams.append('place_id', place.place_id);
        detailsUrl.searchParams.append('fields', 'name,formatted_address,formatted_phone_number,website,rating,price_level,opening_hours,photos');
        detailsUrl.searchParams.append('key', apiKey);

        const detailsResponse = await fetch(detailsUrl.toString());
        const detailsData = await detailsResponse.json();

        return {
          id: place.place_id,
          name: place.name,
          address: place.vicinity,
          rating: place.rating,
          priceLevel: place.price_level,
          types: place.types,
          location: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
          },
          geometry: place.geometry,
          opening_hours: detailsData.result?.opening_hours,
          details: detailsData.result,
        };
      })
    );

    return new Response(
      JSON.stringify({ places: placesWithDetails }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in search-places function:', error);
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
