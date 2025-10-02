import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MapPin, Clock, DollarSign, Calendar, Copy, Shirt, Trash2, Star as StarIcon, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { scheduleDate } from "@/lib/calendar";
import GoogleMap from "./GoogleMap";
import { ReviewModal } from "./ReviewModal";
import { format } from "date-fns";

export interface DateIdea {
  id: string;
  title: string;
  description: string;
  budget: string;
  duration: string;
  dressCode: string;
  location: string;
  activities: string[];
  foodSpots?: string[];
  venueLinks?: Array<{ name: string; url: string; type?: string }>;
  mapLocations?: Array<{ name: string; lat: number; lng: number }>;
  date_went?: string | null;
  rating?: number | null;
  journal_entry?: string | null;
}

interface DateIdeaCardProps {
  idea: DateIdea;
  onSave?: (id: string) => void;
  onDelete?: (id: string) => void;
  onReviewUpdate?: (
    id: string,
    data: { date_went: Date | null; rating: number | null; journal_entry: string }
  ) => void;
  isSaved?: boolean;
  showReview?: boolean;
}

export const DateIdeaCard = ({ idea, onSave, onDelete, onReviewUpdate, isSaved = false, showReview = false }: DateIdeaCardProps) => {
  const [saved, setSaved] = useState(isSaved);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const { toast } = useToast();

  // Reset saved state when idea changes
  useEffect(() => {
    setSaved(isSaved);
  }, [idea.id, isSaved]);

  const handleSave = () => {
    setSaved(!saved);
    onSave?.(idea.id);
    toast({
      title: saved ? "Removed from favorites" : "Added to favorites!",
      description: saved ? "Date removed from your favorites" : "Date added to your favorites",
    });
  };

  const handleSchedule = () => {
    try {
      scheduleDate(idea);
      toast({
        title: "Opening Google Calendar",
        description: "Add this date to your calendar!",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to open calendar. Please try again.",
      });
    }
  };

  const handleShare = async () => {
    const shareText = `${idea.title}\n\n${idea.description}\n\nBudget: ${idea.budget} | Duration: ${idea.duration}\nDress Code: ${idea.dressCode}\n\nActivities:\n${idea.activities.join('\n')}`;
    
    // Try Web Share API first (mobile/supported browsers)
    if (navigator.share) {
      try {
        await navigator.share({
          title: idea.title,
          text: shareText,
        });
        toast({
          title: "Shared successfully!",
          description: "Date idea shared with your selected app",
        });
      } catch (error: any) {
        // User cancelled the share dialog - don't show error
        if (error.name !== 'AbortError') {
          // Fallback to clipboard if share fails
          try {
            await navigator.clipboard.writeText(shareText);
            toast({
              title: "Copied to clipboard!",
              description: "Date idea details copied. Share it anywhere!",
            });
          } catch {
            toast({
              variant: "destructive",
              title: "Could not share",
              description: "Please try again",
            });
          }
        }
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        toast({
          title: "Copied to clipboard!",
          description: "Date idea details copied. Share it anywhere!",
        });
      } catch {
        toast({
          variant: "destructive",
          title: "Could not copy",
          description: "Please try again",
        });
      }
    }
  };

  return (
    <Card className="p-6 space-y-4 bg-card border-2 border-border shadow-playful hover:shadow-glow transition-all duration-300 animate-bounce-in">
      <div className="flex justify-between items-start">
        <div className="space-y-1 flex-1">
          <h3 className="text-2xl font-bold text-primary">{idea.title}</h3>
          <p className="text-sm text-muted-foreground">{idea.description}</p>
        </div>
        <div className="flex gap-1">
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(idea.id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSave}
            className={saved ? "text-primary" : "text-muted-foreground"}
          >
            <Heart className={saved ? "fill-current" : ""} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="w-4 h-4 text-secondary" />
          <span className="font-medium">{idea.budget}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-accent" />
          <span className="font-medium capitalize">{idea.duration}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="font-medium capitalize">{idea.location}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Shirt className="w-4 h-4 text-secondary" />
          <span className="font-medium capitalize">{idea.dressCode}</span>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-semibold text-sm">Activities:</h4>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          {idea.activities.map((activity, index) => (
            <li key={index}>{activity}</li>
          ))}
        </ul>
      </div>

      {idea.mapLocations && idea.mapLocations.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Location Map:</h4>
          <GoogleMap locations={idea.mapLocations} />
        </div>
      )}

      {idea.venueLinks && idea.venueLinks.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Venue Links:</h4>
          <div className="flex flex-wrap gap-2">
            {idea.venueLinks.map((venue, index) => (
              <a
                key={index}
                href={venue.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors"
              >
                <MapPin className="w-3 h-3" />
                {venue.name}
              </a>
            ))}
          </div>
        </div>
      )}

      {showReview && idea.date_went && (
        <div className="space-y-3 p-4 bg-primary/5 rounded-lg border border-primary/10">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <StarIcon className="w-4 h-4 text-primary" />
              Review
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReviewModalOpen(true)}
              className="text-xs"
            >
              Edit
            </Button>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent" />
              <span className="font-medium">
                {format(new Date(idea.date_went), "MMMM d, yyyy")}
              </span>
            </div>
            
            {idea.rating && (
              <div className="flex items-center gap-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < idea.rating!
                        ? "fill-primary text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
            )}
            
            {idea.journal_entry && (
              <p className="text-muted-foreground leading-relaxed mt-2">
                {idea.journal_entry}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button onClick={handleSchedule} variant="secondary" className="flex-1">
          <Calendar className="mr-2" />
          Schedule
        </Button>
        <Button onClick={handleShare} variant="accent" className="flex-1">
          <Copy className="mr-2" />
          Copy
        </Button>
        {showReview && (
          <Button onClick={() => setReviewModalOpen(true)} variant="outline" className="flex-1">
            <StarIcon className="mr-2" />
            {idea.date_went ? "Update" : "Add"} Review
          </Button>
        )}
      </div>

      {showReview && onReviewUpdate && (
        <ReviewModal
          open={reviewModalOpen}
          onOpenChange={setReviewModalOpen}
          onSave={(data) => onReviewUpdate(idea.id, data)}
          initialData={{
            date_went: idea.date_went ? new Date(idea.date_went) : null,
            rating: idea.rating || null,
            journal_entry: idea.journal_entry || "",
          }}
          dateTitle={idea.title}
        />
      )}
    </Card>
  );
};
