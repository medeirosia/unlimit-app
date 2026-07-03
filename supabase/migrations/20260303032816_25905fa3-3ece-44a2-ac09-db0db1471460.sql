
CREATE OR REPLACE FUNCTION public.get_shipping_cost_by_month(p_year integer, p_month integer)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(cost), 0)
  FROM pj_shipping_items
  WHERE posting_date >= make_date(p_year, p_month, 1)
    AND posting_date < (make_date(p_year, p_month, 1) + interval '1 month')::date
$$;
