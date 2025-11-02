import { useState } from "react";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getSafeErrorMessage } from "@/lib/error-utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

type ChatMode = "motivation" | "jokes" | "coaching";

const Buddy = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hey there, dreamer! 👋 I'm your AI Buddy, here to keep you motivated, crack jokes, and help you crush those habits! What's on your mind?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<ChatMode>("motivation");
  const { toast } = useToast();

  const getModePrompt = (mode: ChatMode) => {
    switch (mode) {
      case "motivation":
        return "You are an enthusiastic motivational coach helping users achieve their dreams through daily habits. Be highly energetic, inspiring, and use plenty of emojis! Push users to take action and believe in themselves. Keep responses concise and actionable.";
      case "jokes":
        return "You are a funny, witty AI buddy who loves making jokes and keeping things light-hearted. Use humor, puns, and playful banter while still being supportive about habits and goals. Keep responses entertaining and brief.";
      case "coaching":
        return "You are a strategic life coach providing thoughtful, analytical advice on building habits and achieving goals. Be professional yet warm, focus on actionable strategies and frameworks. Keep responses clear and structured.";
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { 
          messages: [
            {
              role: "system",
              content: getModePrompt(mode)
            },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: input }
          ]
        }
      });

      if (error) throw error;

      const aiMessage: Message = {
        role: "assistant",
        content: data.choices[0].message.content,
      };
      
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      console.error('Chat error:', error);
      toast({
        title: "Error",
        description: getSafeErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold">
              Your <span className="text-gradient">AI Buddy</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Motivation, coaching, and laughs - all in one place
            </p>
          </div>

          <Card className="p-6 bg-card border-border animate-slide-in">
            <div className="space-y-4 mb-4 h-[500px] overflow-y-auto">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl ${
                      message.role === "user"
                        ? "gradient-primary text-white glow-primary"
                        : "bg-background border border-border"
                    }`}
                  >
                    <p className="text-sm md:text-base">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                className="bg-background border-border"
              />
              <Button
                onClick={sendMessage}
                variant="accent"
                disabled={isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          <div className="grid md:grid-cols-3 gap-4">
            <Button
              variant={mode === "motivation" ? "default" : "outline"}
              onClick={() => setMode("motivation")}
              className="p-6 h-auto flex flex-col items-start gap-2 hover:border-primary/50 hover:glow-primary"
            >
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-semibold">Motivation Mode</span>
              <span className="text-sm text-muted-foreground">Get pumped up!</span>
            </Button>

            <Button
              variant={mode === "jokes" ? "default" : "outline"}
              onClick={() => setMode("jokes")}
              className="p-6 h-auto flex flex-col items-start gap-2 hover:border-accent/50 hover:glow-accent"
            >
              <Sparkles className="h-5 w-5 text-accent" />
              <span className="font-semibold">Jokes Mode</span>
              <span className="text-sm text-muted-foreground">Need a laugh?</span>
            </Button>

            <Button
              variant={mode === "coaching" ? "default" : "outline"}
              onClick={() => setMode("coaching")}
              className="p-6 h-auto flex flex-col items-start gap-2 hover:border-primary/50 hover:glow-primary"
            >
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-semibold">Coaching Mode</span>
              <span className="text-sm text-muted-foreground">Strategic advice</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Buddy;
