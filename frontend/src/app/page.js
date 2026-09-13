"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user, firm, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated && user) {
        if (user.isSuperAdmin) {
          router.replace("/admin");
        } else {
          router.replace(firm?.id ? `/firm/${firm.id}` : "/firm/dev-firm-001");
        }
      } else {
        router.replace("/login");
      }
    }
  }, [isAuthenticated, user, firm, loading, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}
