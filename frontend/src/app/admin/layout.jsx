import { AdminShell } from "@/components/layout/admin-shell";

export const metadata = {
  title: "Admin Panel — Firm",
};

export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
