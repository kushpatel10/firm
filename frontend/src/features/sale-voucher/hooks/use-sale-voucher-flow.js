import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";

export const VOUCHER_STEPS = [
  { id: "PARTY", label: "Party" },
  { id: "INVOICE", label: "Invoice" },
  { id: "ITEMS", label: "Items" },
  { id: "SUMMARY", label: "Summary" },
];

export function useSaleVoucherFlow({
  customers = [],
  initialSale = null,
  onSave,
  onCancel,
  onViewSavedInvoice,
}) {
  const [stepIndex, setStepIndex] = useState(0);

  // Extract initial values if editing
  const isEditing = Boolean(initialSale?.id);

  const [partyMode, setPartyMode] = useState(() => {
    if (initialSale) return initialSale.customerId ? "registered" : "custom";
    return "registered";
  });
  const [customerId, setCustomerId] = useState(() => initialSale?.customerId || "");
  const [partyName, setPartyName] = useState(() => initialSale?.customerName || initialSale?.customer?.name || "");
  const [partyPhone, setPartyPhone] = useState(() => {
    if (initialSale?.customer?.phone) return initialSale.customer.phone;
    if (initialSale?.description && initialSale.description.includes("Phone: ")) {
      const match = initialSale.description.match(/Phone:\s*([^\s|]+)/);
      if (match) return match[1];
    }
    return "";
  });
  const [partyAddress, setPartyAddress] = useState(() => {
    if (initialSale?.customer?.address) return initialSale.customer.address;
    if (initialSale?.description && initialSale.description.includes("Address: ")) {
      const match = initialSale.description.match(/Address:\s*([^|]+)/);
      if (match) return match[1]?.trim();
    }
    return "";
  });

  const [invoiceNumber, setInvoiceNumber] = useState(() => initialSale?.invoiceNumber || "");
  const [saleType, setSaleType] = useState(() => initialSale?.saleType || "PAKU");
  const [description, setDescription] = useState(() => {
    if (!initialSale?.description) return "";
    let raw = initialSale.description;
    const parts = raw.split(" | ");
    return parts.filter((p) => !p.startsWith("Phone: ") && !p.startsWith("Address: ")).join(" | ");
  });

  const [tax, setTax] = useState(() => String(initialSale?.tax ?? "0"));
  const [discount, setDiscount] = useState(() => String(initialSale?.discount ?? "0"));
  const [status, setStatus] = useState(() => initialSale?.status || "CONFIRMED");

  // Line items
  const [items, setItems] = useState(() => {
    if (initialSale?.items && initialSale.items.length > 0) {
      return initialSale.items.map((it, idx) => ({
        id: it.id || `init_${idx + 1}`,
        name: it.name || "",
        category: it.category || null,
        size: it.size || null,
        quantity: it.quantity || 1,
        unit: it.unit || "pcs",
        unitPrice: it.unitPrice || 0,
        total: it.total || (it.quantity || 1) * (it.unitPrice || 0),
        dimensions: it.dimensions || null,
        formula: it.formula || null,
        calculatedArea: it.calculatedArea || null,
        rate: it.rate || it.unitPrice || 0,
        subtype: it.subtype || null,
        snapshot: it.snapshot || null,
        isCustom: !it.category,
      }));
    }
    return [];
  });

  // Flow State
  const [submitting, setSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savedSale, setSavedSale] = useState(null);

  // Active step
  const currentStep = isSaved ? "SUCCESS" : VOUCHER_STEPS[stepIndex]?.id || "PARTY";
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === VOUCHER_STEPS.length - 1;

  // Add Item to list
  const addItem = useCallback((item) => {
    setItems((prev) => [...prev, item]);
    toast.success(`Added "${item.name}" to voucher`);
  }, []);

  // Update existing item in list
  const updateItem = useCallback((updatedItem, index) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = updatedItem;
      return copy;
    });
    toast.success(`Updated item specifications`);
  }, []);

  // Delete item from list
  const deleteItem = useCallback((index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    toast.info("Item removed from voucher");
  }, []);

  // Navigation: Next
  const goNext = useCallback(() => {
    if (currentStep === "PARTY") {
      const pName = partyMode === "registered"
        ? (customers.find((c) => c.id === customerId)?.name || partyName)
        : partyName;
      if (!pName || !pName.trim()) {
        toast.error("Please enter or select a customer name");
        return;
      }
    }

    if (currentStep === "ITEMS" && items.length === 0) {
      toast.error("Please add at least one line item to the voucher");
      return;
    }

    if (stepIndex < VOUCHER_STEPS.length - 1) {
      setStepIndex((idx) => idx + 1);
    }
  }, [currentStep, partyMode, customers, customerId, partyName, items.length, stepIndex]);

  // Navigation: Back
  const goBack = useCallback(() => {
    if (stepIndex > 0) {
      setStepIndex((idx) => idx - 1);
    } else if (onCancel) {
      onCancel();
    }
  }, [stepIndex, onCancel]);

  // Jump to specific step
  const jumpToStep = useCallback((stepId) => {
    const idx = VOUCHER_STEPS.findIndex((s) => s.id === stepId);
    if (idx !== -1) {
      setStepIndex(idx);
    }
  }, []);

  // Subtotal and Totals
  const itemsSubtotal = useMemo(() => {
    return items.reduce((sum, it) => sum + (parseFloat(it.total) || 0), 0);
  }, [items]);

  const taxAmount = parseFloat(tax) || 0;
  const discountAmount = parseFloat(discount) || 0;
  const grandTotal = Math.max(0, itemsSubtotal + taxAmount - discountAmount);

  // Submit & Save Voucher
  const handleSaveVoucher = async () => {
    if (items.length === 0) {
      toast.error("Please enter at least one item for the sale");
      return;
    }

    const selectedCust = customers.find((c) => c.id === customerId);
    const finalPartyName = partyMode === "registered"
      ? (selectedCust?.name || partyName.trim() || "Walk-in Customer")
      : (partyName.trim() || "Walk-in Customer");

    // Package party details in description if custom party
    let finalDesc = description.trim();
    if (partyMode === "custom") {
      const parts = [];
      if (partyPhone.trim()) parts.push(`Phone: ${partyPhone.trim()}`);
      if (partyAddress.trim()) parts.push(`Address: ${partyAddress.trim()}`);
      if (finalDesc) parts.push(finalDesc);
      finalDesc = parts.join(" | ");
    }

    const voucherPayload = {
      customerId: partyMode === "registered" ? (customerId || undefined) : undefined,
      customerName: finalPartyName,
      invoiceNumber: invoiceNumber.trim() || undefined,
      saleType,
      description: finalDesc || undefined,
      subtotal: itemsSubtotal,
      tax: taxAmount,
      discount: discountAmount,
      total: grandTotal,
      status,
      items: items.map((it) => ({
        name: it.name,
        category: it.category || null,
        size: it.size || null,
        quantity: parseInt(it.quantity) || 1,
        unit: it.unit || "pcs",
        unitPrice: parseFloat(it.unitPrice) || 0,
        total: parseFloat(it.total) || 0,
        // Historical Snapshot attributes
        dimensions: it.dimensions || null,
        formula: it.formula || null,
        calculatedArea: it.calculatedArea != null ? parseFloat(it.calculatedArea) : null,
        rate: it.rate != null ? parseFloat(it.rate) : null,
        subtype: it.subtype || null,
        snapshot: it.snapshot || null,
      })),
    };

    setSubmitting(true);
    try {
      const result = await onSave(voucherPayload, initialSale?.id);
      setIsSaved(true);
      setSavedSale(result || { ...voucherPayload, invoiceNumber: invoiceNumber || "INV-NEW" });
      toast.success(`${saleType === "KACHU" ? "Black" : "White"} Sale Voucher saved successfully!`);
    } catch (err) {
      toast.error(err.message || "Failed to save sale voucher");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    steps: VOUCHER_STEPS,
    stepIndex,
    currentStep,
    isFirstStep,
    isLastStep,
    isEditing,
    // Party
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
    // Invoice
    invoiceNumber,
    setInvoiceNumber,
    saleType,
    setSaleType,
    description,
    setDescription,
    // Items
    items,
    addItem,
    updateItem,
    deleteItem,
    // Accounting
    tax,
    setTax,
    discount,
    setDiscount,
    status,
    setStatus,
    itemsSubtotal,
    taxAmount,
    discountAmount,
    grandTotal,
    // Flow actions
    submitting,
    isSaved,
    savedSale,
    goNext,
    goBack,
    jumpToStep,
    handleSaveVoucher,
  };
}
