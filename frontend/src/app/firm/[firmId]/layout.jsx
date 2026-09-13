import { FirmSidebar } from "@/features/firm/components/firm-sidebar";
import { FirmTopbar } from "@/features/firm/components/firm-topbar";
import { AuthGuard } from "@/components/shared/auth-guard";
import { SidebarProvider } from "@/contexts/sidebar-context";

export function generateStaticParams() {
  return [
    { firmId: "demo" },
    { firmId: "dev-firm-001" },
    { firmId: "default" },
    { firmId: "cmseljlzg0003kt5kowwod3kv" },
  ];
}

export const dynamicParams = false;

export const metadata = {
  title: "Dashboard — Firm",
};

export default function FirmLayout({ children }) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <div className="flex h-[100dvh] overflow-hidden bg-background">
          <FirmSidebar />
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <FirmTopbar />
            <main className="flex-1 overflow-y-auto p-3.5 sm:p-4 lg:p-6 pb-[calc(var(--sab)+2.5rem)] touch-scroll">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}
