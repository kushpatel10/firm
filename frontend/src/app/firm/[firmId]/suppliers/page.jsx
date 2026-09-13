"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchInput } from "@/components/shared/search-input";
import { DataTable } from "@/components/shared/data-table";
import { PermissionGate } from "@/components/shared/permission-gate";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Truck, Loader2, Edit, Trash2 } from "lucide-react";
import { supplierService } from "@/services/supplier.service";
import { toast } from "sonner";

export default function SuppliersPage() {
  const { firmId } = useParams();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [search, setSearch] = useState("");

  // Create Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Edit Form state
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await supplierService.getAll(firmId);
      setSuppliers(data?.suppliers || data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  }, [firmId]);

  useEffect(() => {
    if (firmId) {
      loadSuppliers();
    }
  }, [firmId, loadSuppliers]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Supplier name is required");
      return;
    }

    setSubmitting(true);
    try {
      await supplierService.create(firmId, {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      });
      toast.success(`Supplier "${name.trim()}" added successfully!`);
      setDialogOpen(false);
      setName("");
      setEmail("");
      setPhone("");
      setAddress("");
      loadSuppliers();
    } catch (err) {
      toast.error(err.message || "Failed to add supplier");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (sup) => {
    setSelectedSupplier(sup);
    setEditName(sup.name || "");
    setEditEmail(sup.email || "");
    setEditPhone(sup.phone || "");
    setEditAddress(sup.address || "");
    setEditDialogOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editName.trim() || !selectedSupplier) {
      toast.error("Supplier name is required");
      return;
    }

    setSubmitting(true);
    try {
      await supplierService.update(firmId, selectedSupplier.id, {
        name: editName.trim(),
        email: editEmail.trim() || undefined,
        phone: editPhone.trim() || undefined,
        address: editAddress.trim() || undefined,
      });
      toast.success(`Supplier name updated to "${editName.trim()}"!`);
      setEditDialogOpen(false);
      setSelectedSupplier(null);
      loadSuppliers();
    } catch (err) {
      toast.error(err.message || "Failed to update supplier");
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteDialog = (sup) => {
    setSelectedSupplier(sup);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedSupplier) return;
    setSubmitting(true);
    try {
      await supplierService.delete(firmId, selectedSupplier.id);
      toast.success(`Supplier "${selectedSupplier.name}" deleted!`);
      setDeleteDialogOpen(false);
      setSelectedSupplier(null);
      loadSuppliers();
    } catch (err) {
      toast.error(err.message || "Failed to delete supplier");
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: "name", label: "Supplier / Vendor Name", sortable: true },
    { key: "phone", label: "Phone", render: (val) => val || "—" },
    { key: "email", label: "Email", render: (val) => val || "—" },
    { key: "address", label: "Address", render: (val) => val || "—" },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            title="Edit Supplier"
            onClick={() => openEditDialog(row)}
          >
            <Edit className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
            title="Delete Supplier"
            onClick={() => openDeleteDialog(row)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const filteredSuppliers = suppliers.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.phone?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers"
        description="Manage your supplier directory and vendor details"
        breadcrumbs={[{ label: "Firm", href: `/firm/${firmId}` }, { label: "Suppliers" }]}
        actions={
          <PermissionGate permission="Suppliers.Create">
            <Button className="gap-2" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Supplier
            </Button>
          </PermissionGate>
        }
      />

      <SearchInput placeholder="Search supplier name, phone, or email…" onSearch={setSearch} className="sm:w-80" />

      <DataTable
        columns={columns}
        data={filteredSuppliers}
        loading={loading}
        emptyState={
          <EmptyState
            icon={<Truck className="h-8 w-8 text-muted-foreground" />}
            title="No suppliers yet"
            description="Add suppliers to manage purchase orders and track supply chains."
            actionLabel="Add Supplier"
            onAction={() => setDialogOpen(true)}
          />
        }
      />

      {/* Add Supplier Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Supplier</DialogTitle>
            <DialogDescription>Save a new supplier / vendor to your firm directory.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Supplier / Vendor Name *</Label>
              <Input
                id="name"
                placeholder="Business or Vendor Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="supplier@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                placeholder="Full address"
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Supplier
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Supplier Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Supplier / Vendor</DialogTitle>
            <DialogDescription>Update supplier name and contact details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Supplier Name *</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Textarea
                id="edit-address"
                rows={2}
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Supplier Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Supplier</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedSupplier?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Supplier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
