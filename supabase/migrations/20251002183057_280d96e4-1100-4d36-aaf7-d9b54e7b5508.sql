-- Add map_locations and venue_links columns to saved_date_ideas
ALTER TABLE public.saved_date_ideas 
ADD COLUMN IF NOT EXISTS map_locations jsonb,
ADD COLUMN IF NOT EXISTS venue_links jsonb;