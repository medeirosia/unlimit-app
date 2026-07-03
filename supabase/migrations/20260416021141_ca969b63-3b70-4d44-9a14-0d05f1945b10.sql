
-- Table for simple catalog users (not Supabase auth users)
CREATE TABLE public.pj_catalog_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pj_catalog_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage catalog users"
  ON public.pj_catalog_users FOR ALL
  USING (is_admin_user());

CREATE POLICY "Authenticated users can view catalog users"
  ON public.pj_catalog_users FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Anon can view active catalog users for login"
  ON public.pj_catalog_users FOR SELECT TO anon
  USING (is_active = true);

-- Table for price change notifications
CREATE TABLE public.pj_price_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.pj_products(id) ON DELETE CASCADE,
  product_sku TEXT NOT NULL,
  product_name TEXT NOT NULL,
  old_price NUMERIC,
  new_price NUMERIC,
  direction TEXT NOT NULL DEFAULT 'new', -- 'up', 'down', 'new'
  confirmed_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pj_price_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage price notifications"
  ON public.pj_price_notifications FOR ALL
  USING (is_admin_user());

CREATE POLICY "Authenticated users can view price notifications"
  ON public.pj_price_notifications FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Anon can view price notifications"
  ON public.pj_price_notifications FOR SELECT TO anon
  USING (true);

-- Table for tracking which users have seen notifications
CREATE TABLE public.pj_notification_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES public.pj_price_notifications(id) ON DELETE CASCADE,
  catalog_user_id UUID NOT NULL REFERENCES public.pj_catalog_users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (notification_id, catalog_user_id)
);

ALTER TABLE public.pj_notification_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage notification views"
  ON public.pj_notification_views FOR ALL
  USING (is_admin_user());

CREATE POLICY "Authenticated users can view notification views"
  ON public.pj_notification_views FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Anon can view notification views"
  ON public.pj_notification_views FOR SELECT TO anon
  USING (true);

CREATE POLICY "Anon can insert notification views"
  ON public.pj_notification_views FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can insert notification views authenticated"
  ON public.pj_notification_views FOR INSERT
  WITH CHECK (true);
