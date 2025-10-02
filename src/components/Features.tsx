import { Sparkles, Calendar, Heart } from "lucide-react";

export const Features = () => {
  return (
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
            Keep track of dates you love and revisit them anytime you need inspiration
          </p>
        </div>
      </div>
    </section>
  );
};
