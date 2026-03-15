import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useUser } from "@/hooks/useUser";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ChevronRight, User, ArrowLeft, Pencil, Shield, Building2,
  Users, KeyRound, Archive, UserX, Mail, Calendar, Clock
} from "lucide-react";
import { statusVariant, InfoRow, SectionCard, EmptyState } from "@/components/participant/ProfileShared";

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: u, isLoading, error } = useUser(id ?? "");
  const [activeTab, setActiveTab] = useState("overview");

  const displayName = u ? `${u.first_name} ${u.surname ?? u.last_name ?? ""}`.trim() : "";

  if (isLoading) {
    return (
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        <DashboardHeader />
        <div className="flex flex-1 min-h-0">
          <DashboardSidebar />
          <main className="flex-1 overflow-auto">
            <div className="border-b border-border bg-card px-6 py-5">
              <Skeleton className="h-4 w-48 mb-4" />
              <div className="flex items-center gap-4">
                <Skeleton className="w-16 h-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-7 w-56" />
                  <Skeleton className="h-4 w-72" />
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-96" />
              <Skeleton className="h-64 w-full" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !u) {
    return (
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        <DashboardHeader />
        <div className="flex flex-1 min-h-0">
          <DashboardSidebar />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center">
              <p className="text-destructive font-medium">User not found</p>
              <Button variant="outline" className="mt-3" onClick={() => navigate("/people")}>Back to Users</Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const tabs = [
    { value: "overview", label: "Overview", icon: User },
    { value: "roles", label: "Roles & Permissions", icon: Shield },
    { value: "instances", label: "Instances", icon: Building2, count: u.instance_assignments.length },
    { value: "groups", label: "Groups", icon: Users, count: u.group_assignments.length },
    { value: "account", label: "Account", icon: KeyRound },
  ];

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <DashboardHeader />
      <div className="flex flex-1 min-h-0">
        <DashboardSidebar />
        <main className="flex-1 overflow-auto">
          {/* Header */}
          <div className="bg-card border-b border-border">
            <div className="px-6 py-5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                <button onClick={() => navigate("/")} className="hover:text-foreground transition-colors">Dashboard</button>
                <ChevronRight className="w-3 h-3" />
                <button onClick={() => navigate("/people")} className="hover:text-foreground transition-colors">Users</button>
                <ChevronRight className="w-3 h-3" />
                <span className="text-foreground font-medium">{displayName}</span>
              </div>

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border-2 border-border overflow-hidden shrink-0">
                    {u.profile_photo_url ? (
                      <img src={u.profile_photo_url} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h1 className="text-2xl font-semibold text-foreground tracking-tight">{displayName}</h1>
                      <Badge variant={statusVariant(u.status)} className="capitalize">{u.status}</Badge>
                      {u.archive_status !== "active" && (
                        <Badge variant="outline" className="text-muted-foreground border-border capitalize">{u.archive_status}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{u.email}</span>
                      {u.roles.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5" />
                          {u.roles.map((r) => r.name).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="gap-2" onClick={() => navigate("/people")}>
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                  <Button className="gap-2">
                    <Pencil className="w-4 h-4" />
                    Edit
                  </Button>
                </div>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="border-t border-border bg-muted/50">
                <TabsList className="bg-transparent h-11 w-full justify-start p-0 rounded-none gap-0 overflow-x-auto">
                  {tabs.map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="rounded-none h-full px-5 text-sm gap-1.5 border-b-2 border-transparent text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground hover:bg-background/50 transition-colors shrink-0"
                    >
                      <tab.icon className="w-3.5 h-3.5" />
                      {tab.label}
                      {tab.count !== undefined && tab.count > 0 && (
                        <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-4">{tab.count}</Badge>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <div className="px-6 py-6">
                {/* Overview */}
                <TabsContent value="overview" className="mt-0 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SectionCard title="User Details" icon={User}>
                      <div className="grid grid-cols-2 gap-x-6">
                        <InfoRow label="First Name" value={u.first_name} icon={User} />
                        <InfoRow label="Surname" value={u.surname ?? u.last_name} />
                        <InfoRow label="Email" value={u.email} icon={Mail} />
                        <InfoRow label="Status" value={<Badge variant={statusVariant(u.status)} className="capitalize">{u.status}</Badge>} />
                        <InfoRow label="Created" value={new Date(u.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} icon={Calendar} />
                        <InfoRow label="Last Updated" value={new Date(u.updated_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} icon={Clock} />
                      </div>
                    </SectionCard>

                    <SectionCard title="Summary" icon={Shield}>
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Roles</p>
                          {u.roles.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {u.roles.map((r) => (
                                <Badge key={r.id} variant="outline" className="text-xs">{r.name}</Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No roles assigned</p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Instances</p>
                          {u.instance_assignments.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {u.instance_assignments.map((a) => (
                                <Badge key={a.id} variant="secondary" className="text-xs">{a.instance_name}</Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">Not assigned to any instances</p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Groups</p>
                          {u.group_assignments.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {u.group_assignments.map((g) => (
                                <Badge key={g.id} variant="outline" className="text-xs capitalize">{g.group_type}: {g.group_id.slice(0, 8)}…</Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">Not assigned to any groups</p>
                          )}
                        </div>
                      </div>
                    </SectionCard>
                  </div>
                </TabsContent>

                {/* Roles & Permissions */}
                <TabsContent value="roles" className="mt-0 space-y-6">
                  <SectionCard title="Assigned Roles" icon={Shield} actions={
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1"><Shield className="w-3 h-3" /> Manage Roles</Button>
                  }>
                    {u.roles.length > 0 ? (
                      <div className="space-y-3">
                        {u.roles.map((role) => (
                          <div key={role.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-foreground">{role.name}</p>
                                {role.is_system_role && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">System</Badge>
                                )}
                              </div>
                              {role.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>
                              )}
                            </div>
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive">
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState icon={Shield} message="No roles have been assigned to this user." />
                    )}
                  </SectionCard>
                </TabsContent>

                {/* Instances */}
                <TabsContent value="instances" className="mt-0 space-y-6">
                  <SectionCard title="Instance Assignments" icon={Building2} actions={
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1"><Building2 className="w-3 h-3" /> Assign Instance</Button>
                  }>
                    {u.instance_assignments.length > 0 ? (
                      <div className="space-y-3">
                        {u.instance_assignments.map((a) => (
                          <div key={a.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                            <div>
                              <button
                                onClick={() => navigate(`/instances/${a.instance_id}`)}
                                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                              >
                                {a.instance_name}
                              </button>
                              {a.role && (
                                <p className="text-xs text-muted-foreground mt-0.5">Role: {a.role}</p>
                              )}
                            </div>
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive">
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState icon={Building2} message="This user is not assigned to any instances." />
                    )}
                  </SectionCard>
                </TabsContent>

                {/* Groups */}
                <TabsContent value="groups" className="mt-0 space-y-6">
                  <SectionCard title="Group Memberships" icon={Users} actions={
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1"><Users className="w-3 h-3" /> Assign Group</Button>
                  }>
                    {u.group_assignments.length > 0 ? (
                      <div className="space-y-3">
                        {u.group_assignments.map((g) => (
                          <div key={g.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                            <div>
                              <p className="text-sm font-medium text-foreground capitalize">{g.group_type}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                ID: {g.group_id.slice(0, 12)}… · Added {new Date(g.added_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                              </p>
                            </div>
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive">
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState icon={Users} message="This user is not assigned to any groups." />
                    )}
                  </SectionCard>
                </TabsContent>

                {/* Account Actions */}
                <TabsContent value="account" className="mt-0 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SectionCard title="Account Actions" icon={KeyRound}>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between py-3 border-b border-border">
                          <div>
                            <p className="text-sm font-medium text-foreground">Reset Password</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Send a password reset email to the user</p>
                          </div>
                          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                            <Mail className="w-3.5 h-3.5" />
                            Send Reset
                          </Button>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-border">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {u.status === "active" ? "Disable Account" : "Enable Account"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {u.status === "active"
                                ? "Prevent this user from logging in"
                                : "Re-enable login access for this user"}
                            </p>
                          </div>
                          <Button
                            variant={u.status === "active" ? "destructive" : "default"}
                            size="sm"
                            className="h-8 text-xs gap-1.5"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            {u.status === "active" ? "Disable" : "Enable"}
                          </Button>
                        </div>
                        <div className="flex items-center justify-between py-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">Archive Account</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Move this user to the archive (soft delete)</p>
                          </div>
                          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10">
                            <Archive className="w-3.5 h-3.5" />
                            Archive
                          </Button>
                        </div>
                      </div>
                    </SectionCard>

                    <SectionCard title="Account Info" icon={Clock}>
                      <div className="grid grid-cols-1 gap-x-6">
                        <InfoRow label="User ID" value={<span className="font-mono text-xs">{u.id}</span>} />
                        <InfoRow label="Auth ID" value={<span className="font-mono text-xs">{u.auth_id}</span>} />
                        <InfoRow label="Tenant ID" value={<span className="font-mono text-xs">{u.tenant_id}</span>} />
                        <InfoRow label="Archive Status" value={<Badge variant="outline" className="capitalize text-xs">{u.archive_status}</Badge>} />
                      </div>
                    </SectionCard>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserProfile;
