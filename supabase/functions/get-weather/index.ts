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
    
    // Calculate days between today and target date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    console.log('Days from today:', diffDays);

    // Don't provide weather if date is more than 10 days in the future
    if (diffDays > 10) {
      console.log('Date is more than 10 days in the future, not providing weather');
      return new Response(
        JSON.stringify(null),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get API key from secrets
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );
    
    const { data: keyData, error: keyError } = await supabaseClient.functions.invoke('get-maps-key');
    
    if (keyError || !keyData?.apiKey) {
      console.error('Failed to get Google Maps API key:', keyError);
      return new Response(
        JSON.stringify(null),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = keyData.apiKey;
    
    console.log('Fetching weather for location:', lat, lng, 'on date:', date);

    // Use Google Maps Weather API
    const weatherUrl = `https://weather.googleapis.com/v1/forecast/days:lookup?key=${apiKey}&location.latitude=${lat}&location.longitude=${lng}&days=${diffDays}`;

    const response = await fetch(weatherUrl);
    
    if (!response.ok) {
      console.log('Weather API returned error:', response.status);
      return new Response(
        JSON.stringify(null),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    if (!data || !data.days || data.days.length === 0) {
      console.log('No weather data available');
      return new Response(
        JSON.stringify(null),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the weather for the target day
    const dayForecast = data.days[0];
    
    const weatherData = {
      temperature: Math.round(dayForecast.temperature?.max?.value || dayForecast.temperature?.value || 72),
      condition: dayForecast.condition || 'Clear',
      description: dayForecast.description || 'Pleasant weather expected',
      icon: '01d',
      humidity: dayForecast.humidity || 50,
      windSpeed: Math.round(dayForecast.wind?.speed || 5),
      hourlyForecast: dayForecast.hourly?.slice(0, 8).map((hour: any) => ({
        time: new Date(hour.time).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
        temperature: Math.round(hour.temperature?.value || 72),
        condition: hour.condition || 'Clear',
        icon: '01d'
      })) || []
    };

    console.log('Weather data:', weatherData);

    return new Response(
      JSON.stringify(weatherData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-weather function:', error);
    
    // Return null on error so card doesn't show weather
    return new Response(
      JSON.stringify(null),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
