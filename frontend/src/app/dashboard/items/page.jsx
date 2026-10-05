"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchInput } from "@/components/shared/search-input";
import { DataTable } from "@/components/shared/data-table";
import { PermissionGate } from "@/components/shared/permission-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus, Boxes, AlertTriangle, Loader2, Edit, Trash2, X, Tag,
  Layers, Package, Check, ChevronDown, ChevronUp, Sparkles, SlidersHorizontal, Calculator
} from "lucide-react";
import { DEFAULT_UNITS } from "@/types/inventory.types";
import { inventoryService } from "@/services/inventory.service";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { placeholders } from "@/config/placeholders";
import { CategoryManagerDialog } from "@/features/categories/components/category-manager-dialog";

// Preset size catalogs for instant one-click addition
const SIZE_PRESETS = [
  {
    category: "Apparel",
    sizes: ["S", "M", "L", "XL", "XXL", "3XL"],
  },
  {
    category: "Footwear",
    sizes: ["6", "7", "8", "9", "10", "11", "12"],
  },
  {
    category: "Pallets / Dimensions",
    sizes: ["950x1120", "1000x1200", "1100x1100", "1200x800", "1200x1000"],
  },
  {
    category: "Waist / Numeric",
    sizes: ["28", "30", "32", "34", "36", "38", "40"],
  },
];

