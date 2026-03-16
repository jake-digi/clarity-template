import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Token-hash flow — used when clicking the invite email link directly
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const [verifying, setVerifying] = useState(!!tokenHash);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(!tokenHash);

  useEffect(() => {
    if (!tokenHash) return;
    const verify = async () => {
      setVerifying(true);
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: (type as any) ?? "recovery",
      });
      if (error) {
        setVerifyError(error.message);
      } else {
        setSessionReady(true);
      }
      setVerifying(false);
    };
    verify();
  }, [tokenHash, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password set", description: "You can now sign in with your new password." });
      navigate("/login");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#c8102e] mb-4">
            <span className="text-white font-bold text-xl">F</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Freemans Industrial Supplies
          </h1>
          <p className="text-sm text-gray-500 mt-1">Ordering Platform</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          {/* Verifying token */}
          {verifying && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#c8102e]" />
              <p className="text-sm text-gray-600">Verifying your invite link…</p>
            </div>
          )}

          {/* Token verify error */}
          {!verifying && verifyError && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Invalid or expired link</p>
                <p className="text-sm text-gray-500 mt-1">{verifyError}</p>
              </div>
              <Button variant="outline" onClick={() => navigate("/login")}>
                Back to sign in
              </Button>
            </div>
          )}

          {/* Password form */}
          {!verifying && sessionReady && !verifyError && (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Set your password</h2>
              <p className="text-sm text-gray-500 mb-6">
                Choose a password to access your account.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password">Confirm password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#c8102e] hover:bg-[#9b0d23] text-white"
                  disabled={loading}
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Set password &amp; sign in
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          &copy; {new Date().getFullYear()} Freemans Industrial Supplies Ltd
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
