DROP POLICY IF EXISTS "Admin can manage price notifications" ON public.pj_price_notifications;

CREATE POLICY "Admins can manage price notifications"
ON public.pj_price_notifications
FOR ALL
USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "Pricing collaborators can insert price notifications"
ON public.pj_price_notifications
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin_user()
  OR has_pancada_submodule_access(auth.uid(), 'pricing'::pancada_submodule)
);