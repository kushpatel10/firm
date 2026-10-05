import { useState, useMemo, useCallback, useEffect } from "react";
import { FormulaEvaluator } from "../engine/formula-evaluator";

export const ITEM_STEPS = {
  CATEGORY: "CATEGORY",
  SUBTYPE: "SUBTYPE",
  SIZE: "SIZE",
  DIMENSIONS: "DIMENSIONS",
  PRICING: "PRICING",
  REVIEW: "REVIEW",
};

export function useItemFlow({ categories = [], initialItem = null, onComplete, onCancel }) {
  // If editing, find initial category
  const initialCategory = useMemo(() => {
    if (!initialItem) return null;
    if (initialItem.categoryId) {
      const match = categories.find((c) => c.id === initialItem.categoryId);
      if (match) return match;
    }
    if (!initialItem.category) return null;
    const catName = initialItem.category.toLowerCase();
    return categories.find((c) => c.name.toLowerCase() === catName || catName.includes(c.name.toLowerCase())) || null;
  }, [categories, initialItem]);

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSubtype, setSelectedSubtype] = useState(initialItem?.subtype || "");
  const [selectedSize, setSelectedSize] = useState(initialItem?.size || "");
  const [isCustomSize, setIsCustomSize] = useState(false);
  const [customSizeText, setCustomSizeText] = useState("");
  const [dimensionValues, setDimensionValues] = useState(() => {
    let dims = initialItem?.dimensions;
    if (typeof dims === "string") {
      try { dims = JSON.parse(dims); } catch (_) {}
    }
    if (dims && typeof dims === "object") {
      return { ...dims };
    }
    return {};
  });
  const [rate, setRate] = useState(initialItem?.rate ?? initialItem?.unitPrice ?? "");
  const [quantity, setQuantity] = useState(initialItem?.quantity ?? 1);

  // Sync state if initialItem or initialCategory changes
  useEffect(() => {
    if (initialCategory && !selectedCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory, selectedCategory]);

  useEffect(() => {
    if (initialItem) {
      if (initialItem.subtype) setSelectedSubtype(initialItem.subtype);
      if (initialItem.size) {
        setSelectedSize(initialItem.size);
      }
      let dims = initialItem.dimensions;
      if (typeof dims === "string") {
        try { dims = JSON.parse(dims); } catch (_) {}
      }
      if (dims && typeof dims === "object") {
        setDimensionValues({ ...dims });
      }
      if (initialItem.rate != null || initialItem.unitPrice != null) {
        setRate(initialItem.rate ?? initialItem.unitPrice);
      }
      if (initialItem.quantity != null) {
        setQuantity(initialItem.quantity);
      }
    }
  }, [initialItem]);

  // Dynamic step list based on selected category:
  // If category has no subtypes (or empty array), SUBTYPE step is excluded!
  const steps = useMemo(() => {
    const list = [ITEM_STEPS.CATEGORY];
    if (selectedCategory?.hasSubtypes && (selectedCategory?.subtypes?.length ?? 0) > 0) {
      list.push(ITEM_STEPS.SUBTYPE);
    }
    list.push(ITEM_STEPS.SIZE);
    list.push(ITEM_STEPS.DIMENSIONS);
    list.push(ITEM_STEPS.PRICING);
    list.push(ITEM_STEPS.REVIEW);
    return list;
  }, [selectedCategory]);

  const [stepIndex, setStepIndex] = useState(() => {
    if (initialItem) return 0;
    return 0;
  });

  const currentStep = steps[stepIndex] || ITEM_STEPS.CATEGORY;
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === steps.length - 1;

  // Change category handler: clears dependent data
  const handleSelectCategory = useCallback((category) => {
    if (category.id === selectedCategory?.id) return;
    setSelectedCategory(category);
    setSelectedSubtype("");
    setSelectedSize("");
    setIsCustomSize(false);
    setCustomSizeText("");

    // Initialize dimensions with defaults from the new category
    const initialDims = {};
    (category.dimensions || []).forEach((d) => {
      initialDims[d.key] = d.defaultValue ?? "";
    });
    setDimensionValues(initialDims);

    // Default rate from category or subtype
    const defaultSubtype = category.subtypes?.[0];
    const defaultRate = defaultSubtype?.defaultRate ?? "";
    setRate(defaultRate);
    setQuantity(initialDims.quantity || 1);
  }, [selectedCategory]);

  // Select subtype handler
  const handleSelectSubtype = useCallback((subtypeName) => {
    setSelectedSubtype(subtypeName);
    const matched = selectedCategory?.subtypes?.find((s) => s.name === subtypeName);
    if (matched?.defaultRate) {
      setRate(matched.defaultRate);
    }
  }, [selectedCategory]);

  // Select size preset or custom size
  const handleSelectSize = useCallback((sizeName, isCustom = false) => {
    if (isCustom) {
      setIsCustomSize(true);
      setSelectedSize(sizeName || customSizeText || "Custom Size");
    } else {
      setIsCustomSize(false);
      setSelectedSize(sizeName);
      const preset = selectedCategory?.sizePresets?.find((sp) => sp.name === sizeName);
      if (preset?.standardRate) {
        setRate(preset.standardRate);
      }
    }
  }, [customSizeText, selectedCategory]);

  // Update dimension field
  const handleUpdateDimension = useCallback((key, value) => {
    setDimensionValues((prev) => ({
      ...prev,
      [key]: value,
    }));
    if (key.toLowerCase() === "quantity" || key.toLowerCase() === "qty") {
      setQuantity(parseInt(value) || 1);
    }
  }, []);

  // Live calculated pricing result using safe formula engine
  const calculationResult = useMemo(() => {
    if (!selectedCategory) {
      return {
        formula: "",
        formulaDisplay: "",
        calculatedMeasure: 0,
        calculationLabel: "Area",
        unit: "sq.ft",
        rate: parseFloat(rate) || 0,
        rateLabel: "Rate",
        amountPerPiece: 0,
        quantity: parseInt(quantity) || 1,
        totalAmount: 0,
      };
    }

    return FormulaEvaluator.calculatePricing({
      category: selectedCategory,
      dimensions: dimensionValues,
      rate: parseFloat(rate) || 0,
      quantity: parseInt(quantity) || 1,
    });
  }, [selectedCategory, dimensionValues, rate, quantity]);

  // Navigation: Next
  const goNext = useCallback(() => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((idx) => idx + 1);
    }
  }, [stepIndex, steps.length]);

  // Navigation: Back
  const goBack = useCallback(() => {
    if (stepIndex > 0) {
      setStepIndex((idx) => idx - 1);
    } else if (onCancel) {
      onCancel();
    }
  }, [stepIndex, onCancel]);

  // Jump to specific step (e.g. from Review "Edit" button)
  const jumpToStep = useCallback((stepName) => {
    const idx = steps.indexOf(stepName);
    if (idx !== -1) {
      setStepIndex(idx);
    }
  }, [steps]);

  // Finalize item object for voucher
  const getCompletedItem = useCallback(() => {
    const finalSize = isCustomSize ? (customSizeText.trim() || "Custom") : selectedSize;
    const catName = selectedCategory?.name || "Product";
    const subName = selectedSubtype ? ` - ${selectedSubtype}` : "";
    const itemName = `${catName}${subName}`;

    return {
      id: initialItem?.id || `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: itemName,
      category: selectedCategory?.name || null,
      categoryId: selectedCategory?.id || null,
      subtype: selectedSubtype || null,
      size: finalSize || null,
      quantity: calculationResult.quantity,
      unit: selectedCategory?.unit || "pcs",
      unitPrice: calculationResult.amountPerPiece,
      total: calculationResult.totalAmount,
      // Configurable snapshot data
      rate: calculationResult.rate,
      calculatedArea: calculationResult.calculatedMeasure,
      formula: calculationResult.formula,
      dimensions: {
        ...dimensionValues,
        unit: selectedCategory?.dimensions?.[0]?.unit || "inch",
      },
      snapshot: {
        categoryName: selectedCategory?.name,
        subtypeName: selectedSubtype,
        sizeName: finalSize,
        dimensions: { ...dimensionValues },
        formula: calculationResult.formula,
        formulaDisplay: calculationResult.formulaDisplay,
        calculationLabel: calculationResult.calculationLabel,
        calculatedMeasure: calculationResult.calculatedMeasure,
        unit: calculationResult.unit,
        rate: calculationResult.rate,
        rateLabel: calculationResult.rateLabel,
        amountPerPiece: calculationResult.amountPerPiece,
        quantity: calculationResult.quantity,
        totalAmount: calculationResult.totalAmount,
        savedAt: new Date().toISOString(),
      },
    };
  }, [
    isCustomSize,
    customSizeText,
    selectedSize,
    selectedCategory,
    selectedSubtype,
    initialItem,
    calculationResult,
    dimensionValues,
  ]);

  const handleFinish = useCallback(() => {
    if (onComplete) {
      onComplete(getCompletedItem());
    }
  }, [getCompletedItem, onComplete]);

  return {
    steps,
    stepIndex,
    currentStep,
    isFirstStep,
    isLastStep,
    selectedCategory,
    selectedSubtype,
    selectedSize,
    isCustomSize,
    customSizeText,
    setCustomSizeText,
    dimensionValues,
    rate,
    setRate,
    quantity,
    setQuantity,
    calculationResult,
    handleSelectCategory,
    handleSelectSubtype,
    handleSelectSize,
    handleUpdateDimension,
    goNext,
    goBack,
    jumpToStep,
    handleFinish,
    getCompletedItem,
  };
}
