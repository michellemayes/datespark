import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MapPin, Clock, DollarSign, Calendar, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { scheduleDate } from "@/lib/calendar";

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
}

interface DateIdeaCardProps {
  idea: DateIdea;
  onSave?: (id: string) => void;
  isSaved?: boolean;
}

export const DateIdeaCard = ({ idea, onSave, isSaved = false }: DateIdeaCardProps) => {
  const [saved, setSaved] = useState(isSaved);
  const { toast } = useToast();

  const handleSave = () => {
    setSaved(!saved);
    onSave?.(idea.id);
    toast({
      title: saved ? "Removed from saved" : "Saved!",
      description: saved ? "Date idea removed from your list" : "Date idea added to your list",
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

  const handleShare = () => {
    toast({
      title: "Coming soon!",
      description: "Share functionality will be available soon",
    });
  };

  return (
    <Card className="p-6 space-y-4 bg-card border-2 border-border shadow-playful hover:shadow-glow transition-all duration-300 animate-bounce-in">
      <div className="flex justify-between items-start">
        <div className="space-y-1 flex-1">
          <h3 className="text-2xl font-bold text-primary">{idea.title}</h3>
          <p className="text-sm text-muted-foreground">{idea.description}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSave}
          className={saved ? "text-primary" : "text-muted-foreground"}
        >
          <Heart className={saved ? "fill-current" : ""} />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="w-4 h-4 text-secondary" />
          <span className="font-medium">{idea.budget}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-accent" />
          <span className="font-medium">{idea.duration}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="font-medium capitalize">{idea.location}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
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

      {idea.foodSpots && idea.foodSpots.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Food Spots:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            {idea.foodSpots.map((spot, index) => (
              <li key={index}>{spot}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button onClick={handleSchedule} variant="secondary" className="flex-1">
          <Calendar className="mr-2" />
          Schedule
        </Button>
        <Button onClick={handleShare} variant="accent" className="flex-1">
          <Share2 className="mr-2" />
          Share
        </Button>
      </div>
    </Card>
  );
};
