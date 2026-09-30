"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGate } from "@/components/shared/permission-gate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { CURRENCIES, TIMEZONES, BUSINESS_TYPES } from "@/types/firm.types";
import { firmService } from "@/services/firm.service";
import { branchService } from "@/services/branch.service";
import { Loader2, Plus, Building } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { firm, loading: authLoading } = useAuth();
  const firmId = firm?.id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile form state
  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState("Retail");
  const [gstNumber, setGstNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [address, setAddress] = useState("");

  // Branch state
  const [branches, setBranches] = useState([]);
  const [branchDialogOpen, setBranchDialogOpen] = useState(false);
  const [branchName, setBranchName] = useState("");
  const [branchPhone, setBranchPhone] = useState("");
  const [branchAddress, setBranchAddress] = useState("");
  const [addingBranch, setAddingBranch] = useState(false);

  const loadSettingsData = useCallback(async () => {
    if (!firmId) return;
    setLoading(true);
    try {
      const [firmData, branchData] = await Promise.all([
        firmService.getById(firmId),
        branchService.getByFirmId(firmId),
      ]);
      if (firmData) {
        setName(firmData.name || "");
        setBusinessType(firmData.businessType || "Retail");
        setGstNumber(firmData.gstNumber || "");
        setPhone(firmData.phone || "");
        setCurrency(firmData.currency || "INR");
        setTimezone(firmData.timezone || "Asia/Kolkata");
        setAddress(firmData.address || "");
      }
      setBranches(branchData || []);
    } catch (err) {
      toast.error(err.message || "Failed to load firm settings");
    } finally {
      setLoading(false);
    }
  }, [firmId]);

  useEffect(() => {
    if (!authLoading && firmId) {
      loadSettingsData();
    } else if (!authLoading && !firmId) {
      setLoading(false);
    }
  }, [authLoading, firmId, loadSettingsData]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await firmService.update(firmId, {
        name,
        businessType,
        gstNumber,
        phone,
        currency,
        timezone,
        address,
      });
      toast.success("Firm profile updated successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to update firm profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAddBranch = async (e) => {
    e.preventDefault();
    if (!branchName) {
      toast.error("Branch name is required");
      return;
    }
    setAddingBranch(true);
    try {
      await branchService.create({
        firmId,
        name: branchName.trim(),
        phone: branchPhone.trim() || undefined,
        address: branchAddress.trim() || undefined,
      });
      toast.success(`Branch "${branchName}" added successfully!`);
      setBranchDialogOpen(false);
      setBranchName("");
      setBranchPhone("");
      setBranchAddress("");
      loadSettingsData();
    } catch (err) {
      toast.error(err.message || "Failed to add branch");
    } finally {
      setAddingBranch(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading settings…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage firm settings and preferences"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Settings" }]}
      />

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="branches">Branches ({branches.length})</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Firm Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Firm Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Business Type</Label>
                    <Select value={businessType} onValueChange={setBusinessType}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        {BUSINESS_TYPES.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>GST Number</Label>
                    <Input value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} placeholder="e.g., 22AAAAA0000A1Z5" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => (<SelectItem key={c.code} value={c.code}>{c.symbol} {c.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map((tz) => (<SelectItem key={tz} value={tz}>{tz}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full business address" rows={2} />
                </div>
                <Separator />
                <PermissionGate permission="Settings.Manage">
                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </PermissionGate>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branches" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Branches</CardTitle>
              <PermissionGate permission="Settings.Manage">
                <Button size="sm" className="gap-2" onClick={() => setBranchDialogOpen(true)}>
                  <Plus className="h-4 w-4" /> Add Branch
                </Button>
              </PermissionGate>
            </CardHeader>
            <CardContent>
              {branches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Building className="h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No branches configured yet. Add branches like Pune, Mumbai, Nashik to organize
                    your business by location.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {branches.map((b) => (
                    <div key={b.id} className="border rounded-lg p-4 space-y-1">
                      <h4 className="font-semibold text-sm">{b.name}</h4>
                      {b.phone && <p className="text-xs text-muted-foreground">Phone: {b.phone}</p>}
                      {b.address && <p className="text-xs text-muted-foreground">Address: {b.address}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  System defaults, tax configurations, and notification preferences are operating under firm profile defaults.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Branch Dialog */}
      <Dialog open={branchDialogOpen} onOpenChange={setBranchDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Branch</DialogTitle>
            <DialogDescription>Add a location branch to your firm.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddBranch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="branchName">Branch Name *</Label>
              <Input
                id="branchName"
                placeholder="e.g. Pune Central Branch"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branchPhone">Phone Number</Label>
              <Input
                id="branchPhone"
                placeholder="+91 98765 43210"
                value={branchPhone}
                onChange={(e) => setBranchPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branchAddress">Address</Label>
              <Textarea
                id="branchAddress"
                placeholder="Branch address"
                rows={2}
                value={branchAddress}
                onChange={(e) => setBranchAddress(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setBranchDialogOpen(false)} disabled={addingBranch}>
                Cancel
              </Button>
              <Button type="submit" disabled={addingBranch}>
                {addingBranch && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Branch
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