export default function ItemsPage() {
  const { firm, loading: authLoading } = useAuth();
  const firmId = firm?.id;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Dialogs
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [sizesFilter, setSizesFilter] = useState("ALL"); // ALL, HAS_SIZES, NO_SIZES

  // Form State
  const [formName, setFormName] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formUnit, setFormUnit] = useState("pcs");
  const [formSellingPrice, setFormSellingPrice] = useState("");
  const [formPurchasePrice, setFormPurchasePrice] = useState("");
  const [formQuantity, setFormQuantity] = useState("0");
  const [formMinStock, setFormMinStock] = useState("5");

  // Sizes State: array of objects { size: "XL", price?: number }
  const [hasSizes, setHasSizes] = useState(false);
  const [sizeList, setSizeList] = useState([]); // [{ size: "M", price: "" }]
  const [customSizeInput, setCustomSizeInput] = useState("");
  const [showSizePriceDetails, setShowSizePriceDetails] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await inventoryService.getAll(firmId);
      const itemsList = Array.isArray(data) ? data : (data?.items || []);
      setItems(itemsList);
    } catch (err) {
      toast.error(err.message || "Failed to load items");
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

  // Support action=new or action=categories from Quick Action FAB / Mobile menu
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("action") === "new") {
        resetForm();
        setAddDialogOpen(true);
      } else if (params.get("action") === "categories") {
        setCategoryDialogOpen(true);
      }
    }
  }, []);

  // Unique categories
  const categories = useMemo(() => {
    const set = new Set();
    items.forEach((item) => {
      if (item.category && item.category.trim()) set.add(item.category.trim());
    });
    return Array.from(set);
  }, [items]);

  // Stats
  const stats = useMemo(() => {
    const total = items.length;
    const withSizes = items.filter((i) => {
      if (!i.sizes) return false;
      if (Array.isArray(i.sizes)) return i.sizes.length > 0;
      return typeof i.sizes === "object" && Object.keys(i.sizes).length > 0;
    }).length;
    const lowStock = items.filter((i) => (i.quantity ?? 0) <= (i.minStock ?? 5)).length;
    return { total, withSizes, categoriesCount: categories.length, lowStock };
  }, [items, categories]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = item.name?.toLowerCase().includes(q);
        const matchesSku = item.sku?.toLowerCase().includes(q);
        const matchesCat = item.category?.toLowerCase().includes(q);
        const matchesSize = Array.isArray(item.sizes) && item.sizes.some((s) => {
          const sName = typeof s === "string" ? s : s?.size;
          return sName?.toLowerCase().includes(q);
        });
        if (!matchesName && !matchesSku && !matchesCat && !matchesSize) return false;
      }

      // Category
      if (categoryFilter !== "ALL" && item.category !== categoryFilter) {
        return false;
      }

      // Sizes Filter
      const hasItemSizes = Array.isArray(item.sizes) ? item.sizes.length > 0 : Boolean(item.sizes);
      if (sizesFilter === "HAS_SIZES" && !hasItemSizes) return false;
      if (sizesFilter === "NO_SIZES" && hasItemSizes) return false;

      return true;
    });
  }, [items, search, categoryFilter, sizesFilter]);

  // Reset form
  const resetForm = () => {
    setFormName("");
    setFormSku("");
    setFormCategory("");
    setFormUnit("pcs");
    setFormSellingPrice("");
    setFormPurchasePrice("");
    setFormQuantity("0");
    setFormMinStock("5");
    setHasSizes(false);
    setSizeList([]);
    setCustomSizeInput("");
    setShowSizePriceDetails(false);
    setSelectedItem(null);
  };

  // Open Edit
  const openEditModal = (item) => {
    setSelectedItem(item);
    setFormName(item.name || "");
    setFormSku(item.sku || "");
    setFormCategory(item.category || "");
    setFormUnit(item.unit || "pcs");
    setFormSellingPrice(String(item.sellingPrice || ""));
    setFormPurchasePrice(String(item.purchasePrice || ""));
    setFormQuantity(String(item.quantity ?? "0"));
    setFormMinStock(String(item.minStock ?? "5"));

    // Parse existing sizes
    let parsedSizes = [];
    if (Array.isArray(item.sizes)) {
      parsedSizes = item.sizes.map((s) => (typeof s === "string" ? { size: s, price: "" } : { size: s.size, price: s.price || "" }));
    } else if (item.sizes && typeof item.sizes === "object") {
      parsedSizes = Object.entries(item.sizes).map(([k, v]) => ({ size: k, price: typeof v === "number" ? v : "" }));
    }
    setHasSizes(parsedSizes.length > 0);
    setSizeList(parsedSizes);
    setShowSizePriceDetails(parsedSizes.some((s) => s.price));
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (item) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  const openEditDialog = (item) => {
    openEditModal(item);
  };

  // Add a size to current list
  const addSizeTag = (sizeName) => {
    const trimmed = sizeName.trim();
    if (!trimmed) return;
    if (sizeList.some((s) => s.size.toLowerCase() === trimmed.toLowerCase())) {
      toast.info(`Size "${trimmed}" is already added.`);
      return;
    }
    setSizeList([...sizeList, { size: trimmed, price: "" }]);
    setHasSizes(true);
  };

  // Remove a size
  const removeSizeTag = (index) => {
    const updated = sizeList.filter((_, i) => i !== index);
    setSizeList(updated);
    if (updated.length === 0) setHasSizes(false);
  };

  // Update per-size price
  const updateSizePrice = (index, priceVal) => {
    const updated = [...sizeList];
    updated[index].price = priceVal;
    setSizeList(updated);
  };

  // Handle Create Item
  const handleCreateItem = async (e) => {
    e.preventDefault();
    if (!formName.trim() || !formSellingPrice) {
      toast.error("Item Name and Selling Price are required");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formName.trim(),
        sku: formSku.trim() || undefined,
        category: formCategory.trim() || undefined,
        unit: formUnit,
        sellingPrice: parseFloat(formSellingPrice),
        purchasePrice: formPurchasePrice ? parseFloat(formPurchasePrice) : 0,
        quantity: parseInt(formQuantity) || 0,
        minStock: parseInt(formMinStock) || 5,
        sizes: hasSizes && sizeList.length > 0 ? sizeList : null,
      };

      await inventoryService.create(firmId, payload);
      toast.success(`Item "${formName}" created successfully!`);
      setAddDialogOpen(false);
      resetForm();
      loadItems();
    } catch (err) {
      toast.error(err.message || "Failed to create item");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Edit Item
  const handleUpdateItem = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    if (!formName.trim() || !formSellingPrice) {
      toast.error("Item Name and Selling Price are required");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formName.trim(),
        sku: formSku.trim() || null,
        category: formCategory.trim() || null,
        unit: formUnit,
        sellingPrice: parseFloat(formSellingPrice),
        purchasePrice: formPurchasePrice ? parseFloat(formPurchasePrice) : 0,
        quantity: parseInt(formQuantity) || 0,
        minStock: parseInt(formMinStock) || 5,
        sizes: hasSizes && sizeList.length > 0 ? sizeList : null,
      };

      await inventoryService.update(firmId, selectedItem.id, payload);
      toast.success(`Item "${formName}" updated!`);
      setEditDialogOpen(false);
      resetForm();
      loadItems();
    } catch (err) {
      toast.error(err.message || "Failed to update item");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Item
  const handleDeleteItem = async () => {
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      await inventoryService.delete(firmId, selectedItem.id);
      toast.success(`Item "${selectedItem.name}" deleted.`);
      setDeleteDialogOpen(false);
      setSelectedItem(null);
      loadItems();
    } catch (err) {
      toast.error(err.message || "Failed to delete item");
    } finally {
      setSubmitting(false);
    }
  };

  // Table columns definition
  const columns = [
    {
      key: "name",
      label: "Item Name",
      sortable: true,
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground text-sm flex items-center gap-1.5">
            {val}
          </span>
          {row.sku && (
            <span className="text-[11px] font-mono text-muted-foreground">
              SKU: {row.sku}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "category",
      label: "Category",
      sortable: true,
      render: (val) => (
        <Badge variant="outline" className="text-xs font-normal py-0.5 px-2 bg-secondary/40 border-border/70">
          {val || "General"}
        </Badge>
      ),
    },
    {
      key: "sizes",
      label: "Available Sizes",
      render: (val) => {
        let list = [];
        if (Array.isArray(val)) {
          list = val.map((s) => (typeof s === "string" ? s : s?.size)).filter(Boolean);
        } else if (val && typeof val === "object") {
          list = Object.keys(val);
        }

        if (!list || list.length === 0) {
          return <span className="text-muted-foreground text-xs italic">Standard</span>;
        }

        const visible = list.slice(0, 4);
        const extra = list.length - 4;

        return (
          <div className="flex flex-wrap items-center gap-1 max-w-xs">
            {visible.map((sz, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="text-[11px] font-mono font-medium px-1.5 py-0 bg-primary/10 text-primary border-primary/20"
              >
                {sz}
              </Badge>
            ))}
            {extra > 0 && (
              <span className="text-[10px] text-muted-foreground font-mono font-medium">
                +{extra} more
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "quantity",
      label: "Stock Level",
      sortable: true,
      render: (val, row) => {
        const isLow = (row.quantity ?? 0) <= (row.minStock ?? 5);
        return (
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-semibold text-foreground">
              {val ?? 0} {row.unit || "pcs"}
            </span>
            {isLow && (
              <Badge variant="destructive" className="text-[10px] h-4 gap-0.5 px-1 py-0">
                <AlertTriangle className="h-2.5 w-2.5" /> Low
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: "sellingPrice",
      label: "Selling Price",
      sortable: true,
      render: (val) => (
        <span className="font-mono font-semibold text-foreground text-sm">
          {formatCurrency(val || 0)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1">
          <PermissionGate permission="Inventory.Edit">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => openEditModal(row)}
              title="Edit Item"
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
          </PermissionGate>
          <PermissionGate permission="Inventory.Delete">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => {
                setSelectedItem(row);
                setDeleteDialogOpen(true);
              }}
              title="Delete Item"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </PermissionGate>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Item Master & Catalog"
        description="Product definitions, SKU codes, categories, size variants, and base pricing. For live stock tracking & adjustments, go to Inventory."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Items Catalog" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/dashboard/inventory">
              <Button variant="outline" className="gap-2 text-xs h-9">
                <Package className="h-4 w-4 text-primary" />
                Stock Tracking
              </Button>
            </Link>
            <Button
              variant="outline"
              className="gap-2 text-xs h-9 border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => setCategoryDialogOpen(true)}
            >
              <Calculator className="h-4 w-4" />
              Categories & Formulas
            </Button>
            <PermissionGate permission="Inventory.Create">
              <Button
                className="gap-2 shadow-sm font-medium text-xs h-9"
                onClick={() => {
                  resetForm();
                  setAddDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </PermissionGate>
          </div>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-card/70 border-border/70 shadow-xs">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Total Items</p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-foreground mt-0.5">
                {stats.total}
              </p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Boxes className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/70 shadow-xs">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">With Size Details</p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-foreground mt-0.5">
                {stats.withSizes}
              </p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Layers className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/70 shadow-xs">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Categories</p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-foreground mt-0.5">
                {stats.categoriesCount}
              </p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Tag className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/70 shadow-xs">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Low Stock Items</p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-foreground mt-0.5">
                {stats.lowStock}
              </p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          <SearchInput
            placeholder={placeholders.items.search}
            onSearch={setSearch}
            className="sm:w-80"
          />

          {categories.length > 0 && (
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-44 text-xs h-9">
                <SelectValue placeholder={placeholders.items.categoryFilter} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={sizesFilter} onValueChange={setSizesFilter}>
            <SelectTrigger className="w-full sm:w-40 text-xs h-9">
              <SelectValue placeholder={placeholders.items.sizesFilter} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Items</SelectItem>
              <SelectItem value="HAS_SIZES">With Sizes</SelectItem>
              <SelectItem value="NO_SIZES">Standard (No Size)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={filteredItems}
          loading={loading}
          emptyState={
            <EmptyState
              icon={<Boxes className="h-9 w-9 text-muted-foreground" />}
              title="No items found"
              description="Add your first item with custom sizes or dimensions to start using it in sales vouchers."
              actionLabel="Add Item"
              onAction={() => {
                resetForm();
                setAddDialogOpen(true);
              }}
            />
          }
        />
      </div>

      {/* Mobile Cards View (WhatsApp / Telegram style) */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-border/70 rounded-2xl p-4 bg-card animate-pulse space-y-2.5">
                <div className="h-5 bg-muted rounded w-2/3"></div>
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-8 bg-muted rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon={<Boxes className="h-9 w-9 text-muted-foreground" />}
            title="No items found"
            description="Add your first item with custom sizes or dimensions to start using it in sales vouchers."
            actionLabel="Add Item"
            onAction={() => {
              resetForm();
              setAddDialogOpen(true);
            }}
          />
        ) : (
          filteredItems.map((item) => {
            const isLowStock = (item.quantity ?? 0) <= (item.minStock ?? 5);
            const sizesArr = Array.isArray(item.sizes) ? item.sizes : [];

            return (
              <div
                key={item.id}
                className="border border-border/80 rounded-2xl p-4 bg-card space-y-3 shadow-xs active:scale-[0.99] transition-all"
              >
                {/* Header row: Avatar + Name + SKU + Price */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 shadow-xs">
                      <Boxes className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <h4 className="font-bold text-sm sm:text-base text-foreground truncate">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground">
                        {item.category && (
                          <span className="font-medium text-foreground/80 bg-secondary px-2 py-0.5 rounded-md">
                            {item.category}
                          </span>
                        )}
                        {item.sku && <span className="font-mono text-[11px]">{item.sku}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-bold text-base text-foreground font-mono">
                      {formatCurrency(item.sellingPrice || 0)}
                    </p>
                    <span className="text-[11px] text-muted-foreground">/ {item.unit || "pcs"}</span>
                  </div>
                </div>

                {/* Stock & Variants */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-block h-2 w-2 rounded-full ${isLowStock ? "bg-amber-500" : "bg-emerald-500"}`} />
                    <span className="text-muted-foreground font-medium">Stock:</span>
                    <span className={`font-mono font-bold ${isLowStock ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>
                      {item.quantity ?? 0} {item.unit || "pcs"}
                    </span>
                  </div>

                  {sizesArr.length > 0 && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-secondary text-foreground">
                      {sizesArr.length} sizes
                    </span>
                  )}
                </div>

                {/* Sizes Chips Preview (if any) */}
                {sizesArr.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    {sizesArr.slice(0, 4).map((s, idx) => {
                      const sName = typeof s === "string" ? s : s?.size;
                      return (
                        <span key={idx} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/50">
                          {sName}
                        </span>
                      );
                    })}
                    {sizesArr.length > 4 && (
                      <span className="text-[10px] text-muted-foreground font-medium">
                        +{sizesArr.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                  <PermissionGate permission="Inventory.Edit">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1.5 rounded-xl font-medium"
                      onClick={() => openEditDialog(item)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  </PermissionGate>
                  <PermissionGate permission="Inventory.Delete">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs gap-1.5 text-destructive hover:bg-destructive/10 rounded-xl"
                      onClick={() => openDeleteDialog(item)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </PermissionGate>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Item Dialog */}
      <Dialog
        open={addDialogOpen || editDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setAddDialogOpen(false);
            setEditDialogOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Boxes className="h-5 w-5 text-primary" />
              {editDialogOpen ? "Edit Item" : "Add New Item"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Define the item name, prices, units, and available size variations.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={editDialogOpen ? handleUpdateItem : handleCreateItem} className="space-y-5">
            {/* Primary Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="item-name" className="text-xs font-semibold">
                  Item Name *
                </Label>
                <Input
                  id="item-name"
                  placeholder={placeholders.items.name}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="item-sku" className="text-xs">
                  SKU / Code
                </Label>
                <Input
                  id="item-sku"
                  placeholder={placeholders.items.sku}
                  value={formSku}
                  onChange={(e) => setFormSku(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="item-cat" className="text-xs">
                  Category
                </Label>
                <Input
                  id="item-cat"
                  placeholder={placeholders.items.category}
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="item-unit" className="text-xs">
                  Base Unit
                </Label>
                <Select value={formUnit} onValueChange={setFormUnit}>
                  <SelectTrigger id="item-unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_UNITS.map((u) => (
                      <SelectItem key={u.abbreviation} value={u.abbreviation}>
                        {u.name} ({u.abbreviation})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="item-sell-price" className="text-xs font-semibold">
                  Default Selling Price (₹) *
                </Label>
                <Input
                  id="item-sell-price"
                  type="number"
                  step="0.01"
                  placeholder={placeholders.items.sellingPrice}
                  value={formSellingPrice}
                  onChange={(e) => setFormSellingPrice(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="item-cost-price" className="text-xs">
                  Cost / Purchase Price (₹)
                </Label>
                <Input
                  id="item-cost-price"
                  type="number"
                  step="0.01"
                  placeholder={placeholders.items.costPrice}
                  value={formPurchasePrice}
                  onChange={(e) => setFormPurchasePrice(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="item-stock" className="text-xs">
                  Initial Stock Quantity
                </Label>
                <Input
                  id="item-stock"
                  type="number"
                  value={formQuantity}
                  onChange={(e) => setFormQuantity(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="item-min-stock" className="text-xs">
                  Min Stock Alert
                </Label>
                <Input
                  id="item-min-stock"
                  type="number"
                  value={formMinStock}
                  onChange={(e) => setFormMinStock(e.target.value)}
                />
              </div>
            </div>

            {/* Sizes & Variation Builder */}
            <div className="border border-border/80 rounded-xl p-3.5 sm:p-4 bg-muted/30 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Size Variations</p>
                    <p className="text-[11px] text-muted-foreground">
                      Enable sizes or dimensions to easily select when creating sales vouchers.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={hasSizes}
                  onCheckedChange={(checked) => {
                    setHasSizes(checked);
                    if (!checked) setSizeList([]);
                  }}
                />
              </div>

              {hasSizes && (
                <div className="space-y-3 pt-2 border-t border-border/60">
                  {/* Preset Quick Buttons */}
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-amber-500" />
                      Quick Presets (Click to add):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {SIZE_PRESETS.map((preset) => (
                        <div key={preset.category} className="flex flex-wrap items-center gap-1 bg-background/80 border rounded-lg p-1 text-xs">
                          <span className="text-[10px] font-semibold text-muted-foreground px-1">{preset.category}:</span>
                          {preset.sizes.map((sz) => {
                            const isAdded = sizeList.some((s) => s.size === sz);
                            return (
                              <button
                                key={sz}
                                type="button"
                                onClick={() => addSizeTag(sz)}
                                disabled={isAdded}
                                className={`text-[11px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                                  isAdded
                                    ? "bg-primary/10 text-primary opacity-50 cursor-not-allowed"
                                    : "bg-secondary hover:bg-secondary/80 text-foreground cursor-pointer"
                                }`}
                              >
                                {sz} {isAdded && "✓"}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Custom Size Input */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      Add Custom Size or Dimension (e.g. 950x1120, XL, 42, 1.5m)
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder={placeholders.items.customSize}
                        value={customSizeInput}
                        onChange={(e) => setCustomSizeInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addSizeTag(customSizeInput);
                            setCustomSizeInput("");
                          }
                        }}
                        className="h-8 text-xs font-mono"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-8 text-xs shrink-0"
                        onClick={() => {
                          addSizeTag(customSizeInput);
                          setCustomSizeInput("");
                        }}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Size
                      </Button>
                    </div>
                  </div>

                  {/* Configured Sizes List */}
                  {sizeList.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground">
                          Configured Sizes ({sizeList.length}):
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[11px] text-muted-foreground hover:text-foreground"
                          onClick={() => setShowSizePriceDetails(!showSizePriceDetails)}
                        >
                          <SlidersHorizontal className="h-3 w-3 mr-1" />
                          {showSizePriceDetails ? "Hide Size Prices" : "Set Custom Size Prices"}
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-1.5 bg-background p-2.5 rounded-lg border">
                        {sizeList.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-medium pl-2.5 pr-1 py-1 rounded-md"
                          >
                            <span>{item.size}</span>
                            {item.price && (
                              <span className="text-[10px] text-muted-foreground font-normal">
                                (₹{item.price})
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => removeSizeTag(idx)}
                              className="h-4 w-4 rounded-full flex items-center justify-center hover:bg-primary/20 text-primary ml-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Optional: Detailed Per-Size Pricing */}
                      {showSizePriceDetails && (
                        <div className="border rounded-lg p-2.5 bg-background space-y-2">
                          <p className="text-[11px] text-muted-foreground">
                            Specify custom selling price for each size (leave empty to use default ₹{formSellingPrice || "0"}):
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                            {sizeList.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 border p-1.5 rounded-md bg-secondary/20 text-xs">
                                <span className="font-mono font-semibold min-w-10 truncate text-foreground">{item.size}:</span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder={formSellingPrice || "₹ Default"}
                                  value={item.price}
                                  onChange={(e) => updateSizePrice(idx, e.target.value)}
                                  className="h-6 text-xs p-1 font-mono"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAddDialogOpen(false);
                  setEditDialogOpen(false);
                  resetForm();
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editDialogOpen ? "Save Changes" : "Save Item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Item Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Delete Item
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to delete <strong>{selectedItem?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteItem}
              disabled={submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category & Formula Manager Modal */}
      <CategoryManagerDialog
        isOpen={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        firmId={firmId}
        onCategoriesUpdated={loadItems}
      />
    </div>
  );
}
