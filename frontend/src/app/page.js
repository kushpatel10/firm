"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useStealth } from "@/contexts/stealth-context";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user, loading } = useAuth();
  const { isAndroidNative, isUnlocked } = useStealth();

  useEffect(() => {
    if (loading) return;

    // On Android native app, wait until the user unlocks the calculator layer
    if (isAndroidNative && !isUnlocked) {
      return;
    }

    if (isAuthenticated && user) {
      if (user.isSuperAdmin) {
        router.replace("/admin");
      } else {
        router.replace("/dashboard");
      }
    } else {
      router.replace("/login");
    }
  }, [isAuthenticated, user, loading, router, isAndroidNative, isUnlocked]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}
