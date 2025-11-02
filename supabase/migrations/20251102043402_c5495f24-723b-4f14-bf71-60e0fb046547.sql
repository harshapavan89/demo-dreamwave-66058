-- Add task_type column to daily_tasks
ALTER TABLE daily_tasks 
ADD COLUMN task_type text NOT NULL DEFAULT 'proof' CHECK (task_type IN ('proof', 'quiz'));

-- Add quiz_attempts column to track attempts
ALTER TABLE daily_tasks
ADD COLUMN quiz_attempts integer DEFAULT 0;

-- Create global leaderboard view table for better performance
CREATE TABLE IF NOT EXISTS public.global_leaderboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  total_tasks_completed integer DEFAULT 0,
  last_updated timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.global_leaderboard ENABLE ROW LEVEL SECURITY;

-- Everyone can view the leaderboard
CREATE POLICY "Anyone can view leaderboard"
ON public.global_leaderboard
FOR SELECT
USING (true);

-- Only system can update (via trigger)
CREATE POLICY "System can update leaderboard"
ON public.global_leaderboard
FOR ALL
USING (auth.uid() = user_id);

-- Function to update leaderboard
CREATE OR REPLACE FUNCTION update_global_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.global_leaderboard (user_id, current_streak, longest_streak, total_tasks_completed, last_updated)
  SELECT 
    NEW.user_id,
    COALESCE((SELECT current_streak FROM streaks WHERE user_id = NEW.user_id), 0),
    COALESCE((SELECT longest_streak FROM streaks WHERE user_id = NEW.user_id), 0),
    (SELECT COUNT(*) FROM daily_tasks WHERE user_id = NEW.user_id AND completed = true),
    now()
  ON CONFLICT (user_id) DO UPDATE SET
    current_streak = EXCLUDED.current_streak,
    longest_streak = EXCLUDED.longest_streak,
    total_tasks_completed = EXCLUDED.total_tasks_completed,
    last_updated = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger on task completion
CREATE TRIGGER update_leaderboard_on_task_complete
AFTER UPDATE OF completed ON daily_tasks
FOR EACH ROW
WHEN (NEW.completed = true AND OLD.completed = false)
EXECUTE FUNCTION update_global_leaderboard();

-- Trigger on streak update
CREATE TRIGGER update_leaderboard_on_streak
AFTER UPDATE ON streaks
FOR EACH ROW
EXECUTE FUNCTION update_global_leaderboard();