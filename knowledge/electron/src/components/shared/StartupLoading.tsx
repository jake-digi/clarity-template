import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface StartupLoadingProps {
    onLoadingComplete?: () => void;
    minDuration?: number;
}

const StartupLoading = ({ onLoadingComplete, minDuration = 1800 }: StartupLoadingProps) => {
    const [isVisible, setIsVisible] = useState(true);
    const [isExiting, setIsExiting] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Simulate initial loading progress
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                // Organic progress steps
                const diff = Math.random() * 20;
                return Math.min(prev + diff, 100);
            });
        }, 120);

        // COMMENTED OUT FOR DEBUGGING/STYLING - Screen will stay static

        const timer = setTimeout(() => {
            setIsExiting(true);
            const exitTimer = setTimeout(() => {
                setIsVisible(false);
                if (onLoadingComplete) onLoadingComplete();
            }, 500);
            return () => clearTimeout(exitTimer);
        }, minDuration);

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };

    }, [minDuration, onLoadingComplete]);

    if (!isVisible) return null;

    return (
        <div
            className={cn(
                "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background text-foreground transition-all duration-500 ease-in-out",
                isExiting ? "opacity-0 scale-[0.98] pointer-events-none" : "opacity-100 scale-100"
            )}
        >
            {/* Background Subtle Pattern - Matching Index.tsx bg-dot-pattern */}
            <div className="absolute inset-0 bg-dot-pattern opacity-40 pointer-events-none" />

            <div className="relative flex flex-col items-center gap-4 w-full max-w-md px-12">
                {/* Postman-style Logo/Branding */}
                <div className="flex flex-col items-center gap-8">
                    {/* Main Logo - Significantly enlarged for better branding */}
                    {/* <div className="relative h-56 w-56 flex items-center justify-center p-4">
                        <img src="/appicon.png" alt="Logo" className="w-full h-full object-contain pointer-events-none select-none" />
                    </div> */}

                    <div className="flex flex-col items-center">
                        <h1 className="text-[28px] font-bold tracking-tight text-foreground select-none">
                            Checkpoint<span className="text-primary">.</span>
                        </h1>
                        {/* <div className="flex items-center gap-2 mt-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#FF6C37] animate-pulse" />
                            {/* <p className="text-[#8C8C8C] text-[11px] font-bold uppercase tracking-[0.2em]">
                                System Initialization
                            </p>
                        </div> */}
                    </div>
                </div>

                {/* Progress System - Clean Postman Style */}
                <div className="w-full space-y-4">
                    <div className="h-[3px] w-full bg-secondary rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    <div className="flex justify-between items-center h-4">
                        <div className="flex items-center gap-2">
                            <Loader2 className="h-3 w-3 text-primary animate-spin" />
                            <span className="text-[11px] text-muted-foreground font-medium tracking-wide">
                                {progress < 30 ? 'Fetching collections...' : progress < 70 ? 'Preparing workspace...' : 'Handshaking...'}
                            </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground/70 font-mono tabular-nums">
                            {Math.round(progress)}%
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StartupLoading;
