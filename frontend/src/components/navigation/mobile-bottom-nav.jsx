"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ShoppingBag,
  Building2,
  Users,
  ShieldAlert,
  Menu,
} from "lucide-react";
import { useSidebar } from "@/contexts/sidebar-context";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { toggleMobile, mobileOpen } = useSidebar();

  const isAdmin = pathname.startsWith("/admin");

  const NAV_TABS = isAdmin
    ? [
        {
          href: "/admin",
          label: "Overview",
          icon: LayoutDashboard,
          exact: true,
        },
        {
          href: "/admin/firms",
          label: "Firms",
          icon: Building2,
        },
        {
          href: "/admin/users",
          label: "Users",
          icon: Users,
        },
        {
          href: "/dashboard",
          label: "Firm App",
          icon: ShoppingBag,
        },
      ]
    : [
        {
          href: "/dashboard",
          label: "Overview",
          icon: LayoutDashboard,
          exact: true,
        },
        {
          href: "/dashboard/sales",
          label: "Sales",
          icon: ShoppingCart,
        },
        {
          href: "/dashboard/inventory",
          label: "Inventory",
          icon: Package,
        },
        {
          href: "/dashboard/purchases",
          label: "Purchases",
          icon: ShoppingBag,
        },
      ];

  return (
    <nav
      id="mobile-bottom-navigation"
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border/80 pb-safe shadow-lg"
    >
      <div className="flex items-center justify-around h-15 px-2 max-w-lg mx-auto">
        {NAV_TABS.map((tab) => {
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center h-full py-1 min-w-[56px] min-h-[48px] rounded-xl transition-all cursor-pointer select-none active:scale-95",
                isActive
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "p-1 rounded-lg transition-all",
                  isActive && "bg-secondary text-foreground shadow-xs"
                )}
              >
                <tab.icon className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-medium tracking-tight mt-0.5">
                {tab.label}
              </span>
            </Link>
          );
        })}

        {/* Menu Tab (Toggles full drawer) */}
        <button
          id="mobile-menu-tab-btn"
          type="button"
          onClick={toggleMobile}
          aria-label="Open full menu"
          className={cn(
            "flex-1 flex flex-col items-center justify-center h-full py-1 min-w-[56px] min-h-[48px] rounded-xl transition-all cursor-pointer select-none active:scale-95",
            mobileOpen
              ? "text-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <div
            className={cn(
              "p-1 rounded-lg transition-all",
              mobileOpen && "bg-secondary text-foreground shadow-xs"
            )}
          >
            <Menu className="h-5 w-5" />
          </div>
          <span className="text-[11px] font-medium tracking-tight mt-0.5">
            More
          </span>
        </button>
      </div>
    </nav>
  );
}
