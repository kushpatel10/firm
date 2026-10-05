"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children, requireSuperAdmin = false }) {
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading) {
      const isLoggedOut =
        typeof window !== "undefined" &&
        (localStorage.getItem("firm_user_logged_out") === "true" ||
          sessionStorage.getItem("firm_user_logged_out") === "true");

      if (!isAuthenticated || isLoggedOut) {
        if (pathname !== "/login") {
          router.replace("/login");
        }
      } else if (requireSuperAdmin && !user?.isSuperAdmin) {
        if (pathname !== "/access-denied") {
          router.replace("/access-denied");
        }
      }
    }
  }, [mounted, isAuthenticated, user, loading, requireSuperAdmin, router, pathname]);

  // Guaranteed identical SSR & initial client hydration output
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isLoggedOut =
    typeof window !== "undefined" &&
    (localStorage.getItem("firm_user_logged_out") === "true" ||
      sessionStorage.getItem("firm_user_logged_out") === "true");

  if (!isAuthenticated || isLoggedOut || (requireSuperAdmin && !user?.isSuperAdmin)) {
    return null;
  }

  return children;
}
