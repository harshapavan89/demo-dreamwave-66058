import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Flame, Target } from "lucide-react";

interface LeaderboardEntry {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  total_tasks_completed: number;
  email?: string;
}

export const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('global_leaderboard')
        .select(`
          user_id,
          current_streak,
          longest_streak,
          total_tasks_completed
        `)
        .order('current_streak', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Fetch user emails
      const enrichedData = await Promise.all(
        (data || []).map(async (entry) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', entry.user_id)
            .single();
          
          return {
            ...entry,
            email: profile?.email || 'Anonymous'
          };
        })
      );

      setLeaderboard(enrichedData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading leaderboard...</div>;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Global Leaderboard</h2>
      </div>

      <div className="space-y-3">
        {leaderboard.map((entry, index) => (
          <div 
            key={entry.user_id}
            className={`flex items-center gap-4 p-4 rounded-lg ${
              index === 0 ? 'bg-primary/10 border border-primary' : 'bg-accent/50'
            }`}
          >
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              index === 0 ? 'bg-primary text-primary-foreground' :
              index === 1 ? 'bg-muted-foreground/20' :
              index === 2 ? 'bg-muted-foreground/10' :
              'bg-muted'
            } font-bold`}>
              {index + 1}
            </div>
            
            <div className="flex-1">
              <p className="font-semibold">{entry.email}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <div className="flex items-center gap-1">
                  <Flame className="h-4 w-4" />
                  {entry.current_streak} day streak
                </div>
                <div className="flex items-center gap-1">
                  <Trophy className="h-4 w-4" />
                  Best: {entry.longest_streak}
                </div>
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  {entry.total_tasks_completed} tasks
                </div>
              </div>
            </div>
          </div>
        ))}

        {leaderboard.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No entries yet. Complete tasks to appear on the leaderboard!
          </p>
        )}
      </div>
    </Card>
  );
};