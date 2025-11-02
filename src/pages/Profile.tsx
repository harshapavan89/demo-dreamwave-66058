import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Settings, Trophy, LogOut, Mail } from "lucide-react";
import { getSafeErrorMessage } from "@/lib/error-utils";

const Profile = () => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('email_notifications_enabled, full_name')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setEmailNotifications(profile?.email_notifications_enabled ?? true);
      setUserName(profile?.full_name || "");
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailNotificationToggle = async (enabled: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ email_notifications_enabled: enabled })
        .eq('id', user.id);

      if (error) throw error;

      setEmailNotifications(enabled);
      toast({
        title: enabled ? "Email notifications enabled" : "Email notifications disabled",
        description: enabled 
          ? "You'll receive reminders for incomplete tasks" 
          : "You won't receive task reminder emails",
      });
    } catch (error: any) {
      console.error('Error updating notification preference:', error);
      toast({
        title: "Error",
        description: getSafeErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error: any) {
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

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4 animate-fade-in">
            <div className="w-24 h-24 mx-auto rounded-full gradient-primary glow-primary flex items-center justify-center">
              <User className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">Your Profile</h1>
            <p className="text-xl text-muted-foreground">Manage your account and preferences</p>
          </div>

          <Card className="p-8 bg-card border-border animate-slide-in">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">Account Settings</h2>
                <div className="space-y-6">
                  
                  {/* Email Notifications Toggle */}
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-start gap-3 flex-1">
                      <Mail className="h-5 w-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <Label htmlFor="email-notifications" className="text-base font-semibold cursor-pointer">
                          Email Notifications
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Receive funny AI-generated reminders for incomplete tasks
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={emailNotifications}
                      onCheckedChange={handleEmailNotificationToggle}
                    />
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left"
                    onClick={() => navigate("/notification-settings")}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Notification Settings
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left"
                    onClick={() => navigate("/notification-history")}
                  >
                    <Trophy className="mr-2 h-4 w-4" />
                    Notification History
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left text-destructive hover:text-destructive"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
