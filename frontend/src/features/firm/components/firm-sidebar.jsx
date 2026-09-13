"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
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

function getNavItems(firmId) {
  return [
    { href: `/firm/${firmId}`, icon: LayoutDashboard, label: "Dashboard", exact: true },
    { href: `/firm/${firmId}/sales`, icon: ShoppingCart, label: "Sales", permission: "Sales.View" },
    { href: `/firm/${firmId}/purchases`, icon: ShoppingBag, label: "Purchases", permission: "Purchase.View" },
    { href: `/firm/${firmId}/expenses`, icon: Receipt, label: "Expenses", permission: "Expense.View" },
    { href: `/firm/${firmId}/items`, icon: Boxes, label: "Items", permission: "Inventory.View" },
    { href: `/firm/${firmId}/inventory`, icon: Package, label: "Inventory", permission: "Inventory.View" },
    { href: `/firm/${firmId}/customers`, icon: UserCircle, label: "Customers", permission: "Customers.View" },
    { href: `/firm/${firmId}/suppliers`, icon: Truck, label: "Suppliers", permission: "Suppliers.View" },
    { href: `/firm/${firmId}/omni-scale`, icon: Scale, label: "Omni Scale" },
    { href: `/firm/${firmId}/reports`, icon: BarChart3, label: "Reports", permission: "Reports.View" },
    { href: `/firm/${firmId}/delivery-challans`, icon: FileText, label: "Delivery Challans", permission: "DeliveryChallans.View" },
    { type: "separator" },
    { href: `/firm/${firmId}/users`, icon: UsersIcon, label: "Users", permission: "Users.Manage" },
    { href: `/firm/${firmId}/settings`, icon: Settings, label: "Settings", permission: "Settings.Manage" },
  ];
}

function NavContent({ firmId, collapsed, onNavigate }) {
  const pathname = usePathname();
  const { hasPermission, logout } = useAuth();
  const navItems = getNavItems(firmId);

  return (
    <ScrollArea className="flex-1 py-3">
      <nav className="space-y-0.5 px-2.5">
        {navItems.map((item, i) => {
          if (item.type === "separator") {
            return <Separator key={i} className="my-2 border-border/50" />;
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
                "group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium transition-all duration-150",
                isActive
                  ? "bg-secondary text-foreground font-medium shadow-xs border border-border/50"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              )}
            >
              <item.icon className={cn(
                "h-4 w-4 shrink-0 transition-opacity",
                isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
              )} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}

        <Separator className="my-2 border-border/50" />

        <button
          onClick={logout}
          className="group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary/60 hover:text-destructive transition-all duration-150 w-full cursor-pointer"
        >
          <LogOut className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-destructive" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </nav>
    </ScrollArea>
  );
}

export function FirmSidebar() {
  const { firmId } = useParams();
  const { firm } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const { mobileOpen, setMobileOpen } = useSidebar();

  const firmName = firm?.name || "Firm";

  return (
    <>
      {/* Mobile Drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0 pt-safe pb-safe border-r border-border/70 bg-sidebar flex flex-col h-full">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-border/70">
              <div className="h-8 w-8 rounded-xl bg-secondary border border-border/80 text-foreground flex items-center justify-center text-xs font-semibold shrink-0 shadow-xs">
                {firmName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-tight text-foreground truncate">{firmName}</p>
                <p className="text-[11px] text-muted-foreground">Workspace</p>
              </div>
            </div>
            <NavContent firmId={firmId} collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col h-screen border-r border-border/70 bg-sidebar transition-[width] duration-200 shrink-0 select-none",
          collapsed ? "w-14" : "w-60"
        )}
      >
        <div className="flex items-center justify-between px-3.5 py-3 border-b border-border/70 h-13">
          {!collapsed && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-7 w-7 rounded-xl bg-secondary border border-border/80 text-foreground flex items-center justify-center text-xs font-semibold shrink-0 shadow-xs">
                {firmName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-tight text-foreground truncate">{firmName}</p>
                <p className="text-[10px] text-muted-foreground font-mono">Workspace</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 ml-auto shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft className={cn("h-3.5 w-3.5 transition-transform duration-200", collapsed && "rotate-180")} />
          </Button>
        </div>
        <NavContent firmId={firmId} collapsed={collapsed} />
      </aside>
    </>
  );
}
