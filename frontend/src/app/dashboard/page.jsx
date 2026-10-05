"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  const loadingRef = useRef(false);

  const loadDashboard = useCallback(async () => {
    if (!firmId || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const summary = await dashboardService.getFirmSummary(firmId);
      setData(summary);
    } catch (err) {
      console.error("Failed to load firm dashboard data", err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-4 sm:pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {firm?.name ? `${firm.name} • Live Workspace Overview` : "Workspace Overview"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="h-10 rounded-xl px-4 text-xs sm:text-sm font-semibold gap-2 shadow-md shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-95">
            <Link href="/dashboard/sales?action=new">
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>New Voucher</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Action Pills (WhatsApp / Telegram style) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none touch-scroll -mx-1 px-1">
        <Link
          href="/dashboard/sales"
          className="inline-flex items-center gap-2 rounded-2xl border border-border/80 bg-card px-3.5 py-2 text-xs sm:text-[13px] font-semibold text-foreground hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all shrink-0 active:scale-95 min-h-[40px] shadow-xs"
        >
          <div className="h-6 w-6 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <ShoppingCart className="h-3.5 w-3.5" />
          </div>
          <span>Invoices</span>
        </Link>
        <Link
          href="/dashboard/items"
          className="inline-flex items-center gap-2 rounded-2xl border border-border/80 bg-card px-3.5 py-2 text-xs sm:text-[13px] font-semibold text-foreground hover:bg-emerald-500/10 hover:border-emerald-500/40 hover:text-emerald-600 transition-all shrink-0 active:scale-95 min-h-[40px] shadow-xs"
        >
          <div className="h-6 w-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Package className="h-3.5 w-3.5" />
          </div>
          <span>Catalog & Stock</span>
        </Link>
        <Link
          href="/dashboard/purchases"
          className="inline-flex items-center gap-2 rounded-2xl border border-border/80 bg-card px-3.5 py-2 text-xs sm:text-[13px] font-semibold text-foreground hover:bg-amber-500/10 hover:border-amber-500/40 hover:text-amber-600 transition-all shrink-0 active:scale-95 min-h-[40px] shadow-xs"
        >
          <div className="h-6 w-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <ShoppingBag className="h-3.5 w-3.5" />
          </div>
          <span>Purchases</span>
        </Link>
        <Link
          href="/dashboard/expenses"
          className="inline-flex items-center gap-2 rounded-2xl border border-border/80 bg-card px-3.5 py-2 text-xs sm:text-[13px] font-semibold text-foreground hover:bg-rose-500/10 hover:border-rose-500/40 hover:text-rose-600 transition-all shrink-0 active:scale-95 min-h-[40px] shadow-xs"
        >
          <div className="h-6 w-6 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <Receipt className="h-3.5 w-3.5" />
          </div>
          <span>Expenses</span>
        </Link>
        <Link
          href="/dashboard/omni-scale"
          className="inline-flex items-center gap-2 rounded-2xl border border-border/80 bg-card px-3.5 py-2 text-xs sm:text-[13px] font-semibold text-foreground hover:bg-purple-500/10 hover:border-purple-500/40 hover:text-purple-600 transition-all shrink-0 active:scale-95 min-h-[40px] shadow-xs"
        >
          <div className="h-6 w-6 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Scale className="h-3.5 w-3.5" />
          </div>
          <span>Omni Scale</span>
        </Link>
      </div>

      {/* KPI Cards Grid — 2x2 on Mobile, 4 columns on Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          title="Total Sales"
          value={loading ? "…" : formatCurrency(stats?.totalSales || 0)}
          description={`${stats?.salesCount || 0} invoices recorded`}
          icon={<ShoppingCart className="h-4.5 w-4.5" />}
        />
        <StatsCard
          title="Total Purchases"
          value={loading ? "…" : formatCurrency(stats?.totalPurchases || 0)}
          description={`${stats?.purchasesCount || 0} purchase orders`}
          icon={<ShoppingBag className="h-4.5 w-4.5" />}
        />
        <StatsCard
          title="Total Expenses"
          value={loading ? "…" : formatCurrency(stats?.totalExpenses || 0)}
          description={`${stats?.expensesCount || 0} expense entries`}
          icon={<Receipt className="h-4.5 w-4.5" />}
        />
        <StatsCard
          title="Inventory Items"
          value={loading ? "…" : String(stats?.totalInventory || 0)}
          description="Tracked SKUs in stock"
          icon={<Package className="h-4.5 w-4.5" />}
        />
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Invoices */}
        <Card className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/70 px-4 sm:px-5 pt-4 sm:pt-5">
            <CardTitle className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                <TrendingUp className="h-4 w-4" />
              </div>
              <span>Recent Invoices</span>
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="h-8 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10 rounded-lg gap-1 px-2.5">
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
                  <Link
                    key={sale.id}
                    href="/dashboard/sales"
                    className="flex flex-col gap-2 p-3.5 sm:p-4 hover:bg-secondary/40 active:scale-[0.99] transition-all cursor-pointer group"
                  >
                    {/* Top Row: Customer Name + Status Badge */}
                    <div className="flex items-center justify-between gap-3 min-w-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-2xl bg-gradient-to-br from-primary/20 to-blue-500/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                          {getInitials(sale.customerName || "Customer")}
                        </div>
                        <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                          {sale.customerName || "Walk-in Customer"}
                        </p>
                      </div>
                      <StatusBadge status={sale.status} />
                    </div>

                    {/* Bottom Row: Invoice # & Date (left) + Total Amount (right) */}
                    <div className="flex items-center justify-between gap-2 pl-10.5 sm:pl-11.5">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="font-mono text-xs font-semibold text-foreground/80 bg-muted px-1.5 py-0.5 rounded-md">
                          {sale.invoiceNumber || "INV"}
                        </span>
                        <span>•</span>
                        <span>{new Date(sale.date).toLocaleDateString()}</span>
                      </div>
                      <p className="font-mono font-bold text-sm sm:text-base text-foreground tabular-nums">
                        {formatCurrency(sale.total)}
                      </p>
                    </div>
                  </Link>
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
