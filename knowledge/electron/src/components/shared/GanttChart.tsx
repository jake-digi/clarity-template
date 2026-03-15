
import React, { useState } from 'react';
import { Gantt, Task, ViewMode } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import { useTheme } from 'next-themes';
import {
    ChevronDown,
    ChevronRight,
    MoreVertical,
    CalendarIcon,
    Clock,
    Search,
    Calendar,
    LayoutGrid,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskDetailSheet } from "./TaskDetailSheet";
import { cn } from "@/lib/utils";
import { ganttTasks as initialTasks, Task as TableTask } from "@/data/mockData-old";

export const GanttChart = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Month);
    const [tasks, setTasks] = useState<Task[]>(initialTasks as unknown as Task[]);
    const [searchQuery, setSearchQuery] = useState("");

    // --- Detail Sheet State ---
    const [selectedDetailTask, setSelectedDetailTask] = useState<TableTask | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const filteredTasks = tasks.filter(task =>
        task.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDateChange = (task: Task) => {
        let newTasks = tasks.map((t) => (t.id === task.id ? task : t));
        if (task.project) {
            const project = newTasks.find((t) => t.id === task.project);
            if (project) {
                const projectTasks = newTasks.filter((t) => t.project === task.project);
                const start = new Date(Math.min(...projectTasks.map((t) => t.start.getTime())));
                const end = new Date(Math.max(...projectTasks.map((t) => t.end.getTime())));
                const progress = projectTasks.reduce((acc, t) => acc + t.progress, 0) / projectTasks.length;

                newTasks = newTasks.map((t) =>
                    t.id === task.project ? { ...t, start, end, progress } : t
                );
            }
        }
        setTasks(newTasks);
    };

    const handleProgressChange = (task: Task) => {
        setTasks(tasks.map((t) => (t.id === task.id ? task : t)));
    };

    const handleOpenDetail = (ganttTask: Task) => {
        // Map Gantt Task to TableTask for the detail sheet
        const mappedTask: TableTask = {
            id: ganttTask.id,
            taskName: ganttTask.name,
            priority: (ganttTask as any).priority || "MEDIUM",
            phase: (ganttTask as any).phase || "Unknown",
            assignees: (ganttTask as any).assignees || [],
            startDate: ganttTask.start.toLocaleDateString(),
            deadline: ganttTask.end.toLocaleDateString(),
            status: (ganttTask as any).status || "IN PROGRESS",
            estHours: (ganttTask as any).estHours || 40,
            loggedHours: (ganttTask as any).loggedHours || 0,
            completed: ganttTask.progress >= 100
        };
        setSelectedDetailTask(mappedTask);
        setIsSheetOpen(true);
    };

    const handleExpanderClick = (task: Task) => {
        setTasks(tasks.map((t) => (t.id === task.id ? task : t)));
    };

    return (
        <div className="w-full h-full flex flex-col bg-background">
            <style dangerouslySetInnerHTML={{ __html: ganttStyles }} />
            <TaskDetailSheet
                task={selectedDetailTask}
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
            />

            {/* Gantt Toolbar - Styled to match global filters */}
            <div className="flex-none flex items-center h-10 bg-background border-b border-border shadow-sm overflow-hidden">
                <div className="relative h-full flex items-center border-r border-border min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 pointer-events-none" />
                    <Input
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-full w-full pl-9 text-xs bg-transparent border-none rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50"
                    />
                </div>

                <Select value={viewMode} onValueChange={(v: ViewMode) => setViewMode(v)}>
                    <SelectTrigger className="w-[120px] h-full text-xs bg-transparent border-none rounded-none border-r border-border hover:bg-muted/50 px-4 focus:ring-0 shadow-none transition-colors">
                        <SelectValue placeholder="View Mode" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ViewMode.Day} className="text-xs">Day View</SelectItem>
                        <SelectItem value={ViewMode.Week} className="text-xs">Week View</SelectItem>
                        <SelectItem value={ViewMode.Month} className="text-xs">Month View</SelectItem>
                    </SelectContent>
                </Select>

                <div className="ml-auto flex items-center h-full">
                    {searchQuery && (
                        <Button
                            variant="ghost"
                            onClick={() => setSearchQuery("")}
                            className="h-full px-4 text-[10px] text-muted-foreground hover:text-destructive hover:bg-destructive/5 uppercase font-bold tracking-tight rounded-none border-l border-border transition-colors group"
                        >
                            Clear Results <X className="ml-1.5 h-3 w-3 opacity-50 group-hover:opacity-100" />
                        </Button>
                    )}
                    <div className="h-full w-10 flex items-center justify-center border-l border-border hover:bg-muted/50 transition-colors pointer-events-none opacity-40">
                        <Calendar className="h-4 w-4" />
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-auto">
                <Gantt
                    tasks={filteredTasks}
                    viewMode={viewMode}
                    viewDate={new Date(2025, 8, 15)}
                    listCellWidth="300px"
                    columnWidth={viewMode === ViewMode.Day ? 60 : viewMode === ViewMode.Week ? 150 : 250}
                    rowHeight={40}
                    barCornerRadius={4}
                    barFill={60}
                    todayColor={isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)"}
                    arrowColor={isDark ? "#94a3b8" : "#64748b"}
                    fontFamily="inherit"
                    fontSize="12px"
                    onExpanderClick={handleExpanderClick}
                    onDateChange={handleDateChange}
                    onProgressChange={handleProgressChange}
                    onDoubleClick={handleOpenDetail} // Handle double click on Gantt bars
                    onClick={handleOpenDetail} // Handle click on Gantt bars
                    TaskListHeader={TaskListHeader}
                    TaskListTable={(props) => <TaskListTable {...props} handleOpenDetail={handleOpenDetail} />}
                />
            </div>
        </div>
    );
}

