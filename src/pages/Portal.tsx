import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Circle, Youtube, Trash2, Flame, Upload, FileCheck, BookOpen, FileText, Loader2, XCircle, Clock } from "lucide-react";
import { getSafeErrorMessage } from "@/lib/error-utils";
import { Leaderboard } from "@/components/Leaderboard";
import { QuizVerification } from "@/components/QuizVerification";

interface Plan {
  id: string;
  title: string;
  description: string;
  pdf_notes_url?: string | null;
}

interface DailyTask {
  id: string;
  title: string;
  completed: boolean;
  plan_id: string;
  verification_url?: string | null;
  notes?: string | null;
  quiz_questions?: any;
  quiz_score?: number | null;
  verification_status?: string | null;
  task_type?: string;
  quiz_attempts?: number;
}

interface Resource {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  plan_id: string;
}

const Portal = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [streak, setStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null);
  const [activeQuizTaskId, setActiveQuizTaskId] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const navigate = useNavigate();
  const { toast } = useToast();

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

      // Fetch plans
      const { data: plansData } = await supabase
        .from("plans")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Fetch tasks
      const { data: tasksData } = await supabase
        .from("daily_tasks")
        .select("*")
        .eq("user_id", user.id);

      // Fetch resources
      const { data: resourcesData } = await supabase
        .from("resources")
        .select("*");

      // Fetch streak
      const { data: streakData } = await supabase
        .from("streaks")
        .select("current_streak")
        .eq("user_id", user.id)
        .single();

      setPlans(plansData || []);
      setTasks(tasksData || []);
      setResources(resourcesData || []);
      setStreak(streakData?.current_streak || 0);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (taskId: string, taskTitle: string, file: File) => {
    try {
      setUploadingTaskId(taskId);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${taskId}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('task-verifications')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('task-verifications')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('daily_tasks')
        .update({ 
          verification_url: publicUrl,
          verification_status: 'verifying'
        })
        .eq('id', taskId);

      if (updateError) throw updateError;

      setTasks(tasks.map(task =>
        task.id === taskId ? { ...task, verification_url: publicUrl, verification_status: 'verifying' } : task
      ));

      toast({
        title: "Verifying your proof... 🤖",
        description: "AI is checking your submission!",
      });

      // Call verification function
      const { data: verificationData, error: verifyError } = await supabase.functions.invoke('verify-task-proof', {
        body: { taskId, taskTitle, imageUrl: publicUrl }
      });

      if (verifyError) throw verifyError;

      // Refresh task data
      await fetchData();

      if (verificationData.verified) {
        toast({
          title: "Task completed! 🎉",
          description: verificationData.feedback,
        });
      } else {
        toast({
          title: "Verification failed 😕",
          description: verificationData.feedback,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: getSafeErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setUploadingTaskId(null);
    }
  };

  const handleQuizComplete = async (taskId: string, score: number, passed: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (passed) {
        // Update task as completed
        const { error } = await supabase
          .from('daily_tasks')
          .update({ 
            completed: true,
            completed_at: new Date().toISOString(),
            quiz_score: score,
            verification_status: 'approved'
          })
          .eq('id', taskId);

        if (error) throw error;

        // Update streak
        const { data: streakData } = await supabase
          .from("streaks")
          .select("*")
          .eq("user_id", user.id)
          .single();

        const today = new Date().toISOString().split('T')[0];
        const lastCompleted = streakData?.last_completed_date;
        
        let newStreak = streakData?.current_streak || 0;
        if (lastCompleted !== today) {
          newStreak += 1;
        }

        await supabase
          .from("streaks")
          .update({
            current_streak: newStreak,
            longest_streak: Math.max(newStreak, streakData?.longest_streak || 0),
            last_completed_date: today
          })
          .eq("user_id", user.id);

        setStreak(newStreak);
        await fetchData();
        setActiveQuizTaskId(null);

        toast({
          title: "Quiz passed! 🎉",
          description: `You scored ${score}%. Task completed!`,
        });
      } else {
        // Increment attempts
        const task = tasks.find(t => t.id === taskId);
        const attempts = (task?.quiz_attempts || 0) + 1;

        await supabase
          .from('daily_tasks')
          .update({ 
            quiz_attempts: attempts,
            quiz_score: score,
            verification_status: 'rejected'
          })
          .eq('id', taskId);

        await fetchData();
        setActiveQuizTaskId(null);

        toast({
          title: "Quiz failed",
          description: `You scored ${score}%. Try again!`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Quiz completion error:', error);
      toast({
        title: "Error",
        description: getSafeErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from("daily_tasks")
        .update({ 
          completed: !completed,
          completed_at: !completed ? new Date().toISOString() : null
        })
        .eq("id", taskId);

      if (error) throw error;

      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, completed: !completed } : task
      ));

      if (!completed) {
        // Update streak
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: streakData } = await supabase
            .from("streaks")
            .select("*")
            .eq("user_id", user.id)
            .single();

          const today = new Date().toISOString().split('T')[0];
          const lastCompleted = streakData?.last_completed_date;
          
          let newStreak = streakData?.current_streak || 0;
          if (lastCompleted !== today) {
            newStreak += 1;
          }

          await supabase
            .from("streaks")
            .update({
              current_streak: newStreak,
              longest_streak: Math.max(newStreak, streakData?.longest_streak || 0),
              last_completed_date: today
            })
            .eq("user_id", user.id);

          setStreak(newStreak);
        }

        toast({
          title: "Great job! 🎉",
          description: "Task completed!",
        });
      }
    } catch (error: any) {
      console.error('Toggle task error:', error);
      toast({
        title: "Error",
        description: getSafeErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const deletePlan = async (planId: string) => {
    try {
      const { error } = await supabase
        .from("plans")
        .delete()
        .eq("id", planId);

      if (error) throw error;

      setPlans(plans.filter(plan => plan.id !== planId));
      setTasks(tasks.filter(task => task.plan_id !== planId));
      setResources(resources.filter(resource => resource.plan_id !== planId));

      toast({
        title: "Plan deleted",
        description: "The plan and its tasks have been removed.",
      });
    } catch (error: any) {
      console.error('Delete plan error:', error);
      toast({
        title: "Error",
        description: getSafeErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const sendReminders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user has email notifications enabled
      const { data: profile } = await supabase
        .from('profiles')
        .select('email_notifications_enabled, full_name, email')
        .eq('id', user.id)
        .single();

      if (!profile?.email_notifications_enabled) {
        toast({
          title: "Email notifications disabled",
          description: "Enable email notifications in your profile to receive reminders.",
          variant: "destructive",
        });
        return;
      }

      // Get AI tone preference
      const { data: preferences } = await supabase
        .from('notification_preferences')
        .select('ai_tone')
        .eq('user_id', user.id)
        .single();

      // Get incomplete tasks
      const incompleteTasks = tasks.filter(t => !t.completed);
      if (incompleteTasks.length === 0) {
        toast({
          title: "All tasks complete! 🎉",
          description: "You're crushing it! No reminders needed.",
        });
        return;
      }

      // Get the user's plan/dream goal
      const firstPlan = plans[0];
      const dreamGoal = firstPlan?.title || "your goals";

      // Send email for the first incomplete task
      const firstIncompleteTask = incompleteTasks[0];
      
      const { data, error } = await supabase.functions.invoke('send-task-reminder', {
        body: {
          taskName: firstIncompleteTask.title,
          userName: profile.full_name || "there",
          userEmail: profile.email,
          dreamGoal: dreamGoal,
          aiTone: preferences?.ai_tone || 'motivational'
        }
      });
      
      if (error) throw error;

      toast({
        title: "Reminder sent! 📧",
        description: data?.message || "Check your email for a motivational boost!",
      });
    } catch (error: any) {
      console.error('Send reminders error:', error);
      toast({
        title: "Error",
        description: getSafeErrorMessage(error),
        variant: "destructive",
      });
    }
  };

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
  const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Learning <span className="text-gradient">Portal</span>
              </h1>
              <p className="text-muted-foreground">
                Track your progress and complete daily tasks
              </p>
            </div>
            <Card className="p-4 flex items-center gap-3">
              <Flame className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold">{streak} days</p>
              </div>
            </Card>
          </div>

          {/* Progress Overview */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Today's Progress</h2>
              {completedTasks < tasks.length && tasks.length > 0 && (
                <Button 
                  onClick={sendReminders}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Send Funny Reminder 😄
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{completedTasks} of {tasks.length} tasks completed</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          </Card>

          {/* Plans and Tasks */}
          {plans.map((plan) => {
            const planTasks = tasks.filter(t => t.plan_id === plan.id);
            const planResources = resources.filter(r => r.plan_id === plan.id);
            
            return (
              <Card key={plan.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">{plan.title}</h2>
                    <p className="text-muted-foreground mb-3">{plan.description}</p>
                    
                    {/* PDF Notes Display - System Provided Only */}
                    {plan.pdf_notes_url && (
                      <div className="flex items-center gap-2 mt-3">
                        <a 
                          href={plan.pdf_notes_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <FileText className="h-4 w-4" />
                          View Learning Notes (PDF)
                        </a>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deletePlan(plan.id)}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>

                {/* Daily Tasks */}
                {planTasks.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Daily Tasks</h3>
                    <div className="space-y-4">
                      {planTasks.map((task) => (
                        <Card key={task.id} className="p-4 space-y-3">
                          <div className="flex items-center gap-3">
                            {task.verification_status === 'approved' ? (
                              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                            ) : task.verification_status === 'verifying' ? (
                              <Loader2 className="h-5 w-5 text-yellow-500 flex-shrink-0 animate-spin" />
                            ) : task.verification_status === 'rejected' ? (
                              <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                            ) : (
                              <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <span className={`font-medium block ${task.verification_status === 'approved' ? "line-through text-muted-foreground" : ""}`}>
                                {task.title}
                              </span>
                              {task.verification_status && task.verification_status !== 'pending' && (
                                <span className="text-xs text-muted-foreground block">
                                  {task.verification_status === 'verifying' && '🤖 AI is verifying...'}
                                  {task.verification_status === 'approved' && '✅ Verified by AI'}
                                  {task.verification_status === 'rejected' && '❌ Verification failed - try again'}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Notes/Key Points */}
                          {task.notes && (
                            <div className="pl-8 space-y-2">
                              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <BookOpen className="h-4 w-4" />
                                Key Points:
                              </div>
                              <div className="text-sm text-muted-foreground whitespace-pre-line bg-accent/20 p-3 rounded-md">
                                {task.notes}
                              </div>
                            </div>
                          )}

                          {/* Quiz Questions */}
                          {task.quiz_questions && Array.isArray(task.quiz_questions) && task.quiz_questions.length > 0 && (
                            <div className="pl-8 space-y-2">
                              <div className="text-sm font-medium text-muted-foreground">
                                🧩 Quick Quiz:
                              </div>
                              <div className="space-y-1 text-sm text-muted-foreground">
                                {task.quiz_questions.map((q: any, idx: number) => (
                                  <div key={idx} className="ml-4">
                                    {idx + 1}. {typeof q === 'string' ? q : q.question}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                           {/* Quiz or Proof Verification */}
                          <div className="pl-8 space-y-2">
                            {task.task_type === 'quiz' && task.quiz_questions?.length > 0 ? (
                              activeQuizTaskId === task.id ? (
                                <QuizVerification
                                  questions={task.quiz_questions}
                                  onComplete={(score, passed) => handleQuizComplete(task.id, score, passed)}
                                />
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => setActiveQuizTaskId(task.id)}
                                  disabled={task.completed}
                                  className="text-xs"
                                >
                                  {task.quiz_attempts ? `Take Quiz (Attempt ${(task.quiz_attempts || 0) + 1})` : 'Start Quiz 🧩'}
                                </Button>
                              )
                            ) : task.verification_url ? (
                              <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-2 text-sm">
                                  <FileCheck className="h-4 w-4 text-primary" />
                                  <a 
                                    href={task.verification_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="underline hover:text-primary/80 text-primary"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    View Uploaded Proof
                                  </a>
                                </div>
                                {task.verification_status === 'rejected' && (
                                  <>
                                    <input
                                      ref={(el) => fileInputRefs.current[task.id + '_retry'] = el}
                                      type="file"
                                      accept="image/*,video/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileUpload(task.id, task.title, file);
                                      }}
                                    />
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        fileInputRefs.current[task.id + '_retry']?.click();
                                      }}
                                      disabled={uploadingTaskId === task.id}
                                      className="text-xs"
                                    >
                                      <Upload className="h-3 w-3 mr-1" />
                                      {uploadingTaskId === task.id ? "Uploading..." : "Re-upload Proof"}
                                    </Button>
                                  </>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <input
                                  ref={(el) => fileInputRefs.current[task.id] = el}
                                  type="file"
                                  accept="image/*,video/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(task.id, task.title, file);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <Button
                                  size="sm"
                                  variant={task.verification_status === 'pending' ? "default" : "outline"}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    fileInputRefs.current[task.id]?.click();
                                  }}
                                  disabled={uploadingTaskId === task.id}
                                  className="text-xs"
                                >
                                  <Upload className="h-3 w-3 mr-1" />
                                  {uploadingTaskId === task.id ? "Uploading..." : "Upload Proof to Complete 📸"}
                                </Button>
                                <span className="text-xs text-muted-foreground">
                                  Required: Photo or video proof
                                </span>
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resources */}
                {planResources.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Youtube className="h-5 w-5 text-accent" />
                      Learning Resources
                    </h3>
                    <div className="grid md:grid-cols-1 gap-4">
                      {planResources.map((resource) => {
                        // Extract YouTube video ID from URL
                        const getYouTubeEmbedUrl = (url: string) => {
                          const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
                          return videoIdMatch ? `https://www.youtube.com/embed/${videoIdMatch[1]}` : url;
                        };

                        return (
                          <div key={resource.id} className="rounded-lg overflow-hidden bg-background border border-border hover:border-primary/50 transition-all hover:glow-primary">
                            <div className="relative aspect-video">
                              <iframe 
                                src={getYouTubeEmbedUrl(resource.url)}
                                title={resource.title}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                            <div className="p-4">
                              <h4 className="font-medium">{resource.title}</h4>
                              <a 
                                href={resource.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline mt-1 inline-block"
                              >
                                Watch on YouTube →
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}

          {plans.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground mb-4">
                No plans yet. Start by adding a plan from the marketplace!
              </p>
              <Button onClick={() => navigate("/marketplace")} variant="accent">
                Browse Marketplace
              </Button>
            </Card>
          )}

          {/* Global Leaderboard */}
          <Leaderboard />
        </div>
      </div>
    </div>
  );
};

export default Portal;
