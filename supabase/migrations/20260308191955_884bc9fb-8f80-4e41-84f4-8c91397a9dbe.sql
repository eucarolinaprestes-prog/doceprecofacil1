
-- Add address column to profiles if not exists (for confeiteira address)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address text DEFAULT '';

-- Add stock control columns to ingredients
ALTER TABLE public.ingredients ADD COLUMN IF NOT EXISTS current_stock numeric DEFAULT 0;
ALTER TABLE public.ingredients ADD COLUMN IF NOT EXISTS min_stock numeric DEFAULT 0;

-- Add stock control columns to packaging
ALTER TABLE public.packaging ADD COLUMN IF NOT EXISTS current_stock numeric DEFAULT 0;
ALTER TABLE public.packaging ADD COLUMN IF NOT EXISTS min_stock numeric DEFAULT 0;

-- Add more fields to orders for delivery/fees
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_address text DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fee_packaging numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fee_topper numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fee_decoration numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fee_delivery numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fee_card_percent numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS observation text DEFAULT '';

-- Create storage bucket for uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true) ON CONFLICT (id) DO NOTHING;

-- Storage policy for uploads
CREATE POLICY "Users can upload files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'uploads');
CREATE POLICY "Users can view files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'uploads');
CREATE POLICY "Users can delete own files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'uploads');
CREATE POLICY "Public can view uploads" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'uploads');
