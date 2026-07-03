ALTER TABLE public.pj_products REPLICA IDENTITY FULL;
ALTER TABLE public.pj_price_notifications REPLICA IDENTITY FULL;
DO $$ BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pj_products;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pj_price_notifications;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;