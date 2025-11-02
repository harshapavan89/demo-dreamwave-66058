
-- Migration: 20251101095752

-- Migration: 20251027093019
-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create streaks table
CREATE TABLE public.streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_completed_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Create plans table (from marketplace)
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create daily tasks table
CREATE TABLE public.daily_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create resources table (YouTube videos, etc.)
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbnail TEXT,
  resource_type TEXT DEFAULT 'youtube',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Streaks policies
CREATE POLICY "Users can view their own streaks"
  ON public.streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks"
  ON public.streaks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streaks"
  ON public.streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Plans policies
CREATE POLICY "Users can view their own plans"
  ON public.plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plans"
  ON public.plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plans"
  ON public.plans FOR DELETE
  USING (auth.uid() = user_id);

-- Daily tasks policies
CREATE POLICY "Users can view their own tasks"
  ON public.daily_tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks"
  ON public.daily_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON public.daily_tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON public.daily_tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Resources policies
CREATE POLICY "Users can view resources for their plans"
  ON public.resources FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.plans
    WHERE plans.id = resources.plan_id
    AND plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert resources for their plans"
  ON public.resources FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.plans
    WHERE plans.id = resources.plan_id
    AND plans.user_id = auth.uid()
  ));

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  
  INSERT INTO public.streaks (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_streaks_updated_at
  BEFORE UPDATE ON public.streaks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Migration: 20251027093058
-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Migration: 20251029140004
-- Add missing UPDATE policy for plans table
CREATE POLICY "Users can update their own plans"
ON public.plans
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add missing DELETE policy for resources table
CREATE POLICY "Users can delete resources for their plans"
ON public.resources
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM plans
  WHERE plans.id = resources.plan_id
  AND plans.user_id = auth.uid()
));

-- Add missing DELETE policy for profiles table
CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = id);

-- Add missing DELETE policy for streaks table
CREATE POLICY "Users can delete their own streaks"
ON public.streaks
FOR DELETE
USING (auth.uid() = user_id);

-- Migration: 20251101064816
-- Add email notification preferences to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_notifications_enabled boolean DEFAULT true;

COMMENT ON COLUMN public.profiles.email_notifications_enabled IS 'Whether user wants to receive email notifications for incomplete tasks';

-- Migration: 20251101074220
-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_time TIME NOT NULL DEFAULT '09:00:00',
  notification_types TEXT[] NOT NULL DEFAULT ARRAY['task_reminder', 'daily_summary'],
  ai_tone TEXT NOT NULL DEFAULT 'motivational',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create notification history table
CREATE TABLE public.notification_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent',
  message_content TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_preferences
CREATE POLICY "Users can view their own notification preferences"
  ON public.notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences"
  ON public.notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
  ON public.notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notification preferences"
  ON public.notification_preferences
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for notification_history
CREATE POLICY "Users can view their own notification history"
  ON public.notification_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification history"
  ON public.notification_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at on notification_preferences
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_notification_preferences_user_id ON public.notification_preferences(user_id);
CREATE INDEX idx_notification_history_user_id ON public.notification_history(user_id);
CREATE INDEX idx_notification_history_sent_at ON public.notification_history(sent_at DESC);


-- Migration: 20251101102937
-- Add coaching_mode to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coaching_mode TEXT DEFAULT 'motivational' CHECK (coaching_mode IN ('motivational', 'casual', 'professional', 'friendly'));

-- Migration: 20251101160356
-- Add target planning fields to plans table
ALTER TABLE public.plans
ADD COLUMN target_date DATE,
ADD COLUMN target_duration_months INTEGER,
ADD COLUMN available_days TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN available_time_slots JSONB DEFAULT '[]'::JSONB,
ADD COLUMN daily_hours_commitment NUMERIC(3,1),
ADD COLUMN start_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN progress_percentage NUMERIC(5,2) DEFAULT 0;

-- Add comments for clarity
COMMENT ON COLUMN public.plans.target_date IS 'Target completion date for the goal';
COMMENT ON COLUMN public.plans.target_duration_months IS 'Duration in months to achieve the goal';
COMMENT ON COLUMN public.plans.available_days IS 'Array of days user is available (e.g., ["Monday", "Wednesday", "Friday"])';
COMMENT ON COLUMN public.plans.available_time_slots IS 'JSON array of time slots with start and end times';
COMMENT ON COLUMN public.plans.daily_hours_commitment IS 'Number of hours per day user can commit';
COMMENT ON COLUMN public.plans.start_date IS 'Date when the plan started';
COMMENT ON COLUMN public.plans.progress_percentage IS 'Current progress percentage toward goal';

-- Migration: 20251101164942
-- Add verification and notes fields to daily_tasks table
ALTER TABLE public.daily_tasks 
ADD COLUMN verification_url TEXT,
ADD COLUMN notes TEXT,
ADD COLUMN quiz_questions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN quiz_score INTEGER;

-- Migration: 20251101165020
-- Create storage bucket for task verifications
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-verifications', 'task-verifications', true);

-- Create RLS policies for task verification uploads
CREATE POLICY "Users can upload their own verification files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'task-verifications' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own verification files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'task-verifications' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view public verification files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'task-verifications');

-- Migration: 20251101165531
-- Add PDF notes field to plans table and verification status to tasks
ALTER TABLE public.plans 
ADD COLUMN pdf_notes_url TEXT;

ALTER TABLE public.daily_tasks
ADD COLUMN verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verifying', 'approved', 'rejected'));
