"use client";

import { useState } from "react";
import { Plus, Boxes, Tag, Edit, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export function ItemsStep({
  items = [],
  onOpenCatalogFlow,
  onOpenCustomItem,
  onEditItem,
  onDeleteItem,
  onBack,
  onContinue,
}) {
  const [showAddMenu, setShowAddMenu] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
  const totalQty = items.reduce((sum, item) => sum + (parseInt(item.quantity) || 1), 0);

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Sale Items
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Add products or services to this voucher
            </p>
          </div>
          {items.length > 0 && (
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
              {items.length} {items.length === 1 ? "Item" : "Items"}
            </span>
          )}
        </div>

        {/* Existing Items Cards List */}
        {items.length === 0 ? (
          <div className="p-8 text-center rounded-3xl border border-dashed border-border/80 bg-card/40 space-y-3 my-2">
            <div className="h-12 w-12 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">No items added yet</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tap the button below to add products from catalog or custom items.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {items.map((item, idx) => {
              // Parse dimensions for display
              let dimSummary = "";
              if (item.dimensions && typeof item.dimensions === "object") {
                const parts = Object.entries(item.dimensions)
                  .filter(([k]) => k.toLowerCase() !== "quantity" && k.toLowerCase() !== "qty" && k.toLowerCase() !== "unit")
                  .map(([_, v]) => `${v}`);
                if (parts.length > 0) {
                  dimSummary = parts.join(" × ") + (item.dimensions.unit ? ` ${item.dimensions.unit}` : "");
                }
              }

              return (
                <div
                  key={item.id || idx}
                  className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3 transition-all hover:border-border"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-muted-foreground">
                          {idx + 1}.
                        </span>
                        <h3 className="font-bold text-base text-foreground truncate">
                          {item.name}
                        </h3>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {item.size && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-foreground">
                            {item.size}
                          </span>
                        )}
                        {dimSummary && (
                          <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground">
                            {dimSummary}
                          </span>
                        )}
                        {item.calculatedArea > 0 && (
                          <span className="text-xs font-mono font-medium text-primary">
                            {item.calculatedArea} {item.unit || "sq.ft"} / pc
                          </span>
                        )}
                        {item.isCustom && (
                          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                            Custom
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-mono text-base sm:text-lg font-bold text-foreground">
                        {formatCurrency(item.total)}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        Qty: {item.quantity} {item.unit || "pcs"}
                      </p>
                    </div>
                  </div>

                  {/* Edit and Delete Actions */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-border/60">
                    <span className="text-xs text-muted-foreground font-mono">
                      @ {formatCurrency(item.rate || item.unitPrice)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditItem(item, idx)}
                        className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5 rounded-xl cursor-pointer"
                      >
                        <Edit className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteItem(idx)}
                        className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10 gap-1.5 rounded-xl cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Item Actions */}
        <div className="pt-2">
          {!showAddMenu ? (
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setShowAddMenu(true)}
              className="w-full h-13 rounded-2xl border-dashed border-2 border-primary/40 hover:border-primary text-primary hover:bg-primary/5 font-semibold text-sm sm:text-base gap-2 cursor-pointer shadow-xs active:scale-[0.99] transition-all"
            >
              <Plus className="h-4 w-4 stroke-[3]" /> + Add Item
            </Button>
          ) : (
            <div className="p-3.5 rounded-3xl bg-muted/40 border border-border/80 space-y-2.5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Select Item Mode
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddMenu(false)}
                  className="text-xs text-muted-foreground hover:text-foreground cursor-pointer font-medium"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMenu(false);
                    onOpenCatalogFlow();
                  }}
                  className="p-3.5 rounded-2xl bg-card border border-border/80 hover:border-primary hover:bg-primary/5 text-left transition-all active:scale-[0.98] cursor-pointer flex flex-col gap-1.5"
                >
                  <div className="flex items-center gap-2">
                    <Boxes className="h-4 w-4 text-primary" />
                    <span className="font-bold text-sm text-foreground">From Catalog</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Doors, Windows, Glass & configured items
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowAddMenu(false);
                    onOpenCustomItem();
                  }}
                  className="p-3.5 rounded-2xl bg-card border border-border/80 hover:border-amber-500 hover:bg-amber-500/5 text-left transition-all active:scale-[0.98] cursor-pointer flex flex-col gap-1.5"
                >
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="font-bold text-sm text-foreground">Custom Item</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Direct entry for miscellaneous items
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground font-medium block">
                Voucher Subtotal ({totalQty} pcs)
              </span>
              <span className="font-mono text-xl font-bold text-foreground">
                {formatCurrency(subtotal)}
              </span>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              {items.length} {items.length === 1 ? "Item" : "Items"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
