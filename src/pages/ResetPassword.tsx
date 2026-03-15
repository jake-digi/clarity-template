import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import checkpointLogo from "@/assets/checkpoint-logo.png";
import jlgbLogo from "@/assets/jlgb-logo.png";
import loginHero from "@/assets/login-hero.jpg";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated", description: "You can now sign in with your new password." });
      navigate("/login");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-muted flex">
      <div className="w-full bg-background flex min-h-screen">
        {/* Left panel – hero image */}
        <div className="hidden md:flex md:w-5/12 relative">
          <img
            src={loginHero}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute top-6 left-6 flex items-center gap-2">
            <img src={checkpointLogo} alt="Checkpoint" className="h-14 brightness-0 invert" />
          </div>
        </div>

        <div className="flex-1 flex flex-col py-12 max-w-md mx-auto w-full">
          <div className="flex-1 flex flex-col justify-center px-6 sm:px-8">
            {/* Mobile logos */}
            <div className="md:hidden mb-8 flex items-center gap-3">
              <img src={checkpointLogo} alt="Checkpoint" className="h-10" />
              <div className="h-6 w-px bg-border" />
              <img src={jlgbLogo} alt="JLGB" className="h-8" />
            </div>

            <h1 className="text-2xl font-bold text-foreground">
              Set your password
            </h1>
            <p className="mt-1 text-sm text-muted-foreground mb-8">
              You've been invited to Checkpoint. Enter your new password below to get started.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="h-11 rounded-none"
                />
              </div>
              <Button type="submit" className="w-full h-11 gap-2" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Set password & sign in
              </Button>
            </form>
          </div>

          <div className="px-6 sm:px-8 pb-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <img src={checkpointLogo} alt="" className="h-5 opacity-70" />
            <span>·</span>
            <img src={jlgbLogo} alt="" className="h-4 opacity-70" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
