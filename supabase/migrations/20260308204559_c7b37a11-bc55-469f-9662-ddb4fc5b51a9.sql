ALTER TABLE public.recipes 
ADD COLUMN yield_quantity numeric DEFAULT 1,
ADD COLUMN yield_unit text DEFAULT 'kg';