"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Users,
  Activity,
  HardDrive,
  Plus,
  UserPlus,
  Shield,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { dashboardService } from "@/services/dashboard.service";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminSummary() {
      try {
        const summary = await dashboardService.getAdminSummary();
        setData(summary);
      } catch (err) {
        console.error("Failed to load admin summary", err);
      } finally {
        setLoading(false);
      }
    }
    loadAdminSummary();
  }, []);

  const stats = data?.stats;
  const recentActivity = data?.recentActivity || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your platform"
        breadcrumbs={[{ label: "Admin" }, { label: "Dashboard" }]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Firms"
          value={loading ? "…" : String(stats?.totalFirms || 0)}
          description="Registered business tenants"
          icon={<Building2 className="h-5 w-5" />}
        />
        <StatsCard
          title="Active Users"
          value={loading ? "…" : String(stats?.activeUsers || 0)}
          description="Active platform accounts"
          icon={<Users className="h-5 w-5" />}
        />
        <StatsCard
          title="Recent Activity"
          value={loading ? "…" : String(stats?.totalActivity || 0)}
          description="Total audit log entries"
          icon={<Activity className="h-5 w-5" />}
        />
        <StatsCard
          title="Storage Usage"
          value={loading ? "…" : stats?.storageUsage || "0.5 GB"}
          description="Estimated platform database storage"
          icon={<HardDrive className="h-5 w-5" />}
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="gap-2">
              <Link href="/admin/firms">
                <Plus className="h-4 w-4" />
                Create Firm
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/admin/users">
                <UserPlus className="h-4 w-4" />
                Add User
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/admin/roles">
                <Shield className="h-4 w-4" />
                Manage Roles
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/admin/activity">
                <Activity className="h-4 w-4" />
                View Logs
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading platform activity…
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Activity className="h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No activity recorded yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((log) => (
                <div key={log.id} className="flex items-center justify-between border-b pb-2 text-sm">
                  <div>
                    <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded font-semibold mr-2">
                      {log.action}
                    </span>
                    <span className="font-medium text-foreground">{log.user?.name || log.user?.email || "System"}</span>
                    {log.firm?.name && <span className="text-muted-foreground ml-2">({log.firm.name})</span>}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
