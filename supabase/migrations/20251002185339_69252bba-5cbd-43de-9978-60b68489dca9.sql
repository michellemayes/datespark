-- Add journal fields to saved_date_ideas table
ALTER TABLE public.saved_date_ideas
ADD COLUMN date_went timestamp with time zone,
ADD COLUMN rating integer CHECK (rating >= 1 AND rating <= 5),
ADD COLUMN journal_entry text;