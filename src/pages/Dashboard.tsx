import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trophy, Flame, Star, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import TargetProgressTracker from "@/components/TargetProgressTracker";

interface Plan {
  id: string;
  title: string;
  target_date: string | null;
  start_date: string | null;
  target_duration_months: number | null;
  daily_hours_commitment: number | null;
  available_days: string[] | null;
  progress_percentage: number | null;
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
  plan_id: string;
}

interface Streak {
  current_streak: number;
  longest_streak: number;
}

const Dashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [streak, setStreak] = useState<Streak>({ current_streak: 0, longest_streak: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: plansData } = await supabase
        .from("plans")
        .select("id, title, target_date, start_date, target_duration_months, daily_hours_commitment, available_days, progress_percentage")
        .eq("user_id", user.id);

      const { data: tasksData } = await supabase
        .from("daily_tasks")
        .select("*")
        .eq("user_id", user.id);

      const { data: streakData } = await supabase
        .from("streaks")
        .select("current_streak, longest_streak")
        .eq("user_id", user.id)
        .maybeSingle();

      setPlans(plansData || []);
      setTasks(tasksData || []);
      setStreak(streakData || { current_streak: 0, longest_streak: 0 });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const badges = [
    { icon: "🔥", name: "Week Warrior", desc: `${streak.current_streak}-day streak` },
    { icon: "⭐", name: "Rising Star", desc: `Completed ${tasks.filter(t => t.completed).length} habits` },
    { icon: "💎", name: "Consistency King", desc: `Best: ${streak.longest_streak} days` },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <p className="text-center text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const completedTasks = tasks.filter(t => t.completed).length;
  const totalXP = completedTasks * 50;
  const level = Math.floor(totalXP / 500) + 1;

  // Group tasks by plan
  const planHabits = plans.map(plan => {
    const planTasks = tasks.filter(t => t.plan_id === plan.id);
    const completed = planTasks.filter(t => t.completed).length;
    return {
      name: plan.title,
      completed,
      total: planTasks.length,
      streak: streak.current_streak,
    };
  }).filter(h => h.total > 0);

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-4 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold">
              Your <span className="text-gradient">Progress</span> Dashboard
            </h1>
            <p className="text-xl text-muted-foreground">
              Track your journey and celebrate wins
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid md:grid-cols-4 gap-4 animate-slide-in">
            <Card className="p-6 bg-card border-border hover:border-primary/50 transition-all hover:glow-primary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total XP</p>
                  <p className="text-3xl font-bold text-primary">{totalXP.toLocaleString()}</p>
                </div>
                <Star className="h-8 w-8 text-primary" />
              </div>
            </Card>

            <Card className="p-6 bg-card border-border hover:border-accent/50 transition-all hover:glow-accent">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Best Streak</p>
                  <p className="text-3xl font-bold text-accent">{streak.longest_streak} days</p>
                </div>
                <Flame className="h-8 w-8 text-accent" />
              </div>
            </Card>

            <Card className="p-6 bg-card border-border hover:border-primary/50 transition-all hover:glow-primary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Habits Completed</p>
                  <p className="text-3xl font-bold text-primary">{completedTasks}</p>
                </div>
                <Trophy className="h-8 w-8 text-primary" />
              </div>
            </Card>

            <Card className="p-6 bg-card border-border hover:border-accent/50 transition-all hover:glow-accent">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Level</p>
                  <p className="text-3xl font-bold text-accent">{level}</p>
                </div>
                <Zap className="h-8 w-8 text-accent" />
              </div>
            </Card>
          </div>

          {/* Target Progress Tracker */}
          <TargetProgressTracker plans={plans} tasks={tasks} />

          {/* Habit Tracker */}
          {planHabits.length > 0 ? (
            <Card className="p-8 bg-card border-border animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <h2 className="text-2xl font-bold mb-6">Active Habits</h2>
              
              <div className="space-y-6">
                {planHabits.map((habit, index) => (
                  <div
                    key={index}
                    className="space-y-2 animate-slide-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-medium">{habit.name}</span>
                        <div className="flex items-center gap-1 text-accent">
                          <Flame className="h-4 w-4" />
                          <span className="text-sm font-bold">{habit.streak} day streak</span>
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {habit.completed}/{habit.total} tasks
                      </span>
                    </div>
                    <Progress value={habit.total > 0 ? (habit.completed / habit.total) * 100 : 0} className="h-2" />
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center bg-card border-border">
              <p className="text-muted-foreground mb-4">
                No active habits yet. Add a plan from the marketplace to get started!
              </p>
              <Button onClick={() => navigate("/marketplace")} variant="accent">
                Browse Marketplace
              </Button>
            </Card>
          )}

          {/* Badges */}
          <Card className="p-8 bg-card border-border animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <h2 className="text-2xl font-bold mb-6">🏆 Your Badges</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {badges.map((badge, index) => (
                <div
                  key={index}
                  className="p-6 rounded-xl bg-background border border-primary/30 hover:border-primary/60 transition-all hover:glow-primary text-center animate-slide-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="text-4xl mb-2">{badge.icon}</div>
                  <h3 className="font-bold mb-1">{badge.name}</h3>
                  <p className="text-sm text-muted-foreground">{badge.desc}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
