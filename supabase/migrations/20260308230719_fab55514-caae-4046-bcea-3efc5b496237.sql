
-- Add new columns to menu_settings
ALTER TABLE public.menu_settings 
  ADD COLUMN IF NOT EXISTS store_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS tagline text DEFAULT '',
  ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#e91e7b',
  ADD COLUMN IF NOT EXISTS secondary_color text DEFAULT '#f8bbd0',
  ADD COLUMN IF NOT EXISTS button_color text DEFAULT '#e91e7b',
  ADD COLUMN IF NOT EXISTS showcase_mode boolean DEFAULT false;

-- Create menu_products table
CREATE TABLE public.menu_products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  category_id uuid REFERENCES public.menu_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  photo_url text DEFAULT '',
  status text NOT NULL DEFAULT 'disponivel',
  featured boolean NOT NULL DEFAULT false,
  available_today boolean NOT NULL DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.menu_products ENABLE ROW LEVEL SECURITY;

-- RLS policy for menu_products (owner access)
CREATE POLICY "Users manage own menu_products" ON public.menu_products
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public read policy for menu_products (for the public cardapio view)
CREATE POLICY "Public can view menu_products" ON public.menu_products
  FOR SELECT TO anon
  USING (true);

-- Public read policy for menu_settings
CREATE POLICY "Public can view menu_settings" ON public.menu_settings
  FOR SELECT TO anon
  USING (true);

-- Public read policy for menu_categories
CREATE POLICY "Public can view menu_categories" ON public.menu_categories
  FOR SELECT TO anon
  USING (true);

-- Public read policy for profiles (for store info on public menu)
CREATE POLICY "Public can view profiles" ON public.profiles
  FOR SELECT TO anon
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_menu_products_updated_at
  BEFORE UPDATE ON public.menu_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
