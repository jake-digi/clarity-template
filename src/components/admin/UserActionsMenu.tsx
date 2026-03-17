import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  MoreHorizontal,
  UserX,
  UserCheck,
  Trash2,
  Building2,
  Loader2,
  X,
  Pencil,
  KeyRound,
  Shield,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import type { UserRow } from "@/hooks/useUsers";

interface Props {
  user: UserRow;
}

type CustomerMatch = { id: string; name: string; account_ref: string };

async function callManageUser(
  action: string,
  portal_user_id: string,
  extra?: Record<string, unknown>,
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const baseUrl = import.meta.env.VITE_SUPABASE_URL ?? "";
  const res = await fetch(`${baseUrl}/functions/v1/manage-user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ action, portal_user_id, ...extra }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? `Request failed (${res.status})`);
  return data;
}

const UserActionsMenu = ({ user }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [roleDraft, setRoleDraft] = useState(user.role ?? "customer");
  const [isAdminDraft, setIsAdminDraft] = useState<boolean>(user.is_admin);

  // Dialog state
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [changeCustomerOpen, setChangeCustomerOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [editName, setEditName] = useState("");

  // Customer picker state
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<CustomerMatch[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerMatch | null>(null);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pre-fill rename dialog
  useEffect(() => {
    if (renameOpen) setEditName(user.name);
  }, [renameOpen, user.name]);

  // Pre-fill customer picker with existing assignment
  useEffect(() => {
    if (changeCustomerOpen) {
      setCustomerSearch("");
      setSelectedCustomer(
        user.customer_id && user.customer_name
          ? { id: user.customer_id, name: user.customer_name, account_ref: "" }
          : null,
      );
    }
  }, [changeCustomerOpen, user.customer_id, user.customer_name]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced customer search
  useEffect(() => {
    if (!customerSearch || selectedCustomer) {
      setCustomerResults([]);
      setShowDropdown(false);
      return;
    }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setCustomerLoading(true);
      try {
        const db = supabase as any;
        const { data } = await db
          .from("customers")
          .select("id, name, account_ref")
          .or(`name.ilike.%${customerSearch}%,account_ref.ilike.%${customerSearch}%`)
          .limit(8);
        setCustomerResults(data ?? []);
        setShowDropdown(true);
      } finally {
        setCustomerLoading(false);
      }
    }, 300);
  }, [customerSearch, selectedCustomer]);

  const run = async (action: string, extra?: Record<string, unknown>) => {
    setBusy(true);
    try {
      await callManageUser(action, user.id, extra);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      return true;
    } catch (err: any) {
      toast({ title: "Action failed", description: err.message, variant: "destructive" });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleRename = async () => {
    if (!editName.trim() || editName.trim() === user.name) { setRenameOpen(false); return; }
    const ok = await run("rename", { name: editName.trim() });
    if (!ok) return;
    setRenameOpen(false);
    toast({ title: "Name updated", description: `User renamed to ${editName.trim()}.` });
  };

  const handleResetPassword = async () => {
    setBusy(true);
    try {
      await callManageUser("reset_password", user.id);
      toast({ title: "Password reset sent", description: `A reset email has been sent to ${user.email}.` });
    } catch (err: any) {
      toast({ title: "Failed to send reset email", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleToggleActive = () =>
    run(user.is_active ? "disable" : "enable").then((ok) => {
      if (!ok) return;
      toast({
        title: user.is_active ? "User disabled" : "User enabled",
        description: `${user.name} has been ${user.is_active ? "disabled and can no longer sign in" : "re-enabled"}.`,
      });
    });

  const handleDelete = async () => {
    setConfirmDelete(false);
    const ok = await run("delete");
    if (!ok) return;
    toast({ title: "User deleted", description: `${user.name} has been permanently removed.` });
  };

  const handleChangeCustomer = async () => {
    const ok = await run("change_customer", { customer_id: selectedCustomer?.id ?? null });
    if (!ok) return;
    setChangeCustomerOpen(false);
    toast({
      title: "Customer updated",
      description: selectedCustomer
        ? `${user.name} is now linked to ${selectedCustomer.name}.`
        : `${user.name} has been unlinked from their customer account.`,
    });
  };

  const handleSavePermissions = async () => {
    const ok = await run("set_permissions", { role: roleDraft, is_admin: isAdminDraft });
    if (!ok) return;
    setPermissionsOpen(false);
    toast({
      title: "Permissions updated",
      description: `${user.name} is now ${isAdminDraft ? "an admin" : roleDraft || "customer"}.`,
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            disabled={busy}
            onClick={(e) => e.stopPropagation()}
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MoreHorizontal className="w-4 h-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem
            onClick={(e) => { e.stopPropagation(); setRenameOpen(true); }}
            className="gap-2"
          >
            <Pencil className="w-4 h-4" />
            Edit name
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={(e) => { e.stopPropagation(); setChangeCustomerOpen(true); }}
            className="gap-2"
          >
            <Building2 className="w-4 h-4" />
            Change customer
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={(e) => { e.stopPropagation(); setRoleDraft(user.role ?? "customer"); setIsAdminDraft(user.is_admin); setPermissionsOpen(true); }}
            className="gap-2"
          >
            <Shield className="w-4 h-4" />
            Edit role & admin
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={(e) => { e.stopPropagation(); handleResetPassword(); }}
            className="gap-2"
          >
            <KeyRound className="w-4 h-4" />
            Send password reset
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={(e) => { e.stopPropagation(); handleToggleActive(); }}
            className="gap-2"
          >
            {user.is_active ? (
              <><UserX className="w-4 h-4" /> Disable user</>
            ) : (
              <><UserCheck className="w-4 h-4" /> Enable user</>
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
            className="gap-2 text-destructive focus:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
            Delete user
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete confirmation */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {user.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the user and their login access. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-sm" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Edit name</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <Label htmlFor="edit-name">Full name</Label>
            <Input
              id="edit-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleRename(); }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>Cancel</Button>
            <Button onClick={handleRename} disabled={busy || !editName.trim()}>
              {busy && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change customer dialog */}
      <Dialog open={changeCustomerOpen} onOpenChange={setChangeCustomerOpen}>
        <DialogContent className="sm:max-w-sm" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Change customer — {user.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <Label>Linked customer account</Label>
            <div ref={dropdownRef} className="relative">
              {selectedCustomer ? (
                <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-md bg-muted/40">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{selectedCustomer.name}</p>
                    {selectedCustomer.account_ref && (
                      <p className="text-xs text-muted-foreground font-mono">{selectedCustomer.account_ref}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => { setSelectedCustomer(null); setCustomerSearch(""); }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <>
                  <Input
                    placeholder="Search by name or account ref…"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    onFocus={() => customerResults.length > 0 && setShowDropdown(true)}
                    autoComplete="off"
                  />
                  {customerLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                  {showDropdown && customerResults.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-md shadow-md overflow-hidden">
                      {customerResults.map((c) => (
                        <button
                          key={c.id}
                          className="w-full text-left px-3 py-2.5 hover:bg-muted transition-colors"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSelectedCustomer(c);
                            setCustomerSearch("");
                            setShowDropdown(false);
                          }}
                        >
                          <p className="text-sm font-medium">{c.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{c.account_ref}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Clear the field and save to unlink this user from any customer.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeCustomerOpen(false)}>Cancel</Button>
            <Button onClick={handleChangeCustomer} disabled={busy}>
              {busy && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions dialog */}
      <Dialog open={permissionsOpen} onOpenChange={setPermissionsOpen}>
        <DialogContent className="sm:max-w-sm" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Permissions — {user.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={roleDraft} onValueChange={setRoleDraft}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Admin access</Label>
                <Select value={isAdminDraft ? "yes" : "no"} onValueChange={(v) => setIsAdminDraft(v === "yes")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Admins can always access the management platform, even when linked to a customer account.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermissionsOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePermissions} disabled={busy}>
              {busy && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserActionsMenu;
