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
  const { user, firm, role, logout } = useAuth();
  const { isStealthEnabled, lock, isServerModalOpen, setIsServerModalOpen, isAndroidNative } = useStealth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { toggleMobile } = useSidebar();
  const [notifOpen, setNotifOpen] = useState(false);

  const firmName = firm?.name || "Firm Workspace";

  return (
    <header className="sticky top-0 z-40 flex flex-col border-b border-border/70 bg-card/90 backdrop-blur-2xl pt-safe shadow-xs">
      <div className="flex h-14 sm:h-15 items-center justify-between px-3 sm:px-4 lg:px-6">
        {/* Left side — Mobile Brand Identity (WhatsApp / Telegram style) */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobile}
            className="lg:hidden h-10 w-10 text-foreground hover:bg-secondary rounded-xl active:scale-95 transition-all shrink-0"
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Firm Avatar & Title — Visible on Mobile & Tablet */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary to-blue-600 text-primary-foreground flex items-center justify-center font-bold text-xs shadow-sm">
                {firmName.charAt(0).toUpperCase()}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-card" />
            </div>

            <div className="min-w-0 flex flex-col justify-center">
              <p className="text-sm font-bold tracking-tight text-foreground truncate max-w-[160px] sm:max-w-xs leading-none">
                {firmName}
              </p>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">

          {/* Notifications */}
          <Sheet open={notifOpen} onOpenChange={setNotifOpen}>
            <SheetTrigger className="relative h-9 w-9 flex items-center justify-center rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-all outline-none cursor-pointer active:scale-95">
              <Bell className="h-4.5 w-4.5" />
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
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-xl hover:bg-secondary active:scale-95" asChild>
              <Link href="/admin">
                <Shield className="h-4.5 w-4.5" />
              </Link>
            </Button>
          )}

          {/* Stealth Panic Lock — Only on native Android */}
          {isAndroidNative && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-amber-500 rounded-xl hover:bg-secondary cursor-pointer active:scale-95"
              title="Lock to Calculator Decoy"
              aria-label="Lock to Calculator"
              onClick={lock}
            >
              <Lock className="h-4.5 w-4.5" />
            </Button>
          )}

          {/* Theme toggle */}
          <Button
            id="theme-toggle-btn"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-xl hover:bg-secondary cursor-pointer active:scale-95"
            aria-label="Toggle light and dark mode"
            onClick={() => setTheme((resolvedTheme || theme) === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4.5 w-4.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4.5 w-4.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger className="h-9 gap-2 pl-1.5 pr-2.5 flex items-center rounded-xl hover:bg-secondary transition-all outline-none cursor-pointer border border-transparent hover:border-border/60">
              <Avatar className="h-7 w-7">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="text-xs bg-secondary text-foreground font-semibold border border-border/70">
                  {getInitials(user?.name || user?.email)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:inline text-xs font-medium max-w-[100px] truncate text-foreground">
                {user?.name || user?.email}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-xl bg-card border-border/80">
              <DropdownMenuLabel className="px-2.5 py-2">
                <p className="text-sm font-semibold text-foreground">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email}</p>
                {role && (
                  <Badge variant="outline" className="mt-1.5 text-[11px] font-mono py-0 font-normal">{role.name}</Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs py-2 cursor-pointer">
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
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
