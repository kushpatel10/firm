"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchInput } from "@/components/shared/search-input";
import { FilterDropdown } from "@/components/shared/filter-dropdown";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Building2, Loader2 } from "lucide-react";
import { BUSINESS_TYPES, CURRENCIES, TIMEZONES, FIRM_STATUS } from "@/types/firm.types";
import { firmService } from "@/services/firm.service";
import { toast } from "sonner";

export default function FirmsPage() {
  const [firms, setFirms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [address, setAddress] = useState("");

  const loadFirms = useCallback(async () => {
    setLoading(true);
    try {
      const data = await firmService.getAll({
        search,
        status: statusFilter.length > 0 ? statusFilter[0] : undefined,
      });
      setFirms(data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load firms");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    loadFirms();
  }, [loadFirms]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name || !businessType) {
      toast.error("Firm Name and Business Type are required");
      return;
    }

    setSubmitting(true);
    try {
      await firmService.create({
        name,
        businessType,
        gstNumber,
        phone,
        currency,
        timezone,
        address,
      });
      toast.success(`Firm "${name}" created successfully!`);
      setDialogOpen(false);
      // Reset form
      setName("");
      setBusinessType("");
      setGstNumber("");
      setPhone("");
      setAddress("");
      loadFirms();
    } catch (err) {
      toast.error(err.message || "Failed to create firm");
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: "name", label: "Firm Name", sortable: true },
    { key: "businessType", label: "Type", sortable: true },
    { key: "gstNumber", label: "GST Number", render: (val) => val || "—" },
    { key: "phone", label: "Phone", render: (val) => val || "—" },
    { key: "currency", label: "Currency" },
    {
      key: "status",
      label: "Status",
      render: (val) => <StatusBadge status={val} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Firms"
        description="Manage all business entities"
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Firms" },
        ]}
        actions={
          <Button className="gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Firm
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          placeholder="Search firms…"
          onSearch={setSearch}
          className="sm:w-80"
        />
        <FilterDropdown
          label="Status"
          options={Object.values(FIRM_STATUS).map((s) => ({
            value: s,
            label: s.charAt(0) + s.slice(1).toLowerCase(),
          }))}
          selected={statusFilter}
          onSelectionChange={setStatusFilter}
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={firms}
        loading={loading}
        emptyState={
          <EmptyState
            icon={<Building2 className="h-8 w-8 text-muted-foreground" />}
            title="No firms yet"
            description="Create your first firm to get started. Each firm is an isolated business entity with its own branches, users, and data."
            actionLabel="Create Firm"
            onAction={() => setDialogOpen(true)}
          />
        }
      />

      {/* Create Firm Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Firm</DialogTitle>
            <DialogDescription>
              Add a new business entity. All fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Firm Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter firm name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type *</Label>
                <Select value={businessType} onValueChange={setBusinessType} required>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gstNumber">GST Number</Label>
                <Input
                  id="gstNumber"
                  placeholder="e.g., 22AAAAA0000A1Z5"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.symbol} {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                placeholder="Full business address"
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Firm
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
