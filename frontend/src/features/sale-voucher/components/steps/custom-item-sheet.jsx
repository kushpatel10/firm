"use client";

import { useState, useEffect } from "react";
import { X, Plus, Tag, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import { placeholders } from "@/config/placeholders";

export function CustomItemSheet({ isOpen, onClose, onAddCustomItem, initialItem = null }) {
  const [name, setName] = useState(() => initialItem?.name || "");
  const [length, setLength] = useState(() => {
    let dims = initialItem?.dimensions;
    if (typeof dims === "string") {
      try { dims = JSON.parse(dims); } catch (_) {}
    }
    return String(dims?.length ?? dims?.l ?? "");
  });
  const [breadth, setBreadth] = useState(() => {
    let dims = initialItem?.dimensions;
    if (typeof dims === "string") {
      try { dims = JSON.parse(dims); } catch (_) {}
    }
    return String(dims?.breadth ?? dims?.b ?? dims?.width ?? dims?.w ?? "");
  });
  const [size, setSize] = useState(() => initialItem?.size || "");
  const [description, setDescription] = useState(() => initialItem?.description || "");
  const [quantity, setQuantity] = useState(() => String(initialItem?.quantity || "1"));
  const [unit, setUnit] = useState(() => initialItem?.unit || "pcs");
  const [unitPrice, setUnitPrice] = useState(() => String(initialItem?.unitPrice ?? initialItem?.rate ?? ""));

  useEffect(() => {
    if (initialItem) {
      setName(initialItem.name || "");
      let dims = initialItem.dimensions;
      if (typeof dims === "string") {
        try { dims = JSON.parse(dims); } catch (_) {}
      }
      setLength(String(dims?.length ?? dims?.l ?? ""));
      setBreadth(String(dims?.breadth ?? dims?.b ?? dims?.width ?? dims?.w ?? ""));
      setSize(initialItem.size || "");
      setDescription(initialItem.description || "");
      setQuantity(String(initialItem.quantity || "1"));
      setUnit(initialItem.unit || "pcs");
      setUnitPrice(String(initialItem.unitPrice ?? initialItem.rate ?? ""));
    } else {
      setName("");
      setLength("");
      setBreadth("");
      setSize("");
      setDescription("");
      setQuantity("1");
      setUnit("pcs");
      setUnitPrice("");
    }
  }, [initialItem, isOpen]);

  if (!isOpen) return null;

  const qtyNum = parseInt(quantity) || 1;
  const priceNum = parseFloat(unitPrice) || 0;
  const lineTotal = qtyNum * priceNum;

  const handleAdd = (e) => {
    e.preventDefault();
    const hasDims = Boolean(length.trim() || breadth.trim());
    const dimsObj = hasDims ? {
      length: length.trim() ? (parseFloat(length) || length.trim()) : null,
      breadth: breadth.trim() ? (parseFloat(breadth) || breadth.trim()) : null,
      width: breadth.trim() ? (parseFloat(breadth) || breadth.trim()) : null,
      unit: unit.trim() || "inch",
    } : null;

    let finalSize = size.trim();
    if (!finalSize && hasDims) {
      if (length.trim() && breadth.trim()) {
        finalSize = `${length.trim()} × ${breadth.trim()}`;
      } else {
        finalSize = length.trim() || breadth.trim();
      }
    }

    onAddCustomItem({
      id: initialItem?.id || `custom_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      size: finalSize || null,
      description: description.trim() || null,
      quantity: qtyNum,
      unit: unit.trim() || "pcs",
      unitPrice: priceNum,
      total: lineTotal,
      isCustom: true,
      category: "Custom Item",
      dimensions: dimsObj,
      formula: null,
      snapshot: {
        isCustom: true,
        name: name.trim(),
        size: finalSize || null,
        dimensions: dimsObj,
        description: description.trim() || null,
        quantity: qtyNum,
        unit: unit.trim() || "pcs",
        unitPrice: priceNum,
        total: lineTotal,
      },
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] bg-background flex flex-col justify-between animate-in fade-in duration-200">
      <div className="w-full max-w-xl mx-auto flex flex-col h-full bg-background shadow-2xl relative">
        {/* Sticky Header */}
        <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-border/80 px-4 py-3 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Tag className="h-4 w-4" />
            </span>
            <div>
              <h1 className="text-base font-bold text-foreground">
                {initialItem ? "Edit Custom Item" : "Add Custom Item"}
              </h1>
              <p className="text-[11px] text-muted-foreground">
                {initialItem ? "Update item specifications for this voucher" : "Direct item entry for this voucher"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-10 w-10 -mr-2 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Form Body */}
        <form onSubmit={handleAdd} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="customName" className="text-xs font-semibold">
              Item Name *
            </Label>
            <Input
              id="customName"
              placeholder={placeholders.sales.customItemName}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="h-11 rounded-xl bg-card border-border/80 text-sm font-medium"
            />
          </div>

          {/* Length & Breadth / Width Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="customLength" className="text-xs font-semibold">
                Length (Optional)
              </Label>
              <Input
                id="customLength"
                type="number"
                step="any"
                placeholder="e.g. 84"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="h-11 rounded-xl bg-card border-border/80 text-sm font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="customBreadth" className="text-xs font-semibold">
                Breadth / Width (Optional)
              </Label>
              <Input
                id="customBreadth"
                type="number"
                step="any"
                placeholder="e.g. 36"
                value={breadth}
                onChange={(e) => setBreadth(e.target.value)}
                className="h-11 rounded-xl bg-card border-border/80 text-sm font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="customSize" className="text-xs font-semibold">
                Size / Spec (Optional)
              </Label>
              <Input
                id="customSize"
                placeholder="e.g. 18mm, Commercial..."
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="h-11 rounded-xl bg-card border-border/80 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="customUnit" className="text-xs font-semibold">
                Unit
              </Label>
              <Input
                id="customUnit"
                placeholder={placeholders.sales.customItemUnit}
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="h-11 rounded-xl bg-card border-border/80 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="customQty" className="text-xs font-semibold">
                Quantity *
              </Label>
              <Input
                id="customQty"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                className="h-11 rounded-xl bg-card border-border/80 text-sm font-mono font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="customRate" className="text-xs font-semibold">
                Rate (₹) *
              </Label>
              <Input
                id="customRate"
                type="number"
                step="any"
                min="0"
                placeholder={placeholders.common.zero}
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                required
                className="h-11 rounded-xl bg-card border-border/80 text-sm font-mono font-bold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="customDesc" className="text-xs font-semibold">
              Description / Notes (Optional)
            </Label>
            <Textarea
              id="customDesc"
              placeholder={placeholders.sales.customItemInstructions}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="rounded-xl bg-card border-border/80 text-xs resize-none"
            />
          </div>

          {/* Amount Preview Box */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Total Calculated:
            </span>
            <span className="font-mono text-xl font-bold text-foreground">
              {formatCurrency(lineTotal)}
            </span>
          </div>

          {/* Sticky Bottom Action */}
          <div className="sticky bottom-0 z-20 bg-background/95 backdrop-blur-md border-t border-border/80 px-4 py-3 -mx-4 -mb-4 mt-auto pb-safe">
            <Button
              type="submit"
              size="lg"
              disabled={!name.trim() || priceNum <= 0}
              className="w-full h-12 text-base font-semibold rounded-2xl shadow-lg shadow-primary/20 gap-2 cursor-pointer"
            >
              {initialItem ? (
                <>
                  <Edit className="h-4 w-4" /> Update Item
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 stroke-[3]" /> Add to Voucher
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
