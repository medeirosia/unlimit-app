-- Allow authenticated users to insert commission payments
CREATE POLICY "Authenticated users can insert ra commission payments"
ON public.pj_ra_commission_payments
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
