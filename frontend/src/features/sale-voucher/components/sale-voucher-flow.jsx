"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, X, FileText, Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { useSaleVoucherFlow } from "../hooks/use-sale-voucher-flow";
import { categoryService } from "@/services/category.service";
import { StepIndicator } from "./step-indicator";
import { PartyStep } from "./steps/party-step";
import { InvoiceStep } from "./steps/invoice-step";
import { ItemsStep } from "./steps/items-step";
import { VoucherSummary } from "./steps/voucher-summary";
import { VoucherSuccess } from "./steps/voucher-success";
import { ItemFlowModal } from "./item-flow/item-flow-modal";
import { CustomItemSheet } from "./steps/custom-item-sheet";

const DEFAULT_FALLBACK_CATEGORIES = [
  {
    id: "cat_doors",
    name: "Doors",
    icon: "🚪",
    description: "Flush Doors, Teak Doors, and custom architectural doors",
    hasSubtypes: true,
    formula: "(LENGTH * WIDTH) / 144",
    calculationLabel: "Square Feet",
    rateLabel: "Rate per sq.ft",
    unit: "sq.ft",
    sortOrder: 1,
    subtypes: [
      { id: "st_flush", name: "Flush Door", description: "Solid core flush door with standard laminate base", defaultRate: 250 },
      { id: "st_teak", name: "Teak Door", description: "Premium natural teak wood carved / panel door", defaultRate: 450 },
      { id: "st_other", name: "Other", description: "Custom membrane, pine, or molded panel door", defaultRate: 300 },
    ],
    dimensions: [
      { id: "dim_len", key: "length", label: "Length", unit: "inch", type: "NUMBER", required: true, defaultValue: 84, sortOrder: 1 },
      { id: "dim_wid", key: "width", label: "Width", unit: "inch", type: "NUMBER", required: true, defaultValue: 36, sortOrder: 2 },
      { id: "dim_qty", key: "quantity", label: "Quantity", unit: "piece", type: "NUMBER", required: true, defaultValue: 2, sortOrder: 3 },
    ],
    sizePresets: [
      { id: "sp_30", name: "30 mm", standardRate: 250 },
      { id: "sp_35", name: "35 mm", standardRate: 280 },
    ],
    pricingRules: [
      {
        formula: "(LENGTH * WIDTH) / 144",
        formulaExplanation: "Square Feet = (Length × Width) / 144",
        rounding: "ROUND_HALF_UP",
        decimalPlaces: 2,
        isActive: true,
      },
    ],
  },
  {
    id: "cat_windows",
    name: "Windows",
    icon: "🪟",
    description: "Aluminium, UPVC, and sliding window sections",
    hasSubtypes: true,
    formula: "(LENGTH * WIDTH) / 144",
    calculationLabel: "Square Feet",
    rateLabel: "Rate per sq.ft",
    unit: "sq.ft",
    sortOrder: 2,
    subtypes: [
      { id: "st_alum", name: "Aluminium Window", defaultRate: 320 },
      { id: "st_upvc", name: "UPVC Window", defaultRate: 480 },
      { id: "st_slid", name: "Sliding Window", defaultRate: 360 },
    ],
    dimensions: [
      { id: "dim_wlen", key: "length", label: "Length (Height)", unit: "inch", type: "NUMBER", required: true, defaultValue: 48, sortOrder: 1 },
      { id: "dim_wwid", key: "width", label: "Width", unit: "inch", type: "NUMBER", required: true, defaultValue: 48, sortOrder: 2 },
      { id: "dim_wqty", key: "quantity", label: "Quantity", unit: "piece", type: "NUMBER", required: true, defaultValue: 1, sortOrder: 3 },
    ],
    sizePresets: [
      { id: "sp_2t", name: "2 Track", standardRate: 320 },
      { id: "sp_3t", name: "3 Track", standardRate: 380 },
    ],
    pricingRules: [
      {
        formula: "(LENGTH * WIDTH) / 144",
        rounding: "ROUND_HALF_UP",
        decimalPlaces: 2,
        isActive: true,
      },
    ],
  },
  {
    id: "cat_furniture",
    name: "Furniture",
    icon: "🛋️",
    description: "Standard unit-priced ready or custom modular furniture",
    hasSubtypes: false,
    formula: "QUANTITY * RATE",
    calculationLabel: "Units",
    rateLabel: "Rate per item",
    unit: "piece",
    sortOrder: 3,
    subtypes: [],
    dimensions: [
      { id: "dim_fqty", key: "quantity", label: "Quantity", unit: "piece", type: "NUMBER", required: true, defaultValue: 1, sortOrder: 1 },
    ],
    sizePresets: [
      { id: "sp_std", name: "Standard", standardRate: 1500 },
      { id: "sp_lrg", name: "Large", standardRate: 2500 },
    ],
    pricingRules: [
      {
        formula: "QUANTITY * RATE",
        rounding: "ROUND_HALF_UP",
        decimalPlaces: 2,
        isActive: true,
      },
    ],
  },
];

