"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
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
  const { firmId } = useParams();
  const { firm } = useAuth();
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
    loadDashboard();
  }, [loadDashboard]);

  const stats = data?.stats;
  const recentSales = data?.recentSales || [];
  const recentActivity = data?.recentActivity || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ChatGPT-styled Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {firm?.name ? `${firm.name} • Workspace Overview` : "Workspace Overview"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="h-9 rounded-full px-4 text-xs font-medium gap-1.5 shadow-sm">
            <Link href={`/firm/${firmId}/sales`}>
              <Plus className="h-3.5 w-3.5" />
              <span>New Invoice</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Action Pills (ChatGPT style) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <Link
          href={`/firm/${firmId}/sales`}
          className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all shrink-0"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          <span>Invoices</span>
        </Link>
        <Link
          href={`/firm/${firmId}/purchases`}
          className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all shrink-0"
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          <span>Purchases</span>
        </Link>
        <Link
          href={`/firm/${firmId}/expenses`}
          className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all shrink-0"
        >
          <Receipt className="h-3.5 w-3.5" />
          <span>Expenses</span>
        </Link>
        <Link
          href={`/firm/${firmId}/inventory`}
          className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all shrink-0"
        >
          <Package className="h-3.5 w-3.5" />
          <span>Inventory</span>
        </Link>
        <Link
          href={`/firm/${firmId}/omni-scale`}
          className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all shrink-0"
        >
          <Scale className="h-3.5 w-3.5" />
          <span>Omni Scale</span>
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <Card className="rounded-2xl border border-border/80 bg-card shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/60 px-5 pt-5">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" />
              </div>
              <span>Recent Invoices</span>
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs font-normal text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full gap-1 px-2.5">
              <Link href={`/firm/${firmId}/sales`}>
                <span>View all</span>
                <ArrowUpRight className="h-3 w-3" />
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
                    className="flex items-center justify-between p-4 text-xs hover:bg-secondary/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-3">
                      <div className="h-8 w-8 rounded-full bg-secondary border border-border/70 text-foreground flex items-center justify-center font-medium text-xs shrink-0">
                        {getInitials(sale.customerName || "Customer")}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {sale.customerName || "Walk-in Customer"}
                        </p>
                        <div className="flex items-center gap-2 text-muted-foreground mt-0.5">
                          <span className="font-mono text-[11px]">
                            {sale.invoiceNumber || "INV"}
                          </span>
                          <span>•</span>
                          <span>{new Date(sale.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="font-semibold text-foreground tabular-nums">
                          {formatCurrency(sale.total)}
                        </p>
                      </div>
                      <StatusBadge status={sale.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="rounded-2xl border border-border/80 bg-card shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/60 px-5 pt-5">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                <Activity className="h-3.5 w-3.5" />
              </div>
              <span>Activity Log</span>
            </CardTitle>
            <span className="text-[10px] text-muted-foreground font-mono bg-secondary px-2 py-0.5 rounded-full border border-border/50">Audit</span>
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
                    className="flex items-center justify-between p-4 text-xs hover:bg-secondary/40 transition-colors"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-medium bg-secondary border border-border/60 px-2 py-0.5 rounded-full text-foreground">
                          {log.action}
                        </span>
                        <span className="font-medium text-foreground truncate">
                          {log.entityType || "System"}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        {log.user?.name || log.user?.email || "System"}
                      </p>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-mono shrink-0">
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
