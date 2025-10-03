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

    // Use at least 1 day for the API call
    const daysParam = Math.max(1, diffDays);

    // Use Google Maps Weather API
    const weatherUrl = `https://weather.googleapis.com/v1/forecast/days:lookup?key=${apiKey}&location.latitude=${lat}&location.longitude=${lng}&days=${daysParam}`;

    const response = await fetch(weatherUrl);
    
    if (!response.ok) {
      console.log('Weather API returned error:', response.status);
      const errorText = await response.text();
      console.log('Error response:', errorText);
      return new Response(
        JSON.stringify(null),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    if (!data || !data.forecastDays || data.forecastDays.length === 0) {
      console.log('No weather data available');
      return new Response(
        JSON.stringify(null),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the weather for the target day (find matching day by index)
    const dayIndex = Math.min(diffDays, data.forecastDays.length - 1);
    const dayForecast = data.forecastDays[dayIndex];
    
    // Extract temperature in Fahrenheit
    const maxTempC = dayForecast.maxTemperature?.degrees || 22;
    const minTempC = dayForecast.minTemperature?.degrees || 10;
    const avgTempF = Math.round(((maxTempC + minTempC) / 2) * 9/5 + 32);
    
    // Get condition from daytime forecast
    const condition = dayForecast.daytimeForecast?.weatherCondition?.description?.text || 'Clear';
    const conditionType = dayForecast.daytimeForecast?.weatherCondition?.type || 'CLEAR';
    
    const weatherData = {
      temperature: avgTempF,
      condition: conditionType.replace(/_/g, ' ').split(' ').map((w: string) => w.charAt(0) + w.slice(1).toLowerCase()).join(' '),
      description: condition,
      icon: '01d',
      humidity: dayForecast.daytimeForecast?.relativeHumidity || 50,
      windSpeed: Math.round(dayForecast.daytimeForecast?.wind?.speed?.value || 5),
      hourlyForecast: [] // Google Weather API doesn't provide hourly in days endpoint
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
