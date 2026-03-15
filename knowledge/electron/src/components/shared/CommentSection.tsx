
import React, { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, MessageSquare, AtSign, Terminal, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export interface Comment {
    id: string;
    user: string;
    avatar?: string;
    content: string;
    timestamp: Date;
}

interface CommentSectionProps {
    comments: Comment[];
    onAddComment: (content: string) => void;
    className?: string;
}

const MOCK_USERS = [
    { name: "Jason Barker", role: "Project Lead" },
    { name: "Sarah Chen", role: "Technical Designer" },
    { name: "Tom Wilson", role: "Mechanical Engineer" },
    { name: "Mike Johnson", role: "Electrical Engineer" },
    { name: "Madina Barker", role: "Product Owner" },
];

const MOCK_COMMANDS = [
    { cmd: "status", desc: "Update task status" },
    { cmd: "priority", desc: "Change task priority" },
    { cmd: "assign", desc: "Reassign task" },
    { cmd: "logged", desc: "Log time spent" },
    { cmd: "help", desc: "View all commands" },
];

export function CommentSection({ comments, onAddComment, className }: CommentSectionProps) {
    const [newComment, setNewComment] = useState("");
    const [showMentions, setShowMentions] = useState(false);
    const [showCommands, setShowCommands] = useState(false);
    const [cursorPosition, setCursorPosition] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new comments arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [comments]);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        const pos = e.target.selectionStart;
        setNewComment(value);
        setCursorPosition(pos);

        const lastChar = value.slice(pos - 1, pos);
        if (lastChar === '@') {
            setShowMentions(true);
            setShowCommands(false);
        } else if (lastChar === '/') {
            setShowCommands(true);
            setShowMentions(false);
        } else if (lastChar === ' ' || value === '') {
            setShowMentions(false);
            setShowCommands(false);
        }
    };

    const insertMention = (name: string) => {
        const before = newComment.slice(0, cursorPosition);
        const after = newComment.slice(cursorPosition);
        setNewComment(`${before}${name} ${after}`);
        setShowMentions(false);
        textareaRef.current?.focus();
    };

    const insertCommand = (cmd: string) => {
        const before = newComment.slice(0, cursorPosition);
        const after = newComment.slice(cursorPosition);
        setNewComment(`${before}${cmd} ${after}`);
        setShowCommands(false);
        textareaRef.current?.focus();
    };

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (newComment.trim()) {
            onAddComment(newComment);
            setNewComment("");
            setShowMentions(false);
            setShowCommands(false);
        }
    };

    return (
        <div className={cn("flex flex-col h-full bg-card relative", className)}>
            {/* Header */}
            <div className="flex-none p-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold tracking-tight text-foreground">Activity & Comments</h3>
                </div>
            </div>

            {/* Scrollable Comment List */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scroll-smooth">
                {comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 space-y-2">
                        <MessageSquare className="w-8 h-8" />
                        <p className="text-xs font-medium tracking-wider">No comments yet</p>
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3 items-start group">
                            <Avatar className="h-8 w-8 rounded-none border border-border shrink-0">
                                {comment.avatar && <AvatarImage src={comment.avatar} alt={comment.user} />}
                                <AvatarFallback className="rounded-none bg-primary/10 text-primary text-[10px] font-bold uppercase">
                                    {comment.user.split(" ").map(n => n[0]).join("")}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-foreground">{comment.user}</span>
                                    <span className="text-[10px] text-muted-foreground font-medium uppercase">
                                        {format(comment.timestamp, "MMM dd, HH:mm")}
                                    </span>
                                </div>
                                <div className="p-3 bg-accent/30 border border-border/50 text-xs text-foreground leading-relaxed">
                                    {comment.content.split(' ').map((word, i) => (
                                        <React.Fragment key={i}>
                                            {word.startsWith('@') ? <span className="text-primary font-bold">{word}</span> :
                                                word.startsWith('/') ? <span className="font-mono text-primary font-bold">{word}</span> :
                                                    word}
                                            {' '}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Fixed Bottom Input Area */}
            <div className="flex-none p-4 border-t border-border bg-background relative">
                {/* Repositioned Suggestion Popovers */}
                {showMentions && (
                    <div className="absolute bottom-full left-0 right-0 bg-popover border-t border-border shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.2)] z-50 animate-in slide-in-from-bottom-2">
                        <div className="p-2 border-b border-border bg-muted/50 flex items-center gap-2">
                            <AtSign className="w-3 h-3 text-primary" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Mention Team Member</span>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                            {MOCK_USERS.map((user) => (
                                <button
                                    key={user.name}
                                    onClick={() => insertMention(user.name)}
                                    className="w-full text-left px-3 py-2 hover:bg-accent flex items-center gap-2 transition-colors border-b border-border/30 last:border-0"
                                >
                                    <div className="h-6 w-6 rounded-none bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                        {user.name.split(" ").map(n => n[0]).join("")}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-semibold">{user.name}</span>
                                        <span className="text-[9px] text-muted-foreground uppercase">{user.role}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {showCommands && (
                    <div className="absolute bottom-full left-0 right-0 bg-popover border-t border-border shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.2)] z-50 animate-in slide-in-from-bottom-2">
                        <div className="p-2 border-b border-border bg-muted/50 flex items-center gap-2">
                            <Terminal className="w-3 h-3 text-primary" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Quick Commands</span>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                            {MOCK_COMMANDS.map((cmd) => (
                                <button
                                    key={cmd.cmd}
                                    onClick={() => insertCommand(cmd.cmd)}
                                    className="w-full text-left px-3 py-2 hover:bg-accent group transition-colors border-b border-border/30 last:border-0"
                                >
                                    <div className="flex justify-between items-center mb-0.5">
                                        <span className="text-xs font-mono font-bold text-primary">/{cmd.cmd}</span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground">{cmd.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="relative">
                    <Textarea
                        ref={textareaRef}
                        placeholder="Add a comment... Type @ to mention or / for commands"
                        value={newComment}
                        onChange={handleTextChange}
                        className="min-h-[100px] resize-none text-xs rounded-none border-border focus-visible:ring-1 focus-visible:ring-primary pr-12 bg-muted/10 leading-relaxed"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey && !showMentions && !showCommands) {
                                e.preventDefault();
                                handleSubmit();
                            } else if (e.key === 'Escape') {
                                setShowMentions(false);
                                setShowCommands(false);
                            }
                        }}
                    />
                    <Button
                        type="submit"
                        size="sm"
                        disabled={!newComment.trim()}
                        className="absolute bottom-2 right-2 h-8 w-8 p-0 rounded-none bg-primary hover:bg-primary/90"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
                <div className="mt-2 flex items-center justify-between">
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowMentions(!showMentions)}
                            className={cn("text-[10px] font-bold uppercase flex items-center gap-1 transition-colors", showMentions ? "text-primary" : "text-muted-foreground hover:text-foreground")}
                        >
                            <AtSign className="w-3 h-3" /> Mention
                        </button>
                        <button
                            onClick={() => setShowCommands(!showCommands)}
                            className={cn("text-[10px] font-bold uppercase flex items-center gap-1 transition-colors", showCommands ? "text-primary" : "text-muted-foreground hover:text-foreground")}
                        >
                            <Terminal className="w-3 h-3" /> Command
                        </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground italic">
                        <span className="font-bold">Enter</span> to post
                    </p>
                </div>
            </div>
        </div>
    );
}
