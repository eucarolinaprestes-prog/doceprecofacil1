
-- 1. Create businesses table
CREATE TABLE public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- 2. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('owner', 'staff');

-- 3. Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'staff',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, business_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create audit_logs table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. Security definer function to get user's business_id
CREATE OR REPLACE FUNCTION public.get_user_business_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT business_id FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
$$;

-- 6. Security definer function to check role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- 7. Security definer function to check if user belongs to business
CREATE OR REPLACE FUNCTION public.user_in_business(_user_id uuid, _business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND business_id = _business_id
  );
$$;

-- 8. RLS for businesses
CREATE POLICY "Users can view own businesses"
  ON public.businesses FOR SELECT
  USING (public.user_in_business(auth.uid(), id));

CREATE POLICY "Owner can update own business"
  ON public.businesses FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Authenticated can create business"
  ON public.businesses FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- 9. RLS for user_roles
CREATE POLICY "Users can view roles in own business"
  ON public.user_roles FOR SELECT
  USING (public.user_in_business(auth.uid(), business_id));

CREATE POLICY "Owner can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'owner') AND public.user_in_business(auth.uid(), business_id))
  WITH CHECK (public.has_role(auth.uid(), 'owner') AND public.user_in_business(auth.uid(), business_id));

-- 10. RLS for audit_logs (read-only for business members)
CREATE POLICY "Users can view own business audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.user_in_business(auth.uid(), business_id));

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 11. Update handle_new_user to also create a business and assign owner role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_business_id uuid;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''));
  
  -- Create business
  INSERT INTO public.businesses (owner_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', '') || '''s Business')
  RETURNING id INTO new_business_id;
  
  -- Assign owner role
  INSERT INTO public.user_roles (user_id, business_id, role)
  VALUES (NEW.id, new_business_id, 'owner');
  
  RETURN NEW;
END;
$$;
