"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchInput } from "@/components/shared/search-input";
import { FilterDropdown } from "@/components/shared/filter-dropdown";
import { DataTable } from "@/components/shared/data-table";
import { PermissionGate } from "@/components/shared/permission-gate";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Receipt, Loader2, Edit, Trash2 } from "lucide-react";
import { DEFAULT_EXPENSE_CATEGORIES } from "@/types/expense.types";
import { expenseService } from "@/services/expense.service";
import { useAuth } from "@/contexts/auth-context";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { placeholders } from "@/config/placeholders";

export default function ExpensesPage() {
  const { firm, loading: authLoading } = useAuth();
  const firmId = firm?.id;
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState([]);
  const [colorFilter, setColorFilter] = useState("all"); // "all" | "PAKU" | "KACHU"

  // Create Form state
  const [category, setCategory] = useState(DEFAULT_EXPENSE_CATEGORIES[0] || "Rent");
  const [expenseType, setExpenseType] = useState("PAKU"); // "PAKU" (White) vs "KACHU" (Black)
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  // Edit Form state
  const [editCategory, setEditCategory] = useState("");
  const [editExpenseType, setEditExpenseType] = useState("PAKU");
  const [editDescription, setEditDescription] = useState("");
  const [editAmount, setEditAmount] = useState("");

  const loadExpenses = useCallback(async () => {
    if (!firmId) return;
    setLoading(true);
    try {
      const data = await expenseService.getAll(firmId);
      setExpenses(data?.expenses || data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [firmId]);

  useEffect(() => {
    if (!authLoading && firmId) {
      loadExpenses();
    } else if (!authLoading && !firmId) {
      setLoading(false);
    }
  }, [authLoading, firmId, loadExpenses]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!amount) {
      toast.error("Amount is required");
      return;
    }

    setSubmitting(true);
    try {
      await expenseService.create(firmId, {
        category,
        expenseType,
        description: description.trim() || category,
        amount: parseFloat(amount),
      });
      toast.success(`${expenseType === "KACHU" ? "Black" : "White"} Expense recorded successfully!`);
      setDialogOpen(false);
      setDescription("");
      setAmount("");
      setExpenseType("PAKU");
      loadExpenses();
    } catch (err) {
      toast.error(err.message || "Failed to add expense");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (expense) => {
    setSelectedExpense(expense);
    setEditCategory(expense.category || DEFAULT_EXPENSE_CATEGORIES[0]);
    setEditExpenseType(expense.expenseType || "PAKU");
    setEditDescription(expense.description || "");
    setEditAmount(String(expense.amount || ""));
    setEditDialogOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editAmount || !selectedExpense) {
      toast.error("Amount is required");
      return;
    }

    setSubmitting(true);
    try {
      await expenseService.update(firmId, selectedExpense.id, {
        category: editCategory,
        expenseType: editExpenseType,
        description: editDescription.trim() || editCategory,
        amount: parseFloat(editAmount),
      });
      toast.success("Expense updated successfully!");
      setEditDialogOpen(false);
      setSelectedExpense(null);
      loadExpenses();
    } catch (err) {
      toast.error(err.message || "Failed to update expense");
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteDialog = (expense) => {
    setSelectedExpense(expense);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedExpense) return;
    setSubmitting(true);
    try {
      await expenseService.delete(firmId, selectedExpense.id);
      toast.success("Expense deleted successfully!");
      setDeleteDialogOpen(false);
      setSelectedExpense(null);
      loadExpenses();
    } catch (err) {
      toast.error(err.message || "Failed to delete expense");
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: "expenseType",
      label: "Ledger",
      render: (val) => (
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full border shadow-xs ${
            val === "KACHU" ? "bg-black border-slate-700" : "bg-white border-slate-300"
          }`}
          title={val === "KACHU" ? "Black Ledger" : "White Ledger"}
        />
      ),
    },
    { key: "category", label: "Category", sortable: true },
    { key: "description", label: "Description", render: (val) => val || "—" },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (val) => formatCurrency(val),
    },
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (val) => formatDate(val),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            title="Edit Expense"
            onClick={() => openEditDialog(row)}
          >
            <Edit className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
            title="Delete Expense"
            onClick={() => openDeleteDialog(row)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const filteredExpenses = useMemo(() => {
    let list = expenses.filter((e) => {
      if (search) {
        const q = search.toLowerCase();
        const matchCategory = e.category?.toLowerCase().includes(q);
        const matchDesc = e.description?.toLowerCase().includes(q);
        if (!matchCategory && !matchDesc) return false;
      }

      if (categoryFilter.length > 0 && !categoryFilter.includes(e.category)) {
        return false;
      }

      if (colorFilter !== "all" && e.expenseType !== colorFilter) {
        return false;
      }

      return true;
    });

    return list;
  }, [expenses, search, categoryFilter, colorFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="Track daily and monthly expenses with ledger classification"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Expenses" }]}
        actions={
          <PermissionGate permission="Expense.Create">
            <Button className="gap-2" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Expense
            </Button>
          </PermissionGate>
        }
      />

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <SearchInput placeholder={placeholders.expenses.search} onSearch={setSearch} className="sm:w-80" />
          <FilterDropdown
            label="Category"
            options={DEFAULT_EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))}
            selected={categoryFilter}
            onSelectionChange={setCategoryFilter}
          />

          {/* Refined compact color filter */}
          <div className="flex items-center gap-2 h-10 px-2.5 border border-border/80 rounded-xl bg-card ml-auto sm:ml-0">
            <button
              type="button"
              onClick={() => setColorFilter(colorFilter === "PAKU" ? "all" : "PAKU")}
              className={`h-5 w-5 rounded-md bg-white border transition-all cursor-pointer ${
                colorFilter === "PAKU"
                  ? "border-primary ring-2 ring-primary ring-offset-1 ring-offset-background scale-110 shadow-sm"
                  : "border-slate-300 hover:border-slate-400 opacity-70 hover:opacity-100"
              }`}
            />
            <button
              type="button"
              onClick={() => setColorFilter(colorFilter === "KACHU" ? "all" : "KACHU")}
              className={`h-5 w-5 rounded-md bg-black border transition-all cursor-pointer ${
                colorFilter === "KACHU"
                  ? "border-primary ring-2 ring-primary ring-offset-1 ring-offset-background scale-110 shadow-sm"
                  : "border-slate-700 hover:border-slate-600 opacity-70 hover:opacity-100"
              }`}
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredExpenses}
          loading={loading}
          emptyState={
            <EmptyState
              icon={<Receipt className="h-8 w-8 text-muted-foreground" />}
              title="No expenses recorded"
              description="Add your first expense to start tracking where your money goes."
              actionLabel="Add Expense"
              onAction={() => setDialogOpen(true)}
            />
          }
        />
      </div>

      {/* Add Expense Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription>Record a business expense with White or Black category.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setExpenseType("PAKU")}
                  className={`h-10 w-24 rounded-xl transition-all border-2 cursor-pointer bg-white ${
                    expenseType === "PAKU"
                      ? "border-emerald-500 ring-2 ring-emerald-500 ring-offset-2 ring-offset-background scale-105 shadow-md"
                      : "border-slate-300 hover:border-slate-400 opacity-70"
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setExpenseType("KACHU")}
                  className={`h-10 w-24 rounded-xl transition-all border-2 cursor-pointer bg-black ${
                    expenseType === "KACHU"
                      ? "border-emerald-500 ring-2 ring-emerald-500 ring-offset-2 ring-offset-background scale-105 shadow-md"
                      : "border-slate-700 hover:border-slate-600 opacity-70"
                  }`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEFAULT_EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder={placeholders.expenses.description}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder={placeholders.expenses.amount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className={expenseType === "KACHU" ? "bg-black text-white hover:bg-slate-900 font-bold" : "bg-white text-slate-950 border-2 border-slate-300 hover:bg-slate-100 font-bold"}
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Expense
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>Update expense details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditExpenseType("PAKU")}
                  className={`h-10 w-24 rounded-xl transition-all border-2 cursor-pointer bg-white ${
                    editExpenseType === "PAKU"
                      ? "border-emerald-500 ring-2 ring-emerald-500 ring-offset-2 ring-offset-background scale-105 shadow-md"
                      : "border-slate-300 hover:border-slate-400 opacity-70"
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setEditExpenseType("KACHU")}
                  className={`h-10 w-24 rounded-xl transition-all border-2 cursor-pointer bg-black ${
                    editExpenseType === "KACHU"
                      ? "border-emerald-500 ring-2 ring-emerald-500 ring-offset-2 ring-offset-background scale-105 shadow-md"
                      : "border-slate-700 hover:border-slate-600 opacity-70"
                  }`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">Category *</Label>
              <Select value={editCategory} onValueChange={setEditCategory} required>
                <SelectTrigger id="edit-category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEFAULT_EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-amount">Amount (₹) *</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                required
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className={editExpenseType === "KACHU" ? "bg-black text-white hover:bg-slate-900 font-bold" : "bg-white text-slate-950 border-2 border-slate-300 hover:bg-slate-100 font-bold"}
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Expense
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Expense Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense of {formatCurrency(selectedExpense?.amount || 0)} for "{selectedExpense?.category}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
