import { Sparkles, Brain, ArrowRight, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AISearchResultProps {
    query: string;
    onClose: () => void;
}

export function AISearchResult({ query, onClose }: AISearchResultProps) {
    const overdueTasks = [
        { task: "Design custom end effector", proj: "BASE-SANDING", time: "4d", owner: "Jason Barker", color: "bg-blue-600" },
        { task: "Source pneumatic components", proj: "SDM-PROJ-V2", time: "2d", owner: "Tom Wilson", color: "bg-amber-600" },
        { task: "Review supplier quotes", proj: "BASE-SANDING", time: "1d", owner: "Sarah Chen", color: "bg-emerald-500" }
    ];

    return (
        <div className="flex flex-col animate-in fade-in duration-200">
            {/* Context Line */}
            <div className="px-5 py-3 border-b border-border/40 bg-primary/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Checkpoint. Intelligence</span>
                </div>
                <span className="text-[10px] font-medium text-emerald-600/70 italic">Cross-referenced 12 active projects</span>
            </div>

            <div className="p-5 space-y-6">
                {/* Summary */}
                <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest">AI Analysis</div>
                    <p className="text-[13px] text-foreground font-medium leading-normal">
                        I've identified <span className="text-red-500 font-bold">3 critical bottlenecks</span> affecting project delivery timelines. The <span className="text-primary font-mono text-[12px]">Base Sanding</span> project is currently at risk.
                    </p>
                </div>

                {/* Task List */}
                <div className="space-y-1">
                    <div className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mb-2 px-1">Priority Tasks</div>
                    {overdueTasks.map((t, i) => (
                        <div key={i} className="group flex items-center justify-between p-2.5 hover:bg-muted/50 rounded-sm transition-colors border border-transparent hover:border-border/50">
                            <div className="flex items-center gap-3">
                                <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", i === 0 ? "bg-red-500" : "bg-amber-500")} />
                                <div className="space-y-0.5">
                                    <div className="text-[12px] font-bold text-foreground leading-none">{t.task}</div>
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                        <span className="font-mono text-[9px] opacity-70 tracking-tight">{t.proj}</span>
                                        <span className="opacity-20">•</span>
                                        <span className="font-bold text-red-500/80">{t.time} overdue</span>
                                        <span className="opacity-20">•</span>
                                        <span>{t.owner}</span>
                                    </div>
                                </div>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/20 group-hover:text-primary transition-colors" />
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-border/40 flex items-center justify-between">
                    <div className="text-[10px] font-medium text-muted-foreground/60 italic flex items-center gap-1.5">
                        <Brain className="w-3 h-3" />
                        Next step: Review resource allocation in Base Sanding
                    </div>
                    <Button onClick={onClose} variant="ghost" className="h-7 text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/5 px-2">
                        View Full Report
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

export function AISearchThinking() {
    return (
        <div className="p-16 flex flex-col items-center justify-center gap-5">
            <div className="relative">
                <div className="w-10 h-10 rounded-full border-2 border-primary/10 border-t-primary animate-spin" />
                <Sparkles className="absolute inset-0 m-auto w-4 h-4 text-primary animate-pulse" />
            </div>
            <div className="text-center space-y-1">
                <div className="text-[11px] font-bold text-foreground uppercase tracking-[0.2em]">Consulting Agent</div>
                <div className="text-[10px] text-muted-foreground font-medium italic opacity-60">Synthesizing project timelines...</div>
            </div>
        </div>
    );
}
