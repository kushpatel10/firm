"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchInput } from "@/components/shared/search-input";
import { FilterDropdown } from "@/components/shared/filter-dropdown";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { PermissionGate } from "@/components/shared/permission-gate";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ShoppingBag, Loader2, Printer, Edit, Trash2, Building2, Truck, Percent } from "lucide-react";
import { purchaseService } from "@/services/purchase.service";
import { supplierService } from "@/services/supplier.service";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

const TAX_RATE_PRESETS = [
  { label: "0% (Nil / Exempt)", value: "0" },
  { label: "5% (GST)", value: "5" },
  { label: "12% (GST)", value: "12" },
  { label: "18% (Standard GST)", value: "18" },
  { label: "28% (Luxury / Higher)", value: "28" },
  { label: "Custom Amount", value: "custom" },
];

export default function PurchasesPage() {
  const { firm, loading: authLoading } = useAuth();
  const firmId = firm?.id;
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Dialog States
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState([]);

  // Create Form State
  const [supplierMode, setSupplierMode] = useState("registered"); // "registered" | "custom"
  const [supplierId, setSupplierId] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [subtotal, setSubtotal] = useState("");
  const [taxRateType, setTaxRateType] = useState("18"); // "0" | "5" | "12" | "18" | "28" | "custom"
  const [taxAmount, setTaxAmount] = useState("");
  const [discount, setDiscount] = useState("0");
  const [status, setStatus] = useState("RECEIVED");

  // Edit Form State
  const [editSupplierId, setEditSupplierId] = useState("");
  const [editSupplierName, setEditSupplierName] = useState("");
  const [editInvoiceNumber, setEditInvoiceNumber] = useState("");
  const [editSubtotal, setEditSubtotal] = useState("");
  const [editTaxRateType, setEditTaxRateType] = useState("18");
  const [editTaxAmount, setEditTaxAmount] = useState("");
  const [editDiscount, setEditDiscount] = useState("0");
  const [editStatus, setEditStatus] = useState("RECEIVED");

  const loadPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const data = await purchaseService.getAll(firmId);
      setPurchases(data?.purchases || data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load purchases");
    } finally {
      setLoading(false);
    }
  }, [firmId]);

  useEffect(() => {
    if (!authLoading && firmId) {
      loadPurchases();
      supplierService.getAll(firmId).then((res) => {
        setSuppliers(res?.suppliers || res || []);
      }).catch(() => {});
    } else if (!authLoading && !firmId) {
      setLoading(false);
    }
  }, [authLoading, firmId, loadPurchases]);

  // Tax calculation helper for Create Form
  const calcTaxAmount = (subVal, rateType, customVal) => {
    const sub = parseFloat(subVal) || 0;
    if (rateType === "custom") {
      return parseFloat(customVal) || 0;
    }
    const rate = parseFloat(rateType) || 0;
    return (sub * rate) / 100;
  };

  const calculatedCreateTax = calcTaxAmount(subtotal, taxRateType, taxAmount);
  const calculatedCreateGrandTotal = Math.max(
    0,
    (parseFloat(subtotal) || 0) + calculatedCreateTax - (parseFloat(discount) || 0)
  );

  const calculatedEditTax = calcTaxAmount(editSubtotal, editTaxRateType, editTaxAmount);
  const calculatedEditGrandTotal = Math.max(
    0,
    (parseFloat(editSubtotal) || 0) + calculatedEditTax - (parseFloat(editDiscount) || 0)
  );

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!subtotal || parseFloat(subtotal) <= 0) {
      toast.error("Please enter a valid subtotal amount");
      return;
    }

    const selectedSup = suppliers.find((s) => s.id === supplierId);
    const finalSupplierName = supplierMode === "registered"
      ? (selectedSup?.name || supplierName.trim() || "General Supplier")
      : (supplierName.trim() || "General Supplier");

    setSubmitting(true);
    try {
      const created = await purchaseService.create(firmId, {
        supplierId: supplierMode === "registered" ? (supplierId || undefined) : undefined,
        supplierName: finalSupplierName,
        invoiceNumber: invoiceNumber.trim() || undefined,
        subtotal: parseFloat(subtotal),
        tax: calculatedCreateTax,
        discount: parseFloat(discount) || 0,
        total: calculatedCreateGrandTotal,
        status,
        items: [],
      });
      toast.success("Purchase recorded successfully with Tax calculation!");
      setCreateDialogOpen(false);
      resetCreateForm();
      loadPurchases();

      if (created) {
        setSelectedPurchase(created);
        setInvoiceModalOpen(true);
      }
    } catch (err) {
      toast.error(err.message || "Failed to create purchase");
    } finally {
      setSubmitting(false);
    }
  };

  const resetCreateForm = () => {
    setSupplierId("");
    setSupplierName("");
    setInvoiceNumber("");
    setSubtotal("");
    setTaxRateType("18");
    setTaxAmount("");
    setDiscount("0");
    setStatus("RECEIVED");
    setSupplierMode("registered");
  };

  const openEditDialog = (purchase) => {
    setSelectedPurchase(purchase);
    setEditSupplierId(purchase.supplierId || "");
    setEditSupplierName(purchase.supplierName || purchase.supplier?.name || "");
    setEditInvoiceNumber(purchase.invoiceNumber || "");
    setEditSubtotal(String(purchase.subtotal || purchase.total || ""));
    setEditTaxRateType("custom");
    setEditTaxAmount(String(purchase.tax || 0));
    setEditDiscount(String(purchase.discount || 0));
    setEditStatus(purchase.status || "RECEIVED");
    setEditDialogOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editSubtotal || !selectedPurchase) {
      toast.error("Subtotal amount is required");
      return;
    }

    setSubmitting(true);
    try {
      const selectedSup = suppliers.find((s) => s.id === editSupplierId);
      await purchaseService.update(firmId, selectedPurchase.id, {
        supplierId: editSupplierId || undefined,
        supplierName: selectedSup?.name || editSupplierName.trim() || "General Supplier",
        invoiceNumber: editInvoiceNumber.trim() || undefined,
        subtotal: parseFloat(editSubtotal),
        tax: calculatedEditTax,
        discount: parseFloat(editDiscount) || 0,
        total: calculatedEditGrandTotal,
        status: editStatus,
      });
      toast.success("Purchase updated successfully!");
      setEditDialogOpen(false);
      setSelectedPurchase(null);
      loadPurchases();
    } catch (err) {
      toast.error(err.message || "Failed to update purchase");
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteDialog = (purchase) => {
    setSelectedPurchase(purchase);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedPurchase) return;
    setSubmitting(true);
    try {
      await purchaseService.delete(firmId, selectedPurchase.id);
      toast.success("Purchase record deleted!");
      setDeleteDialogOpen(false);
      setSelectedPurchase(null);
      loadPurchases();
    } catch (err) {
      toast.error(err.message || "Failed to delete purchase");
    } finally {
      setSubmitting(false);
    }
  };

  const viewPurchaseInvoice = (purchase) => {
    setSelectedPurchase(purchase);
    setInvoiceModalOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const columns = [
    {
      key: "invoiceNumber",
      label: "Bill / Invoice #",
      render: (val, row) => (
        <span className="font-mono font-semibold">
          {val || `PUR-${row.id?.slice(0, 6)}`}
        </span>
      ),
      sortable: true,
    },
    {
      key: "supplierName",
      label: "Supplier / Vendor",
      render: (val, row) => val || row.supplier?.name || "General Supplier",
      sortable: true,
    },
    {
      key: "createdAt",
      label: "Date",
      render: (val) => formatDate(val),
      sortable: true,
    },
    {
      key: "subtotal",
      label: "Subtotal (₹)",
      render: (val, row) => formatCurrency(val || (row.total - (row.tax || 0)) || 0),
      sortable: true,
    },
    {
      key: "tax",
      label: "Tax (₹)",
      render: (val) => (
        <span className={val > 0 ? "text-primary font-mono font-medium" : "text-muted-foreground"}>
          {val > 0 ? formatCurrency(val) : "₹0"}
        </span>
      ),
      sortable: true,
    },
    {
      key: "total",
      label: "Grand Total",
      render: (val) => (
        <span className="font-bold text-foreground">
          {formatCurrency(val || 0)}
        </span>
      ),
      sortable: true,
    },
    {
      key: "status",
      label: "Status",
      render: (val) => <StatusBadge status={val || "RECEIVED"} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1"
            onClick={() => viewPurchaseInvoice(row)}
            title="View Bill / PO"
          >
            <Printer className="h-3.5 w-3.5" />
            Print
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            title="Edit Purchase"
            onClick={() => openEditDialog(row)}
          >
            <Edit className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
            title="Delete Purchase"
            onClick={() => openDeleteDialog(row)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const filteredPurchases = purchases.filter((p) => {
    if (search) {
      const q = search.toLowerCase();
      const matchInv = p.invoiceNumber?.toLowerCase().includes(q);
      const matchSup = p.supplierName?.toLowerCase().includes(q) || p.supplier?.name?.toLowerCase().includes(q);
      if (!matchInv && !matchSup) return false;
    }
    if (statusFilter.length > 0 && !statusFilter.includes(p.status)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchases"
        description="Track supplier orders, purchase invoices, and input tax / GST breakdown"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Purchases" }]}
        actions={
          <PermissionGate permission="Purchase.Create">
            <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              New Purchase
            </Button>
          </PermissionGate>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput placeholder="Search supplier or invoice #…" onSearch={setSearch} className="sm:w-80" />
        <FilterDropdown
          label="Status"
          options={[
            { value: "ORDERED", label: "Ordered" },
            { value: "RECEIVED", label: "Received" },
            { value: "CANCELLED", label: "Cancelled" },
          ]}
          selected={statusFilter}
          onSelectionChange={setStatusFilter}
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredPurchases}
        loading={loading}
        emptyState={
          <EmptyState
            icon={<ShoppingBag className="h-8 w-8 text-muted-foreground" />}
            title="No purchases recorded"
            description="Record a purchase or supplier invoice with GST/Tax calculation."
            actionLabel="New Purchase"
            onAction={() => setCreateDialogOpen(true)}
          />
        }
      />

      {/* Create Purchase Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[92vh] overflow-y-auto w-[95vw] p-4 sm:p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Truck className="h-5 w-5 text-primary" />
              New Purchase Entry
            </DialogTitle>
            <DialogDescription className="text-xs">
              Record supplier bill with tax rates (0%, 5%, 12%, 18%, 28%) and auto-calculated totals.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4">
            {/* Supplier Section */}
            <div className="border p-3.5 rounded-xl bg-muted/40 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Supplier / Vendor *</Label>
                {suppliers.length > 0 && (
                  <div className="flex items-center gap-1 bg-background border p-0.5 rounded-lg text-xs">
                    <button
                      type="button"
                      onClick={() => setSupplierMode("registered")}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        supplierMode === "registered" ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground"
                      }`}
                    >
                      Registered
                    </button>
                    <button
                      type="button"
                      onClick={() => setSupplierMode("custom")}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        supplierMode === "custom" ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground"
                      }`}
                    >
                      Custom
                    </button>
                  </div>
                )}
              </div>

              {supplierMode === "registered" && suppliers.length > 0 ? (
                <Select value={supplierId} onValueChange={(val) => {
                  setSupplierId(val);
                  const s = suppliers.find((x) => x.id === val);
                  if (s) setSupplierName(s.name);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select registered supplier">
                      {suppliers.find((s) => s.id === supplierId)?.name || supplierName || "Select registered supplier"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder="Enter Supplier name (e.g. Acme Raw Materials Ltd)"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  required
                />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <Label htmlFor="pur-inv" className="text-xs">Supplier Invoice / Bill #</Label>
                  <Input
                    id="pur-inv"
                    placeholder="e.g. BILL-9481 (Optional)"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ORDERED">Ordered</SelectItem>
                      <SelectItem value="RECEIVED">Received</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Financials & Tax Option Section */}
            <div className="border p-4 rounded-xl bg-card space-y-3">
              <div className="flex items-center gap-2 border-b pb-2">
                <Percent className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">Tax & Amount Calculation</span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pur-subtotal" className="text-xs">Subtotal Amount (Before Tax) (₹) *</Label>
                <Input
                  id="pur-subtotal"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={subtotal}
                  onChange={(e) => setSubtotal(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tax / GST Rate Option</Label>
                  <Select value={taxRateType} onValueChange={setTaxRateType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TAX_RATE_PRESETS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {taxRateType === "custom" ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="custom-tax" className="text-xs">Custom Tax Amount (₹)</Label>
                    <Input
                      id="custom-tax"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={taxAmount}
                      onChange={(e) => setTaxAmount(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Calculated Tax Amount</Label>
                    <div className="h-9 px-3 py-2 rounded-md border bg-muted/50 font-mono text-sm flex items-center justify-end font-semibold text-primary">
                      {formatCurrency(calculatedCreateTax)}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pur-discount" className="text-xs">Discount (₹)</Label>
                  <Input
                    id="pur-discount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Grand Total (₹)</Label>
                  <div className="h-9 px-3 py-2 rounded-md border-2 border-primary/40 bg-primary/5 font-mono text-base flex items-center justify-end font-bold text-primary">
                    {formatCurrency(calculatedCreateGrandTotal)}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Purchase
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Purchase Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[92vh] overflow-y-auto w-[95vw] p-4 sm:p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Edit className="h-5 w-5 text-primary" />
              Edit Purchase Entry
            </DialogTitle>
            <DialogDescription className="text-xs">
              Update supplier, bill details, and tax amounts.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="border p-3.5 rounded-xl bg-muted/40 space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Supplier Name *</Label>
                <Input
                  value={editSupplierName}
                  onChange={(e) => setEditSupplierName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <Label className="text-xs">Invoice / Bill #</Label>
                  <Input
                    value={editInvoiceNumber}
                    onChange={(e) => setEditInvoiceNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Status</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ORDERED">Ordered</SelectItem>
                      <SelectItem value="RECEIVED">Received</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="border p-4 rounded-xl bg-card space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Subtotal Amount (₹) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editSubtotal}
                  onChange={(e) => setEditSubtotal(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tax Option</Label>
                  <Select value={editTaxRateType} onValueChange={setEditTaxRateType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TAX_RATE_PRESETS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {editTaxRateType === "custom" ? (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tax Amount (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editTaxAmount}
                      onChange={(e) => setEditTaxAmount(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Calculated Tax Amount</Label>
                    <div className="h-9 px-3 py-2 rounded-md border bg-muted/50 font-mono text-sm flex items-center justify-end font-semibold text-primary">
                      {formatCurrency(calculatedEditTax)}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Discount (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editDiscount}
                    onChange={(e) => setEditDiscount(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Grand Total (₹)</Label>
                  <div className="h-9 px-3 py-2 rounded-md border-2 border-primary/40 bg-primary/5 font-mono text-base flex items-center justify-end font-bold text-primary">
                    {formatCurrency(calculatedEditGrandTotal)}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Purchase
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Purchase Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Purchase</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete purchase #{selectedPurchase?.invoiceNumber || selectedPurchase?.id?.slice(0, 6)} from "{selectedPurchase?.supplierName || selectedPurchase?.supplier?.name}" for {formatCurrency(selectedPurchase?.total || 0)}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Printable Purchase Order / Bill Modal */}
      <Dialog open={invoiceModalOpen} onOpenChange={setInvoiceModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] p-4 sm:p-6 space-y-6">
          {selectedPurchase && (
            <div className="space-y-6">
              <div id="printable-purchase" className="border rounded-2xl p-4 sm:p-8 bg-background space-y-6 shadow-sm">
                <div className="flex justify-between items-start border-b pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-6 w-6 text-primary" />
                      <h2 className="text-xl font-bold uppercase tracking-tight">{selectedPurchase.firm?.name || "Business Firm"}</h2>
                    </div>
                    {selectedPurchase.firm?.address && <p className="text-xs text-muted-foreground mt-1">{selectedPurchase.firm.address}</p>}
                    {selectedPurchase.firm?.phone && <p className="text-xs text-muted-foreground">Phone: {selectedPurchase.firm.phone}</p>}
                    {selectedPurchase.firm?.gstNumber && <p className="text-xs font-mono text-muted-foreground mt-0.5">GSTIN: {selectedPurchase.firm.gstNumber}</p>}
                  </div>

                  <div className="text-right">
                    <span className="inline-block bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-md text-xs font-bold font-mono tracking-wide">
                      PURCHASE VOUCHER
                    </span>
                    <p className="text-sm font-bold font-mono mt-2">{selectedPurchase.invoiceNumber || `PUR-${selectedPurchase.id?.slice(0, 6)}`}</p>
                    <p className="text-xs text-muted-foreground">Date: {formatDate(selectedPurchase.createdAt || selectedPurchase.date)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-xl">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Supplier / Vendor:</p>
                    <p className="font-bold text-foreground mt-0.5 text-base">{selectedPurchase.supplierName || selectedPurchase.supplier?.name || "General Supplier"}</p>
                    {selectedPurchase.supplier?.phone && <p className="text-xs text-muted-foreground">Phone: {selectedPurchase.supplier.phone}</p>}
                    {selectedPurchase.supplier?.address && <p className="text-xs text-muted-foreground">{selectedPurchase.supplier.address}</p>}
                  </div>
                  <div className="sm:text-right">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Status:</p>
                    <p className="font-bold text-primary mt-0.5">{selectedPurchase.status || "RECEIVED"}</p>
                  </div>
                </div>

                {/* Subtotal, Tax and Totals breakdown */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-t pt-4">
                  <div className="text-xs text-muted-foreground">
                    <p>Verified inward purchase record.</p>
                  </div>

                  <div className="space-y-1.5 text-sm min-w-[240px] border p-4 rounded-xl bg-card">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Subtotal (Before Tax):</span>
                      <span className="font-mono">{formatCurrency(selectedPurchase.subtotal || (selectedPurchase.total - (selectedPurchase.tax || 0)))}</span>
                    </div>
                    {selectedPurchase.tax > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-primary font-medium">Input Tax / GST:</span>
                        <span className="font-mono font-medium text-primary">+{formatCurrency(selectedPurchase.tax)}</span>
                      </div>
                    )}
                    {selectedPurchase.discount > 0 && (
                      <div className="flex justify-between text-xs text-destructive">
                        <span>Discount:</span>
                        <span className="font-mono">-{formatCurrency(selectedPurchase.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base border-t pt-1.5">
                      <span>Grand Total:</span>
                      <span className="font-mono text-primary">{formatCurrency(selectedPurchase.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex justify-between sm:justify-between items-center gap-2">
                <Button variant="outline" onClick={() => setInvoiceModalOpen(false)}>Close</Button>
                <Button onClick={handlePrint} className="gap-2">
                  <Printer className="h-4 w-4" /> Print Purchase Voucher
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
