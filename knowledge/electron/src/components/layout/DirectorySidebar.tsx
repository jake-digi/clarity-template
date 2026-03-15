
import React, { useState } from 'react';
import { SidebarContainer, SidebarHeader, SidebarContent, SidebarFooter } from './SidebarLayout';
import { Book, Users, Filter, Search, ChevronDown, CheckCircle2, Clock, ShieldAlert, GraduationCap, UserCircle, Users2, Star, Download, FileText, FileCode, FileType } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DirectorySidebarProps {
    isCollapsed: boolean;
    activeFilter?: string;
    onFilterChange?: (filterId: string) => void;
}

const NavButton = ({
    icon: Icon,
    label,
    isActive,
    onClick
}: {
    icon: any,
    label: string,
    isActive: boolean,
    onClick: () => void
}) => (
    <button
        onClick={onClick}
        className={cn(
            "w-full flex items-center gap-2.5 min-h-[44px] py-1.5 hover:bg-sidebar-accent/50 text-sm transition-colors border-l-2 shrink-0 px-3",
            isActive
                ? "bg-primary/5 text-primary border-primary font-bold"
                : "text-sidebar-foreground border-transparent"
        )}
    >
        <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
        <span className="truncate font-semibold tracking-tight text-left leading-tight">{label}</span>
    </button>
);

export const DirectorySidebar = ({ isCollapsed, activeFilter = 'all', onFilterChange }: DirectorySidebarProps) => {
    return (
        <SidebarContainer isCollapsed={isCollapsed}>
            <SidebarHeader title="Directory" icon={Book} />
            <SidebarContent className="px-0 py-0 flex flex-col overflow-hidden">
                <div className="flex flex-col h-full overflow-hidden">
                    {/* Search in Sidebar */}
                    <div className="p-3 border-b border-sidebar-border bg-sidebar-accent/5">
                        <div className="relative group">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                            <input
                                placeholder="Quick find..."
                                className="w-full bg-background border border-sidebar-border rounded-md pl-8 pr-3 py-1.5 text-[12px] focus:outline-none transition-all placeholder:text-muted-foreground/40 font-medium"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
                        {/* Main Categories - Matching style of other sidebars */}
                        <div className="flex flex-col mb-4">
                            <NavButton
                                icon={Users}
                                label="All Participants"
                                isActive={activeFilter === 'all'}
                                onClick={() => onFilterChange?.('all')}
                            />
                            <NavButton
                                icon={Clock}
                                label="Recently Added"
                                isActive={activeFilter === 'recent'}
                                onClick={() => onFilterChange?.('recent')}
                            />
                        </div>

                        <Separator className="mx-4 opacity-50 mb-6" />

                        {/* Attribute Filters */}
                        <div className="px-4 space-y-5">
                            {/* Status */}
                            <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-3 ml-1">Status</h4>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <Checkbox className="w-4 h-4 rounded-sm" />
                                        <span className="text-xs font-semibold text-sidebar-foreground group-hover:text-foreground transition-colors">On-site</span>
                                        <span className="ml-auto text-[10px] font-bold text-muted-foreground/50 bg-muted/30 px-1.5 rounded-full">482</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <Checkbox className="w-4 h-4 rounded-sm" />
                                        <span className="text-xs font-semibold text-sidebar-foreground group-hover:text-foreground transition-colors">Off-site</span>
                                        <span className="ml-auto text-[10px] font-bold text-muted-foreground/50 bg-muted/30 px-1.5 rounded-full">12</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <Checkbox className="w-4 h-4 rounded-sm" />
                                        <span className="text-xs font-semibold text-sidebar-foreground group-hover:text-foreground transition-colors">Unassigned</span>
                                        <span className="ml-auto text-[10px] font-bold text-muted-foreground/50 bg-muted/30 px-1.5 rounded-full">45</span>
                                    </label>
                                </div>
                            </div>

                            {/* Age Group */}
                            <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-3 ml-1">Age Group</h4>
                                <div className="space-y-3">
                                    {['Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12+'].map(year => (
                                        <label key={year} className="flex items-center gap-3 cursor-pointer group">
                                            <Checkbox className="w-4 h-4 rounded-sm" />
                                            <span className="text-xs font-semibold text-sidebar-foreground group-hover:text-foreground transition-colors">{year}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Role */}
                            <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-3 ml-1">Role</h4>
                                <div className="space-y-3">
                                    {['Participant', 'Young Leader', 'Staff', 'HQ Staff'].map(role => (
                                        <label key={role} className="flex items-center gap-3 cursor-pointer group">
                                            <Checkbox className="w-4 h-4 rounded-sm" />
                                            <span className="text-xs font-semibold text-sidebar-foreground group-hover:text-foreground transition-colors">{role}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Ranking Filters Section */}
                            <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-3 ml-1 text-primary/70">Rank</h4>
                                <div className="space-y-3">
                                    {['Corporal', 'Sergeant', 'Staff Sergeant', 'Warrant Officer'].map(rank => (
                                        <label key={rank} className="flex items-center gap-3 cursor-pointer group">
                                            <Checkbox className="w-4 h-4 rounded-sm border-primary/20" />
                                            <span className="text-xs font-semibold text-sidebar-foreground group-hover:text-foreground transition-colors">{rank}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Instance */}
                            <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-3 ml-1">Instance Scoping</h4>
                                <div className="space-y-3 pb-8">
                                    {['Summer Camp 2026', 'Winter Seminar', 'Israel Tour'].map(instance => (
                                        <label key={instance} className="flex items-center gap-3 cursor-pointer group">
                                            <Checkbox className="w-4 h-4 rounded-sm" />
                                            <span className="text-xs font-semibold text-sidebar-foreground group-hover:text-foreground transition-colors truncate max-w-[120px]">{instance}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </SidebarContent>

            {/* Redesigned Footer with Export Dropdown */}
            <SidebarFooter className="p-3 bg-sidebar-accent/5">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="w-full flex items-center justify-center gap-2.5 px-3 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-md hover:bg-primary/90 transition-all shadow-md shadow-primary/20">
                            <Download className="w-3.5 h-3.5" />
                            Export Directory
                            <ChevronDown className="w-3 h-3 opacity-70" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[180px] p-1.5">
                        <DropdownMenuItem className="flex items-center gap-2.5 py-2 text-xs font-semibold cursor-pointer">
                            <FileType className="w-4 h-4 text-green-600" />
                            Export as CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2.5 py-2 text-xs font-semibold cursor-pointer">
                            <FileText className="w-4 h-4 text-red-600" />
                            Export as PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2.5 py-2 text-xs font-semibold cursor-pointer">
                            <FileCode className="w-4 h-4 text-blue-600" />
                            Export as HTML
                        </DropdownMenuItem>
                        <Separator className="my-1.5 opacity-50" />
                        <DropdownMenuItem className="flex items-center gap-2.5 py-2 text-xs font-semibold cursor-pointer opacity-70">
                            <Users2 className="w-4 h-4" />
                            Bulk Export Sync
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarFooter>
        </SidebarContainer>
    );
};
