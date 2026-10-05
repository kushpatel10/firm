"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Layers,
  ShoppingBag,
  Building2,
  Users,
  ShieldCheck,
  Menu,
} from "lucide-react";
import { useSidebar } from "@/contexts/sidebar-context";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { toggleMobile, mobileOpen } = useSidebar();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Auto-hide when virtual keyboard is open on mobile devices
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      if (window.visualViewport) {
        const heightDiff = window.innerHeight - window.visualViewport.height;
        setIsKeyboardOpen(heightDiff > 140);
      }
    };

    window.visualViewport?.addEventListener("resize", handleResize);
    return () => {
      window.visualViewport?.removeEventListener("resize", handleResize);
    };
  }, []);

  // Auto-hide when full-screen modal or dialog is open (body overflow hidden)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const observer = new MutationObserver(() => {
      const isLocked = document.body.style.overflow === "hidden";
      setIsModalOpen(isLocked);
    });

    observer.observe(document.body, { attributes: true, attributeFilter: ["style"] });
    return () => observer.disconnect();
  }, []);

  // Do not render bottom nav when keyboard or modal is active
  if (isKeyboardOpen || isModalOpen) {
    return null;
  }

  const isAdmin = pathname.startsWith("/admin");

  const tabs = isAdmin
    ? [
        { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
        { href: "/admin/firms", label: "Firms", icon: Building2 },
        { href: "/admin/users", label: "Users", icon: Users },
        { href: "/admin/roles", label: "Roles", icon: ShieldCheck },
      ]
    : [
        { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
        { href: "/dashboard/sales", label: "Sales", icon: ShoppingCart },
        { href: "/dashboard/items", label: "Items", icon: Layers },
        { href: "/dashboard/purchases", label: "Purchases", icon: ShoppingBag },
      ];

  return (
    <nav
      id="mobile-bottom-navigation"
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-md border-t border-border/80 pb-safe shadow-lg pointer-events-auto"
    >
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {tabs.map((tab) => {
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
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "p-1.5 rounded-xl transition-all",
                  isActive && "bg-primary/10 text-primary"
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
              ? "text-primary font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <div
            className={cn(
              "p-1.5 rounded-xl transition-all",
              mobileOpen && "bg-primary/10 text-primary"
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
