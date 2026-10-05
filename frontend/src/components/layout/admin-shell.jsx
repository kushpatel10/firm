"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const DynamicAdminShell = dynamic(
  () => import("./admin-shell-content").then((mod) => mod.AdminShellContent),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ),
  }
);

export function AdminShell({ children }) {
  return <DynamicAdminShell>{children}</DynamicAdminShell>;
}
