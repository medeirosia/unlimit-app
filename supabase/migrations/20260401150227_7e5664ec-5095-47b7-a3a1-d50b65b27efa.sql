CREATE OR REPLACE FUNCTION public.get_shipping_cost_by_month_and_carrier(p_year integer, p_month integer)
RETURNS TABLE(carrier_name text, total_cost numeric)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT r.carrier_name, COALESCE(SUM(i.cost), 0) as total_cost
  FROM pj_shipping_items i
  JOIN pj_shipping_reports r ON r.id = i.report_id
  WHERE i.posting_date >= make_date(p_year, p_month, 1)
    AND i.posting_date < (make_date(p_year, p_month, 1) + interval '1 month')::date
  GROUP BY r.carrier_name
$$;