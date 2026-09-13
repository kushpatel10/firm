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
import { Plus, UserCircle, Loader2, Edit, Trash2 } from "lucide-react";
import { customerService } from "@/services/customer.service";
import { toast } from "sonner";

export default function CustomersPage() {
  const { firmId } = useParams();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
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

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await customerService.getAll(firmId);
      setCustomers(data?.customers || data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [firmId]);

  useEffect(() => {
    if (firmId) {
      loadCustomers();
    }
  }, [firmId, loadCustomers]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Customer name is required");
      return;
    }

    setSubmitting(true);
    try {
      await customerService.create(firmId, {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      });
      toast.success(`Customer "${name.trim()}" added successfully!`);
      setDialogOpen(false);
      setName("");
      setEmail("");
      setPhone("");
      setAddress("");
      loadCustomers();
    } catch (err) {
      toast.error(err.message || "Failed to add customer");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (cust) => {
    setSelectedCustomer(cust);
    setEditName(cust.name || "");
    setEditEmail(cust.email || "");
    setEditPhone(cust.phone || "");
    setEditAddress(cust.address || "");
    setEditDialogOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editName.trim() || !selectedCustomer) {
      toast.error("Customer name is required");
      return;
    }

    setSubmitting(true);
    try {
      await customerService.update(firmId, selectedCustomer.id, {
        name: editName.trim(),
        email: editEmail.trim() || undefined,
        phone: editPhone.trim() || undefined,
        address: editAddress.trim() || undefined,
      });
      toast.success(`Party name updated to "${editName.trim()}"!`);
      setEditDialogOpen(false);
      setSelectedCustomer(null);
      loadCustomers();
    } catch (err) {
      toast.error(err.message || "Failed to update customer");
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteDialog = (cust) => {
    setSelectedCustomer(cust);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;
    setSubmitting(true);
    try {
      await customerService.delete(firmId, selectedCustomer.id);
      toast.success(`Customer "${selectedCustomer.name}" deleted!`);
      setDeleteDialogOpen(false);
      setSelectedCustomer(null);
      loadCustomers();
    } catch (err) {
      toast.error(err.message || "Failed to delete customer");
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: "name", label: "Party / Customer Name", sortable: true },
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
            title="Edit Party Details"
            onClick={() => openEditDialog(row)}
          >
            <Edit className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
            title="Delete Party"
            onClick={() => openDeleteDialog(row)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const filteredCustomers = customers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Manage your party directory and customer records"
        breadcrumbs={[{ label: "Firm", href: `/firm/${firmId}` }, { label: "Customers" }]}
        actions={
          <PermissionGate permission="Customers.Create">
            <Button className="gap-2" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Customer
            </Button>
          </PermissionGate>
        }
      />

      <SearchInput placeholder="Search party name, phone, or email…" onSearch={setSearch} className="sm:w-80" />

      <DataTable
        columns={columns}
        data={filteredCustomers}
        loading={loading}
        emptyState={
          <EmptyState
            icon={<UserCircle className="h-8 w-8 text-muted-foreground" />}
            title="No customers yet"
            description="Add customer parties to track orders and maintain relationships."
            actionLabel="Add Customer"
            onAction={() => setDialogOpen(true)}
          />
        }
      />

      {/* Add Customer Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
            <DialogDescription>Save a new party / customer to your firm directory.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Customer / Party Name *</Label>
              <Input
                id="name"
                placeholder="Full name or Business name"
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
                placeholder="customer@example.com"
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
                Add Customer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Party / Customer</DialogTitle>
            <DialogDescription>Update party name and contact details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Customer / Party Name *</Label>
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

      {/* Delete Customer Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedCustomer?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
