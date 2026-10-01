"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchInput } from "@/components/shared/search-input";
import { DataTable } from "@/components/shared/data-table";
import { PermissionGate } from "@/components/shared/permission-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Package,
  AlertTriangle,
  ArrowUpDown,
  Boxes,
  Loader2,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Plus,
  Minus,
} from "lucide-react";
import { inventoryService } from "@/services/inventory.service";
import { useAuth } from "@/contexts/auth-context";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export default function InventoryPage() {
  const { firm, loading: authLoading } = useAuth();
  const firmId = firm?.id;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [stockTab, setStockTab] = useState("ALL"); // ALL, LOW, OUT

  // Stock Adjustment Dialog state
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustType, setAdjustType] = useState("IN"); // "IN" or "OUT"
  const [adjustQuantity, setAdjustQuantity] = useState("");
  const [adjustReference, setAdjustReference] = useState("");
  const [adjustNotes, setAdjustNotes] = useState("");

  const loadItems = useCallback(async () => {
    if (!firmId) return;
    setLoading(true);
    try {
      const data = await inventoryService.getAll(firmId, { pageSize: 200 });
      setItems(data?.items || data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load inventory stock");
    } finally {
      setLoading(false);
    }
  }, [firmId]);

  useEffect(() => {
    if (!authLoading && firmId) {
      loadItems();
    } else if (!authLoading && !firmId) {
      setLoading(false);
    }
  }, [authLoading, firmId, loadItems]);

  // Stock Metrics Calculations
  const stats = useMemo(() => {
    let totalItems = items.length;
    let totalUnits = 0;
    let totalValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    items.forEach((item) => {
      const qty = item.quantity ?? 0;
      const minStock = item.minStock ?? 5;
      const price = item.purchasePrice > 0 ? item.purchasePrice : item.sellingPrice || 0;

      totalUnits += qty;
      totalValuation += qty * price;

      if (qty === 0) {
        outOfStockCount++;
      } else if (qty <= minStock) {
        lowStockCount++;
      }
    });

    return {
      totalItems,
      totalUnits,
      totalValuation,
      lowStockCount,
      outOfStockCount,
      inStockCount: totalItems - lowStockCount - outOfStockCount,
    };
  }, [items]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const nameMatch = (item.name || "").toLowerCase().includes(search.toLowerCase());
      const skuMatch = (item.sku || "").toLowerCase().includes(search.toLowerCase());
      const catMatch = (item.category || "").toLowerCase().includes(search.toLowerCase());
      const matchesSearch = nameMatch || skuMatch || catMatch;

      if (!matchesSearch) return false;

      const qty = item.quantity ?? 0;
      const minStock = item.minStock ?? 5;

      if (stockTab === "LOW") {
        return qty > 0 && qty <= minStock;
      }
      if (stockTab === "OUT") {
        return qty <= 0;
      }
      return true;
    });
  }, [items, search, stockTab]);

  const openAdjustDialog = (item) => {
    setSelectedItem(item);
    setAdjustType("IN");
    setAdjustQuantity("");
    setAdjustReference("");
    setAdjustNotes("");
    setAdjustDialogOpen(true);
  };

  const handleStockAdjustment = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    const qty = parseInt(adjustQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Please enter a valid stock quantity greater than 0");
      return;
    }

    if (adjustType === "OUT" && (selectedItem.quantity ?? 0) < qty) {
      toast.error(`Cannot reduce ${qty} units. Current stock is only ${selectedItem.quantity ?? 0}`);
      return;
    }

    setSubmitting(true);
    try {
      await inventoryService.addStockEntry(firmId, selectedItem.id, {
        type: adjustType,
        quantity: qty,
        reference: adjustReference.trim() || undefined,
        notes: adjustNotes.trim() || undefined,
      });

      toast.success(
        `Recorded stock ${adjustType === "IN" ? "addition (+)" : "reduction (-)"} of ${qty} ${selectedItem.unit}`
      );
      setAdjustDialogOpen(false);
      loadItems();
    } catch (err) {
      toast.error(err.message || "Failed to record stock entry");
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: "name",
      label: "Item & Category",
      sortable: true,
      render: (val, row) => (
        <div>
          <p className="font-semibold text-foreground text-sm tracking-tight">{val}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <span>{row.category || "General"}</span>
            {row.sku && <span>• SKU: {row.sku}</span>}
          </p>
        </div>
      ),
    },
    {
      key: "quantity",
      label: "Available Stock",
      sortable: true,
      render: (val, row) => {
        const qty = val ?? 0;
        const min = row.minStock ?? 5;
        const isOut = qty <= 0;
        const isLow = !isOut && qty <= min;

        return (
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-bold text-foreground">
              {qty} <span className="text-xs text-muted-foreground font-normal">{row.unit}</span>
            </span>
            {isOut ? (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 gap-1">
                <XCircle className="h-2.5 w-2.5" /> Out of Stock
              </Badge>
            ) : isLow ? (
              <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] px-1.5 py-0 h-4 gap-1">
                <AlertTriangle className="h-2.5 w-2.5" /> Low Stock
              </Badge>
            ) : (
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] px-1.5 py-0 h-4 gap-1">
                <CheckCircle2 className="h-2.5 w-2.5" /> Normal
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: "minStock",
      label: "Min Alert Threshold",
      render: (val, row) => (
        <span className="text-xs font-mono text-muted-foreground">
          {val ?? 5} {row.unit}
        </span>
      ),
    },
    {
      key: "valuation",
      label: "Stock Valuation",
      render: (_, row) => {
        const qty = row.quantity ?? 0;
        const unitVal = row.purchasePrice > 0 ? row.purchasePrice : row.sellingPrice || 0;
        const totalVal = qty * unitVal;
        return (
          <div>
            <p className="text-xs font-semibold text-foreground">{formatCurrency(totalVal)}</p>
            <p className="text-[10px] text-muted-foreground">@{formatCurrency(unitVal)}/unit</p>
          </div>
        );
      },
    },
    {
      key: "actions",
      label: "Stock Action",
      render: (_, row) => (
        <PermissionGate permission="Inventory.Edit">
          <Button
            size="sm"
            variant="outline"
            onClick={() => openAdjustDialog(row)}
            className="h-8 text-xs gap-1.5 font-medium border-border/80 hover:bg-secondary active:scale-95"
          >
            <ArrowUpDown className="h-3.5 w-3.5 text-primary" />
            <span>Adjust Stock</span>
          </Button>
        </PermissionGate>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory & Stock Tracking"
        description="Monitor real-time warehouse stock levels, threshold alerts, and record stock movements"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Inventory" }]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/dashboard/items">
              <Button variant="outline" className="gap-2 text-xs h-9">
                <Boxes className="h-4 w-4 text-primary" />
                <span>Open Item Catalog Master</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border border-border/80 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Total Tracked Items</span>
              <Package className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-foreground mt-2">
              {stats.totalItems}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {stats.totalUnits.toLocaleString()} total units on hand
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Total Stock Value</span>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-foreground mt-2">
              {formatCurrency(stats.totalValuation)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Estimated purchase valuation</p>
          </CardContent>
        </Card>

        <Card
          onClick={() => setStockTab(stockTab === "LOW" ? "ALL" : "LOW")}
          className={`border shadow-xs cursor-pointer transition-all ${
            stockTab === "LOW"
              ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/5"
              : "border-border/80 hover:border-amber-500/50"
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                Low Stock Warning
              </span>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 mt-2">
              {stats.lowStockCount}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {stockTab === "LOW" ? "Filter active (Click to reset)" : "At or below min threshold"}
            </p>
          </CardContent>
        </Card>

        <Card
          onClick={() => setStockTab(stockTab === "OUT" ? "ALL" : "OUT")}
          className={`border shadow-xs cursor-pointer transition-all ${
            stockTab === "OUT"
              ? "border-destructive ring-2 ring-destructive/20 bg-destructive/5"
              : "border-border/80 hover:border-destructive/50"
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-destructive font-medium">Out of Stock</span>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-destructive mt-2">
              {stats.outOfStockCount}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {stockTab === "OUT" ? "Filter active (Click to reset)" : "Needs immediate restock"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-secondary/60 rounded-xl border border-border/80 w-fit">
          <Button
            type="button"
            size="sm"
            variant={stockTab === "ALL" ? "default" : "ghost"}
            onClick={() => setStockTab("ALL")}
            className="h-8 text-xs rounded-lg"
          >
            All Stock ({items.length})
          </Button>
          <Button
            type="button"
            size="sm"
            variant={stockTab === "LOW" ? "default" : "ghost"}
            onClick={() => setStockTab("LOW")}
            className="h-8 text-xs rounded-lg gap-1.5"
          >
            <AlertTriangle className="h-3 w-3 text-amber-500" />
            Low Stock ({stats.lowStockCount})
          </Button>
          <Button
            type="button"
            size="sm"
            variant={stockTab === "OUT" ? "default" : "ghost"}
            onClick={() => setStockTab("OUT")}
            className="h-8 text-xs rounded-lg gap-1.5"
          >
            <XCircle className="h-3 w-3 text-destructive" />
            Out of Stock ({stats.outOfStockCount})
          </Button>
        </div>

        <SearchInput
          placeholder="Filter by name, SKU, or category…"
          onSearch={setSearch}
          className="sm:w-80"
        />
      </div>

      {/* Stock Table */}
      <DataTable
        columns={columns}
        data={filteredItems}
        loading={loading}
        emptyState={
          <EmptyState
            icon={<Package className="h-8 w-8 text-muted-foreground" />}
            title={stockTab === "ALL" ? "No inventory items" : `No ${stockTab.toLowerCase()} stock items found`}
            description={
              stockTab === "ALL"
                ? "Visit the Item Catalog to create products and start tracking stock."
                : "All items are currently above threshold levels."
            }
            actionLabel="Open Item Catalog Master"
            onAction={() => (window.location.href = "/dashboard/items")}
          />
        }
      />

      {/* Stock Adjustment Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5 text-primary" />
              <span>Record Stock Adjustment</span>
            </DialogTitle>
            <DialogDescription>
              Adjust physical quantity for{" "}
              <strong className="text-foreground">{selectedItem?.name}</strong>. Current stock:{" "}
              <span className="font-mono font-semibold text-foreground">
                {selectedItem?.quantity ?? 0} {selectedItem?.unit}
              </span>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleStockAdjustment} className="space-y-4">
            {/* Adjustment Type Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-secondary/60 rounded-xl border border-border/80">
              <Button
                type="button"
                variant={adjustType === "IN" ? "default" : "ghost"}
                onClick={() => setAdjustType("IN")}
                className="gap-2 h-9 text-xs rounded-lg"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Stock IN (Restock)</span>
              </Button>
              <Button
                type="button"
                variant={adjustType === "OUT" ? "destructive" : "ghost"}
                onClick={() => setAdjustType("OUT")}
                className="gap-2 h-9 text-xs rounded-lg"
              >
                <Minus className="h-3.5 w-3.5" />
                <span>Stock OUT (Wastage / Audit)</span>
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjust-qty">
                Quantity to {adjustType === "IN" ? "Add (+)" : "Deduct (-)"} ({selectedItem?.unit}) *
              </Label>
              <Input
                id="adjust-qty"
                type="number"
                min="1"
                placeholder="e.g. 25"
                value={adjustQuantity}
                onChange={(e) => setAdjustQuantity(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjust-ref">Reference / Invoice / Challan #</Label>
              <Input
                id="adjust-ref"
                placeholder="e.g. PO-8492 or Physical Audit 2026"
                value={adjustReference}
                onChange={(e) => setAdjustReference(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjust-notes">Reason / Notes</Label>
              <Input
                id="adjust-notes"
                placeholder="e.g. Received new shipment from supplier"
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAdjustDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant={adjustType === "OUT" ? "destructive" : "default"}
                disabled={submitting}
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Stock {adjustType === "IN" ? "Addition (+)" : "Reduction (-)"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
