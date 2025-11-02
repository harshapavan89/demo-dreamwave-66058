import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, ArrowRight, Loader2, Youtube, Calendar, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getSafeErrorMessage } from "@/lib/error-utils";
import { addMonths, format } from "date-fns";

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
}

const Dream = () => {
  const [dream, setDream] = useState("");
  const [targetMonths, setTargetMonths] = useState<number>(3);
  const [dailyHours, setDailyHours] = useState<number>(2);
  const [availableDays, setAvailableDays] = useState<string[]>(["Monday", "Wednesday", "Friday"]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [habits, setHabits] = useState<string[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
  const toggleDay = (day: string) => {
    setAvailableDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const generateHabits = async () => {
    if (!dream.trim()) {
      toast({
        title: "Please enter your dream",
        description: "Tell us what you want to achieve!",
        variant: "destructive",
      });
      return;
    }

    if (availableDays.length === 0) {
      toast({
        title: "Please select available days",
        description: "Choose at least one day you can work on your goal!",
        variant: "destructive",
      });
      return;
    }

    if (dailyHours <= 0 || dailyHours > 24) {
      toast({
        title: "Invalid time commitment",
        description: "Please enter a valid number of hours (1-24)!",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const targetDate = addMonths(new Date(), targetMonths);
      
      const { data, error } = await supabase.functions.invoke('generate-habits', {
        body: { 
          dream,
          targetMonths,
          targetDate: format(targetDate, 'yyyy-MM-dd'),
          availableDays,
          dailyHours
        }
      });

      if (error) throw error;

      setHabits(data.habits);
      setVideos(data.videos);
      
      toast({
        title: "✨ Adaptive Plan Generated!",
        description: `Your personalized ${targetMonths}-month plan is ready!`,
      });
    } catch (error: any) {
      console.error('Error generating habits:', error);
      toast({
        title: "Error",
        description: getSafeErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const savePlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to save your plan.",
          variant: "destructive",
        });
        return;
      }

      const targetDate = addMonths(new Date(), targetMonths);

      // Create the plan
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .insert({
          user_id: user.id,
          title: dream,
          description: `${targetMonths}-month plan with ${dailyHours}h/day commitment`,
          target_date: format(targetDate, 'yyyy-MM-dd'),
          target_duration_months: targetMonths,
          available_days: availableDays,
          daily_hours_commitment: dailyHours,
          start_date: format(new Date(), 'yyyy-MM-dd'),
        })
        .select()
        .single();

      if (planError) throw planError;

      // Create daily tasks from generated habits
      const tasksToInsert = habits.map(habit => ({
        user_id: user.id,
        plan_id: planData.id,
        title: habit,
        completed: false,
      }));

      const { error: tasksError } = await supabase
        .from('daily_tasks')
        .insert(tasksToInsert);

      if (tasksError) throw tasksError;

      // Save resources
      if (videos.length > 0) {
        const resourcesToInsert = videos.map(video => ({
          plan_id: planData.id,
          title: video.title,
          url: `https://www.youtube.com/watch?v=${video.id}`,
          thumbnail: video.thumbnail,
          resource_type: 'youtube',
        }));

        const { error: resourcesError } = await supabase
          .from('resources')
          .insert(resourcesToInsert);

        if (resourcesError) throw resourcesError;
      }

      toast({
        title: "🎉 Target Plan Saved!",
        description: `Your ${targetMonths}-month journey starts now!`,
      });
      navigate("/portal");
    } catch (error: any) {
      console.error('Error saving plan:', error);
      toast({
        title: "Error",
        description: getSafeErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-4 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold">
              What's Your <span className="text-gradient">Dream</span>?
            </h1>
            <p className="text-xl text-muted-foreground">
              Tell us your goal, and we'll create a personalized daily habit plan
            </p>
          </div>

          <Card className="p-8 bg-card border-border animate-slide-in">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="dream" className="text-sm font-medium">Describe Your Dream or Goal</Label>
                <Textarea
                  id="dream"
                  placeholder="e.g., 'I want to crack the GATE exam', 'Build a successful startup', 'Get fit and healthy'..."
                  className="min-h-[120px] bg-background border-border resize-none"
                  value={dream}
                  onChange={(e) => setDream(e.target.value)}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Target Duration (Months)
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    max="24"
                    value={targetMonths}
                    onChange={(e) => setTargetMonths(parseInt(e.target.value) || 3)}
                    className="bg-background border-border"
                  />
                  <p className="text-xs text-muted-foreground">
                    Target date: {format(addMonths(new Date(), targetMonths), 'MMM dd, yyyy')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hours" className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Daily Time Commitment (Hours)
                  </Label>
                  <Input
                    id="hours"
                    type="number"
                    min="0.5"
                    max="24"
                    step="0.5"
                    value={dailyHours}
                    onChange={(e) => setDailyHours(parseFloat(e.target.value) || 2)}
                    className="bg-background border-border"
                  />
                  <p className="text-xs text-muted-foreground">
                    Total: {Math.round(targetMonths * 30 * dailyHours)} hours over {targetMonths} months
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Available Days</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {weekDays.map((day) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={day}
                        checked={availableDays.includes(day)}
                        onCheckedChange={() => toggleDay(day)}
                      />
                      <label
                        htmlFor={day}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {day.slice(0, 3)}
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Selected: {availableDays.length} days per week
                </p>
              </div>
              
              <Button
                onClick={generateHabits}
                disabled={isGenerating}
                variant="hero"
                size="lg"
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Your Adaptive Plan...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate Time-Based Habit Plan
                  </>
                )}
              </Button>
            </div>
          </Card>

          {habits.length > 0 && (
            <Card className="p-8 bg-card border-primary/50 glow-primary animate-fade-in">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <Sparkles className="mr-2 h-6 w-6 text-primary" />
                Your Personalized Habit Plan
              </h2>
              
              <div className="space-y-3 mb-6">
                {habits.map((habit, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg bg-background border border-border hover:border-primary/50 transition-colors animate-slide-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <p className="text-lg">{habit}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={savePlan}
                  variant="accent"
                  size="lg"
                  className="flex-1"
                >
                  Save & Start Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  onClick={() => {
                    setHabits([]);
                    setVideos([]);
                  }}
                  variant="outline"
                  size="lg"
                >
                  Regenerate
                </Button>
              </div>
            </Card>
          )}

          {videos.length > 0 && (
            <Card className="p-8 bg-card border-border animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <Youtube className="mr-2 h-6 w-6 text-accent" />
                Recommended Learning Resources
              </h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                {videos.map((video) => (
                  <a
                    key={video.id}
                    href={`https://www.youtube.com/watch?v=${video.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block rounded-lg overflow-hidden bg-background border border-border hover:border-primary/50 transition-all hover:glow-primary"
                  >
                    <div className="relative aspect-video">
                      <img 
                        src={video.thumbnail} 
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Youtube className="h-12 w-12 text-white" />
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium line-clamp-2 mb-1">{video.title}</h3>
                      <p className="text-sm text-muted-foreground">{video.channelTitle}</p>
                    </div>
                  </a>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dream;
