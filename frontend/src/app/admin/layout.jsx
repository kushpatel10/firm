import { AdminSidebar } from "@/features/admin/components/admin-sidebar";
import { AdminTopbar } from "@/features/admin/components/admin-topbar";
import { AuthGuard } from "@/components/shared/auth-guard";
import { SidebarProvider } from "@/contexts/sidebar-context";

export const metadata = {
  title: "Admin Panel — Firm",
};

export default function AdminLayout({ children }) {
  return (
    <AuthGuard requireSuperAdmin>
      <SidebarProvider>
        <div className="flex h-[100dvh] overflow-hidden bg-background">
          <AdminSidebar />
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <AdminTopbar />
            <main className="flex-1 overflow-y-auto p-3.5 sm:p-4 lg:p-6 pb-[calc(var(--sab)+2.5rem)] touch-scroll">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}
