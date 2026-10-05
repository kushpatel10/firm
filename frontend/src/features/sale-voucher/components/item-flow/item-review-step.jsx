"use client";

import { Check, Edit, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export function ItemReviewStep({
  category,
  selectedSubtype,
  selectedSize,
  isCustomSize,
  customSizeText,
  dimensionValues = {},
  calculationResult,
  onEdit,
  onAddItem,
  isEditing = false,
}) {
  const finalSize = isCustomSize ? (customSizeText || "Custom Size") : selectedSize;
  const dimEntries = Object.entries(dimensionValues).filter(
    ([k]) => k.toLowerCase() !== "quantity" && k.toLowerCase() !== "qty"
  );
  const dimsDisplay = dimEntries
    .map(([_, v]) => `${v}`)
    .join(" × ") + (category?.dimensions?.[0]?.unit ? ` ${category.dimensions[0].unit}` : "");

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Review Item
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Verify item specifications before adding to voucher
          </p>
        </div>

        {/* Clean Review Card */}
        <div className="p-5 rounded-3xl bg-card border border-border/80 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-border/60">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{category?.icon || "📦"}</span>
                <div>
                  <h3 className="font-bold text-lg text-foreground">
                    {selectedSubtype ? `${category?.name} - ${selectedSubtype}` : category?.name}
                  </h3>
                  {finalSize && (
                    <span className="inline-block mt-0.5 text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                      Size: {finalSize}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="gap-1.5 h-8 text-xs rounded-xl"
            >
              <Edit className="h-3.5 w-3.5" /> Edit
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 py-1 text-sm">
            {dimsDisplay && (
              <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Dimensions
                </span>
                <span className="font-bold font-mono text-foreground mt-0.5 block">
                  {dimsDisplay}
                </span>
              </div>
            )}

            <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Quantity
              </span>
              <span className="font-bold font-mono text-foreground mt-0.5 block">
                {calculationResult.quantity} pcs
              </span>
            </div>

            {calculationResult.calculatedMeasure > 0 && (
              <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  {calculationResult.calculationLabel}
                </span>
                <span className="font-bold font-mono text-foreground mt-0.5 block">
                  {calculationResult.calculatedMeasure.toFixed(2)} {calculationResult.unit} / pc
                </span>
              </div>
            )}

            <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                {calculationResult.rateLabel}
              </span>
              <span className="font-bold font-mono text-foreground mt-0.5 block">
                {formatCurrency(calculationResult.rate)}
              </span>
            </div>
          </div>

          {/* Grand Piece & Total Amount */}
          <div className="pt-3 border-t border-border/60 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground font-medium block">
                Amount ({formatCurrency(calculationResult.amountPerPiece)} × {calculationResult.quantity})
              </span>
              <span className="font-mono text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {formatCurrency(calculationResult.totalAmount)}
              </span>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              ✓ Ready
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons: Edit and Add Item */}
      <div className="pt-6 pb-2 flex gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onEdit}
          className="flex-1 h-12 sm:h-13 text-sm font-semibold rounded-2xl"
        >
          ← Edit
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={onAddItem}
          className="flex-2 h-12 sm:h-13 text-base font-semibold rounded-2xl shadow-lg shadow-primary/20 gap-2 cursor-pointer"
        >
          {isEditing ? (
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
    </div>
  );
}
