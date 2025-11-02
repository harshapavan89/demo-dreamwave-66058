import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Flame, Target, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface LeaderboardEntry {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  total_tasks_completed: number;
  email: string;
}

const CHART_COLORS = ['hsl(270, 80%, 60%)', 'hsl(240, 70%, 50%)', 'hsl(25, 95%, 60%)', 'hsl(270, 60%, 50%)', 'hsl(240, 50%, 45%)'];

export const LeaderboardWidget = () => {
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
          total_tasks_completed,
          email
        `)
        .order('current_streak', { ascending: false })
        .limit(5);

      if (error) throw error;
      setLeaderboard(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6 bg-card border-border">
        <p className="text-center text-muted-foreground">Loading leaderboard...</p>
      </Card>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <Card className="p-6 bg-card border-border">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          Community Leaderboard
        </h2>
        <p className="text-center text-muted-foreground py-8">
          No entries yet. Complete tasks to appear on the leaderboard!
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-card border-border animate-fade-in" style={{ animationDelay: "0.3s" }}>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Trophy className="h-6 w-6 text-primary" />
        Community Leaderboard
      </h2>

      <div className="space-y-6">
        {/* Visual Chart */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-accent" />
            Top 5 Streaks
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={leaderboard}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 30%, 20%)" />
              <XAxis 
                dataKey="email" 
                tick={{ fill: 'hsl(280, 10%, 70%)', fontSize: 11 }}
                tickFormatter={(value) => value.split('@')[0].substring(0, 8)}
              />
              <YAxis tick={{ fill: 'hsl(280, 10%, 70%)', fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(225, 45%, 10%)', 
                  border: '1px solid hsl(240, 30%, 20%)',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="current_streak" radius={[8, 8, 0, 0]}>
                {leaderboard.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top 3 Rankings */}
        <div className="space-y-2">
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
            <Trophy className="h-4 w-4 text-primary" />
            Top Performers
          </h3>
          {leaderboard.slice(0, 3).map((entry, index) => (
            <div 
              key={entry.user_id}
              className={`flex items-center gap-3 p-3 rounded-lg ${
                index === 0 ? 'bg-primary/10 border border-primary' : 'bg-accent/5'
              }`}
            >
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                index === 0 ? 'bg-primary text-primary-foreground text-sm' :
                index === 1 ? 'bg-muted-foreground/20 text-sm' :
                'bg-muted-foreground/10 text-sm'
              } font-bold`}>
                {index + 1}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{entry.email || 'Anonymous'}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  <div className="flex items-center gap-1">
                    <Flame className="h-3 w-3" />
                    {entry.current_streak}d
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {entry.total_tasks_completed}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
