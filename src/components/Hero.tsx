import { Button } from "@/components/ui/button";
import { Sparkles, Calendar } from "lucide-react";
import heroImage from "@/assets/hero-couple.jpg";

interface HeroProps {
  user: any;
}

export const Hero = ({ user }: HeroProps) => {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10" />
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-slide-up">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Find Your Perfect Date
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Get personalized date ideas based on your budget, time, and style. 
              From cozy coffee dates to adventurous outings, we've got you covered.
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
              className="relative rounded-3xl shadow-2xl w-full object-cover aspect-square"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
