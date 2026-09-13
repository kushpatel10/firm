"use client";

import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Moon, Sun, LogOut, User, Bell, Shield,
  Server, Lock, Menu,
} from "lucide-react";
import { useTheme } from "next-themes";
import { getInitials } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";
import { useSidebar } from "@/contexts/sidebar-context";
import { useStealth } from "@/contexts/stealth-context";
import { ServerConfigModal } from "@/components/decoy/server-config-modal";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function FirmTopbar() {
  const { user, role, logout } = useAuth();
  const { isStealthEnabled, lock, isServerModalOpen, setIsServerModalOpen, isAndroidNative } = useStealth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { toggleMobile } = useSidebar();
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex flex-col border-b border-sidebar-border bg-sidebar/95 backdrop-blur-md pt-safe">
      <div className="flex h-11 sm:h-13 items-center justify-between px-3 sm:px-4 lg:px-6">
        {/* Left side — Mobile Menu Toggle */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobile}
            className="lg:hidden h-8 w-8 text-foreground hover:bg-secondary rounded-full"
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1.5">

          {/* Notifications */}
          <Sheet open={notifOpen} onOpenChange={setNotifOpen}>
            <SheetTrigger className="relative h-8 w-8 flex items-center justify-center rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-all outline-none cursor-pointer">
              <Bell className="h-4 w-4" />
            </SheetTrigger>
            <SheetContent className="bg-card border-border/80">
              <SheetHeader>
                <SheetTitle className="text-sm font-semibold">Notifications</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Bell className="h-6 w-6 text-muted-foreground mb-2 stroke-1" />
                <p className="text-xs text-muted-foreground">No new notifications</p>
              </div>
            </SheetContent>
          </Sheet>

          {/* Admin link */}
          {user?.isSuperAdmin && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary" asChild>
              <Link href="/admin">
                <Shield className="h-4 w-4" />
              </Link>
            </Button>
          )}

          {/* Stealth Panic Lock — Only on native Android */}
          {isAndroidNative && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-amber-500 rounded-full hover:bg-secondary cursor-pointer"
              title="Lock to Calculator Decoy"
              aria-label="Lock to Calculator"
              onClick={lock}
            >
              <Lock className="h-4 w-4" />
            </Button>
          )}

          {/* Theme toggle */}
          <Button
            id="theme-toggle-btn"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary cursor-pointer"
            aria-label="Toggle light and dark mode"
            onClick={() => setTheme((resolvedTheme || theme) === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger className="h-8 gap-2 pl-1 pr-2.5 flex items-center rounded-full hover:bg-secondary transition-all outline-none cursor-pointer border border-transparent hover:border-border/60">
              <Avatar className="h-6 w-6">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="text-[10px] bg-secondary text-foreground font-medium border border-border/70">
                  {getInitials(user?.name || user?.email)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:inline text-xs font-medium max-w-[100px] truncate text-foreground">
                {user?.name || user?.email}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-xl bg-card border-border/80">
              <DropdownMenuLabel className="px-2 py-1.5">
                <p className="text-xs font-medium text-foreground">{user?.name || "User"}</p>
                <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                {role && (
                  <Badge variant="outline" className="mt-1 text-[10px] font-mono py-0 font-normal">{role.name}</Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs cursor-pointer">
                <User className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                Profile
              </DropdownMenuItem>
              {isAndroidNative && (
                <>
                  <DropdownMenuItem
                    onClick={() => setIsServerModalOpen(true)}
                    className="text-xs cursor-pointer"
                  >
                    <Server className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                    Server VPS Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={lock}
                    className="text-xs cursor-pointer text-amber-500"
                  >
                    <Lock className="mr-2 h-3.5 w-3.5 text-amber-500" />
                    Lock to Calculator
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} onSelect={logout} className="text-xs text-destructive cursor-pointer">
                <LogOut className="mr-2 h-3.5 w-3.5" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

    </header>
  );
}
