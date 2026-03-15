ALTER TABLE public.behavior_cases ADD COLUMN event_time timestamp with time zone DEFAULT now();
-- Backfill existing rows with the timestamp value
UPDATE public.behavior_cases SET event_time = timestamp WHERE event_time IS NULL;