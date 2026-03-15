import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/components/theme-provider";
import { useAccessibility } from "@/components/accessibility-provider";
import {
    ChevronRight,
    ChevronLeft,
    Check,
    Bell,
    Eye,
    LayoutDashboard,
    Briefcase,
    Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
    {
        id: "profile",
        title: "Setup your profile",
        description: "Personalize your identity and team assignment."
    },
    {
        id: "preferences",
        title: "Work Preferences",
        description: "Configure how you want to interact with Checkpoint.."
    },
    {
        id: "workspace",
        title: "Your Workspace",
        description: "Choose your primary focus area for the dashboard."
    },
    {
        id: "complete",
        title: "You're all set!",
        description: "Welcome to the future of CNC workflow management."
    }
];

const Onboarding = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const { user, completeOnboarding } = useAuth();
    const { theme, setTheme } = useTheme();
    const { highContrast, setHighContrast, reducedMotion, setReducedMotion } = useAccessibility();
    const navigate = useNavigate();

    // Form state
    const [name, setName] = useState(user?.name || "");
    const [role, setRole] = useState("");
    const [department, setDepartment] = useState("");
    const [notifications, setNotifications] = useState("mentions");
    const [defaultView, setDefaultView] = useState("dashboard");

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            completeOnboarding();
            navigate("/");
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const ProgressIndicator = () => (
        <div className="flex gap-2 mb-12">
            {steps.map((_, index) => (
                <div
                    key={index}
                    className={cn(
                        "h-1 rounded-full transition-all duration-500",
                        index <= currentStep ? "bg-primary w-8" : "bg-muted w-4"
                    )}
                />
            ))}
        </div>
    );

    return (
        <div className="min-h-screen w-full bg-background flex items-center justify-center p-6 overflow-hidden relative">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />

            <div className="w-full max-w-xl relative z-10">
                <ProgressIndicator />

                <div className="min-h-[480px] flex flex-col justify-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="space-y-6">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-3xl font-bold tracking-tight">
                                {steps[currentStep].title}
                            </h1>
                        </div>

                        <p className="text-lg text-muted-foreground max-w-[440px]">
                            {steps[currentStep].description}
                        </p>

                        <div className="py-6 space-y-6">
                            {currentStep === 0 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="space-y-2">
                                        <Label htmlFor="onboarding-name">Display Name</Label>
                                        <Input
                                            id="onboarding-name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Enter your name"
                                            className="h-12 bg-muted/40 border-border"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <Label>Role</Label>
                                            <div className="flex flex-col gap-2">
                                                {["Operator", "Manager", "Admin", "Engineer"].map((r) => (
                                                    <button
                                                        key={r}
                                                        onClick={() => setRole(r)}
                                                        className={cn(
                                                            "h-10 px-4 rounded-lg border text-sm font-medium transition-all text-left",
                                                            role === r ? "bg-primary border-primary text-primary-foreground" : "bg-muted/40 border-border"
                                                        )}
                                                    >
                                                        {r}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <Label>Department</Label>
                                            <div className="flex flex-col gap-2">
                                                {["Production", "Quality", "Maintenance", "Logistics"].map((d) => (
                                                    <button
                                                        key={d}
                                                        onClick={() => setDepartment(d)}
                                                        className={cn(
                                                            "h-10 px-4 rounded-lg border text-sm font-medium transition-all text-left",
                                                            department === d ? "bg-primary border-primary text-primary-foreground" : "bg-muted/40 border-border"
                                                        )}
                                                    >
                                                        {d}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 1 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="space-y-3">
                                        <Label>Appearance</Label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {["Light", "Dark", "System"].map((t) => (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => setTheme(t.toLowerCase() as any)}
                                                    className={cn(
                                                        "h-12 rounded-xl border text-sm font-medium transition-all",
                                                        theme === t.toLowerCase() ? "bg-primary/5 border-primary ring-1 ring-primary text-primary" : "bg-muted/40 border-border"
                                                    )}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border">
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <Eye size={14} className="text-primary" />
                                                    <Label className="text-sm font-semibold">High Contrast</Label>
                                                </div>
                                                <p className="text-xs text-muted-foreground text-pretty max-w-[200px]">Enhance visibility for critical data points.</p>
                                            </div>
                                            <Switch checked={highContrast} onCheckedChange={setHighContrast} />
                                        </div>

                                        <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border">
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <Zap size={14} className="text-primary" />
                                                    <Label className="text-sm font-semibold">Reduced Motion</Label>
                                                </div>
                                                <p className="text-xs text-muted-foreground text-pretty max-w-[200px]">Smooth out interface transitions.</p>
                                            </div>
                                            <Switch checked={reducedMotion} onCheckedChange={setReducedMotion} />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Bell size={16} className="text-primary" />
                                            <Label>Notifications</Label>
                                        </div>
                                        <div className="flex gap-2">
                                            {[
                                                { id: "all", label: "All Activity" },
                                                { id: "mentions", label: "Assignments Only" },
                                                { id: "critical", label: "Critical Only" }
                                            ].map((n) => (
                                                <button
                                                    key={n.id}
                                                    onClick={() => setNotifications(n.id)}
                                                    className={cn(
                                                        "flex-1 h-10 px-3 rounded-lg border text-xs font-medium transition-all",
                                                        notifications === n.id ? "bg-primary border-primary text-primary-foreground" : "bg-muted/40 border-border"
                                                    )}
                                                >
                                                    {n.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 2 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="grid grid-cols-1 gap-4">
                                        {[
                                            { id: "dashboard", label: "Overview Dashboard", desc: "Global metrics and system performance.", icon: LayoutDashboard },
                                            { id: "projects", label: "Active Projects", desc: "Detailed Gantt and task scheduling.", icon: Briefcase },
                                            { id: "resources", label: "Resource Planning", desc: "Machine and personnel allocation.", icon: Zap }
                                        ].map((v) => (
                                            <button
                                                key={v.id}
                                                onClick={() => setDefaultView(v.id)}
                                                className={cn(
                                                    "flex items-center gap-4 p-5 rounded-2xl border text-left transition-all",
                                                    defaultView === v.id ? "bg-primary/5 border-primary ring-1 ring-primary" : "bg-muted/40 border-border hover:bg-muted/60"
                                                )}
                                            >
                                                <div className={cn("p-2.5 rounded-xl border", defaultView === v.id ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground")}>
                                                    <v.icon size={20} />
                                                </div>
                                                <div>
                                                    <p className={cn("font-semibold", defaultView === v.id ? "text-primary" : "text-foreground")}>{v.label}</p>
                                                    <p className="text-xs text-muted-foreground">{v.desc}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {currentStep === 3 && (
                                <div className="bg-primary/5 border border-primary/10 p-8 rounded-3xl text-center space-y-4 animate-in zoom-in-95 duration-1000">
                                    <h3 className="text-2xl font-bold">You're ready to go!</h3>
                                    <p className="text-muted-foreground">
                                        Your workspace has been configured. Click below to launch your dashboard.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-8 mt-auto border-t border-border">
                        <Button
                            variant="ghost"
                            onClick={handleBack}
                            disabled={currentStep === 0}
                            className={cn(
                                "h-12 px-6 rounded-xl transition-all",
                                currentStep === 0 && "opacity-0"
                            )}
                        >
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                        <Button
                            onClick={handleNext}
                            className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all font-semibold"
                        >
                            {currentStep === steps.length - 1 ? (
                                "Explore Checkpoint."
                            ) : (
                                <>
                                    {currentStep === 0 ? "Get Started" : "Continue"}
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Logo at bottom */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-30">
                <span className="text-xl font-bold tracking-tight">Checkpoint<span className="text-primary">.</span></span>
            </div>
        </div>
    );
};

export default Onboarding;
