"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown } from "lucide-react";

/**
 * Reusable data table with sorting, pagination, and responsive design.
 * @param {Object} props
 * @param {Array<{ key: string, label: string, sortable?: boolean, render?: Function, className?: string }>} props.columns
 * @param {Array} props.data
 * @param {boolean} [props.loading]
 * @param {number} [props.pageSize]
 * @param {React.ReactNode} [props.emptyState]
 * @param {Function} [props.onRowClick]
 */
export function DataTable({
  columns,
  data = [],
  loading = false,
  pageSize = 10,
  emptyState,
  onRowClick,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

  const safeData = Array.isArray(data) ? data : [];

  // Sort data safely handling null, undefined, and case-insensitive strings
  const sortedData = [...safeData].sort((a, b) => {
    if (!sortField) return 0;
    const aVal = a?.[sortField];
    const bVal = b?.[sortField];
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return sortOrder === "asc" ? 1 : -1;
    if (bVal == null) return sortOrder === "asc" ? -1 : 1;
    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // Calculate pages and automatically clamp out-of-range pages when data filters change
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedData = sortedData.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  );

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key}>
                  <Skeleton className="h-4 w-24" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (!safeData.length && emptyState) {
    return emptyState;
  }

  const startIdx = safeData.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endIdx = Math.min(safeCurrentPage * pageSize, safeData.length);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/80 bg-card overflow-x-auto touch-scroll shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.sortable ? (
                    <button
                      className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer py-1"
                      onClick={() => handleSort(col.key)}
                    >
                      {col.label}
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    col.label
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row, rowIdx) => (
              <TableRow
                key={row.id || rowIdx}
                className={onRowClick ? "cursor-pointer hover:bg-secondary/40" : ""}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination — Mobile Optimized */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-1">
          <p className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1 font-medium">
            Showing {startIdx}–{endIdx} of {safeData.length}
          </p>
          <div className="flex items-center gap-1.5 order-1 sm:order-2">
            <Button variant="outline" size="icon" className="h-9.5 w-9.5 rounded-xl active:scale-95" onClick={() => setCurrentPage(1)} disabled={safeCurrentPage === 1}>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-9.5 w-9.5 rounded-xl active:scale-95" onClick={() => setCurrentPage(safeCurrentPage - 1)} disabled={safeCurrentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs sm:text-sm px-2 text-muted-foreground font-semibold tabular-nums">
              {safeCurrentPage} / {totalPages}
            </span>
            <Button variant="outline" size="icon" className="h-9.5 w-9.5 rounded-xl active:scale-95" onClick={() => setCurrentPage(safeCurrentPage + 1)} disabled={safeCurrentPage === totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-9.5 w-9.5 rounded-xl active:scale-95" onClick={() => setCurrentPage(totalPages)} disabled={safeCurrentPage === totalPages}>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
