-- Add email column to global_leaderboard table to avoid RLS issues
ALTER TABLE global_leaderboard ADD COLUMN IF NOT EXISTS email TEXT;

-- Create or replace the trigger function to include email
CREATE OR REPLACE FUNCTION public.update_global_leaderboard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.global_leaderboard (user_id, current_streak, longest_streak, total_tasks_completed, email, last_updated)
  SELECT 
    NEW.user_id,
    COALESCE((SELECT current_streak FROM streaks WHERE user_id = NEW.user_id), 0),
    COALESCE((SELECT longest_streak FROM streaks WHERE user_id = NEW.user_id), 0),
    (SELECT COUNT(*) FROM daily_tasks WHERE user_id = NEW.user_id AND completed = true),
    (SELECT email FROM profiles WHERE id = NEW.user_id),
    now()
  ON CONFLICT (user_id) DO UPDATE SET
    current_streak = EXCLUDED.current_streak,
    longest_streak = EXCLUDED.longest_streak,
    total_tasks_completed = EXCLUDED.total_tasks_completed,
    email = EXCLUDED.email,
    last_updated = now();
  
  RETURN NEW;
END;
$function$;