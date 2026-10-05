"use client";

import { useState, useEffect, useMemo, useId } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calculator,
  Plus,
  Trash2,
  Check,
  Layers,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Loader2,
  RefreshCw,
  FolderPlus,
} from "lucide-react";
import { toast } from "sonner";
import { categoryService } from "@/services/category.service";
import { FormulaEvaluator } from "@/features/sale-voucher/engine/formula-evaluator";
import { placeholders } from "@/config/placeholders";

// Preset formula templates to help users quickly pick common business patterns
const FORMULA_PRESETS = [
  {
    id: "sqft_inch",
    name: "Area (Sq.Ft from inches)",
    formula: "(LENGTH * WIDTH) / 144",
    unit: "sq.ft",
    calculationLabel: "Square Feet",
    rateLabel: "Rate per sq.ft",
    description: "Standard area formula for plywood, glass, tiles, sheet metal in inches",
    dimensions: [
      { key: "length", label: "Length", unit: "inch", type: "NUMBER", required: true, defaultValue: 84, placeholder: "e.g. 84", sortOrder: 1 },
      { key: "width", label: "Width", unit: "inch", type: "NUMBER", required: true, defaultValue: 36, placeholder: "e.g. 36", sortOrder: 2 },
      { key: "quantity", label: "Quantity", unit: "piece", type: "NUMBER", required: true, defaultValue: 1, placeholder: "e.g. 1", sortOrder: 3 },
    ],
  },
  {
    id: "cft_inch",
    name: "Volume (Cubic Feet from inches)",
    formula: "(LENGTH * WIDTH * HEIGHT) / 1728",
    unit: "cft",
    calculationLabel: "Cubic Feet",
    rateLabel: "Rate per cft",
    description: "Volume formula for timber, logs, packaging, concrete in inches",
    dimensions: [
      { key: "length", label: "Length", unit: "inch", type: "NUMBER", required: true, defaultValue: 96, placeholder: "e.g. 96", sortOrder: 1 },
      { key: "width", label: "Width", unit: "inch", type: "NUMBER", required: true, defaultValue: 6, placeholder: "e.g. 6", sortOrder: 2 },
      { key: "height", label: "Height / Depth", unit: "inch", type: "NUMBER", required: true, defaultValue: 4, placeholder: "e.g. 4", sortOrder: 3 },
      { key: "quantity", label: "Quantity", unit: "piece", type: "NUMBER", required: true, defaultValue: 1, placeholder: "e.g. 1", sortOrder: 4 },
    ],
  },
  {
    id: "rft_inch",
    name: "Running Length (RFT from inches)",
    formula: "LENGTH / 12",
    unit: "rft",
    calculationLabel: "Running Feet",
    rateLabel: "Rate per rft",
    description: "Linear measurement for sections, pipes, railings, border mouldings",
    dimensions: [
      { key: "length", label: "Length", unit: "inch", type: "NUMBER", required: true, defaultValue: 120, placeholder: "e.g. 120", sortOrder: 1 },
      { key: "quantity", label: "Quantity", unit: "piece", type: "NUMBER", required: true, defaultValue: 1, placeholder: "e.g. 1", sortOrder: 2 },
    ],
  },
  {
    id: "direct_qty",
    name: "Direct Unit Pricing (Quantity × Rate)",
    formula: "QUANTITY * RATE",
    unit: "piece",
    calculationLabel: "Quantity",
    rateLabel: "Rate per item",
    description: "Standard per-item pricing for hardware, hinges, locks, ready products",
    dimensions: [
      { key: "quantity", label: "Quantity", unit: "piece", type: "NUMBER", required: true, defaultValue: 1, placeholder: "e.g. 1", sortOrder: 1 },
    ],
  },
  {
    id: "sqm_cm",
    name: "Metric Area (Sq.Meter from cm)",
    formula: "(LENGTH * WIDTH) / 10000",
    unit: "sq.m",
    calculationLabel: "Square Meters",
    rateLabel: "Rate per sq.m",
    description: "Metric area calculation from centimeters",
    dimensions: [
      { key: "length", label: "Length", unit: "cm", type: "NUMBER", required: true, defaultValue: 200, placeholder: "e.g. 200", sortOrder: 1 },
      { key: "width", label: "Width", unit: "cm", type: "NUMBER", required: true, defaultValue: 100, placeholder: "e.g. 100", sortOrder: 2 },
      { key: "quantity", label: "Quantity", unit: "piece", type: "NUMBER", required: true, defaultValue: 1, placeholder: "e.g. 1", sortOrder: 3 },
    ],
  },
  {
    id: "custom",
    name: "Custom Math Formula",
    formula: "(LENGTH * WIDTH) / 144",
    unit: "unit",
    calculationLabel: "Measure",
    rateLabel: "Rate per unit",
    description: "Enter any mathematical expression with operators (+, -, *, /) and dimensions",
    dimensions: [
      { key: "length", label: "Length", unit: "inch", type: "NUMBER", required: true, defaultValue: 10, placeholder: "e.g. 10", sortOrder: 1 },
      { key: "width", label: "Width", unit: "inch", type: "NUMBER", required: true, defaultValue: 10, placeholder: "e.g. 10", sortOrder: 2 },
      { key: "quantity", label: "Quantity", unit: "piece", type: "NUMBER", required: true, defaultValue: 1, placeholder: "e.g. 1", sortOrder: 3 },
    ],
  },
];

