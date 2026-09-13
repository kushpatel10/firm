"use client";

import { useAuth } from "@/contexts/auth-context";
import { useSidebar } from "@/contexts/sidebar-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Moon, Sun, LogOut, User, Building2, Menu } from "lucide-react";
import { useTheme } from "next-themes";
import { getInitials } from "@/lib/utils";
import Link from "next/link";

export function AdminTopbar() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toggleMobile } = useSidebar();

  return (
    <header className="sticky top-0 z-40 flex flex-col border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-safe">
      <div className="flex h-14 items-center justify-between px-3 sm:px-4 lg:px-6">
        <div className="flex items-center gap-2.5">
          {/* Mobile hamburger menu button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobile}
            className="lg:hidden h-9 w-9 text-foreground hover:bg-accent"
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight text-foreground sm:inline">
              Super Admin
            </span>
            <span className="text-xs text-muted-foreground hidden md:inline">
              Management
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Link to Firm Dashboard */}
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground h-9 px-2.5"
            asChild
          >
            <Link href="/firm/dev-firm-001">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Firm Dashboard</span>
            </Link>
          </Button>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-accent transition-colors outline-none cursor-pointer">
              <Avatar className="h-8 w-8 ring-2 ring-border">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="text-xs font-medium bg-primary text-primary-foreground">
                  {getInitials(user?.name || user?.email)}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="text-sm font-medium">{user?.name || "Admin"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                onSelect={logout}
                className="text-destructive cursor-pointer focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
