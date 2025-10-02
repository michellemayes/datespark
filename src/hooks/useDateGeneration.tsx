import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DateIdea } from "@/components/DateIdeaCard";
import { DatePreferences } from "@/components/DateFilters";

export const useDateGeneration = () => {
  const { toast } = useToast();
  const [generatedIdeas, setGeneratedIdeas] = useState<DateIdea[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateDateIdeas = async (preferences: DatePreferences) => {
    setIsGenerating(true);
    
    try {
      // First, geocode the user's location
      let coordinates = "37.7749,-122.4194";
      let userCoords = { lat: 37.7749, lng: -122.4194 };
      
      if (preferences.userLocation) {
        const { data: geocodeData, error: geocodeError } = await supabase.functions.invoke('geocode-location', {
          body: { address: preferences.userLocation }
        });
        
        if (geocodeError) {
          console.error('Geocoding error:', geocodeError);
          toast({
            variant: "destructive",
            title: "Location error",
            description: "Could not find your location. Using default area.",
          });
        } else {
          coordinates = `${geocodeData.lat},${geocodeData.lng}`;
          userCoords = { lat: geocodeData.lat, lng: geocodeData.lng };
        }
      }

      // Do broader search to get many options
      const radiusMeters = preferences.radiusMiles * 1609.34;
      const venueTypes = ['restaurant', 'cafe', 'bar', 'museum', 'art_gallery', 'park', 'movie_theater', 'bowling_alley', 'night_club'];
      
      const searchPromises = venueTypes.map(type =>
        supabase.functions.invoke('search-places', {
          body: {
            location: coordinates,
            radius: radiusMeters,
            type: type,
            budget: preferences.budget
          }
        })
      );

      const searchResults = await Promise.all(searchPromises);
      let allPlaces: any[] = [];
      searchResults.forEach(result => {
        if (result.data?.places) {
          allPlaces = [...allPlaces, ...result.data.places];
        }
      });

      console.log(`Found ${allPlaces.length} venues total`);

      // Apply logic-based filtering before AI
      const filterByDuration = (venues: any[]) => {
        return venues.filter(v => {
          const types = v.types || [];
          const name = v.name?.toLowerCase() || '';
          
          // Evening - STRICT filtering for evening-only venues
          if (preferences.duration === 'evening') {
            // Exclude ALL cafes, coffee shops, bakeries, breakfast places
            if (types.includes('cafe') || 
                types.includes('coffee_shop') || 
                types.includes('bakery') ||
                types.includes('breakfast_restaurant')) return false;
            
            // Name-based exclusions
            const eveningExclusions = ['starbucks', 'coffee', 'cafe', 'dunkin', 'peet', 'caribou', 'dutch bros'];
            if (eveningExclusions.some(term => name.includes(term))) return false;
            
            // Check opening hours - exclude if closes before 7pm
            if (v.opening_hours?.periods) {
              const now = new Date();
              const day = now.getDay();
              const todayHours = v.opening_hours.periods.find((p: any) => p.open?.day === day);
              if (todayHours?.close) {
                const closeHour = parseInt(todayHours.close.time.substring(0, 2));
                if (closeHour < 19) return false; // Closes before 7pm
              }
            }
            
            // Only keep evening-appropriate: restaurants, bars, theaters, entertainment
            const eveningTypes = ['restaurant', 'bar', 'night_club', 'movie_theater', 'bowling_alley', 'museum', 'art_gallery'];
            if (!types.some(t => eveningTypes.includes(t))) return false;
          }
          
          // Half Day - exclude bars/nightclubs, include lunch spots
          if (preferences.duration === 'half') {
            if (types.includes('night_club')) return false;
          }
          
          // Quick - exclude bars/nightclubs
          if (preferences.duration === 'quick') {
            if (types.includes('bar') || types.includes('night_club')) return false;
          }
          
          return true;
        });
      };

      const filteredPlaces = filterByDuration(allPlaces);
      console.log(`Duration: ${preferences.duration}, Filtered to ${filteredPlaces.length} appropriate venues from ${allPlaces.length} total`);

      if (filteredPlaces.length === 0) {
        toast({
          variant: "destructive",
          title: "No venues found",
          description: "Try adjusting your filters or expanding your search radius.",
        });
        setIsGenerating(false);
        return;
      }

      // Let AI create 4 unique date ideas
      const { data: aiResult, error: aiError } = await supabase.functions.invoke('filter-venues', {
        body: { 
          venues: filteredPlaces,
          userLocation: userCoords,
          preferences: {
            duration: preferences.duration,
            budget: preferences.budget,
            dressCode: preferences.dressCode
          }
        }
      });

      if (aiError || !aiResult?.dateIdeas) {
        console.error('AI error:', aiError);
        toast({
          variant: "destructive",
          title: "Error generating ideas",
          description: "Please try again with different preferences.",
        });
        setIsGenerating(false);
        return;
      }

      console.log(`AI generated ${aiResult.dateIdeas.length} date ideas`);

      // Generate content for each date idea
      const ideas: DateIdea[] = [];
      const ideaPromises = aiResult.dateIdeas.map(async (dateIdea: any, i: number) => {
        const venues = dateIdea.venueIndices.map((idx: number) => filteredPlaces[idx]).filter(Boolean);
        
        if (venues.length === 0) return null;

        const { data: contentData } = await supabase.functions.invoke('generate-date-content', {
          body: { venues, duration: preferences.duration }
        });

        const venueLinks = venues
          .filter(v => v.details?.website)
          .map(v => ({ name: v.name, url: v.details.website, type: 'website' }));

        const mapLocations = venues
          .filter(v => v.location)
          .map(v => ({ name: v.name, lat: v.location.lat, lng: v.location.lng }));

        return {
          id: `idea-${i}`,
          title: contentData?.title || dateIdea.theme || `${venues[0].name} & More`,
          description: contentData?.description || `Visit ${venues.map(v => v.name).join(', ')}`,
          budget: preferences.budget === 0 ? "Free" : `$${preferences.budget}`,
          duration: preferences.duration,
          dressCode: preferences.dressCode,
          location: preferences.location,
          activities: venues.map(v => `${v.name} - ${v.address}`),
          foodSpots: venues.filter(v => v.types?.includes('restaurant') || v.types?.includes('cafe') || v.types?.includes('bar')).map(v => v.name),
          venueLinks,
          mapLocations
        };
      });

      const results = await Promise.all(ideaPromises);
      ideas.push(...results.filter(idea => idea !== null) as DateIdea[]);

      // Add backup ideas if needed
      if (ideas.length === 0) {
        ideas.push({
          id: "fallback-1",
          title: "Explore Your City",
          description: "Visit some of the great venues we found near you!",
          budget: preferences.budget === 0 ? "Free" : `$${preferences.budget}`,
          duration: preferences.duration,
          dressCode: preferences.dressCode,
          location: preferences.location,
          activities: filteredPlaces.slice(0, 3).map(v => `${v.name} - ${v.address}`),
          foodSpots: [],
          venueLinks: [],
          mapLocations: filteredPlaces.slice(0, 3).map(v => ({ name: v.name, lat: v.geometry.location.lat, lng: v.geometry.location.lng }))
        });
      }

      setGeneratedIdeas(ideas);
      toast({
        title: "Success!",
        description: `Generated ${ideas.length} date ideas for you`,
      });
    } catch (error) {
      console.error('Error generating date ideas:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return { generatedIdeas, isGenerating, generateDateIdeas };
};

