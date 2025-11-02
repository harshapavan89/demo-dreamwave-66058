import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { ArrowLeft, History, Mail, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

interface NotificationRecord {
  id: string;
  notification_type: string;
  sent_at: string;
  status: string;
  message_content: string | null;
  email: string | null;
}

export default function NotificationHistory() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<NotificationRecord[]>([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("notification_history")
        .select("*")
        .eq("user_id", user.id)
        .order("sent_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      task_reminder: "Task Reminder",
      daily_summary: "Daily Summary",
      weekly_progress: "Weekly Progress",
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/profile")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Profile
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Notification History
            </CardTitle>
            <CardDescription>
              View your past email notifications and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No notifications sent yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((record) => (
                  <div
                    key={record.id}
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            {getNotificationTypeLabel(record.notification_type)}
                          </h3>
                          {record.status === "sent" ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Sent to: {record.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(record.sent_at), "MMM dd, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          record.status === "sent"
                            ? "bg-green-500/10 text-green-500"
                            : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {record.status}
                      </span>
                    </div>
                    {record.message_content && (
                      <div className="mt-3 p-3 bg-muted rounded text-sm">
                        {record.message_content}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}