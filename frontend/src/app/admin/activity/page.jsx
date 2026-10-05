"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchInput } from "@/components/shared/search-input";
import { FilterDropdown } from "@/components/shared/filter-dropdown";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import { ACTIVITY_ACTIONS } from "@/types/activity.types";
import { activityService } from "@/services/activity.service";
import { toast } from "sonner";
import { placeholders } from "@/config/placeholders";

export default function ActivityPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState([]);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await activityService.getAll({
        search,
        action: actionFilter.length > 0 ? actionFilter[0] : undefined,
      });
      setLogs(data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load activity logs");
    } finally {
      setLoading(false);
    }
  }, [search, actionFilter]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const columns = [
    {
      key: "action",
      label: "Action",
      render: (val) => (
        <Badge variant="outline" className="text-xs font-mono">
          {val}
        </Badge>
      ),
    },
    {
      key: "user",
      label: "User",
      render: (user, row) => user?.name || user?.email || row.userId || "—",
    },
    {
      key: "firm",
      label: "Firm",
      render: (firm, row) => firm?.name || row.firmId || "—",
    },
    { key: "entityType", label: "Entity", render: (val) => val || "—" },
    { key: "ipAddress", label: "IP Address", render: (val) => val || "—" },
    {
      key: "createdAt",
      label: "Timestamp",
      sortable: true,
      render: (val) => new Date(val).toLocaleString(),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Logs"
        description="Audit trail of all platform actions"
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Activity Logs" }]}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput placeholder={placeholders.admin.activitySearch} onSearch={setSearch} className="sm:w-80" />
        <FilterDropdown
          label="Action"
          options={Object.values(ACTIVITY_ACTIONS).map((a) => ({
            value: a, label: a.replace(/_/g, " "),
          }))}
          selected={actionFilter}
          onSelectionChange={setActionFilter}
        />
      </div>

      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        emptyState={
          <EmptyState
            icon={<Activity className="h-8 w-8 text-muted-foreground" />}
            title="No activity logs"
            description="Activity logs will appear here as users perform actions."
          />
        }
      />
    </div>
  );
}
