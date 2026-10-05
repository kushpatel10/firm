"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchInput } from "@/components/shared/search-input";
import { FilterDropdown } from "@/components/shared/filter-dropdown";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { UserPlus, Users, Loader2 } from "lucide-react";
import { USER_STATUS } from "@/types/user.types";
import { userService } from "@/services/user.service";
import { firmService } from "@/services/firm.service";
import { roleService } from "@/services/role.service";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { placeholders } from "@/config/placeholders";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [firms, setFirms] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [selectedFirmId, setSelectedFirmId] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, firmsRes, rolesRes] = await Promise.allSettled([
        userService.getAll({
          search,
          status: statusFilter.length > 0 ? statusFilter[0] : undefined,
        }),
        firmService.getAll(),
        roleService.getAll(),
      ]);

      if (usersRes.status === "fulfilled") setUsers(usersRes.value || []);
      if (firmsRes.status === "fulfilled") setFirms(firmsRes.value || []);
      if (rolesRes.status === "fulfilled") setRoles(rolesRes.value || []);
    } catch (err) {
      toast.error(err.message || "Failed to load users data");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!email || !selectedFirmId || !selectedRoleId) {
      toast.error("Google Email, Firm, and Role are required");
      return;
    }

    setSubmitting(true);
    try {
      await userService.create({
        email: email.toLowerCase().trim(),
        name: name.trim() || undefined,
        firmId: selectedFirmId,
        roleId: selectedRoleId,
      });
      toast.success(`User "${email}" added and assigned successfully!`);
      setDialogOpen(false);
      // Reset form
      setEmail("");
      setName("");
      setSelectedFirmId("");
      setSelectedRoleId("");
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: "name", label: "Name", render: (val, row) => val || row.email?.split("@")[0] || "User", sortable: true },
    { key: "email", label: "Google Email", sortable: true },
    {
      key: "firmAssignments",
      label: "Assigned Firm",
      render: (val) => val?.[0]?.firm?.name || "None",
    },
    {
      key: "role",
      label: "Role",
      render: (_, row) => row.firmAssignments?.[0]?.role?.name || (row.isSuperAdmin ? "Super Admin" : "Staff"),
    },
    {
      key: "lastLoginAt",
      label: "Last Login",
      render: (val) => formatDate(val),
    },
    {
      key: "status",
      label: "Status",
      render: (val) => <StatusBadge status={val || "ACTIVE"} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage platform users and firm assignments"
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Users" }]}
        actions={
          <Button className="gap-2" onClick={() => setDialogOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Create User
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput placeholder={placeholders.admin.usersSearch} onSearch={setSearch} className="sm:w-80" />
        <FilterDropdown
          label="Status"
          options={Object.values(USER_STATUS).map((s) => ({
            value: s, label: s.charAt(0) + s.slice(1).toLowerCase(),
          }))}
          selected={statusFilter}
          onSelectionChange={setStatusFilter}
        />
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        emptyState={
          <EmptyState
            icon={<Users className="h-8 w-8 text-muted-foreground" />}
            title="No users yet"
            description="Create users and assign them to firms with specific roles. Users authenticate via Google."
            actionLabel="Create User"
            onAction={() => setDialogOpen(true)}
          />
        }
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
            <DialogDescription>
              Assign a Google account to a firm with a specific role. The user can then sign in using Google.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Google Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder={placeholders.admin.userEmail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                placeholder={placeholders.admin.userName}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firm">Assign Firm *</Label>
              <Select value={selectedFirmId} onValueChange={setSelectedFirmId} required>
                <SelectTrigger>
                  <SelectValue placeholder={placeholders.admin.selectFirm}>
                    {firms.find((f) => f.id === selectedFirmId)?.name || placeholders.admin.selectFirm}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {firms.length === 0 ? (
                    <SelectItem value="none" disabled>No firms created yet — create a firm first</SelectItem>
                  ) : (
                    firms.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Assign Role *</Label>
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId} required>
                <SelectTrigger>
                  <SelectValue placeholder={placeholders.admin.selectRole}>
                    {roles.find((r) => r.id === selectedRoleId)?.name || placeholders.admin.selectRole}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {roles.length === 0 ? (
                    <SelectItem value="none" disabled>Loading roles…</SelectItem>
                  ) : (
                    roles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
