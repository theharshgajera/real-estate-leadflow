-- Add INSERT policy for users to create leads
CREATE POLICY "Users can insert new leads" 
ON public.leads 
FOR INSERT 
WITH CHECK (true);