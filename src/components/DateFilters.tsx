import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { DollarSign, Clock, Shirt, MapPin } from "lucide-react";

export interface DatePreferences {
  budget: number;
  duration: string;
  dressCode: string;
  location: string;
  dietary: string[];
}

interface DateFiltersProps {
  preferences: DatePreferences;
  onPreferencesChange: (preferences: DatePreferences) => void;
}

export const DateFilters = ({ preferences, onPreferencesChange }: DateFiltersProps) => {
  const dietaryOptions = [
    "Vegetarian",
    "Vegan",
    "Gluten-Free",
    "Dairy-Free",
    "Nut Allergies",
  ];

  const handleBudgetChange = (value: number[]) => {
    onPreferencesChange({ ...preferences, budget: value[0] });
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
          <MapPin className="w-5 h-5 text-primary" />
          <Label className="text-base font-semibold">Location Type</Label>
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
