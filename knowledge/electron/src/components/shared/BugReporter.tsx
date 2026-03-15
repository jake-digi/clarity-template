
import React, { useState, useEffect, useRef } from 'react';
import {
    Bug,
    MousePointer2,
    Video,
    X,
    Send,
    Check,
    MessageSquare,
    Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export function BugReporter() {
    const [isOpen, setIsOpen] = useState(false);
    const [isSelecting, setIsSelecting] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [comment, setComment] = useState('');
    const [selectedElement, setSelectedElement] = useState<string | null>(null);
    const [elementText, setElementText] = useState<string | null>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    // Mock "Selection" effect
    useEffect(() => {
        if (!isSelecting) return;

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest('.bug-reporter-ui')) return;

            target.style.outline = '2px solid hsl(var(--primary))';
            target.style.outlineOffset = '2px';
            target.style.cursor = 'crosshair';
        };

        const handleMouseOut = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            target.style.outline = '';
            target.style.outlineOffset = '';
            target.style.cursor = '';
        };

        const handleClick = (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();

            const target = e.target as HTMLElement;
            if (target.closest('.bug-reporter-ui')) return;

            const selector = target.tagName.toLowerCase() +
                (target.id ? `#${target.id}` : '') +
                (target.className ? `.${target.className.split(' ').join('.')}` : '');

            setSelectedElement(selector);
            setElementText(target.innerText.slice(0, 50) + (target.innerText.length > 50 ? '...' : ''));
            setIsSelecting(false);
            setIsOpen(true);

            // Cleanup outlines
            document.querySelectorAll('*').forEach((el) => {
                (el as HTMLElement).style.outline = '';
                (el as HTMLElement).style.cursor = '';
            });
        };

        document.addEventListener('mouseover', handleMouseOver);
        document.addEventListener('mouseout', handleMouseOut);
        document.addEventListener('click', handleClick, true);

        return () => {
            document.removeEventListener('mouseover', handleMouseOver);
            document.removeEventListener('mouseout', handleMouseOut);
            document.removeEventListener('click', handleClick, true);
        };
    }, [isSelecting]);

    const handleReport = () => {
        console.log('Reporting bug:', {
            page: window.location.pathname,
            element: selectedElement,
            comment,
            recording: isRecording
        });
        setIsOpen(false);
        setComment('');
        setSelectedElement(null);
        setIsRecording(false);
    };

    return (
        <>
            {/* Exposed global trigger or managed via custom event */}
            <div id="bug-report-trigger-target" className="hidden" onClick={() => setIsOpen(true)} />

            {/* Selection HUD */}
            {isSelecting && (
                <div className="fixed inset-0 z-[9999] pointer-events-none cursor-crosshair">
                    <div className="bug-reporter-ui absolute top-6 left-1/2 -translate-x-1/2 bg-slate-950 text-white px-4 py-2 rounded-none border border-white/20 shadow-2xl flex items-center gap-3 pointer-events-auto">
                        <Target className="w-4 h-4 text-primary animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-wider">Select an element to inspect</span>
                        <button
                            onClick={() => setIsSelecting(false)}
                            className="ml-2 p-1 hover:bg-white/10"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            )}

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[550px] w-[95vw] rounded-none border-border bg-card p-0 gap-0 bug-reporter-ui overflow-hidden shadow-2xl">
                    <DialogHeader className="p-8 pb-4 bg-muted/20 border-b border-border">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <DialogTitle className="flex items-center gap-2 text-xl font-semibold tracking-tight">
                                    <Bug className="w-5 h-5 text-primary/80" />
                                    Report a Bug
                                </DialogTitle>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold opacity-50">
                                    Diagnostic Tooling
                                </p>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                        <div className="space-y-2">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <div className="w-1 h-1 bg-primary/40" />
                                Active Route
                            </label>
                            <div className="p-3 bg-muted/30 border border-border text-[11px] font-mono text-muted-foreground break-all leading-relaxed">
                                {window.location.href}
                            </div>
                        </div>

                        {selectedElement && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <div className="w-1 h-1 bg-primary/40" />
                                    Inspected Element
                                </label>
                                <div className="p-4 border border-primary/20 bg-primary/5 rounded-none flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[10px] font-mono text-primary break-all leading-normal mb-2 bg-primary/10 px-1.5 py-0.5 inline-block">
                                            {selectedElement}
                                        </div>
                                        <div className="text-xs text-foreground font-medium leading-relaxed italic border-l-2 border-primary/20 pl-3">
                                            "{elementText}"
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedElement(null)}
                                        className="shrink-0 p-1 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setIsOpen(false);
                                    setIsSelecting(true);
                                }}
                                className="rounded-none h-11 text-[12px] font-medium gap-3 border-border hover:bg-accent hover:text-accent-foreground transition-all"
                            >
                                <MousePointer2 className="w-4 h-4" />
                                Select component on page
                            </Button>
                            <Button
                                variant={isRecording ? "destructive" : "outline"}
                                size="sm"
                                onClick={() => setIsRecording(!isRecording)}
                                className={cn(
                                    "rounded-none h-11 text-[12px] font-medium gap-3 border-border transition-all",
                                    isRecording && "animate-pulse"
                                )}
                            >
                                <Video className="w-4 h-4" />
                                {isRecording ? "Stop capture" : "Capture screen workflow"}
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <div className="w-1 h-1 bg-primary/40" />
                                Observation
                            </label>
                            <Textarea
                                placeholder="What's not working as expected?"
                                className="min-h-[120px] rounded-none border-border resize-none text-sm focus-visible:ring-primary p-4 leading-relaxed bg-background/50"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter className="p-6 px-8 bg-muted/20 border-t border-border mt-0 sm:justify-between items-center">
                        <div className="hidden sm:block text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                            Checkpoint. Internal Diagnostic v1.0.4
                        </div>
                        <div className="flex gap-3 w-full sm:w-auto">
                            <Button
                                variant="ghost"
                                onClick={() => setIsOpen(false)}
                                className="flex-1 sm:flex-none rounded-none text-xs h-10 px-6 font-medium border border-transparent hover:border-border hover:bg-transparent"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleReport}
                                disabled={!comment && !selectedElement}
                                className="flex-1 sm:flex-none rounded-none text-xs h-10 px-8 font-semibold gap-2 shadow-lg transition-all"
                            >
                                <Send className="w-3.5 h-3.5" />
                                Submit Report
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
