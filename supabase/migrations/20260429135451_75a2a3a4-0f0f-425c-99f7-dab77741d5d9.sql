INSERT INTO public.pj_price_notifications (
  product_id,
  product_sku,
  product_name,
  old_price,
  new_price,
  direction,
  confirmed_by,
  created_at
)
SELECT
  h.product_id,
  p.sku AS product_sku,
  p.name AS product_name,
  h.old_price,
  h.new_price,
  CASE
    WHEN h.old_price IS NULL THEN 'new'
    WHEN h.new_price > h.old_price THEN 'up'
    WHEN h.new_price < h.old_price THEN 'down'
    ELSE 'new'
  END AS direction,
  COALESCE(pr.nome, pr.email, 'Equipe') AS confirmed_by,
  h.created_at
FROM public.pj_price_history h
JOIN public.pj_products p ON p.id = h.product_id
LEFT JOIN public.profiles pr ON pr.id = h.changed_by
WHERE h.created_at >= now() - interval '48 hours'
  AND h.new_price IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.pj_price_notifications n
    WHERE n.product_id = h.product_id
      AND n.new_price IS NOT DISTINCT FROM h.new_price
      AND n.created_at >= h.created_at - interval '5 minutes'
      AND n.created_at <= h.created_at + interval '5 minutes'
  )
ORDER BY h.created_at DESC
LIMIT 100;