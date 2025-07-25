-- Fix infinite recursion by creating security definer function for role checking
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
    SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = 'public';

-- Update profiles policy to use the security definer function
DROP POLICY IF EXISTS "Admins can do everything on profiles" ON public.profiles;
CREATE POLICY "Admins can do everything on profiles" 
ON public.profiles 
FOR ALL 
USING (public.get_current_user_role() = 'admin');

-- Update tasks policies to use the security definer function  
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can manage their own tasks" ON public.tasks;

CREATE POLICY "Users can view their own tasks" 
ON public.tasks 
FOR SELECT 
USING (user_id = auth.uid() OR public.get_current_user_role() = 'admin');

CREATE POLICY "Users can manage their own tasks" 
ON public.tasks 
FOR ALL 
USING (user_id = auth.uid() OR public.get_current_user_role() = 'admin');

-- Update leads policies to use the security definer function
DROP POLICY IF EXISTS "Admins can do everything on leads" ON public.leads;
DROP POLICY IF EXISTS "Users can view assigned leads" ON public.leads;

CREATE POLICY "Admins can do everything on leads" 
ON public.leads 
FOR ALL 
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Users can view assigned leads" 
ON public.leads 
FOR SELECT 
USING (assigned_to = auth.uid() OR public.get_current_user_role() = 'admin');

-- Fix search path for all functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

CREATE OR REPLACE FUNCTION public.update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';