import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { DateIdeaCard } from "@/components/DateIdeaCard";
import { useSavedIdeas } from "@/hooks/useSavedIdeas";
import { ArrowLeft } from "lucide-react";

const SavedIdeas = () => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { savedIdeas, loading } = useSavedIdeas(user?.id);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate("/");
      } else {
        setUser(user);
      }
    });
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl md:text-5xl font-bold">
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Your Favorite Dates
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your personal collection of romantic date ideas
          </p>
        </div>

        {savedIdeas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground mb-4">
              No favorite dates yet
            </p>
            <Button onClick={() => navigate("/")}>
              Generate Date Ideas
            </Button>
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto">
            {savedIdeas.map((idea) => (
              <DateIdeaCard
                key={idea.id}
                idea={{
                  id: idea.id,
                  title: idea.title,
                  description: idea.description,
                  budget: idea.budget,
                  duration: idea.duration,
                  location: idea.location,
                  dressCode: idea.dress_code,
                  activities: idea.activities,
                  foodSpots: idea.food_spots,
                  venueLinks: idea.venue_links || [],
                  mapLocations: idea.map_locations || [],
                }}
                isSaved={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedIdeas;