export function SaleVoucherFlow({
  isOpen,
  onClose,
  firmId,
  customers = [],
  initialSale = null,
  onSaveVoucher,
  onViewInvoice,
}) {
  // Categories from database
  const [categories, setCategories] = useState(DEFAULT_FALLBACK_CATEGORIES);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Sub-modal states
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const [customSheetOpen, setCustomSheetOpen] = useState(false);
  const [editingItemInfo, setEditingItemInfo] = useState(null); // { item, index }

  // Fetch categories for this firm from backend API
  useEffect(() => {
    if (isOpen) {
      const targetFirmId = firmId || "dev-firm-001";
      setLoadingCategories(true);
      categoryService
        .getAll(targetFirmId)
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setCategories(data);
          } else {
            setCategories(DEFAULT_FALLBACK_CATEGORIES);
          }
        })
        .catch((err) => {
          console.warn("Backend categories unavailable, using default catalog:", err);
          setCategories(DEFAULT_FALLBACK_CATEGORIES);
        })
        .finally(() => {
          setLoadingCategories(false);
        });
    }
  }, [isOpen, firmId]);

  // Master voucher flow state
  const {
    steps,
    stepIndex,
    currentStep,
    isFirstStep,
    isEditing,
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
    invoiceNumber,
    setInvoiceNumber,
    saleType,
    setSaleType,
    description,
    setDescription,
    items,
    addItem,
    updateItem,
    deleteItem,
    tax,
    setTax,
    discount,
    setDiscount,
    status,
    setStatus,
    submitting,
    isSaved,
    savedSale,
    grandTotal,
    goNext,
    goBack,
    handleSaveVoucher,
  } = useSaleVoucherFlow({
    customers,
    initialSale,
    onSave: onSaveVoucher,
    onCancel: onClose,
  });

  const canContinueParty = partyMode === "registered"
    ? Boolean(customerId) || partyName.trim().length > 0
    : partyName.trim().length > 0;

  // Lock background scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle adding or updating item from catalog flow
  const handleItemFlowComplete = (completedItem) => {
    if (editingItemInfo != null) {
      updateItem(completedItem, editingItemInfo.index);
      setEditingItemInfo(null);
    } else {
      addItem(completedItem);
    }
  };

  // Open item flow for editing
  const handleEditItem = (item, index) => {
    setEditingItemInfo({ item, index });
    if (item.isCustom) {
      setCustomSheetOpen(true);
    } else {
      setCatalogModalOpen(true);
    }
  };

  const currentStepNum = stepIndex + 1;
  const totalSteps = steps.length;

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col justify-between animate-in fade-in duration-200">
      {/* Mobile-first centered container: full screen on mobile, elegant max-w-xl frame on desktop */}
      <div className="w-full max-w-xl mx-auto flex flex-col h-full bg-background md:border-x md:border-border/80 md:shadow-2xl relative">
        
        {/* Fixed Top Header Navigation */}
        {!isSaved && (
          <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-border/80 px-4 py-3 shrink-0">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={goBack}
                className="h-10 w-10 -ml-2 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 active:scale-95 transition-all cursor-pointer"
                title="Go Back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div className="text-center min-w-0 flex-1">
                <div className="flex items-center justify-center gap-1.5">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="font-bold text-sm sm:text-base text-foreground truncate">
                    {isEditing ? "Edit Sale Voucher" : "Sale Voucher"}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground">
                  Step {currentStepNum} of {totalSteps}: {steps[stepIndex]?.label}
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="h-10 w-10 -mr-2 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 active:scale-95 transition-all cursor-pointer"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Step Progress Dots & Bar */}
            <div className="pt-2 px-1">
              <StepIndicator steps={steps} currentStepIndex={stepIndex} />
            </div>
          </header>
        )}

        {/* Scrollable Form Content */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          {currentStep === "PARTY" && (
            <PartyStep
              partyMode={partyMode}
              setPartyMode={setPartyMode}
              customerId={customerId}
              setCustomerId={setCustomerId}
              partyName={partyName}
              setPartyName={setPartyName}
              partyPhone={partyPhone}
              setPartyPhone={setPartyPhone}
              partyAddress={partyAddress}
              setPartyAddress={setPartyAddress}
              customers={customers}
              onContinue={goNext}
            />
          )}

          {currentStep === "INVOICE" && (
            <InvoiceStep
              invoiceNumber={invoiceNumber}
              setInvoiceNumber={setInvoiceNumber}
              saleType={saleType}
              setSaleType={setSaleType}
              description={description}
              setDescription={setDescription}
              onBack={goBack}
              onContinue={goNext}
            />
          )}

          {currentStep === "ITEMS" && (
            <ItemsStep
              items={items}
              onOpenCatalogFlow={() => {
                setEditingItemInfo(null);
                setCatalogModalOpen(true);
              }}
              onOpenCustomItem={() => {
                setEditingItemInfo(null);
                setCustomSheetOpen(true);
              }}
              onEditItem={handleEditItem}
              onDeleteItem={deleteItem}
              onBack={goBack}
              onContinue={goNext}
            />
          )}

          {currentStep === "SUMMARY" && (
            <VoucherSummary
              partyMode={partyMode}
              customerId={customerId}
              partyName={partyName}
              partyPhone={partyPhone}
              partyAddress={partyAddress}
              invoiceNumber={invoiceNumber}
              saleType={saleType}
              description={description}
              items={items}
              tax={tax}
              setTax={setTax}
              discount={discount}
              setDiscount={setDiscount}
              status={status}
              setStatus={setStatus}
              submitting={submitting}
              onBack={goBack}
              onSave={handleSaveVoucher}
            />
          )}

          {currentStep === "SUCCESS" && (
            <VoucherSuccess
              savedSale={savedSale}
              onViewVoucher={() => {
                onClose();
                if (onViewInvoice) {
                  onViewInvoice(savedSale);
                }
              }}
              onDone={onClose}
            />
          )}
        </main>

        {/* Fixed Sticky Footer for Mobile Navigation Actions */}
        {!isSaved && currentStep !== "SUCCESS" && (
          <footer className="sticky bottom-0 z-30 bg-background/95 backdrop-blur-md border-t border-border/80 px-4 sm:px-6 py-3 shrink-0 pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
            {currentStep === "PARTY" && (
              <Button
                type="button"
                size="lg"
                disabled={!canContinueParty}
                onClick={goNext}
                className="w-full h-12 sm:h-13 text-base font-semibold rounded-2xl shadow-lg shadow-primary/20 cursor-pointer"
              >
                Continue
              </Button>
            )}

            {currentStep === "INVOICE" && (
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={goBack}
                  className="flex-1 h-12 sm:h-13 rounded-2xl cursor-pointer"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  size="lg"
                  onClick={goNext}
                  className="flex-1 h-12 sm:h-13 rounded-2xl shadow-lg shadow-primary/20 cursor-pointer font-semibold text-base"
                >
                  Continue
                </Button>
              </div>
            )}

            {currentStep === "ITEMS" && (
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={goBack}
                  className="flex-1 h-12 sm:h-13 rounded-2xl cursor-pointer"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  size="lg"
                  disabled={items.length === 0}
                  onClick={goNext}
                  className="flex-1 h-12 sm:h-13 rounded-2xl shadow-lg shadow-primary/20 cursor-pointer font-semibold text-base"
                >
                  Review Voucher ({items.length})
                </Button>
              </div>
            )}

            {currentStep === "SUMMARY" && (
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={goBack}
                  disabled={submitting}
                  className="flex-1 h-12 sm:h-13 rounded-2xl cursor-pointer"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  size="lg"
                  onClick={handleSaveVoucher}
                  disabled={submitting || items.length === 0}
                  className="flex-2 h-12 sm:h-13 text-base font-bold rounded-2xl shadow-lg shadow-primary/25 cursor-pointer"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" /> Saving…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" /> Save Voucher • {formatCurrency(grandTotal)}
                    </span>
                  )}
                </Button>
              </div>
            )}
          </footer>
        )}
      </div>

      {/* Sub-Flow: Add/Edit Item from Catalog */}
      <ItemFlowModal
        isOpen={catalogModalOpen}
        onClose={() => {
          setCatalogModalOpen(false);
          setEditingItemInfo(null);
        }}
        categories={categories}
        initialItem={editingItemInfo?.item || null}
        onAddItem={handleItemFlowComplete}
        loading={loadingCategories}
      />

      {/* Sub-Flow: Add/Edit Custom Item */}
      <CustomItemSheet
        isOpen={customSheetOpen}
        onClose={() => {
          setCustomSheetOpen(false);
          setEditingItemInfo(null);
        }}
        onAddCustomItem={(customItem) => {
          if (editingItemInfo != null) {
            updateItem(customItem, editingItemInfo.index);
            setEditingItemInfo(null);
          } else {
            addItem(customItem);
          }
        }}
      />
    </div>
  );
}
