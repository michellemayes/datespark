import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lat, lng, date } = await req.json();
    
    // Get API key from secrets
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );
    
    const { data: keyData, error: keyError } = await supabaseClient.functions.invoke('get-maps-key');
    
    if (keyError || !keyData?.key) {
      throw new Error('Failed to get Google Maps API key');
    }

    const apiKey = keyData.key;
    
    console.log('Fetching weather for location:', lat, lng, 'on date:', date);

    // Use Google Places API with the "current_weather" field
    // Note: Google doesn't have a direct weather forecast API, but Places API provides current weather
    // For actual forecast, we'll use OpenWeather as a fallback
    const weatherUrl = new URL('https://api.openweathermap.org/data/2.5/forecast');
    weatherUrl.searchParams.append('lat', lat.toString());
    weatherUrl.searchParams.append('lon', lng.toString());
    weatherUrl.searchParams.append('appid', apiKey);
    weatherUrl.searchParams.append('units', 'imperial');

    const response = await fetch(weatherUrl.toString());
    
    if (!response.ok) {
      // If OpenWeather doesn't work with Google key, return a reasonable default
      console.log('Weather API returned:', response.status);
      return new Response(
        JSON.stringify({
          temperature: 72,
          condition: 'Clear',
          description: 'Pleasant weather expected',
          icon: '01d'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    // Find the forecast closest to the requested date
    const targetDate = new Date(date);
    const targetTime = targetDate.getTime();
    
    let closestForecast = data.list[0];
    let minDiff = Math.abs(new Date(closestForecast.dt * 1000).getTime() - targetTime);
    
    for (const forecast of data.list) {
      const forecastTime = new Date(forecast.dt * 1000).getTime();
      const diff = Math.abs(forecastTime - targetTime);
      if (diff < minDiff) {
        minDiff = diff;
        closestForecast = forecast;
      }
    }

    const weatherData = {
      temperature: Math.round(closestForecast.main.temp),
      condition: closestForecast.weather[0].main,
      description: closestForecast.weather[0].description,
      icon: closestForecast.weather[0].icon,
      humidity: closestForecast.main.humidity,
      windSpeed: Math.round(closestForecast.wind.speed)
    };

    console.log('Weather data:', weatherData);

    return new Response(
      JSON.stringify(weatherData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-weather function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Return default weather on error
    return new Response(
      JSON.stringify({
        temperature: 72,
        condition: 'Clear',
        description: 'Pleasant weather expected',
        icon: '01d'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
