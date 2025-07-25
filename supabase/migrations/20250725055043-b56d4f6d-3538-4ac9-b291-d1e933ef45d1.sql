-- Create user role enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create lead status enum if it doesn't exist  
DO $$ BEGIN
    CREATE TYPE lead_status AS ENUM ('new', 'assigned', 'in_progress', 'site_visit_scheduled', 'site_visit_done', 'converted', 'lost');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create lead quality enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE lead_quality AS ENUM ('hot', 'warm', 'cold');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update profiles table to include role
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user';

-- Create tasks table for daily tasks
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    task_type TEXT NOT NULL CHECK (task_type IN ('followup', 'site_visit')),
    task_date DATE NOT NULL,
    task_time TIME,
    completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tasks
CREATE POLICY "Users can view their own tasks" 
ON public.tasks 
FOR SELECT 
USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
));

CREATE POLICY "Users can manage their own tasks" 
ON public.tasks 
FOR ALL 
USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
));

-- Update RLS policies for profiles to include role-based access
DROP POLICY IF EXISTS "Admins can do everything on profiles" ON public.profiles;
CREATE POLICY "Admins can do everything on profiles" 
ON public.profiles 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
));

-- Create trigger for updating tasks updated_at
CREATE OR REPLACE FUNCTION public.update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_tasks_updated_at();

-- Update the handle_new_user function to set default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data ->> 'full_name', new.email),
        new.email,
        'user'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';