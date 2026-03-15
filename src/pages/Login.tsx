import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import checkpointLogo from "@/assets/checkpoint-logo.png";
import loginHero from "@/assets/login-hero.jpg";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [m365Loading, setM365Loading] = useState(false);
  const [remember, setRemember] = useState(true);
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

  const handleMicrosoft365 = async () => {
    setM365Loading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: {
        scopes: "email profile openid",
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    }
    setM365Loading(false);
  };

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-4xl bg-background rounded-2xl shadow-xl overflow-hidden flex min-h-[600px]">
        {/* Left panel – hero image */}
        <div className="hidden md:flex md:w-5/12 relative">
          <img
            src={loginHero}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          {/* logo */}
          <div className="absolute top-6 left-6 flex items-center gap-2">
            <img src={checkpointLogo} alt="Checkpoint" className="h-8 brightness-0 invert" />
          </div>
          {/* testimonial */}
          <div className="absolute bottom-8 left-6 right-6 text-white">
            <p className="text-lg font-semibold leading-snug mb-3">
              "Simply all the tools that my team and I need."
            </p>
            <p className="text-sm font-medium">Sarah Cohen</p>
            <p className="text-xs text-white/70">Director of Operations</p>
          </div>
        </div>

        {/* Right panel – form */}
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-14 py-12">
          {/* Mobile logo */}
          <div className="md:hidden mb-8">
            <img src={checkpointLogo} alt="Checkpoint" className="h-10" />
          </div>

          <h1 className="text-2xl font-bold text-foreground">
            {mode === "login" ? "Welcome back to Checkpoint" : "Reset your password"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground mb-8">
            {mode === "login"
              ? "Manage your operations effortlessly."
              : "Enter your email to receive a reset link."}
          </p>

          <form
            onSubmit={mode === "login" ? handleLogin : handleResetPassword}
            className="space-y-5"
          >
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@organisation.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-11"
              />
            </div>

            {mode === "login" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="h-11"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setMode("reset")}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Remember me</span>
                    <Switch checked={remember} onCheckedChange={setRemember} />
                  </div>
                </div>
              </>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold"
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {mode === "login" ? "Log in" : "Send reset link"}
            </Button>
          </form>

          {mode === "login" && (
            <>
              {/* Divider */}
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <Button
                variant="outline"
                className="w-full h-11 text-sm font-medium gap-3"
                onClick={handleMicrosoft365}
                disabled={m365Loading}
              >
                {m365Loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
                    <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                    <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                    <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                    <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
                  </svg>
                )}
                Continue with Microsoft 365
              </Button>
            </>
          )}

          {mode === "reset" && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setMode("login")}
                className="text-sm font-medium text-primary hover:underline"
              >
                Back to sign in
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
