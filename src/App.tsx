import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Dream from "./pages/Dream";
import Dashboard from "./pages/Dashboard";
import Buddy from "./pages/Buddy";
import Marketplace from "./pages/Marketplace";
import Portal from "./pages/Portal";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import NotificationSettings from "./pages/NotificationSettings";
import NotificationHistory from "./pages/NotificationHistory";
import FloatingChatbot from "./components/FloatingChatbot";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dream" element={<Dream />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/buddy" element={<Buddy />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/portal" element={<Portal />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/notification-settings" element={<NotificationSettings />} />
            <Route path="/notification-history" element={<NotificationHistory />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <FloatingChatbot />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
