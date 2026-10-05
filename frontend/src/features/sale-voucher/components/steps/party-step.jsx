"use client";

import { useState, useMemo } from "react";
import { User, Phone, MapPin, Building2, Check, Search, X, UserPlus, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getInitials } from "@/lib/utils";
import { placeholders } from "@/config/placeholders";

export function PartyStep({
  partyMode,
  setPartyMode,
  customerId,
  setCustomerId,
  partyName,
  setPartyName,
  partyPhone,
  setPartyPhone,
  partyAddress,
  setPartyAddress,
  customers = [],
  onContinue,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isChanging, setIsChanging] = useState(false);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === customerId);
  }, [customers, customerId]);

  // Filter customers by name or phone
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase().trim();
    return customers.filter((c) => {
      const matchName = c.name?.toLowerCase().includes(q);
      const matchPhone = c.phone?.toLowerCase().includes(q);
      const matchAddr = c.address?.toLowerCase().includes(q);
      return matchName || matchPhone || matchAddr;
    });
  }, [customers, searchQuery]);

  const handleSelectCustomer = (cust) => {
    setCustomerId(cust.id);
    setPartyName(cust.name);
    if (cust.phone) setPartyPhone(cust.phone);
    if (cust.address) setPartyAddress(cust.address);
    setIsChanging(false);
    setSearchQuery("");
  };

  const handleClearSelection = () => {
    setCustomerId("");
    setPartyName("");
    setPartyPhone("");
    setPartyAddress("");
    setIsChanging(true);
  };

  const handleUseSearchAsCustom = () => {
    setPartyMode("custom");
    setPartyName(searchQuery.trim());
    setCustomerId("");
    setSearchQuery("");
    setIsChanging(false);
  };

  const canContinue = partyMode === "registered"
    ? Boolean(customerId) || partyName.trim().length > 0
    : partyName.trim().length > 0;

  const showCustomerList = partyMode === "registered" && (!selectedCustomer || isChanging);

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Party / Customer
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Who is this sale for?
          </p>
        </div>

        {/* Registered vs Custom Mode Toggle */}
        <div className="flex p-1 rounded-2xl bg-muted/60 border border-border/60">
          <button
            type="button"
            onClick={() => {
              setPartyMode("registered");
              setIsChanging(false);
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              partyMode === "registered"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Building2 className="h-4 w-4" /> Registered Party
          </button>
          <button
            type="button"
            onClick={() => setPartyMode("custom")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              partyMode === "custom"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <User className="h-4 w-4" /> Custom Party
          </button>
        </div>

        {/* Registered Party Selection */}
        {partyMode === "registered" ? (
          <div className="space-y-3 pt-1">
            {/* Selected Customer Card */}
            {selectedCustomer && !isChanging ? (
              <div className="p-4 rounded-2xl bg-card border-2 border-primary/40 shadow-sm space-y-3 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/20">
                      {getInitials(selectedCustomer.name)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-foreground">
                          {selectedCustomer.name}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <Check className="h-3 w-3 stroke-[3]" /> Selected
                        </span>
                      </div>
                      {selectedCustomer.phone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <Phone className="h-3 w-3" /> {selectedCustomer.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsChanging(true)}
                    className="h-8 px-2.5 text-xs rounded-xl cursor-pointer shrink-0"
                  >
                    Change
                  </Button>
                </div>

                {selectedCustomer.address && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1 border-t border-border/50">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{selectedCustomer.address}</span>
                  </p>
                )}
              </div>
            ) : null}

            {/* Search and List */}
            {showCustomerList && (
              <div className="space-y-2.5">
                <div className="relative">
                  <Search className="h-4 w-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder={placeholders.sales.partySearch}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="h-12 pl-10 pr-9 rounded-2xl bg-card border-border/80 text-sm font-medium focus-visible:ring-primary/30"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Quick Add / Fallback to custom with query */}
                {searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={handleUseSearchAsCustom}
                    className="w-full p-2.5 rounded-xl border border-dashed border-primary/40 bg-primary/5 text-primary text-xs font-semibold flex items-center justify-between cursor-pointer hover:bg-primary/10 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <UserPlus className="h-3.5 w-3.5" /> Use &ldquo;{searchQuery.trim()}&rdquo; as Custom Party
                    </span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                )}

                {/* Customer List */}
                <div className="max-h-60 sm:max-h-72 overflow-y-auto rounded-2xl border border-border/80 bg-card divide-y divide-border/60 shadow-xs">
                  {filteredCustomers.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground space-y-1">
                      <p className="font-semibold text-foreground">No matching party found</p>
                      <p>Try searching another name or switch to Custom Party.</p>
                    </div>
                  ) : (
                    filteredCustomers.map((cust) => {
                      const isSelected = cust.id === customerId;
                      return (
                        <button
                          key={cust.id}
                          type="button"
                          onClick={() => handleSelectCustomer(cust)}
                          className={`w-full p-3 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer hover:bg-muted/50 active:bg-muted ${
                            isSelected ? "bg-primary/5 font-semibold" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-9 w-9 rounded-xl bg-muted text-muted-foreground flex items-center justify-center font-bold text-xs shrink-0">
                              {getInitials(cust.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">
                                {cust.name}
                              </p>
                              {cust.phone && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {cust.phone}
                                </p>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="h-4 w-4 text-primary shrink-0 stroke-[3]" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>

                {isChanging && selectedCustomer && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsChanging(false)}
                    className="w-full text-xs text-muted-foreground hover:text-foreground"
                  >
                    Keep current: {selectedCustomer.name}
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Custom Party Form Details */
          <div className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="customPartyName" className="text-xs font-semibold text-foreground">
                Party / Customer Name *
              </Label>
              <Input
                id="customPartyName"
                placeholder={placeholders.sales.customPartyName}
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                autoFocus
                required
                className="h-12 rounded-xl bg-card border-border/80 text-sm font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="customPartyPhone" className="text-xs font-semibold text-muted-foreground">
                Customer Phone (Optional)
              </Label>
              <div className="relative">
                <Phone className="h-4 w-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  id="customPartyPhone"
                  placeholder={placeholders.sales.customPartyPhone}
                  value={partyPhone}
                  onChange={(e) => setPartyPhone(e.target.value)}
                  className="h-11 pl-10 rounded-xl bg-card border-border/80 text-sm font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="customPartyAddress" className="text-xs font-semibold text-muted-foreground">
                Customer Address / City (Optional)
              </Label>
              <div className="relative">
                <MapPin className="h-4 w-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  id="customPartyAddress"
                  placeholder={placeholders.sales.customPartyAddress}
                  value={partyAddress}
                  onChange={(e) => setPartyAddress(e.target.value)}
                  className="h-11 pl-10 rounded-xl bg-card border-border/80 text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
