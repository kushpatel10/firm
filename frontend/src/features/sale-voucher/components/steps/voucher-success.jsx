"use client";

import { CheckCircle2, FileText, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export function VoucherSuccess({ savedSale, onViewVoucher, onDone }) {
  const invNumber = savedSale?.invoiceNumber || `INV-${savedSale?.id?.slice(0, 6)}`;
  const party = savedSale?.customerName || savedSale?.customer?.name || "Customer";
  const total = savedSale?.total || 0;

  return (
    <div className="flex flex-col h-full justify-between items-center text-center py-6 px-2">
      <div className="my-auto space-y-5 max-w-sm">
        {/* Animated Green Badge */}
        <div className="h-20 w-20 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10 animate-in zoom-in-75 duration-300">
          <CheckCircle2 className="h-10 w-10 stroke-[2.5]" />
        </div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Voucher Saved!
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Sales voucher has been posted successfully to ledger.
          </p>
        </div>

        {/* Saved Voucher Ticket Box */}
        <div className="p-5 rounded-3xl bg-card border border-border/80 shadow-sm space-y-3 text-left">
          <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Voucher Number
            </span>
            <span className="font-mono text-sm font-bold text-primary">
              {invNumber}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Billed To:</span>
            <span className="font-semibold text-foreground truncate max-w-[180px]">
              {party}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/60">
            <span className="text-xs text-muted-foreground font-medium">Grand Total:</span>
            <span className="font-mono text-xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(total)}
            </span>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="w-full pt-6 pb-2 space-y-2.5">
        <Button
          type="button"
          size="lg"
          onClick={onViewVoucher}
          className="w-full h-12 sm:h-13 text-base font-semibold rounded-2xl shadow-lg shadow-primary/20 gap-2 cursor-pointer"
        >
          <FileText className="h-4 w-4" /> View / Print Bill
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onDone}
          className="w-full h-12 text-sm font-semibold rounded-2xl cursor-pointer"
        >
          Done
        </Button>
      </div>
    </div>
  );
}
