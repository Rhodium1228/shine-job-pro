import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GradientButton } from "@/components/ui/button-variants";
import { Sparkles, Lock, Mail } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate login
    setTimeout(() => {
      if (email && password) {
        toast.success("Welcome back!");
        navigate("/dashboard");
      } else {
        toast.error("Please enter your credentials");
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-primary">
      <div className="w-full max-w-md animate-scale-in">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm mb-4 animate-pulse-glow">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">BMS Pro</h1>
          <p className="text-white/80 text-lg">Staff App</p>
        </div>

        {/* Login Card */}
        <div className="glass-card rounded-3xl p-8 animate-slide-up">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-background/50 border-border/50"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 bg-background/50 border-border/50"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <a href="#" className="text-primary hover:text-primary/80 transition-colors">
                Forgot password?
              </a>
            </div>

            <GradientButton
              type="submit"
              variant="primary"
              className="w-full h-12 text-lg"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Sign In"}
            </GradientButton>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Need help? Contact your admin</p>
          </div>
        </div>

        <div className="mt-4 text-center text-white/60 text-sm">
          <p>© 2024 BMS Pro. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
