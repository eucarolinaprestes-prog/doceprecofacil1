
-- Drop old user_id-based policies and create business_id-based ones

-- PRODUCTS
DROP POLICY IF EXISTS "Users manage own products" ON public.products;
CREATE POLICY "Business members manage products"
  ON public.products FOR ALL
  USING (public.user_in_business(auth.uid(), business_id))
  WITH CHECK (public.user_in_business(auth.uid(), business_id));

-- INGREDIENTS
DROP POLICY IF EXISTS "Users manage own ingredients" ON public.ingredients;
CREATE POLICY "Business members manage ingredients"
  ON public.ingredients FOR ALL
  USING (public.user_in_business(auth.uid(), business_id))
  WITH CHECK (public.user_in_business(auth.uid(), business_id));

-- RECIPES
DROP POLICY IF EXISTS "Users manage own recipes" ON public.recipes;
CREATE POLICY "Business members manage recipes"
  ON public.recipes FOR ALL
  USING (public.user_in_business(auth.uid(), business_id))
  WITH CHECK (public.user_in_business(auth.uid(), business_id));

-- CLIENTS
DROP POLICY IF EXISTS "Users manage own clients" ON public.clients;
CREATE POLICY "Business members manage clients"
  ON public.clients FOR ALL
  USING (public.user_in_business(auth.uid(), business_id))
  WITH CHECK (public.user_in_business(auth.uid(), business_id));

-- ORDERS
DROP POLICY IF EXISTS "Users manage own orders" ON public.orders;
CREATE POLICY "Business members manage orders"
  ON public.orders FOR ALL
  USING (public.user_in_business(auth.uid(), business_id))
  WITH CHECK (public.user_in_business(auth.uid(), business_id));

-- FINANCIAL_INCOME
DROP POLICY IF EXISTS "Users manage own income" ON public.financial_income;
CREATE POLICY "Business members manage income"
  ON public.financial_income FOR ALL
  USING (public.user_in_business(auth.uid(), business_id))
  WITH CHECK (public.user_in_business(auth.uid(), business_id));

-- FINANCIAL_EXPENSE
DROP POLICY IF EXISTS "Users manage own expenses" ON public.financial_expense;
CREATE POLICY "Business members manage expenses"
  ON public.financial_expense FOR ALL
  USING (public.user_in_business(auth.uid(), business_id))
  WITH CHECK (public.user_in_business(auth.uid(), business_id));

-- SHOPPING_LIST
DROP POLICY IF EXISTS "Users manage own shopping_list" ON public.shopping_list;
CREATE POLICY "Business members manage shopping_list"
  ON public.shopping_list FOR ALL
  USING (public.user_in_business(auth.uid(), business_id))
  WITH CHECK (public.user_in_business(auth.uid(), business_id));

-- PACKAGING
DROP POLICY IF EXISTS "Users manage own packaging" ON public.packaging;
CREATE POLICY "Business members manage packaging"
  ON public.packaging FOR ALL
  USING (public.user_in_business(auth.uid(), business_id))
  WITH CHECK (public.user_in_business(auth.uid(), business_id));

-- FIXED_COSTS
DROP POLICY IF EXISTS "Users manage own fixed_costs" ON public.fixed_costs;
CREATE POLICY "Business members manage fixed_costs"
  ON public.fixed_costs FOR ALL
  USING (public.user_in_business(auth.uid(), business_id))
  WITH CHECK (public.user_in_business(auth.uid(), business_id));

-- VARIABLE_COSTS
DROP POLICY IF EXISTS "Users manage own variable_costs" ON public.variable_costs;
CREATE POLICY "Business members manage variable_costs"
  ON public.variable_costs FOR ALL
  USING (public.user_in_business(auth.uid(), business_id))
  WITH CHECK (public.user_in_business(auth.uid(), business_id));

-- MENU_CATEGORIES - keep public read, update business-based write
DROP POLICY IF EXISTS "Users manage own menu_categories" ON public.menu_categories;
CREATE POLICY "Business members manage menu_categories"
  ON public.menu_categories FOR ALL
  USING (public.user_in_business(auth.uid(), business_id))
  WITH CHECK (public.user_in_business(auth.uid(), business_id));

-- MENU_PRODUCTS - keep public read, update business-based write
DROP POLICY IF EXISTS "Users manage own menu_products" ON public.menu_products;
CREATE POLICY "Business members manage menu_products"
  ON public.menu_products FOR ALL
  USING (public.user_in_business(auth.uid(), business_id))
  WITH CHECK (public.user_in_business(auth.uid(), business_id));

-- MENU_SETTINGS - keep public read, update business-based write
DROP POLICY IF EXISTS "Users manage own menu_settings" ON public.menu_settings;
CREATE POLICY "Business members manage menu_settings"
  ON public.menu_settings FOR ALL
  USING (public.user_in_business(auth.uid(), business_id))
  WITH CHECK (public.user_in_business(auth.uid(), business_id));

-- PROFILES - update policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Business members can view profiles"
  ON public.profiles FOR SELECT
  USING (public.user_in_business(auth.uid(), business_id) OR auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);
