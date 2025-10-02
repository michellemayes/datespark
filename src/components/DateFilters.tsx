import { useState, useEffect, useRef } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DollarSign, Clock, Shirt, MapPin, Navigation } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export interface DatePreferences {
  budget: number;
  duration: string;
  dressCode: string;
  location: string;
  dietary: string[];
  userLocation: string;
  radiusMiles: number;
}

interface DateFiltersProps {
  preferences: DatePreferences;
  onPreferencesChange: (preferences: DatePreferences) => void;
}

export const DateFilters = ({ preferences, onPreferencesChange }: DateFiltersProps) => {
  const [suggestions, setSuggestions] = useState<Array<{ description: string; place_id: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  const dietaryOptions = [
    "Vegetarian",
    "Vegan",
    "Gluten-Free",
    "Dairy-Free",
    "Nut Allergies",
  ];

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchLocations = async (input: string) => {
    if (input.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('autocomplete-places', {
        body: { input }
      });

      if (error) {
        console.error('Autocomplete error:', error);
        setIsSearching(false);
        return;
      }

      setSuggestions(data?.suggestions || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error searching locations:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocationInput = (value: string) => {
    onPreferencesChange({ ...preferences, userLocation: value });
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debounced search (reduced from 300ms to 150ms)
    const timeout = setTimeout(() => {
      searchLocations(value);
    }, 150);
    
    setSearchTimeout(timeout);
  };

  const handleSuggestionClick = (description: string) => {
    onPreferencesChange({ ...preferences, userLocation: description });
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleBudgetChange = (value: number[]) => {
    onPreferencesChange({ ...preferences, budget: value[0] });
  };

  const handleRadiusChange = (value: number[]) => {
    onPreferencesChange({ ...preferences, radiusMiles: value[0] });
  };

  const handleDietaryChange = (option: string, checked: boolean) => {
    const newDietary = checked
      ? [...preferences.dietary, option]
      : preferences.dietary.filter((item) => item !== option);
    onPreferencesChange({ ...preferences, dietary: newDietary });
  };

  const getBudgetLabel = () => {
    if (preferences.budget === 0) return "Free";
    if (preferences.budget <= 25) return "$";
    if (preferences.budget <= 50) return "$$";
    if (preferences.budget <= 100) return "$$$";
    return "$$$$";
  };

  return (
    <Card className="p-6 space-y-6 bg-card border-2 border-border shadow-playful">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Navigation className="w-5 h-5 text-primary" />
          <Label className="text-base font-semibold">Your Location</Label>
        </div>
        <div className="relative" ref={suggestionsRef}>
          <div className="relative">
            <Input
              type="text"
              placeholder="Enter city, zip code, or address"
              value={preferences.userLocation}
              onChange={(e) => handleLocationInput(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              className="h-11"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
              </div>
            )}
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-background border-2 border-border rounded-lg shadow-glow max-h-60 overflow-y-auto">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.place_id}
                  onClick={() => handleSuggestionClick(suggestion.description)}
                  className="w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b border-border last:border-b-0 flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm">{suggestion.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-secondary" />
          <Label className="text-base font-semibold">Search Radius</Label>
        </div>
        <div className="space-y-3">
          <Slider
            value={[preferences.radiusMiles]}
            onValueChange={handleRadiusChange}
            max={50}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-secondary">{preferences.radiusMiles} mi</span>
            <span className="text-sm text-muted-foreground">
              Search within {preferences.radiusMiles} {preferences.radiusMiles === 1 ? 'mile' : 'miles'}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          <Label className="text-base font-semibold">Budget per Person</Label>
        </div>
        <div className="space-y-3">
          <Slider
            value={[preferences.budget]}
            onValueChange={handleBudgetChange}
            max={200}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-primary">{getBudgetLabel()}</span>
            <span className="text-sm text-muted-foreground">
              {preferences.budget === 0 ? "Free" : `$${preferences.budget}`}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-secondary" />
          <Label className="text-base font-semibold">Duration</Label>
        </div>
        <Select value={preferences.duration} onValueChange={(value) => onPreferencesChange({ ...preferences, duration: value })}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select duration" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="quick">Quick (1-2 hours)</SelectItem>
            <SelectItem value="half">Half Day (3-4 hours)</SelectItem>
            <SelectItem value="full">Full Day (5+ hours)</SelectItem>
            <SelectItem value="evening">Evening (2-3 hours)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Shirt className="w-5 h-5 text-accent" />
          <Label className="text-base font-semibold">Dress Code</Label>
        </div>
        <Select value={preferences.dressCode} onValueChange={(value) => onPreferencesChange({ ...preferences, dressCode: value })}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select dress code" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="casual">Casual</SelectItem>
            <SelectItem value="smart-casual">Smart Casual</SelectItem>
            <SelectItem value="dressy">Dressy</SelectItem>
            <SelectItem value="formal">Formal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Shirt className="w-5 h-5 text-primary" />
          <Label className="text-base font-semibold">Venue Type</Label>
        </div>
        <Select value={preferences.location} onValueChange={(value) => onPreferencesChange({ ...preferences, location: value })}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="indoor">Indoor</SelectItem>
            <SelectItem value="outdoor">Outdoor</SelectItem>
            <SelectItem value="mixed">Mixed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label className="text-base font-semibold">Dietary Restrictions</Label>
        <div className="space-y-2">
          {dietaryOptions.map((option) => (
            <div key={option} className="flex items-center space-x-2">
              <Checkbox
                id={option}
                checked={preferences.dietary.includes(option)}
                onCheckedChange={(checked) => handleDietaryChange(option, checked as boolean)}
              />
              <label
                htmlFor={option}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {option}
              </label>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
