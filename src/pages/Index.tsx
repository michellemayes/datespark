import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DateFilters, DatePreferences } from "@/components/DateFilters";
import { DateIdeaCard, DateIdea } from "@/components/DateIdeaCard";
import { Heart, Sparkles, Calendar, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSavedIdeas } from "@/hooks/useSavedIdeas";
import { AuthModal } from "@/components/AuthModal";
import { Footer } from "@/components/Footer";
import heroImage from "@/assets/hero-couple.jpg";

const Index = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [preferences, setPreferences] = useState<DatePreferences>({
    budget: 50,
    duration: "evening",
    dressCode: "smart-casual",
    location: "mixed",
    userLocation: "",
    radiusMiles: 10,
  });
  const [generatedIdeas, setGeneratedIdeas] = useState<DateIdea[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { savedIdeas, saveIdea, refetch } = useSavedIdeas(user?.id);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully",
    });
  };

  const generateDateIdeas = async () => {
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
          description: "Please try again",
        });
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
          id: "fallback",
          title: "Cozy Evening Adventure",
          description: "A flexible date night plan that works anywhere",
          budget: preferences.budget === 0 ? "Free" : `$${preferences.budget}`,
          duration: preferences.duration,
          dressCode: preferences.dressCode,
          location: preferences.location,
          activities: [
            "Find a highly-rated restaurant in your area",
            "Take a scenic walk before or after dinner",
            "Discover a new neighborhood together",
            "End with coffee or dessert at a local café",
          ],
          foodSpots: ["Ask locals for recommendations"],
        });
      }

      setGeneratedIdeas(ideas);
      
      toast({
        title: "Date ideas generated!",
        description: `Found ${ideas.length} personalized date idea${ideas.length > 1 ? 's' : ''} for you`,
      });
    } catch (error) {
      console.error('Error generating date ideas:', error);
      toast({
        variant: "destructive",
        title: "Error generating ideas",
        description: "Please try again or adjust your preferences",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveIdea = async (ideaId: string) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Sign in required",
        description: "Please sign in to save date ideas",
      });
      setAuthModalOpen(true);
      return;
    }

    const idea = generatedIdeas.find(i => i.id === ideaId);
    if (!idea) return;

    // Check if already saved
    const existingSaved = savedIdeas.find(saved => saved.title === idea.title);
    
    if (existingSaved) {
      // Unsave it
      try {
        const { error } = await supabase
          .from("saved_date_ideas")
          .delete()
          .eq("id", existingSaved.id);

        if (error) throw error;

        toast({
          title: "Removed from favorites",
          description: "Date removed from your favorites",
        });

        // Refresh saved ideas
        refetch();
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
      }
    } else {
      // Save it
      await saveIdea({
        title: idea.title,
        description: idea.description,
        budget: idea.budget,
        duration: idea.duration,
        location: idea.location,
        dress_code: idea.dressCode,
        activities: idea.activities,
        food_spots: idea.foodSpots,
        map_locations: idea.mapLocations,
        venue_links: idea.venueLinks,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10" />
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="flex justify-end gap-2 mb-4">
            {user && (
              <Button variant="ghost" onClick={() => window.location.href = '/saved'}>
                <Heart className="mr-2 h-4 w-4" />
                Favorite Dates
              </Button>
            )}
            {user ? (
              <Button variant="ghost" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => setAuthModalOpen(true)}>
                Sign In
              </Button>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-slide-up">
              <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
                <Heart className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-sm font-semibold text-primary">Date Night Made Easy</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Perfect Date Ideas,
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {" "}Zero Planning Stress
                </span>
              </h1>
              <p className="text-xl text-muted-foreground">
                For busy parents and couples who want to maximize their precious date night time. Get personalized date ideas in seconds.
              </p>
              <div className="flex gap-4">
                <Button variant="hero" size="lg" onClick={() => document.getElementById('generator')?.scrollIntoView({ behavior: 'smooth' })}>
                  <Sparkles className="mr-2" />
                  Find Your Perfect Date
                </Button>
                {user && (
                  <Button variant="outline" size="lg" onClick={() => window.location.href = '/saved'}>
                    <Calendar className="mr-2" />
                    View Favorite Dates
                  </Button>
                )}
              </div>
            </div>
            <div className="relative animate-float">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl blur-3xl" />
              <img
                src={heroImage}
                alt="Happy couple on a date"
                className="relative rounded-3xl shadow-glow w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center space-y-4 p-6 rounded-2xl bg-card border-2 border-border shadow-playful hover:shadow-glow transition-all animate-bounce-in">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold">Personalized Ideas</h3>
            <p className="text-muted-foreground">
              Filter by budget, time, and style to get dates that actually work for you
            </p>
          </div>
          <div className="text-center space-y-4 p-6 rounded-2xl bg-card border-2 border-border shadow-playful hover:shadow-glow transition-all animate-bounce-in" style={{ animationDelay: '0.1s' }}>
            <div className="w-16 h-16 bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center mx-auto">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold">One-Click Scheduling</h3>
            <p className="text-muted-foreground">
              Add your date to Google Calendar and share the itinerary with your partner instantly
            </p>
          </div>
          <div className="text-center space-y-4 p-6 rounded-2xl bg-card border-2 border-border shadow-playful hover:shadow-glow transition-all animate-bounce-in" style={{ animationDelay: '0.2s' }}>
            <div className="w-16 h-16 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center mx-auto">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold">Save Your Favorites</h3>
            <p className="text-muted-foreground">
              Build your date night bucket list and never run out of romantic ideas again
            </p>
          </div>
        </div>
      </section>

      {/* Generator Section */}
      <section id="generator" className="container mx-auto px-4 py-16">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-4xl md:text-5xl font-bold">
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Create Your Perfect Date
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tell us your preferences and we'll create personalized date ideas just for you
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <DateFilters preferences={preferences} onPreferencesChange={setPreferences} />
            <Button
              onClick={generateDateIdeas}
              disabled={isGenerating}
              variant="hero"
              size="lg"
              className="w-full mt-6"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="mr-2 animate-spin" />
                  Generating Ideas...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2" />
                  {generatedIdeas.length > 0 ? "Refresh Ideas" : "Generate Date Ideas"}
                </>
              )}
            </Button>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {generatedIdeas.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mx-auto">
                  <Heart className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Ready to Find Your Perfect Date?</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Adjust your preferences and click "Generate Date Ideas" to get started!
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {generatedIdeas.map((idea) => (
                  <DateIdeaCard 
                    key={idea.id} 
                    idea={idea} 
                    onSave={handleSaveIdea}
                    isSaved={savedIdeas.some(saved => saved.title === idea.title)} 
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Index;
