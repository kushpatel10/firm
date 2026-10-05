"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Shield, Loader2 } from "lucide-react";
import { roleService } from "@/services/role.service";
import { toast } from "sonner";
import { placeholders } from "@/config/placeholders";

const PERMISSIONS_BY_MODULE = {
  Sales: ["View", "Create", "Edit", "Delete"],
  Purchase: ["View", "Create", "Edit", "Delete"],
  Expense: ["View", "Create", "Edit", "Delete"],
  Inventory: ["View", "Create", "Edit", "Delete"],
  Customers: ["View", "Create", "Edit", "Delete"],
  Suppliers: ["View", "Create", "Edit", "Delete"],
  DeliveryChallans: ["View", "Create", "Edit", "Delete"],
  Reports: ["View"],
  Settings: ["Manage"],
  Users: ["Manage"],
};

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState({});

  // Form state
  const [roleName, setRoleName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");

  const loadRoles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await roleService.getAll();
      setRoles(data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load roles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const togglePermission = (module, action) => {
    const key = `${module}.${action}`;
    setSelectedPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!roleName) {
      toast.error("Role Name is required");
      return;
    }

    setSubmitting(true);
    try {
      await roleService.create({
        name: roleName.trim(),
        description: roleDesc.trim() || undefined,
      });
      toast.success(`Role "${roleName}" created successfully!`);
      setDialogOpen(false);
      setRoleName("");
      setRoleDesc("");
      loadRoles();
    } catch (err) {
      toast.error(err.message || "Failed to create role");
    } finally {
      setSubmitting(false);
    }
  };

  const systemRoles = roles.filter((r) => r.isSystem);
  const customRoles = roles.filter((r) => !r.isSystem);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        description="Manage role-based access control"
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Roles & Permissions" }]}
        actions={
          <Button className="gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Role
          </Button>
        }
      />

      {/* System Roles */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">System Roles</h3>
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading roles…
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemRoles.map((role) => (
              <Card key={role.id} className="transition-all hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{role.name}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {role.permissions?.length || role._count?.userFirms || 0} perms
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{role.description || "System default role"}</p>
                  <Badge variant="outline" className="mt-3 text-xs">System Role</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Custom Roles */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Custom Roles</h3>
        {customRoles.length === 0 ? (
          <EmptyState
            icon={<Shield className="h-8 w-8 text-muted-foreground" />}
            title="No custom roles"
            description="Create custom roles with specific permissions tailored to your needs."
            actionLabel="Create Role"
            onAction={() => setDialogOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {customRoles.map((role) => (
              <Card key={role.id} className="transition-all hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{role.name}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {role.permissions?.length || 0} perms
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{role.description || "Custom role"}</p>
                  <Badge variant="default" className="mt-3 text-xs">Custom Role</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Permissions Matrix Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Permissions Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium">Module</th>
                  <th className="text-center py-2 px-3 font-medium">View</th>
                  <th className="text-center py-2 px-3 font-medium">Create</th>
                  <th className="text-center py-2 px-3 font-medium">Edit</th>
                  <th className="text-center py-2 px-3 font-medium">Delete</th>
                  <th className="text-center py-2 px-3 font-medium">Manage</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(PERMISSIONS_BY_MODULE).map(([module, actions]) => (
                  <tr key={module} className="border-b last:border-0">
                    <td className="py-2.5 pr-4 font-medium">{module}</td>
                    {["View", "Create", "Edit", "Delete", "Manage"].map((action) => (
                      <td key={action} className="text-center py-2.5 px-3">
                        {actions.includes(action) ? (
                          <div className="flex justify-center">
                            <Checkbox
                              checked={selectedPermissions[`${module}.${action}`] || false}
                              onCheckedChange={() => togglePermission(module, action)}
                            />
                          </div>
                        ) : (
                          <span className="text-muted-foreground/30">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create Role Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Custom Role</DialogTitle>
            <DialogDescription>Define a new role with specific permissions.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="roleName">Role Name *</Label>
              <Input
                id="roleName"
                placeholder={placeholders.admin.roleName}
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roleDesc">Description</Label>
              <Textarea
                id="roleDesc"
                placeholder={placeholders.admin.roleDesc}
                rows={2}
                value={roleDesc}
                onChange={(e) => setRoleDesc(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Role
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
