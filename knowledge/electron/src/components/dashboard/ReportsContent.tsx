import React, { useState } from 'react';
import {
    BarChart3,
    Calendar,
    Clock,
    Download,
    FileText,
    Filter,
    MoreHorizontal,
    Plus,
    Search,
    Share2,
    Star,
    TrendingUp,
    History,
    Timer,
    Zap,
    ChevronRight,
    Play
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Report {
    id: string;
    name: string;
    description: string;
    type: 'templated' | 'custom' | 'real-time';
    lastRun?: string;
    frequency?: string;
    category: string;
    status: 'active' | 'scheduled' | 'draft';
}

const reports: Report[] = [
    {
        id: 'r1',
        name: 'Project Velocity Report',
        description: 'Track team sprint velocity and project completion rates over time.',
        type: 'templated',
        lastRun: '2 hours ago',
        frequency: 'Weekly',
        category: 'Performance',
        status: 'active'
    },
    {
        id: 'r2',
        name: 'Resource Allocation Matrix',
        description: 'Real-time overview of personnel across all active projects.',
        type: 'real-time',
        category: 'Resources',
        status: 'active'
    },
    {
        id: 'r3',
        name: 'Q1 Financial Summary',
        description: 'Budget vs Actual spending analysis for the first quarter.',
        type: 'custom',
        lastRun: '1 day ago',
        category: 'Finance',
        status: 'scheduled'
    },
    {
        id: 'r4',
        name: 'Risk Distribution Heatmap',
        description: 'Visual representation of project risks categorized by impact and likelihood.',
        type: 'templated',
        lastRun: '30 mins ago',
        category: 'Risk Management',
        status: 'active'
    },
    {
        id: 'r5',
        name: 'Quality Assurance Throughput',
        description: 'Analysis of bug detection and resolution rates.',
        type: 'custom',
        category: 'Quality',
        status: 'draft'
    }
];

const ReportTypeBadge = ({ type }: { type: Report['type'] }) => {
    const styles = {
        templated: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
        custom: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
        'real-time': "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
    };

    const icons = {
        templated: <FileText className="w-3 h-3 mr-1" />,
        custom: <Zap className="w-3 h-3 mr-1" />,
        'real-time': <Timer className="w-3 h-3 mr-1" />
    };

    return (
        <Badge variant="outline" className={`${styles[type]} flex items-center font-medium capitalize`}>
            {icons[type]}
            {type.replace('-', ' ')}
        </Badge>
    );
};

export const ReportsContent = () => {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-background/50 overflow-hidden">
            {/* Header Section */}
            <div className="p-6 border-b bg-background">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl tracking-tight">System Reports</h1>
                        <p className="text-muted-foreground mt-1">
                            Produce, run and schedule analytics for project management.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="h-9 px-3 gap-2">
                            <History className="w-4 h-4" />
                            Run History
                        </Button>
                        <Button variant="outline" className="h-9 px-3 gap-2">
                            <Calendar className="w-4 h-4" />
                            Schedules
                        </Button>
                        <Button className="h-9 px-4 gap-2 bg-primary">
                            <Plus className="w-4 h-4" />
                            Create Custom Report
                        </Button>
                    </div>
                </div>

                {/* Filters/Search Area */}
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search reports by name, description or category..."
                            className="pl-10 h-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" className="h-10 px-3 gap-2">
                        <Filter className="w-4 h-4" />
                        Filters
                    </Button>
                    <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground mr-4">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span>34 Reports Generated Today</span>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-auto p-6">
                <Tabs defaultValue="all" className="w-full">
                    <TabsList className="mb-6 bg-muted/50 p-1 border h-11">
                        <TabsTrigger value="all" className="px-6">All Reports</TabsTrigger>
                        <TabsTrigger value="templated" className="px-6">Templates</TabsTrigger>
                        <TabsTrigger value="custom" className="px-6">Custom</TabsTrigger>
                        <TabsTrigger value="realtime" className="px-6 text-green-600">Real-time</TabsTrigger>
                        <TabsTrigger value="scheduled" className="px-6">Scheduled</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="mt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Report Cards */}
                            {reports.map((report) => (
                                <Card key={report.id} className="group overflow-hidden border-border/60 hover:border-primary/40 transition-all hover:shadow-lg bg-card">
                                    <CardHeader className="p-5 pb-3">
                                        <div className="flex items-start justify-between mb-2">
                                            <ReportTypeBadge type={report.type} />
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="w-4 h-4 cursor-pointer" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem className="gap-2">
                                                        <Play className="w-4 h-4" /> Run Now
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2">
                                                        <Calendar className="w-4 h-4" /> Schedule
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2">
                                                        <Share2 className="w-4 h-4" /> Share
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2">
                                                        <Star className="w-4 h-4" /> Favorite
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <CardTitle className="text-lg leading-snug group-hover:text-primary transition-colors cursor-pointer">
                                            {report.name}
                                        </CardTitle>
                                        <CardDescription className="line-clamp-2 mt-2 h-10">
                                            {report.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-5 pt-0">
                                        <div className="mt-4 flex flex-col gap-3">
                                            <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-4">
                                                <div className="flex items-center gap-1.5">
                                                    <History className="w-3.5 h-3.5" />
                                                    <span>Last run: {report.lastRun || 'Never'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Tag className="w-3.5 h-3.5" />
                                                    <span className="font-medium bg-muted px-1.5 py-0.5 rounded">{report.category}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 mt-2">
                                                <Button className="flex-1 h-9 rounded-md gap-2 bg-primary/10 hover:bg-primary/20 text-primary border-none text-xs font-semibold uppercase tracking-wider">
                                                    <Play className="w-3.5 h-3.5" />
                                                    Run Report
                                                </Button>
                                                <Button variant="outline" size="icon" className="h-9 w-9 rounded-md border-border/80">
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            {/* Create New Card */}
                            <button className="h-full min-h-[220px] rounded-xl border-2 border-dashed border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-4 text-muted-foreground hover:text-primary group">
                                <div className="w-12 h-12 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                                    <Plus className="w-6 h-6" />
                                </div>
                                <div className="text-center px-6">
                                    <p className="font-semibold text-sm">Create Custom Report</p>
                                    <p className="text-xs mt-1">Builder mode with custom metrics and filters</p>
                                </div>
                            </button>
                        </div>
                    </TabsContent>

                    {/* Other tabs would have filtered versions of the same grid */}
                    <TabsContent value="templated" className="mt-0">
                        <div className="py-20 text-center text-muted-foreground">
                            <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>Filtered view for Templetized Reports</p>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>


        </div>
    );
};

// Helper for Tag icon if not imported
const Tag = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
        <path d="M7 7h.01" />
    </svg>
);
