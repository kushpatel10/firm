"use client";

import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  ShoppingCart,
  Boxes,
  Calculator,
  ShoppingBag,
  Receipt,
  UserPlus,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export function MobileQuickActionSheet({ isOpen, onClose }) {
  const actions = [
    {
      href: "/dashboard/sales?action=new",
      title: "New Sale Voucher",
      description: "Itemized billing with custom dimensions & formulas",
      icon: ShoppingCart,
      color: "from-blue-600 to-indigo-600 text-white shadow-blue-500/25",
    },
    {
      href: "/dashboard/items?action=new",
      title: "Add Product / Item",
      description: "Create SKU, define sizes & set base selling prices",
      icon: Boxes,
      color: "from-emerald-600 to-teal-600 text-white shadow-emerald-500/25",
    },
    {
      href: "/dashboard/items?action=categories",
      title: "Categories & Formulas",
      description: "Manage dimensions, calculation units & math rules",
      icon: Calculator,
      color: "from-purple-600 to-violet-600 text-white shadow-purple-500/25",
    },
    {
      href: "/dashboard/purchases?action=new",
      title: "New Purchase Bill",
      description: "Record supplier bill and incoming inventory stock",
      icon: ShoppingBag,
      color: "from-amber-600 to-orange-600 text-white shadow-amber-500/25",
    },
    {
      href: "/dashboard/expenses?action=new",
      title: "Record Expense",
      description: "Track operational overhead, rent, tea, or transport",
      icon: Receipt,
      color: "from-rose-600 to-pink-600 text-white shadow-rose-500/25",
    },
    {
      href: "/dashboard/customers?action=new",
      title: "Add Customer",
      description: "Register party contact info, ledger & GSTIN",
      icon: UserPlus,
      color: "from-sky-600 to-cyan-600 text-white shadow-sky-500/25",
    },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl max-h-[85vh] p-0 pb-safe border-t border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl overflow-hidden"
      >
        <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto my-3" />

        <SheetHeader className="px-5 pb-3 text-left">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <SheetTitle className="text-base font-bold text-foreground">
              Quick Actions
            </SheetTitle>
          </div>
          <SheetDescription className="text-xs text-muted-foreground">
            Fast entry for sales, items, expenses, and business entries
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 py-2 space-y-2 overflow-y-auto max-h-[60vh] touch-scroll">
          {actions.map((act) => (
            <Link
              key={act.title}
              href={act.href}
              onClick={onClose}
              className="flex items-center gap-3.5 p-3 rounded-2xl border border-border/60 bg-background/60 hover:bg-secondary/70 active:scale-[0.98] transition-all cursor-pointer group shadow-xs"
            >
              <div
                className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${act.color} flex items-center justify-center shrink-0 shadow-md`}
              >
                <act.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                  {act.title}
                </h4>
                <p className="text-[11px] text-muted-foreground line-clamp-1">
                  {act.description}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-foreground transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
