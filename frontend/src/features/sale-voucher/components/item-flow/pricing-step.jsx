"use client";

import { Calculator, IndianRupee, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { placeholders } from "@/config/placeholders";

export function PricingStep({
  category,
  rate,
  setRate,
  quantity,
  setQuantity,
  calculationResult,
  onContinue,
}) {
  const canContinue = (parseFloat(rate) || 0) > 0 && (parseInt(quantity) || 0) > 0;

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Pricing
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Review calculation formula and set rate per unit
          </p>
        </div>

        {/* Prominent Formula & Measure Breakdown Card */}
        <div className="p-4 sm:p-5 rounded-3xl bg-linear-to-b from-card to-muted/30 border border-border/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Calculator className="h-4 w-4 text-primary" />
              <span>{calculationResult.calculationLabel} Formula</span>
            </div>
            {calculationResult.formulaDisplay && (
              <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                {calculationResult.formulaDisplay}
              </span>
            )}
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              Area per piece:
            </span>
            <div className="text-right">
              <span className="font-mono text-xl sm:text-2xl font-bold text-foreground">
                {calculationResult.calculatedMeasure.toFixed(2)}
              </span>
              <span className="text-xs font-semibold text-muted-foreground ml-1.5 uppercase">
                {calculationResult.unit}
              </span>
            </div>
          </div>

          {/* Rate Input Field */}
          <div className="space-y-1.5 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between">
              <Label htmlFor="rateInput" className="text-xs font-semibold text-foreground">
                {calculationResult.rateLabel} *
              </Label>
              <span className="text-[11px] text-muted-foreground">
                Base ₹/{calculationResult.unit}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                ₹
              </span>
              <Input
                id="rateInput"
                type="number"
                step="any"
                min="0"
                placeholder={placeholders.sales.rate}
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                autoFocus
                className="h-12 pl-8 text-lg font-bold font-mono bg-background rounded-xl border-border focus-visible:ring-primary"
              />
            </div>
          </div>

          {/* Quantity Controls */}
          <div className="space-y-1.5 pt-2">
            <Label htmlFor="qtyInput" className="text-xs font-semibold text-foreground">
              Quantity (Pieces) *
            </Label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, (parseInt(quantity) || 1) - 1))}
                className="h-11 w-11 rounded-xl border border-border bg-background hover:bg-muted text-lg font-bold flex items-center justify-center shrink-0 cursor-pointer active:scale-95 transition-transform"
              >
                −
              </button>
              <Input
                id="qtyInput"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="h-11 text-center font-bold font-mono text-base bg-background rounded-xl"
              />
              <button
                type="button"
                onClick={() => setQuantity((parseInt(quantity) || 0) + 1)}
                className="h-11 w-11 rounded-xl border border-border bg-background hover:bg-muted text-lg font-bold flex items-center justify-center shrink-0 cursor-pointer active:scale-95 transition-transform"
              >
                +
              </button>
            </div>
          </div>

          {/* Amount Breakdown Summary */}
          <div className="p-3.5 rounded-2xl bg-background border border-border/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Amount per piece:</span>
              <span className="font-mono font-bold text-foreground">
                {formatCurrency(calculationResult.amountPerPiece)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm pt-1.5 border-t border-border/50">
              <span className="font-semibold text-foreground">
                Total ({calculationResult.quantity} pcs):
              </span>
              <span className="font-mono text-lg font-black text-emerald-600 dark:text-emerald-400">
                {formatCurrency(calculationResult.totalAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Safe Action */}
      <div className="pt-6 pb-2">
        <Button
          type="button"
          size="lg"
          disabled={!canContinue}
          onClick={onContinue}
          className="w-full h-12 sm:h-13 text-base font-semibold rounded-2xl shadow-lg shadow-primary/20"
        >
          Review Item
        </Button>
      </div>
    </div>
  );
}
