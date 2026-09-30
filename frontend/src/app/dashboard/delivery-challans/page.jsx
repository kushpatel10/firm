"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchInput } from "@/components/shared/search-input";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { PermissionGate } from "@/components/shared/permission-gate";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, Loader2 } from "lucide-react";
import { deliveryChallanService } from "@/services/delivery-challan.service";
import { customerService } from "@/services/customer.service";
import { useAuth } from "@/contexts/auth-context";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function DeliveryChallansPage() {
  const { firm, loading: authLoading } = useAuth();
  const firmId = firm?.id;
  const [challans, setChallans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Form state
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [challanNumber, setChallanNumber] = useState("");
  const [status, setStatus] = useState("DELIVERED");

  const loadChallans = useCallback(async () => {
    if (!firmId) return;
    setLoading(true);
    try {
      const data = await deliveryChallanService.getAll(firmId);
      setChallans(data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load delivery challans");
    } finally {
      setLoading(false);
    }
  }, [firmId]);

  useEffect(() => {
    if (!authLoading && firmId) {
      loadChallans();
      customerService.getAll(firmId).then(setCustomers).catch(() => {});
    } else if (!authLoading && !firmId) {
      setLoading(false);
    }
  }, [authLoading, firmId, loadChallans]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const selectedCust = customers.find((c) => c.id === customerId);
      await deliveryChallanService.create(firmId, {
        customerId: customerId || undefined,
        customerName: selectedCust?.name || customerName || "General Customer",
        challanNumber: challanNumber.trim() || undefined,
        status,
        items: [],
      });
      toast.success("Delivery challan created successfully!");
      setDialogOpen(false);
      setCustomerId("");
      setCustomerName("");
      setChallanNumber("");
      loadChallans();
    } catch (err) {
      toast.error(err.message || "Failed to create delivery challan");
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: "challanNumber", label: "Challan #", render: (val, row) => val || `DC-${row.id?.slice(0, 6)}`, sortable: true },
    { key: "customerName", label: "Customer", render: (val, row) => val || row.customer?.name || "General Customer" },
    { key: "createdAt", label: "Date", render: (val) => formatDate(val), sortable: true },
    { key: "status", label: "Status", render: (val) => <StatusBadge status={val || "DELIVERED"} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Challans"
        description="Generate and manage delivery challans"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Delivery Challans" }]}
        actions={
          <PermissionGate permission="DeliveryChallans.Create">
            <Button className="gap-2" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Generate Challan
            </Button>
          </PermissionGate>
        }
      />

      <SearchInput placeholder="Search challans…" onSearch={setSearch} className="sm:w-80" />

      <DataTable
        columns={columns}
        data={challans}
        loading={loading}
        emptyState={
          <EmptyState
            icon={<FileText className="h-8 w-8 text-muted-foreground" />}
            title="No delivery challans"
            description="Generate a delivery challan when shipping goods to customers."
            actionLabel="Generate Challan"
            onAction={() => setDialogOpen(true)}
          />
        }
      />

      {/* Create Delivery Challan Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Delivery Challan</DialogTitle>
            <DialogDescription>Create a dispatch document for goods delivery.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer">Customer</Label>
              {customers.length > 0 ? (
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select existing customer">
                      {customers.find((c) => c.id === customerId)?.name || customerName || "Select existing customer"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder="Customer name (e.g. John Doe)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="challanNo">Challan Number</Label>
              <Input
                id="challanNo"
                placeholder="e.g. DC-001 (auto-generated if empty)"
                value={challanNumber}
                onChange={(e) => setChallanNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SHIPPED">Shipped</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Challan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
