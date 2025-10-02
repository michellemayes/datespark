import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Star, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { date_went: Date | null; rating: number | null; journal_entry: string }) => void;
  initialData?: {
    date_went: Date | null;
    rating: number | null;
    journal_entry: string;
  };
  dateTitle: string;
}

export const ReviewModal = ({
  open,
  onOpenChange,
  onSave,
  initialData,
  dateTitle,
}: ReviewModalProps) => {
  const [dateWent, setDateWent] = useState<Date | undefined>(
    initialData?.date_went ? new Date(initialData.date_went) : undefined
  );
  const [rating, setRating] = useState<number | null>(initialData?.rating || null);
  const [review, setReview] = useState(initialData?.journal_entry || "");
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);

  const handleSave = () => {
    onSave({
      date_went: dateWent || null,
      rating,
      journal_entry: review,
    });
    onOpenChange(false);
  };

  const displayRating = hoveredStar !== null ? hoveredStar : rating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Review: {dateTitle}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Date Picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium">When did you go on this date?</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateWent && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateWent ? format(dateWent, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateWent}
                  onSelect={setDateWent}
                  disabled={(date) => date > new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Star Rating */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Rate your date</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(null)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "w-8 h-8 transition-colors",
                      displayRating && star <= displayRating
                        ? "fill-primary text-primary"
                        : "text-muted-foreground"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Review */}
          <div className="space-y-2">
            <label className="text-sm font-medium">How did it go?</label>
            <Textarea
              placeholder="Share your experience, memorable moments, or any thoughts about the date..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="min-h-[150px] resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Review
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
