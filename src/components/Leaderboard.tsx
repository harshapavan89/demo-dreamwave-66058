import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

export const Leaderboard = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen]);

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
        .limit(10);

      if (error) throw error;
      setLeaderboard(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        size="icon"
        className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg glow-primary z-50 gradient-primary"
      >
        <Trophy className="h-6 w-6" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-2xl flex items-center gap-3">
              <Trophy className="h-6 w-6 text-primary" />
              <span className="text-gradient">Global Leaderboard</span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {loading ? (
              <div className="text-center text-muted-foreground py-8">Loading leaderboard...</div>
            ) : (
              <div className="space-y-6">
                {/* Visual Charts */}
                {leaderboard.length > 0 && (
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Streak Chart */}
                    <Card className="p-4 bg-card border-border">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Flame className="h-5 w-5 text-accent" />
                        Top Streaks
                      </h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={leaderboard.slice(0, 5)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 30%, 20%)" />
                          <XAxis 
                            dataKey="email" 
                            tick={{ fill: 'hsl(280, 10%, 70%)', fontSize: 12 }}
                            tickFormatter={(value) => value.split('@')[0].substring(0, 8)}
                          />
                          <YAxis tick={{ fill: 'hsl(280, 10%, 70%)', fontSize: 12 }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(225, 45%, 10%)', 
                              border: '1px solid hsl(240, 30%, 20%)',
                              borderRadius: '8px'
                            }}
                          />
                          <Bar dataKey="current_streak" radius={[8, 8, 0, 0]}>
                            {leaderboard.slice(0, 5).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Card>

                    {/* Tasks Completed Chart */}
                    <Card className="p-4 bg-card border-border">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        Tasks Completed
                      </h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={leaderboard.slice(0, 5)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 30%, 20%)" />
                          <XAxis 
                            dataKey="email" 
                            tick={{ fill: 'hsl(280, 10%, 70%)', fontSize: 12 }}
                            tickFormatter={(value) => value.split('@')[0].substring(0, 8)}
                          />
                          <YAxis tick={{ fill: 'hsl(280, 10%, 70%)', fontSize: 12 }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(225, 45%, 10%)', 
                              border: '1px solid hsl(240, 30%, 20%)',
                              borderRadius: '8px'
                            }}
                          />
                          <Bar dataKey="total_tasks_completed" radius={[8, 8, 0, 0]}>
                            {leaderboard.slice(0, 5).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Card>
                  </div>
                )}

                {/* Leaderboard Rankings */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Rankings
                  </h3>
                  {leaderboard.map((entry, index) => (
                    <div 
                      key={entry.user_id}
                      className={`flex items-center gap-4 p-4 rounded-lg ${
                        index === 0 ? 'bg-primary/10 border border-primary' : 'bg-accent/5'
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
                        <p className="font-semibold">{entry.email || 'Anonymous'}</p>
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
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};