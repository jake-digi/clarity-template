import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Mail, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefilledCustomer?: { id: string; name: string; account_ref: string } | null;
}

type CustomerMatch = { id: string; name: string; account_ref: string };

const InviteUserDialog = ({ open, onOpenChange, prefilledCustomer }: InviteUserDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("customer");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  // Customer search
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<CustomerMatch[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerMatch | null>(null);
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      setCustomerSearchLoading(true);
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
        setCustomerSearchLoading(false);
      }
    }, 300);
  }, [customerSearch, selectedCustomer]);

  // Apply prefilled customer when dialog opens
  useEffect(() => {
    if (open && prefilledCustomer) {
      setSelectedCustomer(prefilledCustomer);
      setCustomerSearch("");
    }
  }, [open, prefilledCustomer]);

  const reset = () => {
    setName("");
    setEmail("");
    setRole("customer");
    setIsAdmin(false);
    setCustomerSearch("");
    setCustomerResults([]);
    setSelectedCustomer(prefilledCustomer ?? null);
    setShowDropdown(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const handleInvite = async () => {
    if (!email || !name) return;
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Not authenticated", description: "Please sign in and try again.", variant: "destructive" });
        return;
      }

      const baseUrl = import.meta.env.VITE_SUPABASE_URL ?? "";
      const res = await fetch(`${baseUrl}/functions/v1/invite-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email,
          name,
          role,
          is_admin: isAdmin,
          customer_id: selectedCustomer?.id ?? null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? `Request failed (${res.status})`);

      toast({
        title: "Invitation sent",
        description: data.email_sent
          ? `Invite email sent to ${email}`
          : `User created but invite email could not be sent`,
      });

      queryClient.invalidateQueries({ queryKey: ["users"] });
      handleClose(false);
    } catch (err: any) {
      toast({
        title: "Failed to invite user",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="inv-name">Full name *</Label>
            <Input
              id="inv-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Smith"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="inv-email">Email *</Label>
            <Input
              id="inv-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
            />
          </div>

          {/* Customer assignment */}
          <div className="space-y-1.5" ref={dropdownRef}>
            <Label>Assign to customer</Label>
            {selectedCustomer ? (
              <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-md bg-muted/40">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedCustomer.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{selectedCustomer.account_ref}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setCustomerSearch("");
                  }}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  placeholder="Search by name or account ref…"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  onFocus={() => customerResults.length > 0 && setShowDropdown(true)}
                  autoComplete="off"
                />
                {customerSearchLoading && (
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
              </div>
            )}
            <p className="text-xs text-muted-foreground">Optional — links this user to a customer account</p>
          </div>

          {/* Role */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
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
              <Select value={isAdmin ? "yes" : "no"} onValueChange={(v) => setIsAdmin(v === "yes")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
          <Button onClick={handleInvite} disabled={loading || !email || !name}>
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
              : <Mail className="w-4 h-4 mr-2" />}
            Send Invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InviteUserDialog;
