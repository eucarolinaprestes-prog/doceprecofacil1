
-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  store_name TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  whatsapp TEXT DEFAULT '',
  address TEXT DEFAULT '',
  desired_salary NUMERIC DEFAULT 0,
  work_days_per_week INTEGER DEFAULT 5,
  work_hours_per_day INTEGER DEFAULT 8,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fixed costs
CREATE TABLE public.fixed_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.fixed_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own fixed_costs" ON public.fixed_costs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Variable costs
CREATE TABLE public.variable_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.variable_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own variable_costs" ON public.variable_costs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Ingredients
CREATE TABLE public.ingredients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT '',
  unit TEXT NOT NULL DEFAULT 'g',
  total_cost NUMERIC NOT NULL DEFAULT 0,
  quantity_purchased NUMERIC NOT NULL DEFAULT 0,
  supplier TEXT DEFAULT '',
  cost_per_unit NUMERIC GENERATED ALWAYS AS (CASE WHEN quantity_purchased > 0 THEN total_cost / quantity_purchased ELSE 0 END) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own ingredients" ON public.ingredients FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_ingredients_updated_at BEFORE UPDATE ON public.ingredients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Packaging
CREATE TABLE public.packaging (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT '',
  unit TEXT NOT NULL DEFAULT 'un',
  total_cost NUMERIC NOT NULL DEFAULT 0,
  quantity_purchased NUMERIC NOT NULL DEFAULT 0,
  supplier TEXT DEFAULT '',
  cost_per_unit NUMERIC GENERATED ALWAYS AS (CASE WHEN quantity_purchased > 0 THEN total_cost / quantity_purchased ELSE 0 END) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.packaging ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own packaging" ON public.packaging FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_packaging_updated_at BEFORE UPDATE ON public.packaging FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Products
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',
  yield_quantity NUMERIC NOT NULL DEFAULT 1,
  yield_unit TEXT NOT NULL DEFAULT 'unidade',
  preparation_time INTEGER DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  suggested_price NUMERIC DEFAULT 0,
  profit_margin NUMERIC DEFAULT 0,
  ingredients_json JSONB DEFAULT '[]',
  packaging_json JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own products" ON public.products FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Clients
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  whatsapp TEXT DEFAULT '',
  address TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own clients" ON public.clients FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Orders
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  category TEXT DEFAULT '',
  size TEXT DEFAULT '',
  filling TEXT DEFAULT '',
  topping TEXT DEFAULT '',
  dough TEXT DEFAULT '',
  event_date TIMESTAMPTZ,
  delivery_type TEXT DEFAULT 'pickup',
  payment_percent INTEGER DEFAULT 100,
  payment_method TEXT DEFAULT 'pix',
  status TEXT NOT NULL DEFAULT 'pending',
  total_value NUMERIC DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own orders" ON public.orders FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Financial income
CREATE TABLE public.financial_income (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  category TEXT DEFAULT '',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT '',
  client_name TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.financial_income ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own income" ON public.financial_income FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Financial expense
CREATE TABLE public.financial_expense (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  category TEXT DEFAULT '',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  supplier TEXT DEFAULT '',
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.financial_expense ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own expenses" ON public.financial_expense FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Shopping list
CREATE TABLE public.shopping_list (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 0,
  unit_price NUMERIC DEFAULT 0,
  total NUMERIC GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shopping_list ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own shopping_list" ON public.shopping_list FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Menu settings
CREATE TABLE public.menu_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  cover_photo_url TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  description TEXT DEFAULT '',
  business_hours TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.menu_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own menu_settings" ON public.menu_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_menu_settings_updated_at BEFORE UPDATE ON public.menu_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Menu categories
CREATE TABLE public.menu_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own menu_categories" ON public.menu_categories FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
