import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DateFilters, DatePreferences } from "@/components/DateFilters";
import { DateIdeaCard, DateIdea } from "@/components/DateIdeaCard";
import { Heart, Sparkles, Calendar } from "lucide-react";
import heroImage from "@/assets/hero-couple.jpg";

const Index = () => {
  const [preferences, setPreferences] = useState<DatePreferences>({
    budget: 50,
    duration: "evening",
    dressCode: "smart-casual",
    location: "mixed",
    dietary: [],
  });
  const [generatedIdeas, setGeneratedIdeas] = useState<DateIdea[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateDateIdeas = () => {
    setIsGenerating(true);
    // Simulating idea generation - this will be replaced with real logic
    setTimeout(() => {
      const mockIdeas: DateIdea[] = [
        {
          id: "1",
          title: "Sunset Rooftop Dinner & Jazz",
          description: "A romantic evening combining great food, live music, and stunning views",
          budget: preferences.budget === 0 ? "Free" : `$${preferences.budget}`,
          duration: preferences.duration,
          dressCode: preferences.dressCode,
          location: preferences.location,
          activities: [
            "Arrive at 6:30 PM for sunset views",
            "Enjoy live jazz music from 7-9 PM",
            "Three-course dinner with wine pairing",
            "Evening stroll through nearby park",
          ],
          foodSpots: [
            "The Rooftop - Modern American cuisine",
            "Jazz Lounge & Bar - Craft cocktails",
          ],
        },
        {
          id: "2",
          title: "Art Gallery & Coffee Adventure",
          description: "Explore local art followed by discovering hidden coffee gems",
          budget: preferences.budget === 0 ? "Free" : `$${Math.floor(preferences.budget * 0.6)}`,
          duration: preferences.duration,
          dressCode: preferences.dressCode,
          location: "indoor",
          activities: [
            "Visit contemporary art gallery (free admission)",
            "Discuss favorite pieces over coffee",
            "Browse artisan bookstore",
            "Try a new coffee brewing method together",
          ],
          foodSpots: [
            "Artisan Coffee Co. - Specialty brews",
            "Gallery Café - Light bites and desserts",
          ],
        },
      ];
      setGeneratedIdeas(mockIdeas);
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10" />
        <div className="container mx-auto px-4 py-16 relative z-10">
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
                <Button variant="outline" size="lg">
                  <Calendar className="mr-2" />
                  View Saved Ideas
                </Button>
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
              Filter by budget, time, style, and dietary needs to get dates that actually work for you
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
                  Generate Date Ideas
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
                  <DateIdeaCard key={idea.id} idea={idea} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
