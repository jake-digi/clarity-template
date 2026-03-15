ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS geo_bounds jsonb;
ALTER TABLE public.blocks ADD COLUMN IF NOT EXISTS geo_polygon jsonb;