"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Building2,
  Users,
  Menu,
  Plus,
} from "lucide-react";
import { useSidebar } from "@/contexts/sidebar-context";
import { MobileQuickActionSheet } from "./mobile-quick-action-sheet";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { toggleMobile, mobileOpen } = useSidebar();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);

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

  const leftTabs = isAdmin
    ? [
        { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
        { href: "/admin/firms", label: "Firms", icon: Building2 },
      ]
    : [
        { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
        { href: "/dashboard/sales", label: "Sales", icon: ShoppingCart },
      ];

  const rightTabs = isAdmin
    ? [
        { href: "/admin/users", label: "Users", icon: Users },
      ]
    : [
        { href: "/dashboard/items", label: "Items", icon: Boxes },
      ];

  return (
    <>
      <nav
        id="mobile-bottom-navigation"
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-card/90 backdrop-blur-2xl border-t border-border/80 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.06)] pointer-events-auto"
      >
        <div className="flex items-center justify-between h-16 px-3 max-w-lg mx-auto relative">
          {/* Left Tabs */}
          {leftTabs.map((tab) => {
            const isActive = tab.exact
              ? pathname === tab.href
              : pathname.startsWith(tab.href);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center h-full py-1 min-w-[54px] min-h-[48px] rounded-2xl transition-all cursor-pointer select-none active:scale-95",
                  isActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div
                  className={cn(
                    "p-1.5 rounded-xl transition-all duration-200",
                    isActive ? "bg-primary/10 text-primary scale-105" : "text-muted-foreground"
                  )}
                >
                  <tab.icon className="h-5 w-5" />
                </div>
                <span className={cn("text-[11px] tracking-tight mt-0.5", isActive ? "font-bold text-primary" : "font-medium")}>
                  {tab.label}
                </span>
              </Link>
            );
          })}

          {/* Center Primary Action FAB (WhatsApp / Telegram style) */}
          <div className="flex flex-col items-center justify-center px-1">
            <button
              type="button"
              onClick={() => setQuickActionOpen(true)}
              aria-label="Create new entry"
              className="h-12 w-12 rounded-full bg-gradient-to-tr from-primary to-blue-500 text-primary-foreground shadow-lg shadow-primary/35 flex items-center justify-center -translate-y-3.5 border-[3px] border-card active:scale-90 transition-transform cursor-pointer"
            >
              <Plus className="h-6 w-6 stroke-[2.5]" />
            </button>
            <span className="text-[10px] font-bold text-muted-foreground -mt-2">
              Action
            </span>
          </div>

          {/* Right Tabs */}
          {rightTabs.map((tab) => {
            const isActive = tab.exact
              ? pathname === tab.href
              : pathname.startsWith(tab.href);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center h-full py-1 min-w-[54px] min-h-[48px] rounded-2xl transition-all cursor-pointer select-none active:scale-95",
                  isActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div
                  className={cn(
                    "p-1.5 rounded-xl transition-all duration-200",
                    isActive ? "bg-primary/10 text-primary scale-105" : "text-muted-foreground"
                  )}
                >
                  <tab.icon className="h-5 w-5" />
                </div>
                <span className={cn("text-[11px] tracking-tight mt-0.5", isActive ? "font-bold text-primary" : "font-medium")}>
                  {tab.label}
                </span>
              </Link>
            );
          })}

          {/* More / Menu Drawer Trigger */}
          <button
            id="mobile-menu-tab-btn"
            type="button"
            onClick={toggleMobile}
            aria-label="Open full menu"
            className={cn(
              "flex-1 flex flex-col items-center justify-center h-full py-1 min-w-[54px] min-h-[48px] rounded-2xl transition-all cursor-pointer select-none active:scale-95",
              mobileOpen ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div
              className={cn(
                "p-1.5 rounded-xl transition-all duration-200",
                mobileOpen ? "bg-primary/10 text-primary scale-105" : "text-muted-foreground"
              )}
            >
              <Menu className="h-5 w-5" />
            </div>
            <span className={cn("text-[11px] tracking-tight mt-0.5", mobileOpen ? "font-bold text-primary" : "font-medium")}>
              More
            </span>
          </button>
        </div>
      </nav>

      {/* Quick Action Sheet */}
      <MobileQuickActionSheet
        isOpen={quickActionOpen}
        onClose={() => setQuickActionOpen(false)}
      />
    </>
  );
}
