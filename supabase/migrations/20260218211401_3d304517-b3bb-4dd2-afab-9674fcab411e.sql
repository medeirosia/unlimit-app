INSERT INTO public.pj_pricing_config (key, label, value)
VALUES ('drop_fee_percentage', 'Taxa do Drop (%)', 8)
ON CONFLICT DO NOTHING;