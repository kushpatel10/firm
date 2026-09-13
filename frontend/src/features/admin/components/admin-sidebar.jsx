"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Users,
  Shield,
  Activity,
  ChevronLeft,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import { useSidebar } from "@/contexts/sidebar-context";

const NAV_ITEMS = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/firms", icon: Building2, label: "Firms" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/roles", icon: Shield, label: "Roles & Permissions" },
  { href: "/admin/activity", icon: Activity, label: "Activity Logs" },
];

function NavContent({ collapsed, onNavigate }) {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <ScrollArea className="flex-1 py-4">
      <nav className="space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        <Separator className="my-3" />

        <button
          onClick={logout}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all w-full"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </nav>
    </ScrollArea>
  );
}


export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { mobileOpen, setMobileOpen } = useSidebar();

  return (
    <>
      {/* Mobile Drawer (Sheet) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0 pt-safe pb-safe border-r bg-sidebar flex flex-col h-full">
          <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 px-4 py-4 border-b">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Super Admin</p>
                <p className="text-xs text-muted-foreground">Management Panel</p>
              </div>
            </div>
            <NavContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col h-screen border-r bg-sidebar transition-all duration-300 shrink-0",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b h-14">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Super Admin</p>
                <p className="text-xs text-muted-foreground">Panel</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 ml-auto"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")}
            />
          </Button>
        </div>
        <NavContent collapsed={collapsed} />
      </aside>
    </>
  );
}
