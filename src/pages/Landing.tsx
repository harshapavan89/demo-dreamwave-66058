import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Target, TrendingUp, Zap } from "lucide-react";
import Navigation from "@/components/Navigation";
const Landing = () => {
  return <div className="min-h-screen">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-20"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" style={{
        animationDelay: "2s"
      }}></div>
        
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 animate-fade-in">
              
              
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold animate-fade-in" style={{
            animationDelay: "0.1s"
          }}>
              Turn Your <span className="text-gradient">Dreams</span> Into
              <br />
              Daily Digital <span className="text-gradient">Habits</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{
            animationDelay: "0.2s"
          }}>
              AI-powered habit formation with humor, motivation, and real results. 
              Transform your goals into achievable daily routines.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{
            animationDelay: "0.3s"
          }}>
              <Link to="/dream">
                <Button size="lg" variant="hero" className="text-lg px-8">
                  <Target className="mr-2 h-5 w-5" />
                  Start Your Dream
                </Button>
              </Link>
              <Link to="/marketplace">
                <Button size="lg" variant="outline" className="border-primary/50 hover:bg-primary/10 text-lg px-8">
                  Explore Marketplace
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all hover:glow-primary animate-slide-in">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 glow-primary">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">AI-Powered Plans</h3>
              <p className="text-muted-foreground">
                Our AI analyzes your dreams and creates personalized daily habits that actually work for your lifestyle.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all hover:glow-primary animate-slide-in" style={{
            animationDelay: "0.1s"
          }}>
              <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center mb-4 glow-accent">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Track Progress</h3>
              <p className="text-muted-foreground">
                Visualize your journey with beautiful graphs, earn XP, collect badges, and maintain streaks.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all hover:glow-primary animate-slide-in" style={{
            animationDelay: "0.2s"
          }}>
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 glow-primary">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Stay Motivated</h3>
              <p className="text-muted-foreground">
                Chat with your AI buddy for motivation, jokes, and coaching. Never face your habits alone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="max-w-3xl mx-auto text-center p-12 rounded-3xl gradient-hero glow-primary">
            <h2 className="text-4xl font-bold mb-4 text-white">Ready to Transform Your Life?</h2>
            <p className="text-white/90 text-lg mb-8">
              Join thousands of dreamers turning their aspirations into achievements.
            </p>
            <Link to="/dream">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 text-lg px-8">
                Get Started Free
                <Sparkles className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>;
};
export default Landing;