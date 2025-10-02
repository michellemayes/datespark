import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DateFilters, DatePreferences } from "@/components/DateFilters";
import { DateIdeaCard, DateIdea } from "@/components/DateIdeaCard";
import { Sparkles } from "lucide-react";

interface DateGeneratorProps {
  user: any;
  onSaveIdea: (idea: DateIdea) => void;
  generatedIdeas: DateIdea[];
  isGenerating: boolean;
  onGenerate: (preferences: DatePreferences) => void;
}

export const DateGenerator = ({ 
  user, 
  onSaveIdea, 
  generatedIdeas, 
  isGenerating, 
  onGenerate 
}: DateGeneratorProps) => {
  const [preferences, setPreferences] = useState<DatePreferences>({
    budget: 50,
    duration: "evening",
    dressCode: "smart-casual",
    location: "mixed",
    userLocation: "",
    radiusMiles: 10,
  });

  return (
    <section id="generator" className="bg-muted/30 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Create Your Date
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Tell us your preferences and we'll create the perfect date for you
            </p>
          </div>

          <DateFilters 
            preferences={preferences} 
            onPreferencesChange={setPreferences}
          />

          <div className="flex justify-center">
            <Button 
              size="lg" 
              onClick={() => onGenerate(preferences)}
              disabled={isGenerating}
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white px-8"
            >
              {isGenerating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2" />
                  Generate Date Ideas
                </>
              )}
            </Button>
          </div>

          {generatedIdeas.length > 0 && (
            <div className="space-y-6 pt-8">
              <h3 className="text-3xl font-bold text-center">
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Your Date Ideas
                </span>
              </h3>
              <div className="space-y-6">
                {generatedIdeas.map((idea) => (
                  <DateIdeaCard key={idea.id} idea={idea} onSave={() => onSaveIdea(idea)} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
