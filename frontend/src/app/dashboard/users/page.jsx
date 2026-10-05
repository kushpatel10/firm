"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchInput } from "@/components/shared/search-input";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { PermissionGate } from "@/components/shared/permission-gate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { UserPlus, Users, Loader2 } from "lucide-react";
import { userService } from "@/services/user.service";
import { toast } from "sonner";
import { placeholders } from "@/config/placeholders";

export default function FirmUsersPage() {
  const { firm, loading: authLoading } = useAuth();
  const firmId = firm?.id;
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [email, setEmail] = useState("");
  const [roleName, setRoleName] = useState("Manager");

  const loadUsers = useCallback(async () => {
    if (!firmId) return;
    setLoading(true);
    try {
      const data = await userService.getByFirmId(firmId, { search });
      setUsers(data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load firm users");
    } finally {
      setLoading(false);
    }
  }, [firmId, search]);

  useEffect(() => {
    if (!authLoading && firmId) {
      loadUsers();
    } else if (!authLoading && !firmId) {
      setLoading(false);
    }
  }, [authLoading, firmId, loadUsers]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Google Email is required");
      return;
    }

    setSubmitting(true);
    try {
      await userService.inviteToFirm(firmId, {
        email: email.trim(),
        roleName,
      });
      toast.success(`User ${email} invited successfully!`);
      setDialogOpen(false);
      setEmail("");
      loadUsers();
    } catch (err) {
      toast.error(err.message || "Failed to invite user");
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: "name", label: "Name", sortable: true, render: (val, row) => val || row.email },
    { key: "email", label: "Email" },
    {
      key: "firmAssignments",
      label: "Role",
      render: (assignments) => {
        const current = assignments?.find((a) => a.firmId === firmId || a.role?.name);
        return <Badge variant="secondary" className="text-xs">{current?.role?.name || "Member"}</Badge>;
      },
    },
    {
      key: "lastLoginAt",
      label: "Last Login",
      render: (val) => val ? new Date(val).toLocaleString() : "Never",
    },
    { key: "status", label: "Status", render: (val) => <StatusBadge status={val || "ACTIVE"} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage users within this firm"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Users" }]}
        actions={
          <PermissionGate permission="Users.Manage">
            <Button className="gap-2" onClick={() => setDialogOpen(true)}>
              <UserPlus className="h-4 w-4" />
              Invite User
            </Button>
          </PermissionGate>
        }
      />

      <SearchInput placeholder={placeholders.users.search} onSearch={setSearch} className="sm:w-80" />

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        emptyState={
          <EmptyState
            icon={<Users className="h-8 w-8 text-muted-foreground" />}
            title="No users in this firm"
            description="Invite users to collaborate. Each user needs a Google account."
            actionLabel="Invite User"
            onAction={() => setDialogOpen(true)}
          />
        }
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription>
              Add a user to this firm by their Google email address.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Google Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder={placeholders.users.email}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={roleName} onValueChange={setRoleName} required>
                <SelectTrigger><SelectValue placeholder={placeholders.users.selectRole} /></SelectTrigger>
                <SelectContent>
                  {["Owner", "Manager", "Accountant", "Sales", "Inventory", "Staff"].map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Invite
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
