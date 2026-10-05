"use client";

import { FileText, Hash, ShieldCheck, NotebookTabs } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { placeholders } from "@/config/placeholders";

export function InvoiceStep({
  invoiceNumber,
  setInvoiceNumber,
  saleType = "PAKU",
  setSaleType,
  description = "",
  setDescription,
  onBack,
  onContinue,
}) {
  return (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Invoice Details
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Specify invoice number and bill classification
          </p>
        </div>

        {/* Invoice Number Input */}
        <div className="space-y-1.5 pt-1">
          <Label htmlFor="invNumberInput" className="text-xs font-semibold text-foreground">
            Invoice Number
          </Label>
          <div className="relative">
            <Hash className="h-4 w-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              id="invNumberInput"
              placeholder={placeholders.sales.invoiceNumber}
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="h-12 pl-10 rounded-xl bg-card border-border/80 font-mono text-sm"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Leave blank to automatically assign the next sequential invoice number.
          </p>
        </div>

        {/* Bill Type / Ledger Selection */}
        <div className="space-y-2 pt-2">
          <Label className="text-xs font-semibold text-foreground">
            Bill / Ledger Type
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSaleType("PAKU")}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 active:scale-[0.98] ${
                saleType === "PAKU"
                  ? "border-primary bg-primary/10 ring-2 ring-primary/40 shadow-xs"
                  : "border-border/80 bg-card hover:bg-muted/40"
              }`}
            >
              <span className="h-4 w-4 rounded-full bg-white border border-slate-300 dark:border-neutral-300 shadow-2xs shrink-0" />
              <div>
                <span className="font-semibold text-sm text-foreground block">
                  Tax Invoice
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Official / White
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSaleType("KACHU")}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 active:scale-[0.98] ${
                saleType === "KACHU"
                  ? "border-primary bg-primary/10 ring-2 ring-primary/40 shadow-xs"
                  : "border-border/80 bg-card hover:bg-muted/40"
              }`}
            >
              <span className="h-4 w-4 rounded-full bg-black border border-slate-700 shadow-2xs shrink-0" />
              <div>
                <span className="font-semibold text-sm text-foreground block">
                  Estimate / Memo
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Cash Memo / Black
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Description / Voucher Notes */}
        <div className="space-y-1.5 pt-2">
          <Label htmlFor="voucherNotes" className="text-xs font-semibold text-muted-foreground">
            Voucher Notes / Terms (Optional)
          </Label>
          <Textarea
            id="voucherNotes"
            placeholder={placeholders.sales.voucherNotes}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="rounded-xl bg-card border-border/80 text-xs resize-none"
          />
        </div>
      </div>
    </div>
  );
}
