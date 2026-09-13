"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  ShoppingCart, ShoppingBag, Receipt, Package, ArrowRight, Loader2,
} from "lucide-react";
import { REPORT_TYPES } from "@/types/report.types";
import { reportService } from "@/services/report.service";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

const REPORT_CARDS = [
  {
    type: REPORT_TYPES.SALES,
    title: "Sales Report",
    description: "Revenue, invoices, and sales trends by date, category, or branch.",
    icon: ShoppingCart,
  },
  {
    type: REPORT_TYPES.PURCHASES,
    title: "Purchase Report",
    description: "Purchase orders, supplier spending, and cost analysis.",
    icon: ShoppingBag,
  },
  {
    type: REPORT_TYPES.EXPENSES,
    title: "Expense Report",
    description: "Category-wise expenses, monthly summaries, and spending trends.",
    icon: Receipt,
  },
  {
    type: REPORT_TYPES.INVENTORY,
    title: "Inventory Report",
    description: "Stock levels, movement history, and low stock alerts.",
    icon: Package,
  },
];

export default function ReportsPage() {
  const { firmId } = useParams();
  const [activeReport, setActiveReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleGenerateReport = async (reportType) => {
    setActiveReport(reportType);
    setLoading(true);
    setDialogOpen(true);
    try {
      let data = null;
      if (reportType === REPORT_TYPES.SALES) {
        data = await reportService.getSalesReport({ firmId });
      } else if (reportType === REPORT_TYPES.PURCHASES) {
        data = await reportService.getPurchaseReport({ firmId });
      } else if (reportType === REPORT_TYPES.EXPENSES) {
        data = await reportService.getExpenseReport({ firmId });
      } else if (reportType === REPORT_TYPES.INVENTORY) {
        data = await reportService.getInventoryReport({ firmId });
      }
      setReportData(data);
    } catch (err) {
      toast.error(err.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generate and view business reports"
        breadcrumbs={[{ label: "Firm", href: `/firm/${firmId}` }, { label: "Reports" }]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {REPORT_CARDS.map((report) => (
          <Card key={report.type} className="transition-all hover:shadow-md group">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <report.icon className="h-5 w-5" />
                </div>
              </div>
              <CardTitle className="text-base mt-3">{report.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 group-hover:border-primary group-hover:text-primary transition-colors"
                onClick={() => handleGenerateReport(report.type)}
              >
                Generate Report
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Report Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="capitalize">{activeReport} Report</DialogTitle>
            <DialogDescription>
              Aggregated real-time summary for this firm.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <span>Generating report data from database…</span>
            </div>
          ) : reportData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 border p-3 rounded-lg bg-muted/40 text-sm">
                {activeReport === REPORT_TYPES.SALES && (
                  <>
                    <div><span className="text-muted-foreground">Total Invoices:</span> <strong>{reportData.summary?.totalSales}</strong></div>
                    <div><span className="text-muted-foreground">Total Revenue:</span> <strong>{formatCurrency(reportData.summary?.totalRevenue || 0)}</strong></div>
                    <div><span className="text-muted-foreground">Total Tax:</span> <strong>{formatCurrency(reportData.summary?.totalTax || 0)}</strong></div>
                    <div><span className="text-muted-foreground">Total Discount:</span> <strong>{formatCurrency(reportData.summary?.totalDiscount || 0)}</strong></div>
                  </>
                )}
                {activeReport === REPORT_TYPES.PURCHASES && (
                  <>
                    <div><span className="text-muted-foreground">Total Purchases:</span> <strong>{reportData.summary?.totalPurchases}</strong></div>
                    <div><span className="text-muted-foreground">Total Cost:</span> <strong>{formatCurrency(reportData.summary?.totalCost || 0)}</strong></div>
                  </>
                )}
                {activeReport === REPORT_TYPES.EXPENSES && (
                  <>
                    <div><span className="text-muted-foreground">Total Expenses:</span> <strong>{reportData.summary?.totalExpenses}</strong></div>
                    <div><span className="text-muted-foreground">Total Amount:</span> <strong>{formatCurrency(reportData.summary?.totalAmount || 0)}</strong></div>
                  </>
                )}
                {activeReport === REPORT_TYPES.INVENTORY && (
                  <>
                    <div><span className="text-muted-foreground">Total Items:</span> <strong>{reportData.summary?.totalItems}</strong></div>
                    <div><span className="text-muted-foreground">Stock Value:</span> <strong>{formatCurrency(reportData.summary?.totalStockValue || 0)}</strong></div>
                    <div><span className="text-muted-foreground">Low Stock Items:</span> <strong>{reportData.summary?.lowStockCount}</strong></div>
                  </>
                )}
              </div>

              {activeReport === REPORT_TYPES.SALES && reportData.sales?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Recent Sales Items</h4>
                  <div className="border rounded-md divide-y text-xs">
                    {reportData.sales.map((s) => (
                      <div key={s.id} className="p-2 flex justify-between">
                        <span>{s.customerName || "Walk-in"} ({new Date(s.date).toLocaleDateString()})</span>
                        <strong className="font-semibold">{formatCurrency(s.total)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeReport === REPORT_TYPES.PURCHASES && reportData.purchases?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Recent Purchase Orders</h4>
                  <div className="border rounded-md divide-y text-xs">
                    {reportData.purchases.map((p) => (
                      <div key={p.id} className="p-2 flex justify-between">
                        <span>{p.supplierName || "Supplier"} ({new Date(p.date).toLocaleDateString()})</span>
                        <strong className="font-semibold">{formatCurrency(p.total)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeReport === REPORT_TYPES.EXPENSES && reportData.expenses?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Recent Expense Entries</h4>
                  <div className="border rounded-md divide-y text-xs">
                    {reportData.expenses.map((e) => (
                      <div key={e.id} className="p-2 flex justify-between">
                        <span>{e.category} — {e.description || "Expense"}</span>
                        <strong className="font-semibold">{formatCurrency(e.amount)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeReport === REPORT_TYPES.INVENTORY && reportData.lowStockItems?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-destructive">Low Stock Alert</h4>
                  <div className="border rounded-md divide-y text-xs">
                    {reportData.lowStockItems.map((item) => (
                      <div key={item.id} className="p-2 flex justify-between">
                        <span>{item.name} ({item.category || "General"})</span>
                        <span className="text-destructive font-semibold">Qty: {item.quantity} (Min: {item.minStock})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-sm text-muted-foreground">
              No report data returned.
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
