import { useState, useEffect } from 'react';
import {
    Users,
    ShieldAlert,
    History,
    Settings,
    Database,
    Lock,
    Search,
    Plus,
    ChevronRight,
    UserPlus,
    Key,
    ShieldCheck,
    LayoutGrid,
    RefreshCw,
    Download,
    CheckCircle2,
    AlertCircle,
    Info,
    ArrowUpCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

export const AdminContent = () => {
    const [appVersion, setAppVersion] = useState<string>('0.0.0');
    const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'>('idle');
    const [downloadProgress, setDownloadProgress] = useState<number>(0);
    const [updateInfo, setUpdateInfo] = useState<any>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');

    useEffect(() => {
        // Get initial version
        window.ipcRenderer.invoke('get-app-version').then(setAppVersion);

        // Listen for update events
        const handleUpdateStatus = (_event: any, status: any, info: any) => {
            setUpdateStatus(status);
            if (info) setUpdateInfo(info);
            if (status === 'error' && typeof info === 'string') setErrorMessage(info);

            if (status === 'downloaded') {
                toast.success("Update downloaded and ready to install!");
            } else if (status === 'available') {
                toast.info(`Version ${info.version} is available!`);
            }
        };

        const handleUpdateProgress = (_event: any, progressObj: any) => {
            setUpdateStatus('downloading');
            setDownloadProgress(Math.floor(progressObj.percent));
        };

        window.ipcRenderer.on('update-status', handleUpdateStatus);
        window.ipcRenderer.on('update-progress', handleUpdateProgress);

        return () => {
            // Need to implement off properly if we really want to cleanup
            // but for a singleton component like this it's usually fine
        };
    }, []);

    const checkForUpdates = async () => {
        setUpdateStatus('checking');
        setErrorMessage('');
        const result = await window.ipcRenderer.invoke('check-for-updates');
        if (result && result.error) {
            setUpdateStatus('error');
            setErrorMessage(result.error);
            toast.error(result.error);
        }
    };

    const downloadUpdate = async () => {
        setUpdateStatus('downloading');
        await window.ipcRenderer.invoke('download-update');
    };

    const installAndRestart = () => {
        window.ipcRenderer.invoke('install-update');
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden">
            {/* Header Section */}
            <div className="p-6 border-b bg-background">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl tracking-tight font-light">System <span className="font-bold">Administration</span></h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Control system-wide configurations, access levels, and security audits.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="h-9 gap-2">
                            <Database className="w-4 h-4" />
                            Backup System
                        </Button>
                        <Button className="h-9 bg-primary gap-2">
                            <UserPlus className="w-4 h-4" />
                            Invite User
                        </Button>
                    </div>
                </div>

                {/* Admin Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Active Users', value: '1,284', grow: '+12%', icon: Users, color: 'text-blue-600' },
                        { label: 'Security Alerts', value: '0', grow: 'Stable', icon: ShieldAlert, color: 'text-green-600' },
                        { label: 'System Load', value: '14%', grow: 'Normal', icon: Database, color: 'text-purple-600' },
                        { label: 'Audit Events', value: '14.2k', grow: 'Today', icon: History, color: 'text-orange-600' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-muted/30 border rounded-lg p-3 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                                <p className="text-lg font-bold">{stat.value}</p>
                            </div>
                            <stat.icon className={`w-8 h-8 opacity-20 ${stat.color}`} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Tabbed Area */}
            <div className="flex-1 overflow-auto p-6">
                <Tabs defaultValue="users" className="w-full">
                    <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0 mb-6">
                        <TabsTrigger value="users" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 font-semibold">User Management</TabsTrigger>
                        <TabsTrigger value="roles" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 font-semibold">Roles & Permissions</TabsTrigger>
                        <TabsTrigger value="audit" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 font-semibold text-orange-600">Audit Logs</TabsTrigger>
                        <TabsTrigger value="updates" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 font-semibold">App Updates</TabsTrigger>
                        <TabsTrigger value="settings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 font-semibold">General Settings</TabsTrigger>
                    </TabsList>

                    <TabsContent value="users" className="mt-0 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input placeholder="Search users by name or email..." className="pl-10 h-9" />
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="h-9">Export CSV</Button>
                                <Button variant="outline" size="sm" className="h-9">Bulk Actions</Button>
                            </div>
                        </div>

                        <div className="border rounded-md bg-card">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/20">
                                        <TableHead className="w-[250px]">User</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Last Active</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {[
                                        { name: 'Jake Blumenow', email: 'jake@bridgedigital.com', role: 'System Admin', status: 'Active', last: '2 mins ago' },
                                        { name: 'Sarah Miller', email: 'sarah.m@construction.co', role: 'Project Manager', status: 'Active', last: '1 hour ago' },
                                        { name: 'Tom Harris', email: 't.harris@site.com', role: 'Viewer', status: 'Inactive', last: '3 days ago' },
                                        { name: 'Elena Rodriguez', email: 'elena.r@cnc-ops.com', role: 'Editor', status: 'Active', last: 'Just now' },
                                        { name: 'Marcus Chen', email: 'm.chen@logistics.com', role: 'Admin', status: 'Active', last: '5 mins ago' },
                                    ].map((user, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <span>{user.name}</span>
                                                    <span className="text-[11px] text-muted-foreground font-normal">{user.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-normal">{user.role}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5 font-medium">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-green-500' : 'bg-gray-300'}`} />
                                                    {user.status}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">{user.last}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm">Manage</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    <TabsContent value="audit" className="mt-0">
                        <div className="space-y-4">
                            <div className="bg-orange-500/10 border-orange-500/20 border p-4 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <ShieldAlert className="text-orange-600 dark:text-orange-400 w-5 h-5" />
                                    <div>
                                        <p className="text-sm font-semibold text-orange-900 dark:text-orange-200">Compliance Mode Active</p>
                                        <p className="text-xs text-orange-700 dark:text-orange-300">All actions are currently being logged for the monthly security review.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {[
                                    { action: 'Policy Override', user: 'Jake Blumenow', target: 'Resource Matrix Report', time: '14:23:44', level: 'high' },
                                    { action: 'User Permissions Changed', user: 'Marcus Chen', target: 'Sarah Miller', time: '12:05:12', level: 'medium' },
                                    { action: 'Bulk Export Initialized', user: 'Elena Rodriguez', target: 'Active Projects (CSV)', time: '11:45:30', level: 'medium' },
                                    { action: 'New Project Category Created', user: 'Jake Blumenow', target: 'Industrial Automation', time: '09:12:00', level: 'low' },
                                ].map((log, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg bg-card group hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-2 h-10 rounded-full ${log.level === 'high' ? 'bg-red-500' : log.level === 'medium' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                                            <div>
                                                <p className="text-sm font-bold">{log.action}</p>
                                                <p className="text-xs text-muted-foreground">Action by <span className="font-semibold text-foreground">{log.user}</span> on <span className="italic">{log.target}</span></p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <p className="text-xs font-mono">{log.time}</p>
                                            <Button variant="ghost" className="h-6 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">Full Trace</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="updates" className="mt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <Info className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">Application Version</CardTitle>
                                                <CardDescription>Current build information</CardDescription>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="h-6 bg-primary/5 border-primary/20 text-primary">v{appVersion}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm py-2 border-b">
                                            <span className="text-muted-foreground">Product Name</span>
                                            <span className="font-semibold">Checkpoint.</span>
                                        </div>
                                        <div className="flex justify-between text-sm py-2 border-b">
                                            <span className="text-muted-foreground">Channel</span>
                                            <span className="font-semibold">Stable</span>
                                        </div>
                                        <div className="flex justify-between text-sm py-2">
                                            <span className="text-muted-foreground">Platform</span>
                                            <span className="font-semibold capitalize">{window.ipcRenderer.platform}</span>
                                        </div>
                                    </div>

                                    <Button
                                        className="w-full gap-2 mt-4"
                                        onClick={checkForUpdates}
                                        disabled={updateStatus === 'checking' || updateStatus === 'downloading'}
                                    >
                                        <RefreshCw className={`w-4 h-4 ${updateStatus === 'checking' ? 'animate-spin' : ''}`} />
                                        {updateStatus === 'checking' ? 'Checking...' : 'Check for Updates'}
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <ArrowUpCircle className="w-5 h-5 text-primary" />
                                        Update Status
                                    </CardTitle>
                                    <CardDescription>Available updates and download progress</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="min-h-[140px] flex flex-col justify-center border rounded-lg p-4 bg-muted/20 border-border/30">
                                        {updateStatus === 'idle' && (
                                            <div className="text-center py-4">
                                                <Info className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                                                <p className="text-sm text-muted-foreground font-medium italic">Check for updates to see status</p>
                                            </div>
                                        )}

                                        {updateStatus === 'checking' && (
                                            <div className="text-center py-4 space-y-2">
                                                <RefreshCw className="w-8 h-8 mx-auto text-primary animate-spin" />
                                                <p className="text-sm font-medium">Checking our servers...</p>
                                            </div>
                                        )}

                                        {updateStatus === 'available' && updateInfo && (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                                                        <ArrowUpCircle className="w-4 h-4 text-green-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-green-600">New Version Available</p>
                                                        <p className="text-xs text-muted-foreground">Version {updateInfo.version} is ready to be downloaded.</p>
                                                    </div>
                                                </div>
                                                <Button className="w-full" onClick={downloadUpdate}>
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Download Update
                                                </Button>
                                            </div>
                                        )}

                                        {updateStatus === 'not-available' && (
                                            <div className="text-center py-4 space-y-2">
                                                <CheckCircle2 className="w-8 h-8 mx-auto text-green-500" />
                                                <div>
                                                    <p className="text-sm font-bold">You're up to date!</p>
                                                    <p className="text-xs text-muted-foreground">Checkpoint. v{appVersion} is the latest version.</p>
                                                </div>
                                            </div>
                                        )}

                                        {updateStatus === 'downloading' && (
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-end mb-1">
                                                    <div>
                                                        <p className="text-sm font-bold">Downloading Update</p>
                                                        <p className="text-xs text-muted-foreground">Version {updateInfo?.version || ''}</p>
                                                    </div>
                                                    <span className="text-xs font-mono">{downloadProgress}%</span>
                                                </div>
                                                <Progress value={downloadProgress} className="h-2" />
                                            </div>
                                        )}

                                        {updateStatus === 'downloaded' && (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-green-600">Update Ready</p>
                                                        <p className="text-xs text-muted-foreground">Download complete. Restart to apply.</p>
                                                    </div>
                                                </div>
                                                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={installAndRestart}>
                                                    <RefreshCw className="w-4 h-4 mr-2" />
                                                    Install & Restart
                                                </Button>
                                            </div>
                                        )}

                                        {updateStatus === 'error' && (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                                                        <AlertCircle className="w-5 h-5 text-red-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-red-600">Update Failed</p>
                                                        <p className="text-xs text-muted-foreground leading-tight">{errorMessage || 'An error occurred while checking for updates.'}</p>
                                                    </div>
                                                </div>
                                                <Button variant="outline" className="w-full border-red-200 hover:bg-red-50" onClick={checkForUpdates}>
                                                    Try Again
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

