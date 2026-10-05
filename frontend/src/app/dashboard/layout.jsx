import { DashboardShell } from "@/components/layout/dashboard-shell";

export const metadata = {
  title: "Dashboard — Firm",
};

export default function DashboardLayout({ children }) {
  return <DashboardShell>{children}</DashboardShell>;
}
