import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, Target, TrendingUp, Clock } from "lucide-react";
import { differenceInDays, format, parseISO } from "date-fns";

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
  plan_id: string;
  completed: boolean;
}

interface TargetProgressTrackerProps {
  plans: Plan[];
  tasks: Task[];
}

const TargetProgressTracker = ({ plans, tasks }: TargetProgressTrackerProps) => {
  const plansWithTargets = plans.filter(p => p.target_date && p.start_date);

  if (plansWithTargets.length === 0) {
    return null;
  }

  return (
    <Card className="p-8 bg-card border-border animate-fade-in">
      <div className="flex items-center gap-2 mb-6">
        <Target className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Target Progress Tracker</h2>
      </div>

      <div className="space-y-6">
        {plansWithTargets.map((plan) => {
          const startDate = parseISO(plan.start_date!);
          const targetDate = parseISO(plan.target_date!);
          const today = new Date();
          
          const totalDays = differenceInDays(targetDate, startDate);
          const elapsedDays = differenceInDays(today, startDate);
          const remainingDays = differenceInDays(targetDate, today);
          
          const timeProgress = Math.min(Math.max((elapsedDays / totalDays) * 100, 0), 100);
          
          // Calculate task completion progress
          const planTasks = tasks.filter(t => t.plan_id === plan.id);
          const completedTasks = planTasks.filter(t => t.completed).length;
          const taskProgress = planTasks.length > 0 
            ? (completedTasks / planTasks.length) * 100 
            : 0;
          
          const isOnTrack = taskProgress >= timeProgress - 10; // 10% tolerance
          const isOverdue = remainingDays < 0;

          return (
            <div
              key={plan.id}
              className={`p-6 rounded-lg border-2 transition-all ${
                isOverdue
                  ? "border-destructive/50 bg-destructive/5"
                  : isOnTrack
                  ? "border-primary/50 bg-primary/5"
                  : "border-accent/50 bg-accent/5"
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold">{plan.title}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Target: {format(targetDate, 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {isOverdue 
                            ? `Overdue by ${Math.abs(remainingDays)} days` 
                            : `${remainingDays} days left`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isOverdue
                      ? "bg-destructive/20 text-destructive"
                      : isOnTrack
                      ? "bg-primary/20 text-primary"
                      : "bg-accent/20 text-accent"
                  }`}>
                    {isOverdue ? "Overdue" : isOnTrack ? "On Track" : "Behind"}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Task Completion</span>
                      <span className="font-bold">{Math.round(taskProgress)}%</span>
                    </div>
                    <Progress value={taskProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {completedTasks} of {planTasks.length} tasks completed
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Time Elapsed</span>
                      <span className="font-bold">{Math.round(timeProgress)}%</span>
                    </div>
                    <Progress value={timeProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {elapsedDays} of {totalDays} days elapsed
                    </p>
                  </div>
                </div>

                {plan.available_days && plan.available_days.length > 0 && (
                  <div className="pt-3 border-t border-border/50">
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">
                        Working {plan.daily_hours_commitment}h/day on {plan.available_days.join(', ')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default TargetProgressTracker;