const QUICK_ICONS = ["🪵", "🪨", "📐", "🧱", "🪑", "📦", "⚙️", "🚪", "🪟", "🪞", "🔩", "🎨", "🔧", "🏷️"];

export function CategoryManagerDialog({
  isOpen,
  onClose,
  firmId,
  onCategoriesUpdated,
}) {
  const [activeTab, setActiveTab] = useState("list"); // "list" | "create"
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Form states
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📦");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("sq.ft");
  const [calculationLabel, setCalculationLabel] = useState("Square Feet");
  const [rateLabel, setRateLabel] = useState("Rate per sq.ft");
  const [selectedPresetId, setSelectedPresetId] = useState("sqft_inch");
  const [formula, setFormula] = useState("(LENGTH * WIDTH) / 144");
  const [hasSubtypes, setHasSubtypes] = useState(false);

  // Dimensions list: [{ key, label, unit, required, defaultValue }]
  const [dimensions, setDimensions] = useState([
    { key: "length", label: "Length", unit: "inch", type: "NUMBER", required: true, defaultValue: 84, placeholder: "e.g. 84", sortOrder: 1 },
    { key: "width", label: "Width", unit: "inch", type: "NUMBER", required: true, defaultValue: 36, placeholder: "e.g. 36", sortOrder: 2 },
    { key: "quantity", label: "Quantity", unit: "piece", type: "NUMBER", required: true, defaultValue: 1, placeholder: "e.g. 1", sortOrder: 3 },
  ]);

  // Subtypes list: [{ name, description, defaultRate }]
  const [subtypes, setSubtypes] = useState([
    { name: "", description: "", defaultRate: "" },
  ]);

  // Live Formula Simulator states
  const [testDimValues, setTestDimValues] = useState({ length: 84, width: 36, height: 4, quantity: 1 });
  const [testRate, setTestRate] = useState(250);

  // Load existing categories
  const loadCategories = async () => {
    if (!firmId) return;
    setLoading(true);
    try {
      const data = await categoryService.getAll(firmId);
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      setActiveTab("list");
    }
  }, [isOpen, firmId]);

  // Handle Preset selection
  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setFormula(preset.formula);
    setUnit(preset.unit);
    setCalculationLabel(preset.calculationLabel);
    setRateLabel(preset.rateLabel);
    setDimensions(preset.dimensions.map((d) => ({ ...d })));

    // Reset simulator defaults
    const newTestDims = {};
    preset.dimensions.forEach((d) => {
      newTestDims[d.key] = d.defaultValue || 1;
    });
    setTestDimValues(newTestDims);
  };

  // Live simulator evaluation
  const simulation = useMemo(() => {
    try {
      const mockCategory = {
        formula,
        calculationLabel,
        unit,
        rateLabel,
        dimensions,
        pricingRules: [{ formula, isActive: true, decimalPlaces: 2 }],
      };

      const result = FormulaEvaluator.calculatePricing({
        category: mockCategory,
        dimensions: testDimValues,
        rate: testRate,
        quantity: testDimValues.quantity || 1,
      });

      return {
        isValid: true,
        calculatedMeasure: result.calculatedMeasure,
        unit: result.unit,
        formulaDisplay: result.formulaDisplay,
        totalAmount: result.totalAmount,
        amountPerPiece: result.amountPerPiece,
        error: null,
      };
    } catch (err) {
      return {
        isValid: false,
        error: err.message || "Invalid formula expression",
      };
    }
  }, [formula, calculationLabel, unit, rateLabel, dimensions, testDimValues, testRate]);

  // Reset Form
  const resetForm = () => {
    setName("");
    setIcon("📦");
    setDescription("");
    handleSelectPreset(FORMULA_PRESETS[0]);
    setHasSubtypes(false);
    setSubtypes([{ name: "", description: "", defaultRate: "" }]);
  };

  // Add / Remove dimension
  const addDimension = () => {
    const nextIdx = dimensions.length + 1;
    setDimensions([
      ...dimensions,
      {
        key: `dim_${nextIdx}`,
        label: `Dimension ${nextIdx}`,
        unit: "inch",
        type: "NUMBER",
        required: true,
        defaultValue: 1,
        placeholder: "e.g. 10",
        sortOrder: nextIdx,
      },
    ]);
  };

  const removeDimension = (index) => {
    if (dimensions.length <= 1) {
      toast.error("Category must have at least one dimension");
      return;
    }
    const updated = dimensions.filter((_, i) => i !== index);
    setDimensions(updated);
  };

  const updateDimension = (index, field, value) => {
    const updated = [...dimensions];
    updated[index][field] = value;
    if (field === "label" && !updated[index].customKeySet) {
      // Auto-sanitize key from label
      updated[index].key = value.toLowerCase().replace(/[^a-z0-9_]/g, "_");
    }
    setDimensions(updated);
  };

  // Add / Remove subtype
  const addSubtype = () => {
    setSubtypes([...subtypes, { name: "", description: "", defaultRate: "" }]);
  };

  const removeSubtype = (index) => {
    setSubtypes(subtypes.filter((_, i) => i !== index));
  };

  const updateSubtype = (index, field, value) => {
    const updated = [...subtypes];
    updated[index][field] = value;
    setSubtypes(updated);
  };

  // Create Category
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }
    if (!formula.trim()) {
      toast.error("Formula expression is required");
      return;
    }

    setSubmitting(true);
    try {
      const cleanSubtypes = hasSubtypes
        ? subtypes
            .filter((s) => s.name && s.name.trim())
            .map((s, idx) => ({
              name: s.name.trim(),
              description: s.description?.trim() || null,
              defaultRate: s.defaultRate ? parseFloat(s.defaultRate) : null,
              sortOrder: idx + 1,
            }))
        : [];

      const cleanDimensions = dimensions.map((d, idx) => ({
        key: d.key.trim() || `dim_${idx + 1}`,
        label: d.label.trim() || `Dimension ${idx + 1}`,
        unit: d.unit?.trim() || null,
        type: "NUMBER",
        required: Boolean(d.required),
        defaultValue: d.defaultValue ? parseFloat(d.defaultValue) : 0,
        placeholder: d.placeholder || undefined,
        sortOrder: idx + 1,
      }));

      const payload = {
        name: name.trim(),
        icon: icon || "📦",
        description: description.trim() || null,
        hasSubtypes: Boolean(hasSubtypes && cleanSubtypes.length > 0),
        formula: formula.trim(),
        calculationLabel: calculationLabel.trim() || "Calculation",
        rateLabel: rateLabel.trim() || `Rate per ${unit}`,
        unit: unit.trim() || "unit",
        sortOrder: categories.length + 1,
        subtypes: cleanSubtypes,
        dimensions: cleanDimensions,
        pricingRules: [
          {
            name: `${name.trim()} Calculation`,
            formula: formula.trim(),
            formulaExplanation: `${calculationLabel} = ${formula.trim()}`,
            rounding: "ROUND_HALF_UP",
            decimalPlaces: 2,
            isActive: true,
          },
        ],
      };

      const created = await categoryService.create(firmId, payload);
      toast.success(`Category "${name}" created successfully!`);
      resetForm();
      setActiveTab("list");
      await loadCategories();
      if (onCategoriesUpdated) {
        onCategoriesUpdated();
      }
    } catch (err) {
      toast.error(err.message || "Failed to create category");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (id, catName) => {
    if (!confirm(`Are you sure you want to delete category "${catName}"?`)) return;
    setDeletingId(id);
    try {
      await categoryService.delete(firmId, id);
      toast.success(`Category "${catName}" deleted`);
      await loadCategories();
      if (onCategoriesUpdated) {
        onCategoriesUpdated();
      }
    } catch (err) {
      toast.error(err.message || "Failed to delete category");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl bg-card border-border/80 shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-6 pb-3 border-b border-border/60 bg-muted/20 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Calculator className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-bold text-foreground">
                  Categories & Formula Engine
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Define your custom catalog categories, measurements, dimensional formulas, and pricing rules.
                </DialogDescription>
              </div>
            </div>

            {/* Tab switch buttons */}
            <div className="flex items-center rounded-xl bg-muted/60 p-1 border border-border/50 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("list")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "list"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Categories ({categories.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setActiveTab("create");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  activeTab === "create"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Category
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeTab === "list" ? (
            /* --- CATEGORIES LIST VIEW --- */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Configured Catalog Categories</h3>
                  <p className="text-xs text-muted-foreground">
                    Custom business categories created for your firm.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadCategories}
                  disabled={loading}
                  className="h-8 text-xs gap-1.5 rounded-lg"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>

              {loading ? (
                <div className="space-y-3 pt-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 rounded-xl bg-muted/30 animate-pulse border border-border/40" />
                  ))}
                </div>
              ) : categories.length === 0 ? (
                <div className="py-12 px-6 text-center rounded-2xl border-2 border-dashed border-border/80 bg-muted/10 space-y-3">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <FolderPlus className="h-6 w-6" />
                  </div>
                  <h4 className="text-base font-bold text-foreground">No Categories Configured Yet</h4>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    All default presets have been cleared. You can now create custom categories tailored to your specific business with custom formulas, dimensions, and units.
                  </p>
                  <Button
                    onClick={() => {
                      resetForm();
                      setActiveTab("create");
                    }}
                    className="gap-2 text-xs font-semibold h-9 rounded-xl shadow-md shadow-primary/20"
                  >
                    <Plus className="h-4 w-4" />
                    Create Your First Category
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {categories.map((cat) => (
                    <Card
                      key={cat.id}
                      className="border border-border/70 hover:border-primary/50 transition-all rounded-xl shadow-xs overflow-hidden"
                    >
                      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5 min-w-0">
                          <span className="text-3xl p-2 rounded-xl bg-muted/50 border border-border/50 shrink-0">
                            {cat.icon || "📦"}
                          </span>
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-base text-foreground truncate">{cat.name}</h4>
                              <Badge variant="outline" className="text-[11px] font-mono font-medium">
                                {cat.unit}
                              </Badge>
                              {cat.calculationLabel && (
                                <Badge variant="secondary" className="text-[11px] font-normal">
                                  {cat.calculationLabel}
                                </Badge>
                              )}
                            </div>

                            {cat.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {cat.description}
                              </p>
                            )}

                            {/* Formula & Dimensions Badges */}
                            <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px]">
                              <span className="font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                                Formula: {cat.formula}
                              </span>
                              {cat.dimensions?.length > 0 && (
                                <span className="text-muted-foreground">
                                  Dimensions: {cat.dimensions.map((d) => d.label).join(", ")}
                                </span>
                              )}
                              {cat.subtypes?.length > 0 && (
                                <span className="text-muted-foreground">
                                  • {cat.subtypes.length} varieties
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={deletingId === cat.id}
                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                            className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg text-xs gap-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* --- CREATE CATEGORY & FORMULA BUILDER --- */
            <form onSubmit={handleCreateCategory} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs">1</span>
                  Basic Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  {/* Icon Selector */}
                  <div className="sm:col-span-3 space-y-1.5">
                    <Label className="text-xs font-semibold">Icon</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={icon}
                        onChange={(e) => setIcon(e.target.value)}
                        className="text-center text-2xl h-11 w-16 shrink-0"
                        maxLength={4}
                      />
                      <div className="flex flex-wrap gap-1 max-w-[140px]">
                        {QUICK_ICONS.slice(0, 6).map((ic) => (
                          <button
                            key={ic}
                            type="button"
                            onClick={() => setIcon(ic)}
                            className="h-6 w-6 text-sm hover:scale-110 active:scale-95 transition-all"
                          >
                            {ic}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Category Name */}
                  <div className="sm:col-span-9 space-y-1.5">
                    <Label htmlFor="cat_name" className="text-xs font-semibold">
                      Category Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="cat_name"
                      placeholder={placeholders.categories?.name || "e.g. Plywood & Boards"}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="h-11 font-medium"
                    />
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-12 space-y-1.5">
                    <Label htmlFor="cat_desc" className="text-xs font-semibold">
                      Description (Optional)
                    </Label>
                    <Input
                      id="cat_desc"
                      placeholder={placeholders.categories?.description || "e.g. Commercial & Waterproof Sheets"}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="h-10 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Units & Labels */}
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs">2</span>
                  Unit & Calculation Labels
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Standard Unit</Label>
                    <Input
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder={placeholders.categories?.unit || "e.g. sq.ft, cft, rft, piece"}
                      className="h-10 text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Calculation Label</Label>
                    <Input
                      value={calculationLabel}
                      onChange={(e) => setCalculationLabel(e.target.value)}
                      placeholder={placeholders.categories?.calculationLabel || "e.g. Square Feet"}
                      className="h-10 text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Rate Label</Label>
                    <Input
                      value={rateLabel}
                      onChange={(e) => setRateLabel(e.target.value)}
                      placeholder={placeholders.categories?.rateLabel || `Rate per ${unit}`}
                      className="h-10 text-xs"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Formula Configuration & Simulator */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs">3</span>
                    Formula Option & Calculation Engine
                  </h3>
                  <Badge variant="outline" className="text-[10px] font-mono text-primary bg-primary/5">
                    Live Safe Evaluator
                  </Badge>
                </div>

                {/* Preset Formula Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {FORMULA_PRESETS.map((preset) => {
                    const isSelected = selectedPresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "border-primary bg-primary/10 ring-1 ring-primary/40 shadow-xs"
                            : "border-border/70 bg-card hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-foreground truncate">{preset.name}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                        </div>
                        <p className="font-mono text-[11px] text-primary/80 mt-1 truncate">{preset.formula}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{preset.description}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Editable Formula Expression */}
                <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-2">
                  <Label htmlFor="formula_expr" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <span>Mathematical Formula Expression</span>
                    <span className="text-[11px] font-normal text-muted-foreground">
                      (Use variables matching dimension keys e.g. LENGTH, WIDTH, HEIGHT, QUANTITY, RATE)
                    </span>
                  </Label>
                  <Input
                    id="formula_expr"
                    value={formula}
                    onChange={(e) => {
                      setFormula(e.target.value);
                      setSelectedPresetId("custom");
                    }}
                    className="h-11 font-mono text-sm font-semibold bg-background border-border/80"
                    placeholder="e.g. (LENGTH * WIDTH) / 144"
                    required
                  />

                  {/* Live Formula Simulation Card */}
                  <div className="pt-2">
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-foreground">
                        <span className="flex items-center gap-1.5 text-primary">
                          <Sparkles className="h-3.5 w-3.5" />
                          Live Formula Simulator
                        </span>
                        {simulation.isValid ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                            <Check className="h-3 w-3 stroke-[3]" /> Formula Valid
                          </span>
                        ) : (
                          <span className="text-destructive font-mono text-[11px] flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> Formula Error
                          </span>
                        )}
                      </div>

                      {/* Simulator Test Inputs */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {dimensions.map((dim) => (
                          <div key={dim.key} className="flex items-center gap-1 bg-background/80 px-2 py-1 rounded-lg border border-border/60 text-xs">
                            <span className="text-muted-foreground capitalize font-medium">{dim.label}:</span>
                            <input
                              type="number"
                              value={testDimValues[dim.key] !== undefined ? testDimValues[dim.key] : dim.defaultValue || 1}
                              onChange={(e) => setTestDimValues({ ...testDimValues, [dim.key]: parseFloat(e.target.value) || 0 })}
                              className="w-14 font-mono font-bold bg-transparent outline-none text-foreground"
                            />
                            {dim.unit && <span className="text-[10px] text-muted-foreground uppercase">{dim.unit}</span>}
                          </div>
                        ))}

                        <div className="flex items-center gap-1 bg-background/80 px-2 py-1 rounded-lg border border-border/60 text-xs">
                          <span className="text-muted-foreground font-medium">Rate (₹):</span>
                          <input
                            type="number"
                            value={testRate}
                            onChange={(e) => setTestRate(parseFloat(e.target.value) || 0)}
                            className="w-16 font-mono font-bold bg-transparent outline-none text-foreground"
                          />
                        </div>
                      </div>

                      {/* Simulator Output */}
                      {simulation.isValid ? (
                        <div className="flex items-center justify-between pt-1 border-t border-primary/10 text-xs">
                          <div className="text-muted-foreground">
                            <span>Evaluates to: </span>
                            <span className="font-mono font-bold text-foreground">
                              {simulation.calculatedMeasure} {simulation.unit}
                            </span>
                            {simulation.formulaDisplay && (
                              <span className="ml-2 text-[11px] font-mono text-muted-foreground">
                                ({simulation.formulaDisplay})
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-muted-foreground mr-1.5">Amount:</span>
                            <span className="font-mono font-bold text-primary text-sm">
                              ₹{simulation.totalAmount.toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-destructive pt-1">{simulation.error}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Dimensions Builder */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs">4</span>
                    Product Dimensions
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addDimension}
                    className="h-8 text-xs gap-1 rounded-lg"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Dimension
                  </Button>
                </div>

                <div className="space-y-2">
                  {dimensions.map((dim, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-border/70 bg-card grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
                    >
                      <div className="sm:col-span-4 space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Label</Label>
                        <Input
                          value={dim.label}
                          onChange={(e) => updateDimension(idx, "label", e.target.value)}
                          placeholder="e.g. Length"
                          className="h-9 text-xs font-semibold"
                          required
                        />
                      </div>

                      <div className="sm:col-span-3 space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Formula Key</Label>
                        <Input
                          value={dim.key}
                          onChange={(e) => {
                            const updated = [...dimensions];
                            updated[idx].key = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_");
                            updated[idx].customKeySet = true;
                            setDimensions(updated);
                          }}
                          placeholder="e.g. length"
                          className="h-9 text-xs font-mono"
                          required
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Unit</Label>
                        <Input
                          value={dim.unit || ""}
                          onChange={(e) => updateDimension(idx, "unit", e.target.value)}
                          placeholder="e.g. inch"
                          className="h-9 text-xs"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Default</Label>
                        <Input
                          type="number"
                          value={dim.defaultValue ?? ""}
                          onChange={(e) => updateDimension(idx, "defaultValue", e.target.value)}
                          placeholder="e.g. 84"
                          className="h-9 text-xs font-mono"
                        />
                      </div>

                      <div className="sm:col-span-1 flex justify-end pt-4 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => removeDimension(idx)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive flex items-center justify-center rounded-lg hover:bg-destructive/10 transition-colors"
                          title="Remove dimension"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Optional Subtypes / Varieties */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/70 bg-muted/20">
                  <div className="space-y-0.5">
                    <Label htmlFor="subtypes_toggle" className="text-xs font-bold text-foreground cursor-pointer">
                      Has Varieties / Grades / Subtypes?
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Enable if this category comes in different variants with different base rates (e.g. 18mm Commercial vs 19mm BWP)
                    </p>
                  </div>
                  <Switch
                    id="subtypes_toggle"
                    checked={hasSubtypes}
                    onCheckedChange={setHasSubtypes}
                  />
                </div>

                {hasSubtypes && (
                  <div className="space-y-2.5 pl-2 border-l-2 border-primary/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">Configured Varieties</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addSubtype}
                        className="h-7 text-[11px] gap-1 rounded-lg"
                      >
                        <Plus className="h-3 w-3" />
                        Add Variety
                      </Button>
                    </div>

                    {subtypes.map((sub, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          placeholder="Variety Name (e.g. 18mm Commercial)"
                          value={sub.name}
                          onChange={(e) => updateSubtype(idx, "name", e.target.value)}
                          className="h-9 text-xs flex-1"
                        />
                        <Input
                          type="number"
                          placeholder="Rate ₹"
                          value={sub.defaultRate}
                          onChange={(e) => updateSubtype(idx, "defaultRate", e.target.value)}
                          className="h-9 text-xs w-28 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => removeSubtype(idx)}
                          className="h-9 w-9 text-muted-foreground hover:text-destructive flex items-center justify-center rounded-lg hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="pt-4 border-t border-border/60 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab("list")}
                  className="h-10 text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-10 text-xs font-semibold rounded-xl gap-2 shadow-md shadow-primary/20"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving Category…
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Save & Activate Category
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
