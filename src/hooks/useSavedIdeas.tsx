import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SavedDateIdea {
  id: string;
  title: string;
  description: string;
  budget: string;
  duration: string;
  location: string;
  dress_code: string;
  activities: string[];
  food_spots?: string[];
  map_locations?: Array<{ name: string; lat: number; lng: number }>;
  venue_links?: Array<{ name: string; url: string; type?: string }>;
  created_at: string;
  date_went?: string | null;
  rating?: number | null;
  journal_entry?: string | null;
}

export const useSavedIdeas = (userId: string | undefined) => {
  const [savedIdeas, setSavedIdeas] = useState<SavedDateIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchSavedIdeas();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const fetchSavedIdeas = async () => {
    try {
      const { data, error } = await supabase
        .from("saved_date_ideas")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedData = (data || []).map((idea) => ({
        ...idea,
        activities: idea.activities as string[],
        food_spots: idea.food_spots as string[] | undefined,
        map_locations: idea.map_locations as Array<{ name: string; lat: number; lng: number }> | undefined,
        venue_links: idea.venue_links as Array<{ name: string; url: string; type?: string }> | undefined,
      }));

      setSavedIdeas(formattedData);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const saveIdea = async (idea: Omit<SavedDateIdea, "id" | "created_at">) => {
    if (!userId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to save ideas",
      });
      return;
    }

    try {
      const { error } = await supabase.from("saved_date_ideas").insert({
        user_id: userId,
        title: idea.title,
        description: idea.description,
        budget: idea.budget,
        duration: idea.duration,
        location: idea.location,
        dress_code: idea.dress_code,
        activities: idea.activities,
        food_spots: idea.food_spots,
        map_locations: idea.map_locations,
        venue_links: idea.venue_links,
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Date idea saved successfully",
      });

      fetchSavedIdeas();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const deleteIdea = async (ideaId: string) => {
    try {
      const { error } = await supabase
        .from("saved_date_ideas")
        .delete()
        .eq("id", ideaId);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Date idea deleted",
      });

      fetchSavedIdeas();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const updateReview = async (
    ideaId: string,
    reviewData: {
      date_went: Date | null;
      rating: number | null;
      journal_entry: string;
    }
  ) => {
    try {
      const { error } = await supabase
        .from("saved_date_ideas")
        .update({
          date_went: reviewData.date_went?.toISOString() || null,
          rating: reviewData.rating,
          journal_entry: reviewData.journal_entry,
        })
        .eq("id", ideaId);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Review saved",
      });

      fetchSavedIdeas();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  return { savedIdeas, loading, saveIdea, deleteIdea, updateReview, refetch: fetchSavedIdeas };
};
