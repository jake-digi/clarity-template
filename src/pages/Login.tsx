import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import checkpointLogo from "@/assets/checkpoint-logo.png";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "reset">("login");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    } else {
      navigate("/");
    }
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Check your email", description: "We've sent you a password reset link." });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo & Title */}
        <div className="text-center space-y-4">
          <img src={checkpointLogo} alt="CheckPoint" className="h-24 mx-auto" />
          <p className="text-sm text-muted-foreground">
            {mode === "login" ? "Sign in to your account" : "Reset your password"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={mode === "login" ? handleLogin : handleResetPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {mode === "login" && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          )}

          <Button type="submit" className="w-full gap-2 bg-[hsl(var(--checkpoint-green))] hover:bg-[hsl(var(--checkpoint-green))]/90 text-white" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            {mode === "login" ? "Sign in" : "Send reset link"}
          </Button>
        </form>

        {/* Toggle */}
        <div className="text-center">
          {mode === "login" ? (
            <button
              onClick={() => setMode("reset")}
              className="text-sm text-[hsl(var(--checkpoint-green))] hover:underline"
            >
              Forgot your password?
            </button>
          ) : (
            <button
              onClick={() => setMode("login")}
              className="text-sm text-[hsl(var(--checkpoint-green))] hover:underline"
            >
              Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
