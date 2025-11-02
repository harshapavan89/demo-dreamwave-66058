import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0">
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
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};