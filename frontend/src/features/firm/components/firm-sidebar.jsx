"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, ShoppingCart, ShoppingBag, Receipt, Package, Boxes,
  Users as UsersIcon, Truck, BarChart3, FileText, Settings, LogOut,
  ChevronLeft, UserCircle, Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import { useSidebar } from "@/contexts/sidebar-context";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/dashboard/sales", icon: ShoppingCart, label: "Sales", permission: "Sales.View" },
  { href: "/dashboard/purchases", icon: ShoppingBag, label: "Purchases", permission: "Purchase.View" },
  { href: "/dashboard/expenses", icon: Receipt, label: "Expenses", permission: "Expense.View" },
  { href: "/dashboard/items", icon: Boxes, label: "Items", permission: "Inventory.View" },
  { href: "/dashboard/inventory", icon: Package, label: "Inventory", permission: "Inventory.View" },
  { href: "/dashboard/customers", icon: UserCircle, label: "Customers", permission: "Customers.View" },
  { href: "/dashboard/suppliers", icon: Truck, label: "Suppliers", permission: "Suppliers.View" },
  { href: "/dashboard/omni-scale", icon: Scale, label: "Omni Scale" },
  { href: "/dashboard/reports", icon: BarChart3, label: "Reports", permission: "Reports.View" },
  { href: "/dashboard/delivery-challans", icon: FileText, label: "Delivery Challans", permission: "DeliveryChallans.View" },
  { type: "separator" },
  { href: "/dashboard/users", icon: UsersIcon, label: "Users", permission: "Users.Manage" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings", permission: "Settings.Manage" },
];

function NavContent({ collapsed, onNavigate }) {
  const pathname = usePathname();
  const { hasPermission, logout } = useAuth();

  return (
    <ScrollArea className="flex-1 py-3">
      <nav className="space-y-1 px-3">
        {NAV_ITEMS.map((item, i) => {
          if (item.type === "separator") {
            return <Separator key={i} className="my-2.5 border-border/60" />;
          }

          if (item.permission && !hasPermission(item.permission)) return null;

          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all duration-150 min-h-[40px]",
                isActive
                  ? "bg-secondary text-foreground font-semibold shadow-xs border border-border/70"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              )}
            >
              <item.icon className={cn(
                "h-[18px] w-[18px] shrink-0 transition-colors",
                isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
              )} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}

        <Separator className="my-2.5 border-border/60" />

        <button
          onClick={logout}
          className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium text-muted-foreground hover:bg-secondary/60 hover:text-destructive transition-all duration-150 w-full cursor-pointer min-h-[40px]"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0 text-muted-foreground group-hover:text-destructive transition-colors" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </nav>
    </ScrollArea>
  );
}

export function FirmSidebar() {
  const { firm } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const { mobileOpen, setMobileOpen } = useSidebar();

  const firmName = firm?.name || "Firm";

  return (
    <>
      {/* Mobile Drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 sm:w-80 p-0 pt-safe pb-safe border-r border-border/70 bg-sidebar flex flex-col h-full">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 px-4 py-4 border-b border-border/70">
              <div className="h-9 w-9 rounded-xl bg-secondary border border-border/80 text-foreground flex items-center justify-center text-sm font-semibold shrink-0 shadow-xs">
                {firmName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold tracking-tight text-foreground truncate">{firmName}</p>
                <p className="text-xs text-muted-foreground font-normal">Workspace</p>
              </div>
            </div>
            <NavContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col h-screen border-r border-border/70 bg-sidebar transition-[width] duration-200 shrink-0 select-none",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/70 h-14">
          {!collapsed && (
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-8 w-8 rounded-xl bg-secondary border border-border/80 text-foreground flex items-center justify-center text-xs font-semibold shrink-0 shadow-xs">
                {firmName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold tracking-tight text-foreground truncate">{firmName}</p>
                <p className="text-xs text-muted-foreground">Workspace</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 ml-auto shrink-0 text-muted-foreground hover:text-foreground rounded-lg"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform duration-200", collapsed && "rotate-180")} />
          </Button>
        </div>
        <NavContent collapsed={collapsed} />
      </aside>
    </>
  );
}
