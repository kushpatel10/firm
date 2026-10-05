"use client";

import {
  Building2,
  User,
  Hash,
  Tag,
  CheckCircle2,
  Loader2,
  IndianRupee,
  Percent,
  ShieldCheck,
  Receipt,
  Calculator,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { placeholders } from "@/config/placeholders";

const GST_PRESETS = [
  { label: "0%", desc: "Nil", val: "0" },
  { label: "5%", desc: "5%", val: "5" },
  { label: "12%", desc: "12%", val: "12" },
  { label: "18%", desc: "18% Std", val: "18" },
  { label: "28%", desc: "28%", val: "28" },
];

export function VoucherSummary({
  partyMode,
  customerId,
  partyName,
  partyPhone,
  partyAddress,
  invoiceNumber,
  saleType,
  description,
  items = [],
  subtotal: propSubtotal,
  // Tax props
  taxMode = "percent",
  setTaxMode,
  taxRate = "18",
  setTaxRate,
  tax = "0",
  setTax,
  selectTaxPreset,
  taxAmount: propTaxAmount,
  // Discount props
  discountMode = "fixed",
  setDiscountMode,
  discountRate = "0",
  setDiscountRate,
  discount = "0",
  setDiscount,
  discountAmount: propDiscountAmount,
  taxableAmount: propTaxableAmount,
  grandTotal: propGrandTotal,
  status = "CONFIRMED",
  setStatus,
  submitting = false,
  onBack,
  onSave,
}) {
  const subtotal = propSubtotal ?? items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
  const discountAmount = propDiscountAmount ?? (
    discountMode === "percent"
      ? Math.round(((subtotal * (parseFloat(discountRate) || 0)) / 100) * 100) / 100
      : Math.max(0, parseFloat(discount) || 0)
  );
  const taxableAmount = propTaxableAmount ?? Math.max(0, subtotal - discountAmount);
  const taxAmount = propTaxAmount ?? (
    taxMode === "percent"
      ? Math.round(((taxableAmount * (parseFloat(taxRate) || 0)) / 100) * 100) / 100
      : Math.max(0, parseFloat(tax) || 0)
  );
  const grandTotal = propGrandTotal ?? Math.max(0, taxableAmount + taxAmount);

  const handlePresetClick = (presetVal) => {
    if (selectTaxPreset) {
      selectTaxPreset(presetVal);
    } else {
      if (setTaxMode) setTaxMode("percent");
      if (setTaxRate) setTaxRate(String(presetVal));
      if (setTax) {
        const amt = Math.round(((taxableAmount * (parseFloat(presetVal) || 0)) / 100) * 100) / 100;
        setTax(String(amt));
      }
    }
  };

  const effectiveTaxPercent = taxableAmount > 0
    ? ((taxAmount / taxableAmount) * 100).toFixed(2)
    : "0.00";

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Voucher Summary
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Review particulars and financial adjustments before saving
          </p>
        </div>

        {/* Party Card */}
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              {partyMode === "registered" ? <Building2 className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
              Billed To
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted text-foreground">
              {partyMode === "registered" ? "Registered" : "Custom Party"}
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-foreground">
              {partyName || "Walk-in Customer"}
            </h3>
            {partyPhone && (
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                Phone: {partyPhone}
              </p>
            )}
            {partyAddress && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Address: {partyAddress}
              </p>
            )}
          </div>
        </div>

        {/* Invoice & Classification Info */}
        <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-foreground font-mono">
              {invoiceNumber ? invoiceNumber : "Auto Generated"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                saleType === "KACHU" ? "bg-black border border-slate-600" : "bg-white border border-slate-300"
              }`}
            />
            <span className="font-medium text-foreground">
              {saleType === "KACHU" ? "Estimate / Cash Memo" : "Tax Invoice"}
            </span>
          </div>
        </div>

        {/* Items Line Breakdown */}
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Line Items ({items.length})
            </span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Amount
            </span>
          </div>

          <div className="divide-y divide-border/40 space-y-2">
            {items.map((item, idx) => (
              <div key={item.id || idx} className="pt-2 first:pt-0 flex items-baseline justify-between gap-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">
                    {item.quantity} × {item.name}
                  </p>
                  {(item.size || item.dimensions) && (
                    <p className="text-xs text-muted-foreground font-mono">
                      {(() => {
                        let dims = item.dimensions;
                        if (typeof dims === "string") {
                          try { dims = JSON.parse(dims); } catch (_) {}
                        }
                        const l = dims?.length ?? dims?.l;
                        const b = dims?.breadth ?? dims?.b ?? dims?.width ?? dims?.w;
                        const h = dims?.height ?? dims?.h ?? dims?.thickness;
                        const dimStr = (l != null && b != null)
                          ? `${l} × ${b}${h != null ? ` × ${h}` : ""}${dims?.unit ? ` ${dims.unit}` : ""}`
                          : "";
                        if (dimStr && item.size && item.size !== dimStr) {
                          return `Size: ${dimStr} (${item.size})`;
                        }
                        return `Size: ${dimStr || item.size}`;
                      })()}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono font-semibold text-foreground">
                    {formatCurrency(item.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Accounting Adjustments: Subtotal, Discount, Tax, Grand Total */}
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between text-sm pb-2 border-b border-border/60">
            <span className="font-semibold text-muted-foreground">Items Subtotal</span>
            <span className="font-mono text-base font-bold text-foreground">
              {formatCurrency(subtotal)}
            </span>
          </div>

          {/* Discount Section with % / ₹ Toggle */}
          <div className="space-y-2 rounded-xl bg-muted/20 border border-border/40 p-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                Discount
              </Label>
              <div className="flex items-center rounded-lg bg-muted p-0.5 text-[11px] font-medium">
                <button
                  type="button"
                  onClick={() => setDiscountMode && setDiscountMode("fixed")}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    discountMode === "fixed"
                      ? "bg-background text-foreground shadow-2xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  ₹ (Fixed)
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountMode && setDiscountMode("percent")}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    discountMode === "percent"
                      ? "bg-background text-foreground shadow-2xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  % (Rate)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
              {discountMode === "fixed" ? (
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground pointer-events-none">
                    ₹
                  </span>
                  <Input
                    id="discInput"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={discount}
                    onChange={(e) => setDiscount && setDiscount(e.target.value)}
                    className="h-9 pl-6 text-xs font-mono font-medium rounded-lg bg-background"
                  />
                </div>
              ) : (
                <div className="relative">
                  <Input
                    id="discRateInput"
                    type="number"
                    min="0"
                    max="100"
                    step="any"
                    placeholder="0"
                    value={discountRate}
                    onChange={(e) => setDiscountRate && setDiscountRate(e.target.value)}
                    className="h-9 pr-6 text-xs font-mono font-medium rounded-lg bg-background"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                    %
                  </span>
                </div>
              )}

              <div className="h-9 px-3 py-1.5 rounded-lg border bg-background/50 font-mono text-xs flex items-center justify-between text-muted-foreground">
                <span className="text-[11px]">Deduction:</span>
                <span className="font-semibold text-destructive">
                  {discountAmount > 0 ? `-${formatCurrency(discountAmount)}` : formatCurrency(0)}
                </span>
              </div>
            </div>
          </div>

          {/* Taxable Amount Summary */}
          <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-muted/40 border border-border/50">
            <span className="font-medium text-muted-foreground">Taxable Value (Subtotal - Discount):</span>
            <span className="font-mono font-bold text-foreground">{formatCurrency(taxableAmount)}</span>
          </div>

          {/* Tax / GST Section with Dual Mode (% or ₹) and Quick Preset Chips */}
          <div className="space-y-3 rounded-xl bg-muted/20 border border-border/40 p-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Percent className="h-4 w-4 text-primary" />
                <Label className="text-xs font-bold text-foreground">
                  Tax / GST
                </Label>
                <span className="text-[10px] text-muted-foreground font-mono">
                  ({saleType === "PAKU" ? "Official GST" : "Optional / Memo"})
                </span>
              </div>

              {/* Mode Selector Toggle: % vs ₹ */}
              <div className="flex items-center rounded-lg bg-muted p-0.5 text-xs font-medium self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setTaxMode && setTaxMode("percent")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    taxMode === "percent"
                      ? "bg-background text-primary shadow-2xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Percent className="h-3 w-3" />
                  Percentage (%)
                </button>
                <button
                  type="button"
                  onClick={() => setTaxMode && setTaxMode("fixed")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    taxMode === "fixed"
                      ? "bg-background text-primary shadow-2xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <IndianRupee className="h-3 w-3" />
                  Fixed Amount (₹)
                </button>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  GST Presets
                </span>
                {taxMode === "percent" && (
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Active: <strong className="text-primary">{taxRate || 0}%</strong>
                  </span>
                )}
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {GST_PRESETS.map((p) => {
                  const isCurrent = taxMode === "percent" && parseFloat(taxRate) === parseFloat(p.val);
                  return (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => handlePresetClick(p.val)}
                      className={`py-1.5 px-1 rounded-xl text-center transition-all cursor-pointer border flex flex-col items-center justify-center active:scale-95 ${
                        isCurrent
                          ? "bg-primary text-primary-foreground border-primary shadow-xs font-bold ring-2 ring-primary/30"
                          : "bg-card hover:bg-muted text-foreground border-border/70 shadow-2xs"
                      }`}
                    >
                      <span className="text-xs font-bold leading-tight">{p.label}</span>
                      <span className={`text-[10px] leading-tight ${isCurrent ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                        {p.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mode-Specific Inputs */}
            {taxMode === "percent" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div className="space-y-1">
                  <Label htmlFor="taxRateInput" className="text-xs text-muted-foreground">
                    Custom Tax Rate (%)
                  </Label>
                  <div className="relative">
                    <Input
                      id="taxRateInput"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="18"
                      value={taxRate}
                      onChange={(e) => setTaxRate && setTaxRate(e.target.value)}
                      className="h-9 pr-7 text-xs font-mono font-medium rounded-lg bg-background"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                      %
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Calculated Tax Amount
                  </Label>
                  <div className="h-9 px-3 py-1.5 rounded-lg border bg-background/50 font-mono text-xs flex items-center justify-between font-semibold text-primary">
                    <span className="text-[11px] text-muted-foreground font-normal">
                      +{taxRate || 0}% on {formatCurrency(taxableAmount)}
                    </span>
                    <span className="font-bold text-sm">
                      +{formatCurrency(taxAmount)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div className="space-y-1">
                  <Label htmlFor="taxFixedInput" className="text-xs text-muted-foreground">
                    Direct Tax Amount (₹)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground pointer-events-none">
                      ₹
                    </span>
                    <Input
                      id="taxFixedInput"
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0.00"
                      value={tax}
                      onChange={(e) => setTax && setTax(e.target.value)}
                      className="h-9 pl-6 text-xs font-mono font-medium rounded-lg bg-background"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Effective Tax Rate
                  </Label>
                  <div className="h-9 px-3 py-1.5 rounded-lg border bg-background/50 font-mono text-xs flex items-center justify-between text-muted-foreground">
                    <span className="text-[11px]">Tax Share</span>
                    <span className="font-bold text-foreground">
                      {effectiveTaxPercent}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Grand Total Row */}
          <div className="pt-3 border-t border-border/80 flex items-center justify-between">
            <div>
              <span className="font-bold text-base text-foreground block">
                Grand Total
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                Subtotal {formatCurrency(subtotal)}
                {discountAmount > 0 && ` - Disc ${formatCurrency(discountAmount)}`}
                {taxAmount > 0 && ` + Tax ${formatCurrency(taxAmount)}`}
              </span>
            </div>
            <span className="font-mono text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(grandTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
