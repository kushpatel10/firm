"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchInput } from "@/components/shared/search-input";
import { FilterDropdown } from "@/components/shared/filter-dropdown";
import { DataTable } from "@/components/shared/data-table";
import { PermissionGate } from "@/components/shared/permission-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Package, AlertTriangle, Loader2 } from "lucide-react";
import { DEFAULT_UNITS } from "@/types/inventory.types";
import { inventoryService } from "@/services/inventory.service";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export default function InventoryPage() {
  const { firmId } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState([]);

  // Form state
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("PCS");
  const [sellingPrice, setSellingPrice] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [quantity, setQuantity] = useState("0");
  const [minStock, setMinStock] = useState("5");
  const [sizesInput, setSizesInput] = useState("");

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await inventoryService.getAll(firmId);
      setItems(data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }, [firmId]);

  useEffect(() => {
    if (firmId) {
      loadItems();
    }
  }, [firmId, loadItems]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name || !sellingPrice) {
      toast.error("Item Name and Selling Price are required");
      return;
    }

    setSubmitting(true);
    try {
      await inventoryService.create(firmId, {
        name: name.trim(),
        sku: sku.trim() || undefined,
        category: category.trim() || undefined,
        unit,
        sellingPrice: parseFloat(sellingPrice),
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : 0,
        quantity: parseInt(quantity) || 0,
        minStock: parseInt(minStock) || 5,
        sizes: sizesInput.trim() ? sizesInput.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
      });
      toast.success(`Inventory item "${name}" created!`);
      setDialogOpen(false);
      setName("");
      setSku("");
      setCategory("");
      setSellingPrice("");
      setPurchasePrice("");
      setQuantity("0");
      setMinStock("5");
      setSizesInput("");
      loadItems();
    } catch (err) {
      toast.error(err.message || "Failed to add inventory item");
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: "name", label: "Item Name", sortable: true },
    { key: "sku", label: "SKU", render: (val) => val || "—" },
    { key: "category", label: "Category", render: (val) => val || "General" },
    {
      key: "sizes",
      label: "Sizes",
      render: (val) => {
        let list = [];
        if (Array.isArray(val)) {
          list = val.map((s) => (typeof s === "string" ? s : s?.size)).filter(Boolean);
        } else if (val && typeof val === "object") {
          list = Object.keys(val);
        }
        if (!list || list.length === 0) return <span className="text-muted-foreground text-xs italic">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {list.slice(0, 3).map((sz, i) => (
              <Badge key={i} variant="secondary" className="text-[10px] font-mono px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                {sz}
              </Badge>
            ))}
            {list.length > 3 && <span className="text-[10px] text-muted-foreground font-mono">+{list.length - 3}</span>}
          </div>
        );
      },
    },
    {
      key: "quantity",
      label: "Stock",
      sortable: true,
      render: (val, row) => {
        const isLow = (row.quantity ?? 0) <= (row.minStock ?? 5);
        return (
          <span className="flex items-center gap-1.5 font-medium">
            {val ?? 0} {row.unit}
            {isLow && (
              <Badge variant="destructive" className="text-[10px] h-4 gap-0.5 px-1">
                <AlertTriangle className="h-2.5 w-2.5" /> Low
              </Badge>
            )}
          </span>
        );
      },
    },
    { key: "sellingPrice", label: "Selling Price", render: (val) => formatCurrency(val || 0), sortable: true },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Manage stock, categories, and units"
        breadcrumbs={[{ label: "Firm", href: `/firm/${firmId}` }, { label: "Inventory" }]}
        actions={
          <PermissionGate permission="Inventory.Create">
            <Button className="gap-2" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </PermissionGate>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput placeholder="Search inventory…" onSearch={setSearch} className="sm:w-80" />
        <FilterDropdown
          label="Unit"
          options={DEFAULT_UNITS.map((u) => ({ value: u.abbreviation, label: `${u.name} (${u.abbreviation})` }))}
          selected={unitFilter}
          onSelectionChange={setUnitFilter}
        />
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        emptyState={
          <EmptyState
            icon={<Package className="h-8 w-8 text-muted-foreground" />}
            title="No inventory items"
            description="Add items to your inventory to start tracking stock levels."
            actionLabel="Add Item"
            onAction={() => setDialogOpen(true)}
          />
        }
      />

      {/* Add Item Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Inventory Item</DialogTitle>
            <DialogDescription>Add a product or material to your stock.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. Wireless Mouse"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="sku">SKU / Code</Label>
                <Input
                  id="sku"
                  placeholder="e.g. SK-001"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                />
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="e.g. Electronics"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="unit">Unit</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEFAULT_UNITS.map((u) => (
                      <SelectItem key={u.abbreviation} value={u.abbreviation}>
                        {u.name} ({u.abbreviation})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="sellingPrice">Selling Price (₹) *</Label>
                <Input
                  id="sellingPrice"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="purchasePrice">Cost Price (₹)</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                />
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="quantity">Initial Stock</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="minStock">Min Stock Alert</Label>
                <Input
                  id="minStock"
                  type="number"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="sizes">Sizes / Variations (comma-separated)</Label>
                <Input
                  id="sizes"
                  placeholder="e.g. S, M, L, XL or 950x1120, 1000x1200"
                  value={sizesInput}
                  onChange={(e) => setSizesInput(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Item
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
