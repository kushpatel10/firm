"use client";

import { Building2, User, Hash, Tag, FileText, CheckCircle2, Loader2, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";

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
  tax,
  setTax,
  discount,
  setDiscount,
  status = "CONFIRMED",
  setStatus,
  submitting = false,
  onBack,
  onSave,
}) {
  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
  const taxAmount = parseFloat(tax) || 0;
  const discountAmount = parseFloat(discount) || 0;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const grandTotal = Math.max(0, taxableAmount + taxAmount);

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Voucher Summary
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Review particulars and financial totals before saving
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
                  {item.size && (
                    <p className="text-xs text-muted-foreground">
                      Size: {item.size}
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
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-mono font-bold text-foreground">
              {formatCurrency(subtotal)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <Label htmlFor="discInput" className="text-xs text-muted-foreground">
                Discount (₹)
              </Label>
              <Input
                id="discInput"
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="h-9 text-xs font-mono font-medium rounded-lg bg-background"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="taxInput" className="text-xs text-muted-foreground">
                Tax / GST (₹)
              </Label>
              <Input
                id="taxInput"
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={tax}
                onChange={(e) => setTax(e.target.value)}
                className="h-9 text-xs font-mono font-medium rounded-lg bg-background"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <span>Taxable Amount:</span>
            <span className="font-mono font-medium">{formatCurrency(taxableAmount)}</span>
          </div>

          {/* Grand Total */}
          <div className="pt-3 border-t border-border/80 flex items-center justify-between">
            <span className="font-bold text-base text-foreground">
              Grand Total
            </span>
            <span className="font-mono text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(grandTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
