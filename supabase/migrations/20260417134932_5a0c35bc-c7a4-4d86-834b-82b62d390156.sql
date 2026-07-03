-- Permitir que visitantes anônimos (login customizado do catálogo público) vejam os produtos
CREATE POLICY "Anon can view products for catalog"
ON public.pj_products
FOR SELECT
TO anon
USING (true);