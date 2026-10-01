"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, ShoppingCart, Loader2, Trash2, Edit, Printer, FileText, Building2, User, Download, Share2, Tag, Boxes, Sparkles, CheckCircle2, Phone, MapPin, Send
} from "lucide-react";
import { SALE_STATUS } from "@/types/sales.types";
import { salesService } from "@/services/sales.service";
import { customerService } from "@/services/customer.service";
import { inventoryService } from "@/services/inventory.service";
import { useAuth } from "@/contexts/auth-context";
import { ItemCombobox } from "@/features/firm/components/item-combobox";
import { SizeSelector } from "@/features/firm/components/size-selector";
import { QuickAddItemDialog } from "@/features/firm/components/quick-add-item-dialog";
import { SaleVoucherFlow } from "@/features/sale-voucher";
import { formatCurrency, formatDate, numberToWords } from "@/lib/utils";
import { toast } from "sonner";

export default function SalesPage() {
  const { firm: authFirm, loading: authLoading } = useAuth();
  const firmId = authFirm?.id;
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Dialog & Flow states
  const [saleFlowOpen, setSaleFlowOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState([]);
  const [colorFilter, setColorFilter] = useState("all"); // "all" | "PAKU" | "KACHU"

  // Party Selection Mode (Create)
  const [partyMode, setPartyMode] = useState("registered"); // "registered" | "custom"

  // Tally-Style Create Form State
  const [customerId, setCustomerId] = useState("");
  const [partyName, setPartyName] = useState("");
  const [partyPhone, setPartyPhone] = useState("");
  const [partyAddress, setPartyAddress] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [saleType, setSaleType] = useState("PAKU"); // "PAKU" (White/Official) vs "KACHU" (Black/Rough)
  const [description, setDescription] = useState("");
  const [tax, setTax] = useState("0");
  const [discount, setDiscount] = useState("0");
  const [status, setStatus] = useState("CONFIRMED");

  // Dynamic Item Rows (Create)
  const [lineItems, setLineItems] = useState([
    { id: 1, name: "", size: "", isCustom: false, availableSizes: [], quantity: 1, unit: "pcs", unitPrice: 0, total: 0 }
  ]);
  const [quickItemOpen, setQuickItemOpen] = useState(false);
  const [quickItemTarget, setQuickItemTarget] = useState({ type: "create", index: 0, initialName: "" });

  // Edit Form State
  const [editPartyMode, setEditPartyMode] = useState("custom");
  const [editCustomerId, setEditCustomerId] = useState("");
  const [editPartyName, setEditPartyName] = useState("");
  const [editPartyPhone, setEditPartyPhone] = useState("");
  const [editPartyAddress, setEditPartyAddress] = useState("");
  const [editInvoiceNumber, setEditInvoiceNumber] = useState("");
  const [editSaleType, setEditSaleType] = useState("PAKU");
  const [editDescription, setEditDescription] = useState("");
  const [editTax, setEditTax] = useState("0");
  const [editDiscount, setEditDiscount] = useState("0");
  const [editStatus, setEditStatus] = useState("CONFIRMED");
  const [editLineItems, setEditLineItems] = useState([]);

  const loadSalesData = useCallback(async () => {
    if (!firmId) return;
    setLoading(true);
    try {
      const data = await salesService.getAll(firmId);
      setSales(data?.sales || data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load sales");
    } finally {
      setLoading(false);
    }
  }, [firmId]);

  useEffect(() => {
    if (!authLoading && firmId) {
      loadSalesData();
      customerService.getAll(firmId).then((res) => {
        setCustomers(res?.customers || res || []);
      }).catch(() => {});
      inventoryService.getAll(firmId).then((res) => {
        setInventoryItems(res?.inventoryItems || res || []);
      }).catch(() => {});
    } else if (!authLoading && !firmId) {
      setLoading(false);
    }
  }, [authLoading, firmId, loadSalesData]);

  // Helper to parse sizes array from inventory item
  const parseItemSizes = (item) => {
    if (!item?.sizes) return [];
    if (Array.isArray(item.sizes)) {
      return item.sizes.map((s) => (typeof s === "string" ? { size: s, price: null } : { size: s.size, price: s.price || null }));
    }
    if (typeof item.sizes === "object") {
      return Object.entries(item.sizes).map(([size, price]) => ({ size, price: typeof price === "number" ? price : null }));
    }
    return [];
  };

  // Handle selecting an inventory item for Create Form
  const selectLineItem = (index, invItem) => {
    const updated = [...lineItems];
    const availableSizes = parseItemSizes(invItem);
    updated[index].name = invItem.name;
    updated[index].unitPrice = invItem.sellingPrice || 0;
    updated[index].unit = invItem.unit || "pcs";
    updated[index].category = invItem.category || "";
    updated[index].availableSizes = availableSizes;
    if (availableSizes.length > 0) {
      updated[index].size = availableSizes[0].size;
      if (availableSizes[0].price) updated[index].unitPrice = parseFloat(availableSizes[0].price);
    } else {
      updated[index].size = "";
    }

    const qty = parseFloat(updated[index].quantity) || 0;
    const price = parseFloat(updated[index].unitPrice) || 0;
    updated[index].total = qty * price;
    setLineItems(updated);
  };

  // Handle selecting size for Create Form
  const selectLineItemSize = (index, sizeVal, customPrice) => {
    const updated = [...lineItems];
    updated[index].size = sizeVal;
    if (customPrice !== null && customPrice !== undefined && !isNaN(customPrice) && customPrice > 0) {
      updated[index].unitPrice = customPrice;
    } else {
      const matched = inventoryItems.find((inv) => inv.name.toLowerCase() === (updated[index].name || "").toLowerCase());
      if (matched && matched.sellingPrice) {
        updated[index].unitPrice = matched.sellingPrice;
      }
    }
    const qty = parseFloat(updated[index].quantity) || 0;
    const price = parseFloat(updated[index].unitPrice) || 0;
    updated[index].total = qty * price;
    setLineItems(updated);
  };

  // Handle Item Row changes for Create Form
  const updateLineItem = (index, field, value) => {
    const updated = [...lineItems];
    updated[index][field] = value;

    if (field === "name" && inventoryItems.length > 0) {
      const matched = inventoryItems.find((inv) => inv.name.toLowerCase() === (value || "").toLowerCase());
      if (matched) {
        updated[index].unitPrice = matched.sellingPrice || 0;
        updated[index].unit = matched.unit || "pcs";
        updated[index].availableSizes = parseItemSizes(matched);
      }
    }

    const qty = parseFloat(updated[index].quantity) || 0;
    const price = parseFloat(updated[index].unitPrice) || 0;
    updated[index].total = qty * price;

    setLineItems(updated);
  };

  const addLineItem = (isCustom = false) => {
    setLineItems([
      ...lineItems,
      { id: Date.now(), name: "", size: "", isCustom, availableSizes: [], quantity: 1, unit: "pcs", unitPrice: 0, total: 0 }
    ]);
  };

  const toggleLineItemMode = (index) => {
    const updated = [...lineItems];
    updated[index].isCustom = !updated[index].isCustom;
    if (!updated[index].isCustom && updated[index].name) {
      const matched = inventoryItems.find((inv) => inv.name?.toLowerCase() === updated[index].name.toLowerCase());
      if (matched) {
        selectLineItem(index, matched);
        return;
      }
    }
    setLineItems(updated);
  };

  const removeLineItem = (index) => {
    if (lineItems.length === 1) {
      toast.info("Sales voucher requires at least one item.");
      return;
    }
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  // Subtotal and Total calculations for Create Form
  const itemsSubtotal = lineItems.reduce((acc, item) => acc + (parseFloat(item.total) || 0), 0);
  const taxAmount = parseFloat(tax) || 0;
  const discountAmount = parseFloat(discount) || 0;
  const grandTotal = Math.max(0, itemsSubtotal + taxAmount - discountAmount);

  // Handle selecting an inventory item for Edit Form
  const selectEditLineItem = (index, invItem) => {
    const updated = [...editLineItems];
    const availableSizes = parseItemSizes(invItem);
    updated[index].name = invItem.name;
    updated[index].unitPrice = invItem.sellingPrice || 0;
    updated[index].unit = invItem.unit || "pcs";
    updated[index].category = invItem.category || "";
    updated[index].availableSizes = availableSizes;
    if (availableSizes.length > 0) {
      updated[index].size = availableSizes[0].size;
      if (availableSizes[0].price) updated[index].unitPrice = parseFloat(availableSizes[0].price);
    } else {
      updated[index].size = "";
    }

    const qty = parseFloat(updated[index].quantity) || 0;
    const price = parseFloat(updated[index].unitPrice) || 0;
    updated[index].total = qty * price;
    setEditLineItems(updated);
  };

  // Handle selecting size for Edit Form
  const selectEditLineItemSize = (index, sizeVal, customPrice) => {
    const updated = [...editLineItems];
    updated[index].size = sizeVal;
    if (customPrice !== null && customPrice !== undefined && !isNaN(customPrice) && customPrice > 0) {
      updated[index].unitPrice = customPrice;
    } else {
      const matched = inventoryItems.find((inv) => inv.name.toLowerCase() === (updated[index].name || "").toLowerCase());
      if (matched && matched.sellingPrice) {
        updated[index].unitPrice = matched.sellingPrice;
      }
    }
    const qty = parseFloat(updated[index].quantity) || 0;
    const price = parseFloat(updated[index].unitPrice) || 0;
    updated[index].total = qty * price;
    setEditLineItems(updated);
  };

  // Handle Item Row changes for Edit Form
  const updateEditLineItem = (index, field, value) => {
    const updated = [...editLineItems];
    updated[index][field] = value;

    if (field === "name" && !updated[index].isCustom && inventoryItems.length > 0) {
      const matched = inventoryItems.find((inv) => inv.name.toLowerCase() === (value || "").toLowerCase());
      if (matched) {
        updated[index].unitPrice = matched.sellingPrice || 0;
        updated[index].unit = matched.unit || "pcs";
        updated[index].availableSizes = parseItemSizes(matched);
      }
    }

    const qty = parseFloat(updated[index].quantity) || 0;
    const price = parseFloat(updated[index].unitPrice) || 0;
    updated[index].total = qty * price;

    setEditLineItems(updated);
  };

  const addEditLineItem = (isCustom = false) => {
    setEditLineItems([
      ...editLineItems,
      { id: Date.now(), name: "", size: "", isCustom, availableSizes: [], quantity: 1, unit: "pcs", unitPrice: 0, total: 0 }
    ]);
  };

  const toggleEditLineItemMode = (index) => {
    const updated = [...editLineItems];
    updated[index].isCustom = !updated[index].isCustom;
    if (!updated[index].isCustom && updated[index].name) {
      const matched = inventoryItems.find((inv) => inv.name?.toLowerCase() === updated[index].name.toLowerCase());
      if (matched) {
        selectEditLineItem(index, matched);
        return;
      }
    }
    setEditLineItems(updated);
  };

  const removeEditLineItem = (index) => {
    if (editLineItems.length === 1) {
      toast.info("Sales voucher requires at least one item.");
      return;
    }
    setEditLineItems(editLineItems.filter((_, i) => i !== index));
  };

  // Subtotal and Total calculations for Edit Form
  const editItemsSubtotal = editLineItems.reduce((acc, item) => acc + (parseFloat(item.total) || 0), 0);
  const editTaxAmount = parseFloat(editTax) || 0;
  const editDiscountAmount = parseFloat(editDiscount) || 0;
  const editGrandTotal = Math.max(0, editItemsSubtotal + editTaxAmount - editDiscountAmount);

  const handleQuickItemCreated = (newItem) => {
    setInventoryItems((prev) => [newItem, ...prev]);
    if (quickItemTarget.type === "create") {
      selectLineItem(quickItemTarget.index, newItem);
    } else {
      selectEditLineItem(quickItemTarget.index, newItem);
    }
  };

  const handleCreateSale = async (e) => {
    e.preventDefault();

    const validItems = lineItems.filter((i) => i.name.trim() !== "");
    if (validItems.length === 0) {
      toast.error("Please enter at least one item for the sale");
      return;
    }

    const selectedCust = customers.find((c) => c.id === customerId);
    const finalPartyName = partyMode === "registered"
      ? (selectedCust?.name || partyName.trim() || "Walk-in Customer")
      : (partyName.trim() || "Walk-in Customer");

    // Package party details in description if custom
    let finalDesc = description.trim();
    if (partyMode === "custom") {
      const parts = [];
      if (partyPhone.trim()) parts.push(`Phone: ${partyPhone.trim()}`);
      if (partyAddress.trim()) parts.push(`Address: ${partyAddress.trim()}`);
      if (finalDesc) parts.push(finalDesc);
      finalDesc = parts.join(" | ");
    }

    setSubmitting(true);
    try {
      const created = await salesService.create(firmId, {
        customerId: partyMode === "registered" ? (customerId || undefined) : undefined,
        customerName: finalPartyName,
        invoiceNumber: invoiceNumber.trim() || undefined,
        saleType,
        description: finalDesc || undefined,
        subtotal: itemsSubtotal,
        tax: taxAmount,
        discount: discountAmount,
        total: grandTotal,
        status,
        items: validItems.map((item) => ({
          name: item.name.trim(),
          size: item.size ? item.size.trim() : null,
          quantity: parseInt(item.quantity) || 1,
          unit: item.unit || "pcs",
          unitPrice: parseFloat(item.unitPrice) || 0,
        })),
      });

      toast.success(`${saleType === "KACHU" ? "Black" : "White"} Sale voucher saved successfully!`);
      setCreateDialogOpen(false);
      resetForm();
      loadSalesData();

      if (created) {
        setSelectedSale(created);
        setInvoiceModalOpen(true);
      }
    } catch (err) {
      toast.error(err.message || "Failed to create sale");
    } finally {
      setSubmitting(false);
    }
  };

  const openCreateSale = () => {
    setSelectedSale(null);
    setSaleFlowOpen(true);
  };

  const openEditSale = (sale) => {
    setSelectedSale(sale);
    setSaleFlowOpen(true);
  };

  const handleSaveVoucherFlow = async (voucherPayload, saleId) => {
    let result;
    if (saleId) {
      result = await salesService.update(firmId, saleId, voucherPayload);
    } else {
      result = await salesService.create(firmId, voucherPayload);
    }
    loadSalesData();
    return result;
  };

  const handleUpdateSale = async (e) => {
    e.preventDefault();
    if (!selectedSale) return;

    const validItems = editLineItems.filter((i) => i.name.trim() !== "");
    if (validItems.length === 0) {
      toast.error("Please enter at least one item for the sale");
      return;
    }

    const selectedCust = customers.find((c) => c.id === editCustomerId);
    const finalPartyName = editPartyMode === "registered"
      ? (selectedCust?.name || editPartyName.trim() || "Walk-in Customer")
      : (editPartyName.trim() || "Walk-in Customer");

    let finalDesc = editDescription.trim();
    if (editPartyMode === "custom") {
      const parts = [];
      if (editPartyPhone.trim()) parts.push(`Phone: ${editPartyPhone.trim()}`);
      if (editPartyAddress.trim()) parts.push(`Address: ${editPartyAddress.trim()}`);
      if (finalDesc) parts.push(finalDesc);
      finalDesc = parts.join(" | ");
    }

    setSubmitting(true);
    try {
      const updated = await salesService.update(firmId, selectedSale.id, {
        customerId: editPartyMode === "registered" ? (editCustomerId || undefined) : undefined,
        customerName: finalPartyName,
        invoiceNumber: editInvoiceNumber.trim() || undefined,
        saleType: editSaleType,
        description: finalDesc || undefined,
        subtotal: editItemsSubtotal,
        tax: editTaxAmount,
        discount: editDiscountAmount,
        total: editGrandTotal,
        status: editStatus,
        items: validItems.map((item) => ({
          name: item.name.trim(),
          size: item.size ? item.size.trim() : null,
          quantity: parseInt(item.quantity) || 1,
          unit: item.unit || "pcs",
          unitPrice: parseFloat(item.unitPrice) || 0,
        })),
      });

      toast.success("Sale voucher updated successfully!");
      setEditDialogOpen(false);
      setSelectedSale(null);
      loadSalesData();
    } catch (err) {
      toast.error(err.message || "Failed to update sale");
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteSale = (sale) => {
    setSelectedSale(sale);
    setInvoiceModalOpen(false);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSale = async () => {
    if (!selectedSale) return;
    setSubmitting(true);
    try {
      await salesService.delete(firmId, selectedSale.id);
      toast.success("Sale voucher deleted successfully!");
      setDeleteDialogOpen(false);
      setSelectedSale(null);
      loadSalesData();
    } catch (err) {
      toast.error(err.message || "Failed to delete sale");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setCustomerId("");
    setPartyName("");
    setPartyPhone("");
    setPartyAddress("");
    setInvoiceNumber("");
    setSaleType("PAKU");
    setDescription("");
    setTax("0");
    setDiscount("0");
    setStatus("CONFIRMED");
    setPartyMode("registered");
    setLineItems([{ id: 1, name: "", size: "", isCustom: false, availableSizes: [], quantity: 1, unit: "pcs", unitPrice: 0, total: 0 }]);
  };

  const viewInvoice = (sale) => {
    setSelectedSale(sale);
    setInvoiceModalOpen(true);
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    const invNum = selectedSale?.invoiceNumber || `INV-${selectedSale?.id?.slice(0, 6)}`;
    const party = (selectedSale?.customerName || selectedSale?.customer?.name || "Customer").replace(/[^a-zA-Z0-9]/g, "_");
    document.title = `${invNum}_${party}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1500);
  };

  const handleWhatsAppShare = (sale) => {
    if (!sale) return;
    const firmName = sale.firm?.name || authFirm?.name || "Business Firm";
    const party = sale.customerName || sale.customer?.name || "Walk-in Customer";
    const invNum = sale.invoiceNumber || `INV-${sale.id?.slice(0, 6)}`;
    const dateStr = formatDate(sale.createdAt || sale.date);
    const saleTypeLabel = sale.saleType === "KACHU" ? "Estimate/Cash Memo" : "Tax Invoice";

    const itemsText = (sale.items && sale.items.length > 0 ? sale.items : [{ name: "Sales Service / Products", quantity: 1, unit: "pcs", unitPrice: sale.total, total: sale.total }])
      .map((item, idx) => `${idx + 1}. *${item.name}*${item.size ? ` [Size: ${item.size}]` : ""}\n   ${item.quantity} ${item.unit || "pcs"} @ ₹${item.unitPrice} = *₹${item.total || item.quantity * item.unitPrice}*`)
      .join("\n\n");

    const message = `🧾 *${saleTypeLabel.toUpperCase()}: ${invNum}*\n🏢 *${firmName}*\n👤 *Billed To:* ${party}\n📅 *Date:* ${dateStr}\n\n*Itemized Particulars:*\n${itemsText}\n\n────────────────\nSubtotal: ₹${sale.subtotal || sale.total}${sale.tax > 0 ? `\nGST/Tax: ₹${sale.tax}` : ""}${sale.discount > 0 ? `\nDiscount: -₹${sale.discount}` : ""}\n*Grand Total: ₹${sale.total}*\n*Status:* ${sale.status || "CONFIRMED"}\n\n_Thank you for your business!_`;

    let phone = sale.customer?.phone || "";
    if (!phone && sale.description && sale.description.includes("Phone: ")) {
      const match = sale.description.match(/Phone:\s*([0-9+\-\s]+)/);
      if (match) phone = match[1];
    }
    const cleanPhone = (phone || "").replace(/[^0-9]/g, "");
    let waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    if (cleanPhone.length >= 10) {
      const intlPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      waUrl = `https://api.whatsapp.com/send?phone=${intlPhone}&text=${encodeURIComponent(message)}`;
    }
    window.open(waUrl, "_blank");
  };



  const columns = [
    {
      key: "invoiceNumber",
      label: "Invoice #",
      render: (val, row) => (
        <span className="flex items-center gap-2 font-mono text-xs font-semibold">
          <span
            className={`h-2.5 w-2.5 rounded-full shrink-0 ${
              row.saleType === "KACHU"
                ? "bg-black border border-slate-600 shadow-2xs"
                : "bg-white border border-slate-300 shadow-2xs"
            }`}
          />
          {val || `INV-${row.id?.slice(0, 6)}`}
        </span>
      ),
      sortable: true,
    },
    {
      key: "customerName",
      label: "Party / Customer",
      render: (val, row) => val || row.customer?.name || "Walk-in Customer",
    },
    {
      key: "createdAt",
      label: "Date",
      render: (val) => formatDate(val),
      sortable: true,
    },
    {
      key: "total",
      label: "Total Amount",
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
      render: (val) => <StatusBadge status={val || "CONFIRMED"} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5"
            onClick={() => viewInvoice(row)}
          >
            <Printer className="h-3.5 w-3.5" />
            Print
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            title="Edit Sale"
            onClick={() => openEditSale(row)}
          >
            <Edit className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
            title="Delete Sale"
            onClick={() => openDeleteSale(row)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const filteredSales = useMemo(() => {
    let list = sales.filter((s) => {
      if (search) {
        const q = search.toLowerCase();
        const matchInv = s.invoiceNumber?.toLowerCase().includes(q);
        const matchParty = s.customerName?.toLowerCase().includes(q) || s.customer?.name?.toLowerCase().includes(q);
        if (!matchInv && !matchParty) return false;
      }
      if (statusFilter.length > 0 && !statusFilter.includes(s.status)) return false;
      if (colorFilter === "PAKU" && s.saleType === "KACHU") return false;
      if (colorFilter === "KACHU" && s.saleType !== "KACHU") return false;
      return true;
    });

    return list;
  }, [sales, search, statusFilter, colorFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Vouchers"
        description="Tally-style sales billing and invoice management"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Sales" }]}
        actions={
          <PermissionGate permission="Sales.Create">
            <Button className="gap-2" onClick={openCreateSale}>
              <Plus className="h-4 w-4" />
              New Sale Voucher
            </Button>
          </PermissionGate>
        }
      />

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <SearchInput placeholder="Search party name or invoice #…" onSearch={setSearch} className="sm:w-80" />
          <FilterDropdown
            label="Status"
            options={Object.values(SALE_STATUS).map((s) => ({ value: s, label: s.charAt(0) + s.slice(1).toLowerCase() }))}
            selected={statusFilter}
            onSelectionChange={setStatusFilter}
          />

          {/* Refined compact color filter */}
          <div className="flex items-center gap-2 h-10 px-2.5 border border-border/80 rounded-xl bg-card ml-auto sm:ml-0">
            <button
              type="button"
              onClick={() => setColorFilter(colorFilter === "PAKU" ? "all" : "PAKU")}
              className={`h-5 w-5 rounded-md bg-white border transition-all cursor-pointer ${
                colorFilter === "PAKU"
                  ? "border-primary ring-2 ring-primary ring-offset-1 ring-offset-background scale-110 shadow-sm"
                  : "border-slate-300 hover:border-slate-400 opacity-70 hover:opacity-100"
              }`}
            />
            <button
              type="button"
              onClick={() => setColorFilter(colorFilter === "KACHU" ? "all" : "KACHU")}
              className={`h-5 w-5 rounded-md bg-black border transition-all cursor-pointer ${
                colorFilter === "KACHU"
                  ? "border-primary ring-2 ring-primary ring-offset-1 ring-offset-background scale-110 shadow-sm"
                  : "border-slate-700 hover:border-slate-600 opacity-70 hover:opacity-100"
              }`}
            />
          </div>
        </div>
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <DataTable
            columns={columns}
            data={filteredSales}
            loading={loading}
            emptyState={
              <EmptyState
                icon={<ShoppingCart className="h-8 w-8 text-muted-foreground" />}
                title="No sales vouchers created"
                description="Click 'New Sale Voucher' to create an itemized sales bill."
                actionLabel="New Sale Voucher"
                onAction={openCreateSale}
              />
            }
          />
        </div>

        {/* Mobile Cards View */}
        <div className="block md:hidden space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-2xl p-4 bg-card animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                  <div className="h-6 bg-muted rounded w-2/3"></div>
                  <div className="h-8 bg-muted rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : filteredSales.length === 0 ? (
            <EmptyState
              icon={<ShoppingCart className="h-8 w-8 text-muted-foreground" />}
              title="No sales vouchers found"
              description="Click 'New Sale Voucher' to create your first voucher."
              actionLabel="New Sale Voucher"
              onAction={openCreateSale}
            />
          ) : (
            filteredSales.map((sale) => (
              <div key={sale.id} className="border border-border/80 rounded-2xl p-4 bg-card space-y-3 shadow-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-foreground">
                      {sale.invoiceNumber || `INV-${sale.id?.slice(0, 6)}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block h-3.5 w-3.5 rounded-full border shrink-0 shadow-xs ${
                        sale.saleType === "KACHU"
                          ? "bg-black border-slate-600 dark:border-neutral-500"
                          : "bg-white border-slate-300 dark:border-neutral-300"
                      }`}
                      title={sale.saleType === "KACHU" ? "Black Ledger" : "White Ledger"}
                    />
                    <StatusBadge status={sale.status || "CONFIRMED"} />
                  </div>
                </div>

                <div className="flex justify-between items-baseline pt-0.5">
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-sm sm:text-base text-foreground truncate">
                      {sale.customerName || sale.customer?.name || "Walk-in Customer"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(sale.createdAt || sale.date)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-base sm:text-lg font-bold text-foreground">
                      {formatCurrency(sale.total || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">
                      {sale.items?.length || 1} item{sale.items?.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2.5 border-t border-border/60">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-9.5 text-xs sm:text-sm gap-2 font-medium rounded-xl"
                    onClick={() => viewInvoice(sale)}
                  >
                    <FileText className="h-4 w-4" /> View Bill
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-9.5 px-3.5 text-xs sm:text-sm gap-1.5 text-emerald-500 dark:text-emerald-400 font-semibold rounded-xl"
                    onClick={() => handleWhatsAppShare(sale)}
                    title="Share via WhatsApp"
                  >
                    <Share2 className="h-4 w-4" /> WhatsApp
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9.5 w-9.5 p-0 rounded-xl"
                    title="Edit Voucher"
                    onClick={() => openEditSale(sale)}
                  >
                    <Edit className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>



      {/* Mobile-First Step-by-Step Sale Voucher Flow */}
      <SaleVoucherFlow
        isOpen={saleFlowOpen}
        onClose={() => {
          setSaleFlowOpen(false);
          setSelectedSale(null);
        }}
        firmId={firmId}
        customers={customers}
        initialSale={selectedSale}
        onSaveVoucher={handleSaveVoucherFlow}
        onViewInvoice={(sale) => viewInvoice(sale)}
      />

      {/* Delete Sale Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Sale Voucher</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete invoice #{selectedSale?.invoiceNumber || selectedSale?.id?.slice(0, 6)} for {formatCurrency(selectedSale?.total || 0)}? This will permanently remove the sale and its line items.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSale} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Voucher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Printable Customer Invoice Generator Modal */}
      {/* Printable Customer Invoice Generator Modal */}
      <Dialog open={invoiceModalOpen} onOpenChange={setInvoiceModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto w-[96vw] p-3 sm:p-6 space-y-4 sm:space-y-6">
          {selectedSale && (() => {
            const billFirm = selectedSale.firm || authFirm || {};
            const firmName = billFirm.name || "Business Firm";
            const firmAddress = billFirm.address || "Plot 42, Sector 18, Udyog Vihar, Phase II, Gurugram, Haryana - 122015";
            const firmPhone = billFirm.phone || "+91 98765 43210";
            const firmGstin = billFirm.gstNumber || (selectedSale.saleType !== "KACHU" ? "06AAACR5432K1Z9" : null);

            let custPhone = selectedSale.customer?.phone || "";
            let custAddress = selectedSale.customer?.address || "";
            let cleanNotes = selectedSale.description || "";

            if (cleanNotes) {
              const parts = cleanNotes.split(" | ");
              const otherNotes = [];
              for (const p of parts) {
                if (!custPhone && p.startsWith("Phone: ")) custPhone = p.replace("Phone: ", "").trim();
                else if (!custAddress && p.startsWith("Address: ")) custAddress = p.replace("Address: ", "").trim();
                else otherNotes.push(p);
              }
              cleanNotes = otherNotes.join(" | ");
            }

            const totalQty = (selectedSale.items && selectedSale.items.length > 0)
              ? selectedSale.items.reduce((acc, it) => acc + (parseFloat(it.quantity) || 1), 0)
              : 1;

            return (
              <div className="space-y-4 sm:space-y-6">
                {/* Printable Customer Invoice Card */}
                <div id="printable-invoice" className="border rounded-2xl p-4 sm:p-8 bg-card space-y-5 sm:space-y-6 shadow-sm">
                  {/* Top Header: Firm Profile & Invoice Classification */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b pb-5">
                    <div className="space-y-1.5 max-w-md">
                      <div className="flex items-center gap-2.5">
                        <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black text-base shrink-0 shadow-xs">
                          {firmName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground leading-none">
                            {firmName}
                          </h2>
                          <p className="text-[11px] text-muted-foreground font-medium mt-1">
                            {billFirm.businessType || "Trading & Commercial Operations"}
                          </p>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground space-y-0.5 pt-1">
                        <p className="leading-relaxed">{firmAddress}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 font-medium pt-0.5">
                          <span>Phone: <strong className="text-foreground">{firmPhone}</strong></span>
                          {billFirm.email && <span>Email: {billFirm.email}</span>}
                        </div>
                        {firmGstin && selectedSale.saleType !== "KACHU" && (
                          <p className="font-mono text-xs font-semibold text-foreground pt-0.5">
                            GSTIN: <span className="text-primary font-bold">{firmGstin}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-left sm:text-right space-y-1.5 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0">
                      {selectedSale.saleType === "KACHU" ? (
                        <div className="inline-block bg-black text-white px-3 py-1 rounded-md text-xs font-mono font-bold tracking-wider shadow-xs">
                          ESTIMATE / CASH MEMO
                        </div>
                      ) : (
                        <div className="inline-block bg-primary text-primary-foreground px-3 py-1 rounded-md text-xs font-mono font-bold tracking-wider shadow-xs">
                          TAX INVOICE
                        </div>
                      )}

                      <div className="space-y-0.5 pt-1">
                        <p className="text-[11px] text-muted-foreground uppercase font-semibold">Invoice Number</p>
                        <p className="text-lg sm:text-xl font-black font-mono tracking-tight text-foreground">
                          {selectedSale.invoiceNumber || `INV-${selectedSale.id?.slice(0, 6)}`}
                        </p>
                      </div>

                      <div className="flex sm:flex-col justify-between sm:justify-end gap-1 text-xs text-muted-foreground pt-0.5">
                        <span>Invoice Date: <strong className="text-foreground font-semibold">{formatDate(selectedSale.createdAt || selectedSale.date)}</strong></span>
                        <span>Status: <strong className="text-emerald-600 font-bold uppercase">{selectedSale.status || "CONFIRMED"}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Billed To / Party Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-muted/40 p-4 rounded-xl border border-border/60">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Billed To (Customer / Party)
                      </span>
                      <p className="font-bold text-sm text-foreground">
                        {selectedSale.customerName || selectedSale.customer?.name || "Walk-in Customer"}
                      </p>
                      {custPhone ? (
                        <p className="text-muted-foreground">
                          Mobile: <span className="font-mono text-foreground font-medium">{custPhone}</span>
                        </p>
                      ) : (
                        <p className="text-muted-foreground italic">Mobile: Not provided</p>
                      )}
                      {custAddress ? (
                        <p className="text-muted-foreground leading-relaxed">{custAddress}</p>
                      ) : (
                        <p className="text-muted-foreground italic">Counter Sale / General Consumer</p>
                      )}
                      {selectedSale.customer?.gstNumber && (
                        <p className="font-mono text-muted-foreground">
                          GSTIN: <span className="text-foreground font-semibold">{selectedSale.customer.gstNumber}</span>
                        </p>
                      )}
                    </div>

                    <div className="space-y-1 sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Dispatch & Billing Terms
                      </span>
                      <p className="text-muted-foreground">Place of Supply: <strong className="text-foreground">State Code (06) - Local</strong></p>
                      <p className="text-muted-foreground">Payment Mode: <strong className="text-foreground">Cash / Bank / UPI</strong></p>
                      <p className="text-muted-foreground">Reverse Charge: <strong className="text-foreground">No (Applicable to Buyer: No)</strong></p>
                    </div>
                  </div>

                  {/* Itemized Particulars Table */}
                  <div className="border rounded-xl overflow-x-auto bg-background">
                    <table className="w-full text-xs sm:text-sm text-left border-collapse">
                      <thead className="bg-muted text-muted-foreground uppercase text-[10px] sm:text-[11px] font-bold border-b tracking-wider">
                        <tr>
                          <th className="p-2.5 sm:p-3 w-10 text-center">#</th>
                          <th className="p-2.5 sm:p-3">Item Description</th>
                          <th className="p-2.5 sm:p-3 text-center w-28">Size / Dim</th>
                          <th className="p-2.5 sm:p-3 text-center w-20">Qty</th>
                          <th className="p-2.5 sm:p-3 text-right w-28">Rate (₹)</th>
                          <th className="p-2.5 sm:p-3 text-right w-32">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60 text-xs sm:text-sm">
                        {selectedSale.items && selectedSale.items.length > 0 ? (
                          selectedSale.items.map((item, idx) => (
                            <tr key={item.id || idx}>
                              <td className="p-2.5 sm:p-3 text-center font-mono text-muted-foreground">{idx + 1}</td>
                              <td className="p-2.5 sm:p-3 font-semibold text-foreground">
                                <div>{item.name}</div>
                                {item.category && <span className="text-[10px] font-normal text-muted-foreground">{item.category}</span>}
                              </td>
                              <td className="p-2.5 sm:p-3 text-center">
                                {item.size ? (
                                  <span className="font-mono font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-xs">
                                    {item.size}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground text-xs italic">—</span>
                                )}
                              </td>
                              <td className="p-2.5 sm:p-3 text-center font-mono font-medium">
                                {item.quantity} <span className="text-[10px] text-muted-foreground">{item.unit || "pcs"}</span>
                              </td>
                              <td className="p-2.5 sm:p-3 text-right font-mono text-muted-foreground">
                                {formatCurrency(item.unitPrice)}
                              </td>
                              <td className="p-2.5 sm:p-3 text-right font-mono font-bold text-foreground">
                                {formatCurrency(item.total || item.quantity * item.unitPrice)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className="p-3 text-center font-mono text-muted-foreground">1</td>
                            <td className="p-3 font-semibold text-foreground">Sales Service / Commercial Products</td>
                            <td className="p-3 text-center text-muted-foreground italic">—</td>
                            <td className="p-3 text-center font-mono">1 pcs</td>
                            <td className="p-3 text-right font-mono">{formatCurrency(selectedSale.subtotal || selectedSale.total)}</td>
                            <td className="p-3 text-right font-mono font-bold">{formatCurrency(selectedSale.total)}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals, Summary, Words & Bank Box */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
                    {/* Left: Words, Notes, UPI details */}
                    <div className="space-y-3">
                      {/* Amount in Words */}
                      <div className="p-3 rounded-xl bg-muted/30 border border-border/50 text-xs space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                          Amount Chargeable (in words):
                        </span>
                        <p className="font-bold text-foreground italic leading-relaxed">
                          {numberToWords(selectedSale.total)}
                        </p>
                      </div>

                      {/* Internal Notes / Description if present */}
                      {cleanNotes && (
                        <div className="text-xs text-muted-foreground border-l-2 border-primary pl-3 py-1 italic">
                          <strong>Notes:</strong> {cleanNotes}
                        </div>
                      )}

                      {/* Bank & UPI Transfer Box */}
                      <div className="p-3 rounded-xl border border-dashed border-border text-[11px] text-muted-foreground space-y-1">
                        <p className="font-semibold text-foreground">Bank Details & UPI Payment:</p>
                        <p>Firm UPI ID: <span className="font-mono font-bold text-foreground">{firmName.toLowerCase().replace(/[^a-z0-9]/g, "")}@upi</span></p>
                        <p>Accepted via Google Pay, PhonePe, Paytm, or NetBanking</p>
                      </div>
                    </div>

                    {/* Right: Calculations */}
                    <div className="space-y-2 text-xs sm:text-sm">
                      <div className="flex justify-between py-1 border-b border-border/60">
                        <span className="text-muted-foreground">Items Subtotal:</span>
                        <span className="font-mono font-semibold">{formatCurrency(selectedSale.subtotal || selectedSale.total)}</span>
                      </div>
                      {selectedSale.tax > 0 && (
                        <div className="flex justify-between py-1 border-b border-border/60">
                          <span className="text-muted-foreground">GST / Tax Amount:</span>
                          <span className="font-mono font-semibold">{formatCurrency(selectedSale.tax)}</span>
                        </div>
                      )}
                      {selectedSale.discount > 0 && (
                        <div className="flex justify-between py-1 border-b border-border/60 text-destructive">
                          <span>Discount:</span>
                          <span className="font-mono font-semibold">-{formatCurrency(selectedSale.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-2 text-base sm:text-xl font-black border-t-2 border-foreground">
                        <span>Grand Total:</span>
                        <span className="font-mono text-primary">{formatCurrency(selectedSale.total)}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground text-right pt-0.5">
                        Total Items: {selectedSale.items?.length || 1} &nbsp;|&nbsp; Total Qty: {totalQty}
                      </div>
                    </div>
                  </div>

                  {/* Terms & Conditions and Signature Stamp */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t pt-5 text-[11px] text-muted-foreground">
                    <div className="space-y-1">
                      <p className="font-bold uppercase tracking-wider text-foreground text-[10px]">Terms & Conditions:</p>
                      <ol className="list-decimal list-inside space-y-0.5 leading-relaxed">
                        <li>Goods once sold will not be accepted back or exchanged without this original bill.</li>
                        <li>Disputes, if any, shall be subject to local jurisdiction only.</li>
                        <li>Payment due within agreed credit terms. E. & O.E.</li>
                      </ol>
                    </div>

                    <div className="flex flex-col justify-end items-start sm:items-end text-center space-y-1 pt-4 sm:pt-0">
                      <p className="text-xs font-semibold text-foreground">For {firmName}</p>
                      <div className="h-14 border-b border-dashed w-44 border-border/80"></div>
                      <p className="text-[10px] text-muted-foreground font-medium pt-1">Authorized Signatory / Stamp</p>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <DialogFooter className="flex flex-col sm:flex-row justify-between sm:justify-between items-stretch sm:items-center gap-2 pt-2">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={() => setInvoiceModalOpen(false)} className="flex-1 sm:flex-initial h-10 sm:h-9">
                      Close
                    </Button>
                    <Button variant="secondary" onClick={() => openEditSale(selectedSale)} className="gap-1.5 text-xs h-10 sm:h-9">
                      <Edit className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => openDeleteSale(selectedSale)}
                      className="text-destructive hover:bg-destructive/10 h-10 w-10 sm:h-9 sm:w-9 p-0"
                      title="Delete Voucher"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    <Button
                      type="button"
                      onClick={() => handleWhatsAppShare(selectedSale)}
                      className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11 sm:h-9"
                    >
                      <Share2 className="h-4 w-4" /> Share on WhatsApp
                    </Button>
                    <Button
                      type="button"
                      onClick={handlePrint}
                      className="gap-2 h-11 sm:h-9 font-semibold"
                    >
                      <Printer className="h-4 w-4" /> Print / Download PDF
                    </Button>
                  </div>
                </DialogFooter>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Quick Add Item Dialog */}
      <QuickAddItemDialog
        open={quickItemOpen}
        onOpenChange={setQuickItemOpen}
        initialName={quickItemTarget.initialName}
        firmId={firmId}
        onItemCreated={handleQuickItemCreated}
      />
    </div>
  );
}
