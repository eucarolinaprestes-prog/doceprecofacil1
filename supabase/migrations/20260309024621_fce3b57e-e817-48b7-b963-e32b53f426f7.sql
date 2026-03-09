
-- Add business_id to all existing tables
-- First add as nullable, then backfill, then make NOT NULL

-- profiles
ALTER TABLE public.profiles ADD COLUMN business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE;

-- products
ALTER TABLE public.products ADD COLUMN business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE;

-- ingredients
ALTER TABLE public.ingredients ADD COLUMN business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE;

-- recipes
ALTER TABLE public.recipes ADD COLUMN business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE;

-- clients
ALTER TABLE public.clients ADD COLUMN business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE;

-- orders
ALTER TABLE public.orders ADD COLUMN business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE;

-- financial_income
ALTER TABLE public.financial_income ADD COLUMN business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE;

-- financial_expense
ALTER TABLE public.financial_expense ADD COLUMN business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE;

-- shopping_list
ALTER TABLE public.shopping_list ADD COLUMN business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE;

-- packaging
ALTER TABLE public.packaging ADD COLUMN business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE;

-- fixed_costs
ALTER TABLE public.fixed_costs ADD COLUMN business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE;

-- variable_costs
ALTER TABLE public.variable_costs ADD COLUMN business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE;

-- menu_categories
ALTER TABLE public.menu_categories ADD COLUMN business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE;

-- menu_products
ALTER TABLE public.menu_products ADD COLUMN business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE;

-- menu_settings
ALTER TABLE public.menu_settings ADD COLUMN business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE;

-- Backfill: For each existing user, create a business and update all their records
DO $$
DECLARE
  r RECORD;
  new_biz_id uuid;
BEGIN
  FOR r IN SELECT DISTINCT user_id FROM public.profiles LOOP
    -- Create business for this user
    INSERT INTO public.businesses (owner_id, name)
    VALUES (r.user_id, 'Meu Negócio')
    RETURNING id INTO new_biz_id;
    
    -- Assign owner role
    INSERT INTO public.user_roles (user_id, business_id, role)
    VALUES (r.user_id, new_biz_id, 'owner')
    ON CONFLICT (user_id, business_id) DO NOTHING;
    
    -- Update all tables
    UPDATE public.profiles SET business_id = new_biz_id WHERE user_id = r.user_id;
    UPDATE public.products SET business_id = new_biz_id WHERE user_id = r.user_id;
    UPDATE public.ingredients SET business_id = new_biz_id WHERE user_id = r.user_id;
    UPDATE public.recipes SET business_id = new_biz_id WHERE user_id = r.user_id;
    UPDATE public.clients SET business_id = new_biz_id WHERE user_id = r.user_id;
    UPDATE public.orders SET business_id = new_biz_id WHERE user_id = r.user_id;
    UPDATE public.financial_income SET business_id = new_biz_id WHERE user_id = r.user_id;
    UPDATE public.financial_expense SET business_id = new_biz_id WHERE user_id = r.user_id;
    UPDATE public.shopping_list SET business_id = new_biz_id WHERE user_id = r.user_id;
    UPDATE public.packaging SET business_id = new_biz_id WHERE user_id = r.user_id;
    UPDATE public.fixed_costs SET business_id = new_biz_id WHERE user_id = r.user_id;
    UPDATE public.variable_costs SET business_id = new_biz_id WHERE user_id = r.user_id;
    UPDATE public.menu_categories SET business_id = new_biz_id WHERE user_id = r.user_id;
    UPDATE public.menu_products SET business_id = new_biz_id WHERE user_id = r.user_id;
    UPDATE public.menu_settings SET business_id = new_biz_id WHERE user_id = r.user_id;
  END LOOP;
END $$;

-- Update handle_new_user to also set business_id on profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_business_id uuid;
BEGIN
  -- Create business
  INSERT INTO public.businesses (owner_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', '') || '''s Business')
  RETURNING id INTO new_business_id;
  
  -- Create profile with business_id
  INSERT INTO public.profiles (user_id, name, business_id)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), new_business_id);
  
  -- Assign owner role
  INSERT INTO public.user_roles (user_id, business_id, role)
  VALUES (NEW.id, new_business_id, 'owner');
  
  RETURN NEW;
END;
$$;
