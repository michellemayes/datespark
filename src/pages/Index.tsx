import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSavedIdeas } from "@/hooks/useSavedIdeas";
import { useDateGeneration } from "@/hooks/useDateGeneration";
import { AuthModal } from "@/components/AuthModal";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { DateGenerator } from "@/components/DateGenerator";
import { MainLayout } from "@/layouts/MainLayout";
import { DateIdea } from "@/components/DateIdeaCard";

const Index = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { saveIdea } = useSavedIdeas(user?.id);
  const { generatedIdeas, isGenerating, generateDateIdeas } = useDateGeneration();

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

  const handleSaveIdea = async (idea: DateIdea) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save date ideas",
      });
      setAuthModalOpen(true);
      return;
    }

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
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <MainLayout 
      user={user} 
      onSignOut={handleSignOut} 
      onSignIn={() => setAuthModalOpen(true)}
    >
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      <Hero user={user} />
      <Features />
      <DateGenerator 
        user={user}
        onSaveIdea={handleSaveIdea}
        generatedIdeas={generatedIdeas}
        isGenerating={isGenerating}
        onGenerate={generateDateIdeas}
      />
    </MainLayout>
  );
};

export default Index;
