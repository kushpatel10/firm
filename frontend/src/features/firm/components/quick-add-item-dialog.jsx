"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Boxes, Plus, X, Loader2, Sparkles, Layers } from "lucide-react";
import { DEFAULT_UNITS } from "@/types/inventory.types";
import { inventoryService } from "@/services/inventory.service";
import { toast } from "sonner";

const QUICK_PRESETS = [
  { label: "Apparel", sizes: ["S", "M", "L", "XL", "XXL"] },
  { label: "Pallets", sizes: ["950x1120", "1000x1200", "1100x1100", "1200x800"] },
  { label: "Footwear", sizes: ["7", "8", "9", "10", "11"] },
];

export function QuickAddItemDialog({
  open,
  onOpenChange,
  initialName = "",
  firmId,
  onItemCreated,
}) {
  const [name, setName] = useState(initialName);
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [sellingPrice, setSellingPrice] = useState("");
  const [hasSizes, setHasSizes] = useState(false);
  const [sizesList, setSizesList] = useState([]);
  const [customSizeInput, setCustomSizeInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialName || "");
      setCategory("");
      setUnit("pcs");
      setSellingPrice("");
      setHasSizes(false);
      setSizesList([]);
      setCustomSizeInput("");
    }
  }, [open, initialName]);

  const addSizeTag = (sz) => {
    const trimmed = sz.trim();
    if (!trimmed) return;
    if (sizesList.some((s) => s.toLowerCase() === trimmed.toLowerCase())) return;
    setSizesList([...sizesList, trimmed]);
    setHasSizes(true);
  };

  const removeSizeTag = (idx) => {
    const updated = sizesList.filter((_, i) => i !== idx);
    setSizesList(updated);
    if (updated.length === 0) setHasSizes(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !sellingPrice) {
      toast.error("Item Name and Selling Price are required");
      return;
    }

    setSubmitting(true);
    try {
      const createdItem = await inventoryService.create(firmId, {
        name: name.trim(),
        category: category.trim() || undefined,
        unit,
        sellingPrice: parseFloat(sellingPrice),
        sizes: hasSizes && sizesList.length > 0 ? sizesList : null,
      });

      toast.success(`Item "${name}" created and added!`);
      if (onItemCreated) onItemCreated(createdItem);
      onOpenChange(false);
    } catch (err) {
      toast.error(err.message || "Failed to add item");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-5">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Boxes className="h-4 w-4 text-primary" />
            Quick Add New Item
          </DialogTitle>
          <DialogDescription className="text-xs">
            Save this item with size variations to use across vouchers.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Item Name *</Label>
            <Input
              placeholder="e.g. Wooden Pallet, Formal Shirt"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <Input
                placeholder="e.g. Pallets, Apparel"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_UNITS.map((u) => (
                    <SelectItem key={u.abbreviation} value={u.abbreviation} className="text-xs">
                      {u.name} ({u.abbreviation})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Selling Price (₹) *</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              required
              className="text-xs font-mono"
            />
          </div>

          {/* Size Variations Toggle */}
          <div className="border border-border/80 rounded-xl p-3 bg-muted/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold">Size Variations</span>
              </div>
              <Switch
                checked={hasSizes}
                onCheckedChange={(checked) => {
                  setHasSizes(checked);
                  if (!checked) setSizesList([]);
                }}
              />
            </div>

            {hasSizes && (
              <div className="space-y-2 pt-1.5 border-t border-border/60">
                {/* Quick presets */}
                <div className="flex flex-wrap gap-1">
                  {QUICK_PRESETS.map((preset) => (
                    <div key={preset.label} className="flex items-center gap-1 bg-background border rounded px-1.5 py-0.5 text-[10px]">
                      <span className="text-muted-foreground font-semibold">{preset.label}:</span>
                      {preset.sizes.map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => addSizeTag(sz)}
                          className="px-1 py-0.2 bg-secondary rounded hover:bg-secondary/80 font-mono"
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>

                <div className="flex gap-1.5">
                  <Input
                    placeholder="Custom size (e.g. 950x1120, XL)…"
                    value={customSizeInput}
                    onChange={(e) => setCustomSizeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSizeTag(customSizeInput);
                        setCustomSizeInput("");
                      }
                    }}
                    className="h-7 text-xs font-mono"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-7 text-xs"
                    onClick={() => {
                      addSizeTag(customSizeInput);
                      setCustomSizeInput("");
                    }}
                  >
                    Add
                  </Button>
                </div>

                {sizesList.length > 0 && (
                  <div className="flex flex-wrap gap-1 bg-background p-1.5 rounded border">
                    {sizesList.map((sz, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[11px] font-mono px-1.5 py-0.5 rounded"
                      >
                        {sz}
                        <button
                          type="button"
                          onClick={() => removeSizeTag(idx)}
                          className="hover:text-destructive"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Save & Select
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
