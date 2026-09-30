"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { StatsCard } from "@/components/shared/stats-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart, ShoppingBag, Receipt, Package,
  TrendingUp, Activity, Loader2, ArrowUpRight, Plus,
  FileText, Scale, ArrowRight
} from "lucide-react";
import { dashboardService } from "@/services/dashboard.service";
import { useAuth } from "@/contexts/auth-context";
import { formatCurrency, getInitials } from "@/lib/utils";

export default function FirmDashboard() {
  const { firm, loading: authLoading } = useAuth();
  const firmId = firm?.id;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    if (!firmId) return;
    setLoading(true);
    try {
      const summary = await dashboardService.getFirmSummary(firmId);
      setData(summary);
    } catch (err) {
      console.error("Failed to load firm dashboard data", err);
    } finally {
      setLoading(false);
    }
  }, [firmId]);

  useEffect(() => {
    if (!authLoading && firmId) {
      loadDashboard();
    } else if (!authLoading && !firmId) {
      setLoading(false);
    }
  }, [authLoading, firmId, loadDashboard]);

  const stats = data?.stats;
  const recentSales = data?.recentSales || [];
  const recentActivity = data?.recentActivity || [];

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-4 sm:pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {firm?.name ? `${firm.name} • Workspace Overview` : "Workspace Overview"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="h-10 rounded-xl px-4 text-xs sm:text-sm font-semibold gap-2 shadow-xs bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-95">
            <Link href="/dashboard/sales">
              <Plus className="h-4 w-4" />
              <span>New Invoice</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Action Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none touch-scroll -mx-1 px-1">
        <Link
          href="/dashboard/sales"
          className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card px-3.5 py-2 text-xs sm:text-[13px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground hover:border-border transition-all shrink-0 active:scale-95 min-h-[38px]"
        >
          <ShoppingCart className="h-4 w-4" />
          <span>Invoices</span>
        </Link>
        <Link
          href="/dashboard/purchases"
          className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card px-3.5 py-2 text-xs sm:text-[13px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground hover:border-border transition-all shrink-0 active:scale-95 min-h-[38px]"
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Purchases</span>
        </Link>
        <Link
          href="/dashboard/expenses"
          className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card px-3.5 py-2 text-xs sm:text-[13px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground hover:border-border transition-all shrink-0 active:scale-95 min-h-[38px]"
        >
          <Receipt className="h-4 w-4" />
          <span>Expenses</span>
        </Link>
        <Link
          href="/dashboard/inventory"
          className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card px-3.5 py-2 text-xs sm:text-[13px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground hover:border-border transition-all shrink-0 active:scale-95 min-h-[38px]"
        >
          <Package className="h-4 w-4" />
          <span>Inventory</span>
        </Link>
        <Link
          href="/dashboard/omni-scale"
          className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card px-3.5 py-2 text-xs sm:text-[13px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground hover:border-border transition-all shrink-0 active:scale-95 min-h-[38px]"
        >
          <Scale className="h-4 w-4" />
          <span>Omni Scale</span>
        </Link>
      </div>

      {/* KPI Cards Grid — 2x2 on Mobile, 4 columns on Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          title="Total Sales"
          value={loading ? "…" : formatCurrency(stats?.totalSales || 0)}
          description={`${stats?.salesCount || 0} invoices recorded`}
          icon={<ShoppingCart className="h-4 w-4" />}
        />
        <StatsCard
          title="Total Purchases"
          value={loading ? "…" : formatCurrency(stats?.totalPurchases || 0)}
          description={`${stats?.purchasesCount || 0} purchase orders`}
          icon={<ShoppingBag className="h-4 w-4" />}
        />
        <StatsCard
          title="Total Expenses"
          value={loading ? "…" : formatCurrency(stats?.totalExpenses || 0)}
          description={`${stats?.expensesCount || 0} expense entries`}
          icon={<Receipt className="h-4 w-4" />}
        />
        <StatsCard
          title="Inventory Items"
          value={loading ? "…" : String(stats?.totalInventory || 0)}
          description="Tracked SKUs in stock"
          icon={<Package className="h-4 w-4" />}
        />
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Invoices */}
        <Card className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/70 px-4 sm:px-5 pt-4 sm:pt-5">
            <CardTitle className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-muted-foreground border border-border/60">
                <TrendingUp className="h-4 w-4" />
              </div>
              <span>Recent Invoices</span>
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="h-8 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg gap-1 px-2.5">
              <Link href="/dashboard/sales">
                <span>View all</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs">Loading…</span>
              </div>
            ) : recentSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-xs gap-2">
                <FileText className="h-6 w-6 stroke-1 text-muted-foreground/40" />
                <p>No sales invoices recorded yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {recentSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex flex-col gap-2 p-3.5 sm:p-4 hover:bg-secondary/40 transition-colors"
                  >
                    {/* Top Row: Customer Name + Status Badge */}
                    <div className="flex items-center justify-between gap-3 min-w-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-secondary border border-border/70 text-foreground flex items-center justify-center font-semibold text-xs shrink-0">
                          {getInitials(sale.customerName || "Customer")}
                        </div>
                        <p className="font-semibold text-sm text-foreground truncate">
                          {sale.customerName || "Walk-in Customer"}
                        </p>
                      </div>
                      <StatusBadge status={sale.status} />
                    </div>

                    {/* Bottom Row: Invoice # & Date (left) + Total Amount (right) */}
                    <div className="flex items-center justify-between gap-2 pl-9.5 sm:pl-10.5">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="font-mono text-xs text-foreground/80">
                          {sale.invoiceNumber || "INV"}
                        </span>
                        <span>•</span>
                        <span>{new Date(sale.date).toLocaleDateString()}</span>
                      </div>
                      <p className="font-bold text-sm sm:text-base text-foreground tabular-nums">
                        {formatCurrency(sale.total)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/70 px-4 sm:px-5 pt-4 sm:pt-5">
            <CardTitle className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-muted-foreground border border-border/60">
                <Activity className="h-4 w-4" />
              </div>
              <span>Activity Log</span>
            </CardTitle>
            <span className="text-xs text-muted-foreground font-mono bg-secondary px-2.5 py-0.5 rounded-md border border-border/60">Audit</span>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs">Loading…</span>
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-xs">
                No recent activity recorded.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {recentActivity.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between gap-3 p-3.5 sm:p-4 hover:bg-secondary/40 transition-colors"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[11px] font-semibold bg-secondary border border-border/70 px-2 py-0.5 rounded-md text-foreground">
                          {log.action}
                        </span>
                        <span className="font-semibold text-sm text-foreground truncate">
                          {log.entityType || "System"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {log.user?.name || log.user?.email || "System"}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono shrink-0 pt-0.5">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
