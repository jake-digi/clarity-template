import { useState } from 'react';
import { Users, Clock, AlertCircle, CheckCircle2, MoreVertical, Calendar, TrendingUp, LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TeamTable } from "./TeamTable";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { TeamMemberActivity } from "./TeamMemberActivity";
import { TeamMember, teamMembers } from "@/data/mockData-old";

const StatBox = ({ label, value, icon: Icon, color }: { label: string, value: string | number, icon: any, color: string }) => (
    <div className="flex flex-col gap-1 p-2.5 bg-muted/30 rounded-sm border border-border/40">
        <div className="flex items-center gap-1.5 text-muted-foreground/60">
            <Icon className="w-3 h-3" />
            <span className="text-[9px] font-bold uppercase tracking-[0.1em]">{label}</span>
        </div>
        <div className={cn("text-base font-bold tracking-tight", color)}>{value}</div>
    </div>
);

export function TeamGrid() {
    const [view, setView] = useState<'grid' | 'table'>('grid');
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

    return (
        <div className="w-full h-full flex flex-col bg-muted/40 overflow-hidden">
            {/* Header - Fixed */}
            <div className="flex items-end justify-between p-8 pb-6 bg-background/40 border-b border-border/40">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-foreground tracking-tight leading-none">Team Performance</h1>
                    <p className="text-xs font-medium text-muted-foreground/60">Resource management and time tracking across active projects.</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* View Switcher */}
                    <div className="flex items-center p-0.5 bg-muted/30 rounded-sm border border-border/50 mr-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setView('grid')}
                            className={cn(
                                "h-7 w-7 rounded-sm transition-all",
                                view === 'grid' ? "bg-background shadow-sm text-primary" : "text-muted-foreground/60 hover:text-foreground hover:bg-background/50"
                            )}
                        >
                            <LayoutGrid className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setView('table')}
                            className={cn(
                                "h-7 w-7 rounded-sm transition-all",
                                view === 'table' ? "bg-background shadow-sm text-primary" : "text-muted-foreground/60 hover:text-foreground hover:bg-background/50"
                            )}
                        >
                            <List className="w-3.5 h-3.5" />
                        </Button>
                    </div>

                    <Button variant="outline" className="h-8 text-[11px] font-bold uppercase tracking-wider bg-background rounded-sm border-border/60">
                        <Calendar className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                        This Month
                    </Button>
                    <Button className="h-8 text-[11px] font-bold uppercase tracking-wider bg-primary rounded-sm shadow-sm ring-1 ring-primary/20">
                        <TrendingUp className="w-3.5 h-3.5 mr-2" />
                        Efficiency Report
                    </Button>
                </div>
            </div>

            {/* Content Area - Scrollable */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
                {view === 'grid' ? (
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                        {teamMembers.map((member) => (
                            <Card key={member.id} className="group relative overflow-hidden border border-border/50 shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.04)] transition-all duration-300 bg-card rounded-sm">
                                {/* Status Accent - Postman style */}
                                <div className={cn("absolute top-0 left-0 w-[3px] h-full transition-all duration-300 group-hover:w-[4px]", member.color)} />

                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-3.5">
                                            <div className={cn("w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm", member.color)}>
                                                {member.initials}
                                            </div>
                                            <div>
                                                <h3 className="text-[15px] font-bold text-foreground leading-none mb-1.5 tracking-tight">{member.name}</h3>
                                                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground/80">{member.role}</div>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/40 hover:text-foreground hover:bg-muted/50 transition-colors">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2.5 mb-6">
                                        <StatBox label="Active" value={member.activeTasks} icon={Users} color="text-foreground" />
                                        <StatBox label="Logged" value={`${member.loggedHours}h`} icon={Clock} color="text-primary" />
                                        <StatBox
                                            label="Issues"
                                            value={member.issues}
                                            icon={AlertCircle}
                                            color={member.issues > 0 ? "text-red-600" : "text-muted-foreground/30"}
                                        />
                                    </div>

                                    <div className="pt-4 border-t border-border/40">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest leading-none">Weekly Progress</span>
                                            <span className="text-[10px] font-bold text-foreground tabular-nums">{(member.loggedHours / 40 * 100).toFixed(0)}%</span>
                                        </div>
                                        <div className="h-1 w-full bg-muted/50 rounded-full overflow-hidden">
                                            <div
                                                className={cn("h-full transition-all duration-700 ease-out", member.color)}
                                                style={{ width: `${Math.min((member.loggedHours / 40) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        onClick={() => setSelectedMember(member)}
                                        className="w-full mt-5 h-8 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground hover:text-primary hover:bg-primary/[0.03] transition-all group/btn rounded-sm"
                                    >
                                        View Activity
                                        <TrendingUp className="w-3 h-3 ml-2 opacity-40 group-hover/btn:opacity-100 transition-opacity" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}

                        {/* Invite Card */}
                        <Card className="border-2 border-dashed border-muted/50 shadow-none hover:border-primary/30 transition-all duration-300 bg-muted/30 flex items-center justify-center p-8 group cursor-pointer hover:bg-muted/50">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-12 h-12 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center group-hover:border-primary/50 group-hover:bg-primary/5 transition-all">
                                    <Users className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                                </div>
                                <div className="text-center">
                                    <span className="text-sm font-bold text-muted-foreground/60 block group-hover:text-primary transition-colors tracking-tight">Add Team Member</span>
                                    <span className="text-[10px] text-muted-foreground/40 font-medium">Expand your resource pool</span>
                                </div>
                            </div>
                        </Card>
                    </div>
                ) : (
                    <TeamTable />
                )}
            </div>

            {/* Activity Detail Sheet */}
            <Sheet open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
                <SheetContent className="p-0 sm:max-w-[440px] border-l border-border/50 shadow-2xl">
                    {selectedMember && <TeamMemberActivity member={selectedMember} />}
                </SheetContent>
            </Sheet>
        </div>
    );
}
