
-- 1. Trigger: When order status changes to 'delivered' and payment is 100%, create financial_income entry
CREATE OR REPLACE FUNCTION public.on_order_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- When order becomes delivered with full payment
  IF NEW.status = 'delivered' AND NEW.payment_percent = 100 AND 
     (OLD.status IS DISTINCT FROM 'delivered' OR OLD.payment_percent IS DISTINCT FROM 100) THEN
    INSERT INTO public.financial_income (user_id, business_id, amount, category, date, payment_method, client_name, notes)
    VALUES (
      NEW.user_id,
      NEW.business_id,
      COALESCE(NEW.total_value, 0),
      'Encomenda',
      CURRENT_DATE,
      COALESCE(NEW.payment_method, 'pix'),
      '',
      'Gerado automaticamente da encomenda #' || LEFT(NEW.id::text, 8)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_order_paid
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.on_order_paid();

-- 2. Trigger: When ingredient cost changes, update recipes that use it
CREATE OR REPLACE FUNCTION public.on_ingredient_cost_updated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  recipe RECORD;
  ingredient RECORD;
  new_total numeric;
  ingredients jsonb;
  ing jsonb;
BEGIN
  IF NEW.cost_per_unit IS DISTINCT FROM OLD.cost_per_unit THEN
    -- Find all recipes that reference this ingredient in ingredients_json
    FOR recipe IN 
      SELECT id, ingredients_json FROM public.recipes 
      WHERE user_id = NEW.user_id 
      AND ingredients_json::text LIKE '%' || NEW.id::text || '%'
    LOOP
      new_total := 0;
      ingredients := COALESCE(recipe.ingredients_json, '[]'::jsonb);
      FOR ing IN SELECT * FROM jsonb_array_elements(ingredients) LOOP
        IF (ing->>'ingredient_id') = NEW.id::text THEN
          new_total := new_total + (COALESCE((ing->>'quantity')::numeric, 0) * NEW.cost_per_unit);
        ELSE
          new_total := new_total + COALESCE((ing->>'total_cost')::numeric, 0);
        END IF;
      END LOOP;
      UPDATE public.recipes SET total_cost = new_total WHERE id = recipe.id;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_ingredient_cost_update
  AFTER UPDATE ON public.ingredients
  FOR EACH ROW
  EXECUTE FUNCTION public.on_ingredient_cost_updated();

-- 3. Audit log function (callable from edge functions or triggers)
CREATE OR REPLACE FUNCTION public.log_audit(
  _user_id uuid,
  _business_id uuid,
  _action text,
  _entity text,
  _entity_id uuid DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, business_id, action, entity, entity_id, metadata)
  VALUES (_user_id, _business_id, _action, _entity, _entity_id, _metadata);
END;
$$;
