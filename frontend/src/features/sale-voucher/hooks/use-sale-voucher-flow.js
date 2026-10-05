import { useState, useCallback, useMemo, useEffect } from "react";
import { toast } from "sonner";

export const VOUCHER_STEPS = [
  { id: "PARTY", label: "Party" },
  { id: "INVOICE", label: "Invoice" },
  { id: "ITEMS", label: "Items" },
  { id: "SUMMARY", label: "Summary" },
];

function parseSaleItems(rawItems) {
  if (!rawItems || !Array.isArray(rawItems) || rawItems.length === 0) return [];
  return rawItems.map((it, idx) => {
    let dims = it.dimensions;
    if (typeof dims === "string") {
      try { dims = JSON.parse(dims); } catch (_) {}
    }
    let snap = it.snapshot;
    if (typeof snap === "string") {
      try { snap = JSON.parse(snap); } catch (_) {}
    }
    const isCustom = Boolean(
      it.isCustom ||
      !it.category ||
      it.category === "Custom Item" ||
      snap?.isCustom
    );

    const qty = parseInt(it.quantity) || 1;
    const price = parseFloat(it.unitPrice) || 0;
    const tot = (it.total != null && !isNaN(parseFloat(it.total))) ? parseFloat(it.total) : qty * price;

    return {
      id: it.id || `item_${idx + 1}`,
      name: it.name || "",
      category: it.category || null,
      categoryId: it.categoryId || null,
      size: it.size || null,
      quantity: qty,
      unit: it.unit || "pcs",
      unitPrice: price,
      total: tot,
      dimensions: dims || null,
      formula: it.formula || null,
      calculatedArea: it.calculatedArea != null ? parseFloat(it.calculatedArea) : null,
      rate: it.rate != null ? parseFloat(it.rate) : price,
      subtype: it.subtype || null,
      snapshot: snap || null,
      isCustom,
    };
  });
}

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

  // Accounting initialization
  const initSubtotal = (initialSale?.items && initialSale.items.length > 0)
    ? initialSale.items.reduce((sum, it) => sum + (parseFloat(it.total) || (it.quantity || 1) * (it.unitPrice || 0)), 0)
    : (parseFloat(initialSale?.subtotal) || parseFloat(initialSale?.total) || 0);
  const initDiscount = parseFloat(initialSale?.discount) || 0;
  const initTaxable = Math.max(0, initSubtotal - initDiscount);
  const initTaxVal = parseFloat(initialSale?.tax) || 0;

  const [taxMode, setTaxModeState] = useState(() => {
    if (initialSale) {
      if (initTaxVal === 0) return "percent";
      if (initTaxable > 0) {
        const rate = (initTaxVal / initTaxable) * 100;
        const rounded = Math.round(rate * 100) / 100;
        if ([0, 5, 12, 18, 28].includes(Math.round(rate)) || Math.abs(rate - rounded) < 0.001) {
          return "percent";
        }
      }
      return "fixed";
    }
    return "percent";
  });

  const [taxRate, setTaxRate] = useState(() => {
    if (initialSale) {
      if (initTaxVal === 0) return "0";
      if (initTaxable > 0) {
        const rate = (initTaxVal / initTaxable) * 100;
        return String(Math.round(rate * 100) / 100);
      }
      return "0";
    }
    return (initialSale?.saleType || "PAKU") === "KACHU" ? "0" : "18";
  });

  const [tax, setTax] = useState(() => String(initialSale?.tax ?? "0"));
  const [discountMode, setDiscountModeState] = useState("fixed");
  const [discountRate, setDiscountRate] = useState("0");
  const [discount, setDiscount] = useState(() => String(initialSale?.discount ?? "0"));
  const [status, setStatus] = useState(() => initialSale?.status || "CONFIRMED");

  // Line items
  const [items, setItems] = useState(() => parseSaleItems(initialSale?.items));

  // Sync state if initialSale changes while mounted
  useEffect(() => {
    if (initialSale) {
      const isRegistered = Boolean(initialSale.customerId);
      setPartyMode(isRegistered ? "registered" : "custom");
      setCustomerId(initialSale.customerId || "");
      setPartyName(initialSale.customerName || initialSale.customer?.name || "");

      let phone = initialSale.customer?.phone || "";
      let address = initialSale.customer?.address || "";
      if (initialSale.description) {
        if (!phone && initialSale.description.includes("Phone: ")) {
          const match = initialSale.description.match(/Phone:\s*([^\s|]+)/);
          if (match) phone = match[1];
        }
        if (!address && initialSale.description.includes("Address: ")) {
          const match = initialSale.description.match(/Address:\s*([^|]+)/);
          if (match) address = match[1]?.trim();
        }
      }
      setPartyPhone(phone);
      setPartyAddress(address);

      setInvoiceNumber(initialSale.invoiceNumber || "");
      setSaleType(initialSale.saleType || "PAKU");

      let rawDesc = initialSale.description || "";
      const parts = rawDesc.split(" | ");
      const cleanDesc = parts.filter((p) => !p.startsWith("Phone: ") && !p.startsWith("Address: ")).join(" | ");
      setDescription(cleanDesc);

      const parsed = parseSaleItems(initialSale.items);
      setItems(parsed);

      const sub = parsed.length > 0
        ? parsed.reduce((s, it) => s + (parseFloat(it.total) || 0), 0)
        : (parseFloat(initialSale.subtotal) || parseFloat(initialSale.total) || 0);
      const disc = parseFloat(initialSale.discount) || 0;
      const taxVal = parseFloat(initialSale.tax) || 0;
      const taxable = Math.max(0, sub - disc);

      setDiscount(String(disc));
      setDiscountModeState("fixed");
      setDiscountRate("0");

      if (taxVal === 0) {
        setTaxModeState("percent");
        setTaxRate("0");
        setTax("0");
      } else if (taxable > 0) {
        const rate = (taxVal / taxable) * 100;
        const rounded = Math.round(rate * 100) / 100;
        if ([0, 5, 12, 18, 28].includes(Math.round(rate)) || Math.abs(rate - rounded) < 0.05) {
          setTaxModeState("percent");
          setTaxRate(String(Math.round(rate)));
          setTax(String(taxVal));
        } else {
          setTaxModeState("fixed");
          setTax(String(taxVal));
        }
      } else {
        setTaxModeState("fixed");
        setTax(String(taxVal));
      }

      setStatus(initialSale.status || "CONFIRMED");
      setStepIndex(0);
      setIsSaved(false);
      setSavedSale(null);
    }
  }, [initialSale]);

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

  const discountAmount = useMemo(() => {
    if (discountMode === "percent") {
      const rate = parseFloat(discountRate) || 0;
      return Math.round(((itemsSubtotal * rate) / 100) * 100) / 100;
    }
    return Math.max(0, parseFloat(discount) || 0);
  }, [discountMode, discountRate, discount, itemsSubtotal]);

  const taxableAmount = useMemo(() => {
    return Math.max(0, itemsSubtotal - discountAmount);
  }, [itemsSubtotal, discountAmount]);

  const taxAmount = useMemo(() => {
    if (taxMode === "percent") {
      const rate = parseFloat(taxRate) || 0;
      return Math.round(((taxableAmount * rate) / 100) * 100) / 100;
    }
    return Math.max(0, parseFloat(tax) || 0);
  }, [taxMode, taxRate, tax, taxableAmount]);

  const grandTotal = useMemo(() => {
    return Math.max(0, taxableAmount + taxAmount);
  }, [taxableAmount, taxAmount]);

  // Mode change & preset helpers
  const handleTaxModeChange = useCallback((newMode) => {
    if (newMode === taxMode) return;
    if (newMode === "fixed") {
      setTax(taxAmount > 0 ? String(taxAmount) : "0");
      setTaxModeState("fixed");
    } else {
      if (taxableAmount > 0 && taxAmount > 0) {
        const rate = (taxAmount / taxableAmount) * 100;
        setTaxRate(String(Math.round(rate * 100) / 100));
      }
      setTaxModeState("percent");
    }
  }, [taxMode, taxAmount, taxableAmount]);

  const selectTaxPreset = useCallback((presetValue) => {
    setTaxModeState("percent");
    setTaxRate(String(presetValue));
  }, []);

  const handleDiscountModeChange = useCallback((newMode) => {
    if (newMode === discountMode) return;
    if (newMode === "fixed") {
      setDiscount(discountAmount > 0 ? String(discountAmount) : "0");
      setDiscountModeState("fixed");
    } else {
      if (itemsSubtotal > 0 && discountAmount > 0) {
        const rate = (discountAmount / itemsSubtotal) * 100;
        setDiscountRate(String(Math.round(rate * 100) / 100));
      }
      setDiscountModeState("percent");
    }
  }, [discountMode, discountAmount, itemsSubtotal]);

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
      customerId: partyMode === "registered" ? (customerId || null) : null,
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
    setStepIndex,
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
    taxMode,
    setTaxMode: handleTaxModeChange,
    taxRate,
    setTaxRate,
    tax,
    setTax,
    selectTaxPreset,
    taxAmount,
    discountMode,
    setDiscountMode: handleDiscountModeChange,
    discountRate,
    setDiscountRate,
    discount,
    setDiscount,
    status,
    setStatus,
    discountAmount,
    taxableAmount,
    itemsSubtotal,
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
