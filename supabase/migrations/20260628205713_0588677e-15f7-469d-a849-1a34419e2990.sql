
-- Admin write/read policies for permissions tables

-- user_permission_group
CREATE POLICY "Admin manage group assignments"
ON public.user_permission_group FOR ALL
TO authenticated
USING (public.has_perm(auth.uid(), 'sistema.gerenciar_permissoes'))
WITH CHECK (public.has_perm(auth.uid(), 'sistema.gerenciar_permissoes'));

-- user_permissions
CREATE POLICY "Admin manage user permissions"
ON public.user_permissions FOR ALL
TO authenticated
USING (public.has_perm(auth.uid(), 'sistema.gerenciar_permissoes'))
WITH CHECK (public.has_perm(auth.uid(), 'sistema.gerenciar_permissoes'));

-- permission_groups
CREATE POLICY "Admin manage permission groups"
ON public.permission_groups FOR ALL
TO authenticated
USING (public.has_perm(auth.uid(), 'sistema.gerenciar_permissoes'))
WITH CHECK (public.has_perm(auth.uid(), 'sistema.gerenciar_permissoes'));

-- permission_group_items
CREATE POLICY "Admin manage permission group items"
ON public.permission_group_items FOR ALL
TO authenticated
USING (public.has_perm(auth.uid(), 'sistema.gerenciar_permissoes'))
WITH CHECK (public.has_perm(auth.uid(), 'sistema.gerenciar_permissoes'));

-- permission_keys
CREATE POLICY "Admin manage permission keys"
ON public.permission_keys FOR ALL
TO authenticated
USING (public.has_perm(auth.uid(), 'sistema.gerenciar_permissoes'))
WITH CHECK (public.has_perm(auth.uid(), 'sistema.gerenciar_permissoes'));
