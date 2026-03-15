import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/components/auth-provider";
import { Navigate } from "react-router-dom";
import { Loader2, Mail, Lock } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
    const { login, isAuthenticated, isLoading } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    const handleNativeLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error("Please fill in all fields");
            return;
        }
        try {
            await login('native', { email, password });
            // Success toast handled in auth provider
        } catch (error) {
            // Error toast handled in auth provider
        }
    };

    const handleMicrosoftLogin = async () => {
        try {
            await login('microsoft');
            // Toast handled in auth provider
        } catch (error) {
            // Error toast handled in auth provider
        }
    };

    return (
        <div className="min-h-screen w-full flex">
            {/* Left Decoration Side */}
            <div className="hidden lg:flex w-1/2 bg-[#18181b] relative overflow-hidden flex-col justify-between p-12 text-white">
                <div className="absolute inset-0 bg-dot-pattern opacity-10 pointer-events-none" />
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-black/20 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3" />

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-6">
                        {/* <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center border border-white/20">
                            <div className="w-4 h-4 bg-white rounded-sm transform rotate-45" />
                        </div> */}
                        <span className="text-xl font-bold tracking-tight">Checkpoint<span className="text-primary">.</span></span>
                    </div>
                    {/* <h1 className="text-4xl font-bold leading-tight max-w-md">
                        Enterprise resource planning, perfected.
                    </h1> */}
                </div>

                <div className="relative z-10 space-y-6">
                    {/* <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-lg max-w-sm">
                        <p className="text-sm/relaxed opacity-90">
                            "This platform has completely transformed how we handle our CNC workflows. The precision is unmatched."
                        </p>
                        <div className="mt-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500" />
                            <div>
                                <div className="text-sm font-semibold">Alex Chen</div>
                                <div className="text-xs opacity-70">Production Manager</div>
                            </div>
                        </div>
                    </div> */}
                    <p className="text-xs opacity-50">© 2026 Bridge Digital</p>
                </div>
            </div>

            {/* Right Login Form Side */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background">
                <div className="w-full max-w-[400px] space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight">Sign in to your account</h2>
                        <p className="text-sm text-muted-foreground">
                            Enter your details below to access your workspace
                        </p>
                    </div>

                    <div className="grid gap-6">
                        {/* Microsoft Login Button */}
                        <Button
                            variant="outline"
                            className="h-12 relative overflow-hidden group hover:border-primary/50 hover:bg-accent/50 transition-all duration-300"
                            onClick={handleMicrosoftLogin}
                            disabled={isLoading}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                            <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21">
                                <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                                <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                                <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                                <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
                            </svg>
                            {isLoading ? "Connecting..." : "Sign in with Microsoft 365"}
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    Or continue with
                                </span>
                            </div>
                        </div>

                        <form onSubmit={handleNativeLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        id="email"
                                        placeholder="name@example.com"
                                        type="email"
                                        autoCapitalize="none"
                                        autoComplete="email"
                                        autoCorrect="off"
                                        className="pl-9 h-11 transition-all focus-visible:ring-primary/20"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    <a href="#" className="text-xs font-medium text-primary hover:underline">
                                        Forgot password?
                                    </a>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        id="password"
                                        type="password"
                                        className="pl-9 h-11 transition-all focus-visible:ring-primary/20"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full h-11 font-medium bg-primary hover:bg-primary/90 text-white" disabled={isLoading}>
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    "Sign In"
                                )}
                            </Button>
                        </form>
                    </div>

                    <p className="px-8 text-center text-sm text-muted-foreground">
                        Don't have an account?{" "}
                        <a href="#" className="underline underline-offset-4 hover:text-primary transition-colors">
                            Contact Admin
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