// Custom Task List Header
const TaskListHeader: React.FC<{
    headerHeight: number;
    rowWidth: string;
    fontFamily: string;
    fontSize: string;
}> = ({ headerHeight, fontFamily, fontSize, rowWidth }) => {
    return (
        <div
            className="_3wS5W border-r border-border" // Matches library class for consistency + border
            style={{
                fontFamily,
                fontSize,
                height: headerHeight,
                display: "flex",
                alignItems: "center",
                paddingLeft: "10px",
                paddingRight: "10px",
            }}
        >
            <div className="flex-1 font-bold text-xs uppercase tracking-wider text-muted-foreground">Task Name</div>
            <div className="w-8 text-center font-bold text-xs uppercase tracking-wider text-muted-foreground shrink-0">
                {/* Icon Header placeholder or just empty for alignment */}
                <MoreVertical className="w-3.5 h-3.5 mx-auto opacity-50" />
            </div>
        </div>
    );
};

// Custom Task List Table
const TaskListTable: React.FC<{
    rowHeight: number;
    rowWidth: string;
    fontFamily: string;
    fontSize: string;
    locale: string;
    tasks: Task[];
    selectedTaskId: string;
    setSelectedTask: (taskId: string) => void;
    onExpanderClick: (task: Task) => void;
    handleOpenDetail: (task: Task) => void; // Add this prop
}> = ({
    rowHeight,
    tasks,
    fontFamily,
    fontSize,
    onExpanderClick,
    handleOpenDetail, // Destructure the new prop
}) => {
        return (
            <div className="border-r border-border" style={{ fontFamily, fontSize }}>
                {tasks.map((task) => {
                    // Simple logic to determine if this is a project (parent) or task (leaf) based on properties
                    const isProject = task.type === "project";

                    return (
                        <div
                            key={task.id}
                            className="_1nBOt hover:bg-muted/10 transition-colors group cursor-pointer" // Existing library row class + cursor-pointer
                            style={{
                                height: rowHeight,
                                display: "flex",
                                alignItems: "center",
                                paddingLeft: "10px",
                                paddingRight: "10px",
                            }}
                            onClick={() => handleOpenDetail(task)} // Add onClick handler
                        >
                            {/* Indent / Expander */}
                            <div
                                className="flex items-center justify-center shrink-0 w-6 mr-1"
                                onClick={(e) => {
                                    if (isProject) {
                                        e.stopPropagation();
                                        onExpanderClick(task);
                                    }
                                }}
                            >
                                {isProject ? (
                                    task.hideChildren ?
                                        <ChevronRight className="w-4 h-4 text-muted-foreground hover:text-foreground" /> :
                                        <ChevronDown className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                ) : (
                                    <span className="w-4 h-4" /> // Spacer
                                )}
                            </div>

                            {/* Task Name */}
                            <div
                                className="flex-1 truncate text-xs font-medium text-foreground select-none"
                                title={task.name}
                            >
                                {task.name}
                            </div>

                            {/* Details Dropdown */}
                            <div className="w-8 flex items-center justify-center shrink-0">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity"
                                        >
                                            <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" side="right" className="w-64 z-[9999]">
                                        <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                                            Task Details
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <div className="p-3 space-y-3">
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-bold leading-none">{task.name}</h4>
                                                <p className="text-[10px] text-muted-foreground">ID: {task.id}</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 text-xs">
                                                <div className="space-y-0.5">
                                                    <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                                                        <CalendarIcon className="w-3 h-3" /> Start
                                                    </span>
                                                    <span className="font-mono pl-4.5 block">{task.start.toLocaleDateString()}</span>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                                                        <CalendarIcon className="w-3 h-3" /> End
                                                    </span>
                                                    <span className="font-mono pl-4.5 block">{task.end.toLocaleDateString()}</span>
                                                </div>
                                            </div>

                                            <div className="space-y-1 text-xs">
                                                <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                                                    <Clock className="w-3 h-3" /> Performance
                                                </span>
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-[10px]">
                                                        <span>Progress</span>
                                                        {/* @ts-ignore */}
                                                        <span className="font-bold">{task.displayProgress ?? task.progress}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className={cn("h-full rounded-full",
                                                                // @ts-ignore
                                                                (task.displayProgress ?? task.progress) >= 100 ? "bg-green-500" :
                                                                    // @ts-ignore
                                                                    (task.displayProgress ?? task.progress) >= 50 ? "bg-blue-500" :
                                                                        // @ts-ignore
                                                                        (task.displayProgress ?? task.progress) > 0 ? "bg-orange-500" : "bg-slate-300 dark:bg-slate-700"
                                                            )}
                                                            // @ts-ignore
                                                            style={{ width: `${task.displayProgress ?? task.progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };


const ganttStyles = `
    /* Task List Header */
    ._3wS5W, ._3_ygE {  
        background-color: hsl(var(--muted)/0.5) !important;
        border-bottom: 1px solid hsl(var(--border)) !important;
        color: hsl(var(--muted-foreground)) !important;
    }
    
    /* Task List Item */
    ._1nBOt, ._34SS0, ._3ZbQT { 
        background-color: hsl(var(--background)) !important;
        color: hsl(var(--foreground));
        border-bottom: 1px solid hsl(var(--border) / 0.5) !important;
    }
    
    ._34SS0:nth-of-type(even) {
        background-color: hsl(var(--muted)/0.2) !important;
    }

    /* Gantt Chart SVG Styles */
    .grid-header, ._3wS5W, ._3_ygE {
        background-color: hsl(var(--muted)/0.5) !important;
        fill: hsl(var(--muted)/0.2) !important;
    }
    
    .grid-row, ._2dZTy {
        fill: transparent !important;
        stroke: hsl(var(--border)) !important;
    }
    
    ._2dZTy:nth-child(even) {
        fill: hsl(var(--muted)/0.1) !important;
    }

    .grid-tick, ._3rUKi, ._RuwuK, ._1rLuZ {
        stroke: hsl(var(--border)/0.5) !important;
    }
    
    /* Labels on the task bars */
    ._3zRJQ {
        fill: #000 !important;
        font-weight: 500 !important;
    }
    
    /* Labels outside the task bars */
    ._3KcaM {
        fill: hsl(var(--foreground)) !important;
    }

    /* Specific overrides for white background issues */
    .calendar-header {
        fill: hsl(var(--muted)/0.2) !important;
        stroke: hsl(var(--border)) !important;
    }
    
    .calendar-bottom-text, .calendar-top-text, ._9w8d5, ._2q1Kt {
        fill: hsl(var(--muted-foreground)) !important;
    }
    
    /* Today Marker */
    ._35nLX {
         fill: hsl(var(--primary)/0.1) !important;
         stroke: hsl(var(--primary)/0.5) !important;
    }
    
    /* Scrollbar area */
    ._1eT-t, ._2k9Ys {
         border-left: 1px solid hsl(var(--border));
         background-color: hsl(var(--background)) !important;
    }
    
    /* Tooltip */
    ._3T42e {
        background: hsl(var(--popover)) !important;
        color: hsl(var(--popover-foreground)) !important;
        border: 1px solid hsl(var(--border)) !important;
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1) !important;
    }
    
    ._29NTg {
        color: hsl(var(--muted-foreground)) !important;
    }

    /* Ensure transparent background for the SVG so container bg shows */
    ._2k9Ys, ._34SS0, ._291rD, svg {
        background-color: transparent !important;
    }
`;

