"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Scale, Calculator, Maximize2, Layers, Box, DollarSign,
  Copy, Printer, ArrowRightLeft, Sparkles, Plus, Trash2, Trees
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

// Unit conversion factors to millimeters (base unit)
const UNIT_TO_MM = {
  mm: 1,
  cm: 10,
  m: 1000,
  km: 1000000,
  in: 25.4,
  ft: 304.8,
  yd: 914.4,
};

// Common scale presets
const SCALE_PRESETS = [
  { label: "1:1 (Full Size / True Scale)", ratio: "1:1", factor: 1 },
  { label: "1:2 (Half Scale)", ratio: "1:2", factor: 0.5 },
  { label: "1:5 (Drafting)", ratio: "1:5", factor: 0.2 },
  { label: "1:10 (Architectural Detail)", ratio: "1:10", factor: 0.1 },
  { label: "1:20 (Room Layout)", ratio: "1:20", factor: 0.05 },
  { label: "1:25 (Interior Scale)", ratio: "1:25", factor: 0.04 },
  { label: "1:50 (Floor Plan / Building)", ratio: "1:50", factor: 0.02 },
  { label: "1:100 (Site / Architectural Plan)", ratio: "1:100", factor: 0.01 },
  { label: "1:200 (Large Site Plan)", ratio: "1:200", factor: 0.005 },
  { label: "1:500 (Master Plan)", ratio: "1:500", factor: 0.002 },
  { label: "1:12 (Dollhouse / Prototyping)", ratio: "1:12", factor: 1 / 12 },
  { label: "1:24 (Automotive / Product Model)", ratio: "1:24", factor: 1 / 24 },
  { label: "1:48 (Quarter-Inch / Aircraft)", ratio: "1:48", factor: 1 / 48 },
  { label: "1:72 (Scale Miniature)", ratio: "1:72", factor: 1 / 72 },
  { label: "1:87 (HO Scale)", ratio: "1:87", factor: 1 / 87 },
  { label: "2:1 (Double Size / 2x Magnification)", ratio: "2:1", factor: 2 },
  { label: "5:1 (5x Magnification)", ratio: "5:1", factor: 5 },
  { label: "10:1 (10x Component Detail)", ratio: "10:1", factor: 10 },
  { label: "Custom Ratio (X : Y)", ratio: "custom", factor: null },
  { label: "Percentage (%) Scale", ratio: "percentage", factor: null },
];

export default function OmniScalePage() {
  const [activeTab, setActiveTab] = useState("cft");

  // ──────────────────────────────────────────────
  // Cubic Feet (CFT) Calculator State
  // ──────────────────────────────────────────────
  const [volumeMode, setVolumeMode] = useState("sawn"); // "sawn" | "round" | "tally"

  // Sawn Timber / Planks inputs
  const [sawnLengthFt, setSawnLengthFt] = useState("10");
  const [sawnWidthIn, setSawnWidthIn] = useState("6");
  const [sawnThicknessIn, setSawnThicknessIn] = useState("2");
  const [sawnQuantity, setSawnQuantity] = useState("1");
  const [sawnRatePerCft, setSawnRatePerCft] = useState("1800");

  // Round Log inputs
  const [roundLengthFt, setRoundLengthFt] = useState("12");
  const [roundGirthIn, setRoundGirthIn] = useState("36"); // Perimeter in inches
  const [roundQuantity, setRoundQuantity] = useState("1");
  const [roundRatePerCft, setRoundRatePerCft] = useState("1500");

  // Multi-Item Measurement Tally Sheet
  const [tallyRows, setTallyRows] = useState([
    { id: 1, name: "Teak Wood Plank", lengthFt: 10, widthIn: 5, thickIn: 2, qty: 25, ratePerCft: 1800 },
    { id: 2, name: "Pine Wood Batten", lengthFt: 8, widthIn: 3, thickIn: 1.5, qty: 50, ratePerCft: 1200 },
    { id: 3, name: "Sal Wood Rafter", lengthFt: 12, widthIn: 6, thickIn: 3, qty: 10, ratePerCft: 2200 },
  ]);

  // Sawn Volume Calculation: (Length_ft * Width_in * Thick_in) / 144 * Qty
  const sawnCalculations = useMemo(() => {
    const l = parseFloat(sawnLengthFt) || 0;
    const w = parseFloat(sawnWidthIn) || 0;
    const t = parseFloat(sawnThicknessIn) || 0;
    const q = parseFloat(sawnQuantity) || 1;
    const rate = parseFloat(sawnRatePerCft) || 0;

    const cftPerPiece = (l * w * t) / 144;
    const totalCft = cftPerPiece * q;
    const totalAmount = totalCft * rate;
    const totalSqFt = (l * (w / 12)) * q; // Surface area in sq.ft

    return {
      cftPerPiece,
      totalCft,
      totalAmount,
      totalSqFt,
    };
  }, [sawnLengthFt, sawnWidthIn, sawnThicknessIn, sawnQuantity, sawnRatePerCft]);

  // Round Log Volume Calculation (Quarter Girth Formula / Hoppus Rule): ((Girth/4)^2 * Length) / 144 * Qty = (Girth^2 * Length) / 2304 * Qty
  const roundCalculations = useMemo(() => {
    const l = parseFloat(roundLengthFt) || 0;
    const g = parseFloat(roundGirthIn) || 0;
    const q = parseFloat(roundQuantity) || 1;
    const rate = parseFloat(roundRatePerCft) || 0;

    const cftPerLog = ((g / 4) * (g / 4) * l) / 144; // or (g * g * l) / 2304
    const totalCft = cftPerLog * q;
    const totalAmount = totalCft * rate;

    return {
      cftPerLog,
      totalCft,
      totalAmount,
    };
  }, [roundLengthFt, roundGirthIn, roundQuantity, roundRatePerCft]);

  // Multi-Item Tally Calculation
  const tallySummary = useMemo(() => {
    let totalPieces = 0;
    let totalCft = 0;
    let totalAmount = 0;

    const rowsWithComputed = tallyRows.map((row) => {
      const l = parseFloat(row.lengthFt) || 0;
      const w = parseFloat(row.widthIn) || 0;
      const t = parseFloat(row.thickIn) || 0;
      const q = parseFloat(row.qty) || 1;
      const rate = parseFloat(row.ratePerCft) || 0;

      const cftPerPiece = (l * w * t) / 144;
      const rowCft = cftPerPiece * q;
      const rowTotal = rowCft * rate;

      totalPieces += q;
      totalCft += rowCft;
      totalAmount += rowTotal;

      return {
        ...row,
        cftPerPiece,
        rowCft,
        rowTotal,
      };
    });

    return {
      rows: rowsWithComputed,
      totalPieces,
      totalCft,
      totalAmount,
    };
  }, [tallyRows]);

  const updateTallyRow = (index, field, value) => {
    const updated = [...tallyRows];
    updated[index][field] = value;
    setTallyRows(updated);
  };

  const addTallyRow = () => {
    setTallyRows([
      ...tallyRows,
      { id: Date.now(), name: "Timber Item", lengthFt: 10, widthIn: 4, thickIn: 2, qty: 10, ratePerCft: 1800 },
    ]);
  };

  const removeTallyRow = (index) => {
    if (tallyRows.length === 1) {
      toast.info("Tally sheet requires at least one row.");
      return;
    }
    setTallyRows(tallyRows.filter((_, i) => i !== index));
  };

  // ──────────────────────────────────────────────
  // Dimension & Scale Ratio State
  // ──────────────────────────────────────────────
  const [direction, setDirection] = useState("real-to-scaled");
  const [selectedPreset, setSelectedPreset] = useState("1:50");
  const [customRealRatio, setCustomRealRatio] = useState("1");
  const [customScaledRatio, setCustomScaledRatio] = useState("50");
  const [percentageInput, setPercentageInput] = useState("50");

  const [realLength, setRealLength] = useState("10");
  const [realWidth, setRealWidth] = useState("5");
  const [realHeight, setRealHeight] = useState("3");
  const [inputUnit, setInputUnit] = useState("m");
  const [outputUnit, setOutputUnit] = useState("cm");

  // 2D Area & 3D Volume/Weight State
  const [weightInput, setWeightInput] = useState("150");
  const [weightUnit, setWeightUnit] = useState("kg");

  // Production Cost State
  const [prototypeQty, setPrototypeQty] = useState("1");
  const [prototypeCost, setPrototypeCost] = useState("5000");
  const [productionQty, setProductionQty] = useState("500");
  const [efficiencyDiscount, setEfficiencyDiscount] = useState("25");

  const scaleFactor = useMemo(() => {
    if (selectedPreset === "percentage") {
      const p = parseFloat(percentageInput) || 100;
      return p / 100;
    }
    if (selectedPreset === "custom") {
      const r = parseFloat(customRealRatio) || 1;
      const s = parseFloat(customScaledRatio) || 1;
      return s > 0 ? r / s : 1;
    }
    const match = SCALE_PRESETS.find((p) => p.ratio === selectedPreset);
    return match?.factor || 0.02;
  }, [selectedPreset, percentageInput, customRealRatio, customScaledRatio]);

  const calculations = useMemo(() => {
    const l = parseFloat(realLength) || 0;
    const w = parseFloat(realWidth) || 0;
    const h = parseFloat(realHeight) || 0;

    const inFactor = UNIT_TO_MM[inputUnit] || 1000;
    const outFactor = UNIT_TO_MM[outputUnit] || 10;

    const l_mm = l * inFactor;
    const w_mm = w * inFactor;
    const h_mm = h * inFactor;

    let scaled_l_mm, scaled_w_mm, scaled_h_mm;
    let actual_l_mm, actual_w_mm, actual_h_mm;

    if (direction === "real-to-scaled") {
      scaled_l_mm = l_mm * scaleFactor;
      scaled_w_mm = w_mm * scaleFactor;
      scaled_h_mm = h_mm * scaleFactor;
      actual_l_mm = l_mm;
      actual_w_mm = w_mm;
      actual_h_mm = h_mm;
    } else {
      actual_l_mm = scaleFactor > 0 ? l_mm / scaleFactor : 0;
      actual_w_mm = scaleFactor > 0 ? w_mm / scaleFactor : 0;
      actual_h_mm = scaleFactor > 0 ? h_mm / scaleFactor : 0;
      scaled_l_mm = l_mm;
      scaled_w_mm = w_mm;
      scaled_h_mm = h_mm;
    }

    const finalScaledL = scaled_l_mm / outFactor;
    const finalScaledW = scaled_w_mm / outFactor;
    const finalScaledH = scaled_h_mm / outFactor;

    const realAreaM2 = (actual_l_mm / 1000) * (actual_w_mm / 1000);
    const scaledAreaM2 = (scaled_l_mm / 1000) * (scaled_w_mm / 1000);
    const areaScaleFactor = scaleFactor * scaleFactor;

    const realVolumeM3 = (actual_l_mm / 1000) * (actual_w_mm / 1000) * (actual_h_mm / 1000);
    const scaledVolumeM3 = (scaled_l_mm / 1000) * (scaled_w_mm / 1000) * (scaled_h_mm / 1000);
    const volumeScaleFactor = scaleFactor * scaleFactor * scaleFactor;

    const rawWeight = parseFloat(weightInput) || 0;
    const scaledWeight = direction === "real-to-scaled"
      ? rawWeight * volumeScaleFactor
      : (volumeScaleFactor > 0 ? rawWeight / volumeScaleFactor : 0);

    return {
      finalScaledL,
      finalScaledW,
      finalScaledH,
      realAreaM2,
      scaledAreaM2,
      areaScaleFactor,
      realVolumeM3,
      scaledVolumeM3,
      volumeScaleFactor,
      scaledWeight,
    };
  }, [realLength, realWidth, realHeight, inputUnit, outputUnit, direction, scaleFactor, weightInput]);

  const costCalculations = useMemo(() => {
    const protoQ = parseFloat(prototypeQty) || 1;
    const protoC = parseFloat(prototypeCost) || 0;
    const prodQ = parseFloat(productionQty) || 1;
    const disc = parseFloat(efficiencyDiscount) || 0;

    const protoUnitCost = protoQ > 0 ? protoC / protoQ : 0;
    const scaledUnitCost = protoUnitCost * (1 - disc / 100);
    const totalProdCost = scaledUnitCost * prodQ;
    const unscaledProdCost = protoUnitCost * prodQ;
    const totalSavings = Math.max(0, unscaledProdCost - totalProdCost);

    return {
      protoUnitCost,
      scaledUnitCost,
      totalProdCost,
      unscaledProdCost,
      totalSavings,
    };
  }, [prototypeQty, prototypeCost, productionQty, efficiencyDiscount]);

  const handleCopySummary = () => {
    let text = "";
    if (volumeMode === "sawn") {
      text = `--- Volume (CFT) Calculation ---
Type: Sawn Timber / Planks
Dimensions: ${sawnLengthFt} ft (L) x ${sawnWidthIn} in (W) x ${sawnThicknessIn} in (T)
Quantity: ${sawnQuantity} Pcs
CFT per piece: ${sawnCalculations.cftPerPiece.toFixed(4)} CFT
Total Volume (CFT): ${sawnCalculations.totalCft.toFixed(3)} CFT
Total Surface Area: ${sawnCalculations.totalSqFt.toFixed(2)} Sq.Ft
Rate: ₹${sawnRatePerCft}/CFT
Total Amount: ${formatCurrency(sawnCalculations.totalAmount)}`;
    } else if (volumeMode === "round") {
      text = `--- Volume (CFT) Calculation ---
Type: Round Log - Quarter Girth Rule
Dimensions: Length ${roundLengthFt} ft | Girth ${roundGirthIn} in
Quantity: ${roundQuantity} Logs
CFT per Log: ${roundCalculations.cftPerLog.toFixed(4)} CFT
Total Volume (CFT): ${roundCalculations.totalCft.toFixed(3)} CFT
Rate: ₹${roundRatePerCft}/CFT
Total Value: ${formatCurrency(roundCalculations.totalAmount)}`;
    } else {
      text = `--- Multi-Item Measurement Tally Sheet ---
Total Items: ${tallyRows.length} | Total Pieces: ${tallySummary.totalPieces}
Total Volume (CFT): ${tallySummary.totalCft.toFixed(3)} CFT
Total Amount: ${formatCurrency(tallySummary.totalAmount)}
Generated on: ${new Date().toLocaleString()}`;
    }

    navigator.clipboard.writeText(text);
    toast.success("Measurement calculation copied to clipboard!");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Omni Scale Calculator"
        description="Universal Cubic Feet (CFT) measurement, architectural ratio scaling, and batch production calculator"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Omni Scale" }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopySummary} className="gap-1.5 text-xs">
              <Copy className="h-3.5 w-3.5" /> Copy Summary
            </Button>
            <Button size="sm" onClick={handlePrint} className="gap-1.5 text-xs">
              <Printer className="h-3.5 w-3.5" /> Print Sheet
            </Button>
          </div>
        }
      />

      {/* Main Mode Selector Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full sm:w-[640px] h-auto p-1 gap-1">
          <TabsTrigger value="cft" className="gap-1.5 py-2 text-xs">
            <Box className="h-4 w-4 text-emerald-600" /> Cubic Feet (CFT)
          </TabsTrigger>
          <TabsTrigger value="dimensions" className="gap-1.5 py-2 text-xs">
            <Maximize2 className="h-4 w-4" /> Dimensions & Ratio
          </TabsTrigger>
          <TabsTrigger value="area-volume" className="gap-1.5 py-2 text-xs">
            <Layers className="h-4 w-4" /> 2D Area & 3D Weight
          </TabsTrigger>
          <TabsTrigger value="production" className="gap-1.5 py-2 text-xs">
            <DollarSign className="h-4 w-4" /> Batch Cost Scaler
          </TabsTrigger>
        </TabsList>

        {/* ────────────────────────────────────────────── */}
        {/* Tab 1: Cubic Feet (CFT) Calculator */}
        {/* ────────────────────────────────────────────── */}
        <TabsContent value="cft" className="space-y-6 mt-4">
          {/* Sub-modes for Volume */}
          <div className="flex flex-wrap gap-2 border-b pb-3">
            <Button
              size="sm"
              variant={volumeMode === "sawn" ? "default" : "outline"}
              onClick={() => setVolumeMode("sawn")}
              className="text-xs gap-1.5"
            >
              <Box className="h-3.5 w-3.5" /> Sawn Planks / Slabs
            </Button>
            <Button
              size="sm"
              variant={volumeMode === "round" ? "default" : "outline"}
              onClick={() => setVolumeMode("round")}
              className="text-xs gap-1.5"
            >
              <Trees className="h-3.5 w-3.5" /> Round Log
            </Button>
            <Button
              size="sm"
              variant={volumeMode === "tally" ? "default" : "outline"}
              onClick={() => setVolumeMode("tally")}
              className="text-xs gap-1.5"
            >
              <Layers className="h-3.5 w-3.5" /> Multi-Item Tally Sheet
            </Button>
          </div>

          {/* Mode 1: Sawn Timber / Planks */}
          {volumeMode === "sawn" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 border rounded-2xl p-5 bg-card space-y-4 shadow-xs">
                <div className="flex items-center gap-2 border-b pb-3">
                  <Box className="h-5 w-5 text-emerald-600" />
                  <div>
                    <h3 className="font-semibold text-base">Sawn Timber / Plank Volume (CFT)</h3>
                    <p className="text-xs text-muted-foreground">
                      Formula: <code>(Length in Feet × Width in Inches × Thickness in Inches) ÷ 144</code>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Length (Feet)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={sawnLengthFt}
                      onChange={(e) => setSawnLengthFt(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Width (Inches)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={sawnWidthIn}
                      onChange={(e) => setSawnWidthIn(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Thickness (Inches)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={sawnThicknessIn}
                      onChange={(e) => setSawnThicknessIn(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                  <div className="space-y-1">
                    <Label className="text-xs">Quantity (Pieces / Pcs)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={sawnQuantity}
                      onChange={(e) => setSawnQuantity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Rate per CFT (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={sawnRatePerCft}
                      onChange={(e) => setSawnRatePerCft(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Sawn Volume Output Card */}
              <div className="lg:col-span-5 space-y-4">
                <div className="border rounded-2xl p-5 bg-emerald-500/10 border-emerald-500/20 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-emerald-600" />
                      <h3 className="font-bold text-base text-emerald-700 dark:text-emerald-400">Total Volume Output</h3>
                    </div>
                    <Badge className="bg-emerald-600 text-white font-mono text-xs">
                      {sawnQuantity} Pcs
                    </Badge>
                  </div>

                  <div className="text-center py-2 border rounded-xl bg-background">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Total Volume (CFT)</span>
                    <p className="text-3xl font-mono font-bold text-emerald-600 mt-1">
                      {sawnCalculations.totalCft.toFixed(3)}
                    </p>
                    <span className="text-xs text-muted-foreground">Cubic Feet (CFT)</span>
                  </div>

                  <div className="space-y-2 border rounded-xl p-3 bg-background text-xs">
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">Volume Per Piece:</span>
                      <span className="font-mono font-semibold">{sawnCalculations.cftPerPiece.toFixed(4)} CFT</span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">Total Surface Area:</span>
                      <span className="font-mono font-semibold">{sawnCalculations.totalSqFt.toFixed(2)} Sq.Ft</span>
                    </div>
                    <div className="flex justify-between py-1 font-bold text-sm text-foreground">
                      <span>Total Billing Amount:</span>
                      <span className="font-mono text-emerald-600">{formatCurrency(sawnCalculations.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mode 2: Round Log */}
          {volumeMode === "round" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 border rounded-2xl p-5 bg-card space-y-4 shadow-xs">
                <div className="flex items-center gap-2 border-b pb-3">
                  <Trees className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-semibold text-base">Round Log - Quarter Girth Rule</h3>
                    <p className="text-xs text-muted-foreground">
                      Formula: <code>((Girth ÷ 4)² × Length in Feet) ÷ 144 = (Girth² × Length) ÷ 2304</code>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Log Length (Feet)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={roundLengthFt}
                      onChange={(e) => setRoundLengthFt(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Girth / Perimeter (Inches)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={roundGirthIn}
                      onChange={(e) => setRoundGirthIn(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                  <div className="space-y-1">
                    <Label className="text-xs">Quantity (Logs)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={roundQuantity}
                      onChange={(e) => setRoundQuantity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Rate per CFT (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={roundRatePerCft}
                      onChange={(e) => setRoundRatePerCft(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Round Log Output Card */}
              <div className="lg:col-span-5 space-y-4">
                <div className="border rounded-2xl p-5 bg-primary/5 border-primary/20 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between border-b border-primary/20 pb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <h3 className="font-bold text-base text-primary">Round Log Volume Output</h3>
                    </div>
                    <Badge variant="outline" className="bg-background text-xs font-mono">
                      {roundQuantity} Logs
                    </Badge>
                  </div>

                  <div className="text-center py-2 border rounded-xl bg-background">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Total Volume (CFT)</span>
                    <p className="text-3xl font-mono font-bold text-primary mt-1">
                      {roundCalculations.totalCft.toFixed(3)}
                    </p>
                    <span className="text-xs text-muted-foreground">Hoppus Cubic Feet (CFT)</span>
                  </div>

                  <div className="space-y-2 border rounded-xl p-3 bg-background text-xs">
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">Volume Per Log:</span>
                      <span className="font-mono font-semibold">{roundCalculations.cftPerLog.toFixed(4)} CFT</span>
                    </div>
                    <div className="flex justify-between py-1 font-bold text-sm text-foreground">
                      <span>Total Log Value:</span>
                      <span className="font-mono text-primary">{formatCurrency(roundCalculations.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mode 3: Multi-Item Measurement Tally Sheet */}
          {volumeMode === "tally" && (
            <div className="border rounded-2xl p-5 bg-card space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-semibold text-base">Multi-Item Measurement Tally Sheet</h3>
                    <p className="text-xs text-muted-foreground">Itemized measurement table with automatic CFT volume and line amount calculation.</p>
                  </div>
                </div>
                <Button size="sm" onClick={addTallyRow} className="gap-1.5 text-xs">
                  <Plus className="h-4 w-4" /> Add Row
                </Button>
              </div>

              <div className="border rounded-xl overflow-x-auto bg-background">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted uppercase text-[11px] font-semibold text-muted-foreground border-b">
                    <tr>
                      <th className="p-3 w-10 text-center">#</th>
                      <th className="p-3 min-w-[160px]">Description / Type</th>
                      <th className="p-3 w-24">Length (ft)</th>
                      <th className="p-3 w-24">Width (in)</th>
                      <th className="p-3 w-24">Thick (in)</th>
                      <th className="p-3 w-20">Qty</th>
                      <th className="p-3 w-28">Volume (CFT)</th>
                      <th className="p-3 w-28">Rate (₹/CFT)</th>
                      <th className="p-3 w-32 text-right">Line Total (₹)</th>
                      <th className="p-3 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {tallySummary.rows.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-muted/30">
                        <td className="p-3 text-center text-muted-foreground font-mono text-xs">{idx + 1}</td>
                        <td className="p-3">
                          <Input
                            value={row.name}
                            onChange={(e) => updateTallyRow(idx, "name", e.target.value)}
                            placeholder="Item name"
                            className="h-8 text-xs"
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            step="0.01"
                            value={row.lengthFt}
                            onChange={(e) => updateTallyRow(idx, "lengthFt", e.target.value)}
                            className="h-8 text-xs font-mono"
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            step="0.01"
                            value={row.widthIn}
                            onChange={(e) => updateTallyRow(idx, "widthIn", e.target.value)}
                            className="h-8 text-xs font-mono"
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            step="0.01"
                            value={row.thickIn}
                            onChange={(e) => updateTallyRow(idx, "thickIn", e.target.value)}
                            className="h-8 text-xs font-mono"
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min="1"
                            value={row.qty}
                            onChange={(e) => updateTallyRow(idx, "qty", e.target.value)}
                            className="h-8 text-xs font-mono"
                          />
                        </td>
                        <td className="p-3 font-mono font-semibold text-emerald-600">
                          {row.rowCft.toFixed(3)}
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            step="0.01"
                            value={row.ratePerCft}
                            onChange={(e) => updateTallyRow(idx, "ratePerCft", e.target.value)}
                            className="h-8 text-xs font-mono"
                          />
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-foreground">
                          {formatCurrency(row.rowTotal)}
                        </td>
                        <td className="p-3 text-center">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            onClick={() => removeTallyRow(idx)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tally Summary Totals */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-muted/30 p-4 rounded-xl border">
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs block">Total Pieces:</span>
                    <strong className="text-base font-mono">{tallySummary.totalPieces} Pcs</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs block">Total Volume:</span>
                    <strong className="text-base font-mono text-emerald-600">{tallySummary.totalCft.toFixed(3)} CFT</strong>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground text-xs block">Grand Total Amount:</span>
                  <strong className="text-xl font-mono text-primary">{formatCurrency(tallySummary.totalAmount)}</strong>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ────────────────────────────────────────────── */}
        {/* Tab 2: Dimensions & Scale Presets */}
        {/* ────────────────────────────────────────────── */}
        <TabsContent value="dimensions" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 border rounded-2xl p-5 bg-card space-y-5 shadow-xs">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-base">Scale Settings & Ratio</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDirection(direction === "real-to-scaled" ? "scaled-to-real" : "real-to-scaled")}
                  className="gap-1.5 text-xs text-primary"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  {direction === "real-to-scaled" ? "Real → Scaled" : "Scaled → Real"}
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Scale Preset / Ratio Standard</Label>
                <Select value={selectedPreset} onValueChange={setSelectedPreset}>
                  <SelectTrigger><SelectValue placeholder="Select Scale" /></SelectTrigger>
                  <SelectContent>
                    {SCALE_PRESETS.map((p) => (
                      <SelectItem key={p.ratio} value={p.ratio}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPreset === "custom" && (
                <div className="grid grid-cols-2 gap-3 border p-3 rounded-xl bg-muted/30">
                  <div className="space-y-1">
                    <Label className="text-xs">Real Unit Ratio</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={customRealRatio}
                      onChange={(e) => setCustomRealRatio(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Scaled Unit Ratio</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={customScaledRatio}
                      onChange={(e) => setCustomScaledRatio(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {selectedPreset === "percentage" && (
                <div className="space-y-1.5 border p-3 rounded-xl bg-muted/30">
                  <Label className="text-xs">Percentage Scaling Factor (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 50% for half, 200% for double"
                    value={percentageInput}
                    onChange={(e) => setPercentageInput(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {direction === "real-to-scaled" ? "1. Real Object Dimensions" : "1. Scaled Model Dimensions"}
                  </Label>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground mr-1">Unit:</span>
                    <Select value={inputUnit} onValueChange={setInputUnit}>
                      <SelectTrigger className="h-7 text-xs w-20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mm">mm</SelectItem>
                        <SelectItem value="cm">cm</SelectItem>
                        <SelectItem value="m">meter</SelectItem>
                        <SelectItem value="km">km</SelectItem>
                        <SelectItem value="in">inch</SelectItem>
                        <SelectItem value="ft">feet</SelectItem>
                        <SelectItem value="yd">yard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Length (L)</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={realLength}
                      onChange={(e) => setRealLength(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Width (W)</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={realWidth}
                      onChange={(e) => setRealWidth(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Height (H)</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={realHeight}
                      onChange={(e) => setRealHeight(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                <Label className="text-xs font-semibold text-muted-foreground">Target Output Dimension Unit:</Label>
                <Select value={outputUnit} onValueChange={setOutputUnit}>
                  <SelectTrigger className="h-8 text-xs w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mm">mm (millimeter)</SelectItem>
                    <SelectItem value="cm">cm (centimeter)</SelectItem>
                    <SelectItem value="m">m (meter)</SelectItem>
                    <SelectItem value="in">in (inches)</SelectItem>
                    <SelectItem value="ft">ft (feet)</SelectItem>
                    <SelectItem value="yd">yd (yard)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-4">
              <div className="border rounded-2xl p-5 bg-primary/5 border-primary/20 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-primary/10 pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-base text-primary">Scaled Dimension Results</h3>
                  </div>
                  <Badge variant="outline" className="bg-background text-xs font-mono">
                    Factor: {scaleFactor < 1 ? `1:${(1 / scaleFactor).toFixed(2)}` : `${scaleFactor.toFixed(2)}:1`}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="border rounded-xl p-3 bg-background text-center">
                    <p className="text-[11px] uppercase font-semibold text-muted-foreground">Scaled L</p>
                    <p className="text-lg font-mono font-bold text-foreground mt-0.5">
                      {calculations.finalScaledL.toFixed(3)}
                    </p>
                    <span className="text-[10px] text-muted-foreground">{outputUnit}</span>
                  </div>

                  <div className="border rounded-xl p-3 bg-background text-center">
                    <p className="text-[11px] uppercase font-semibold text-muted-foreground">Scaled W</p>
                    <p className="text-lg font-mono font-bold text-foreground mt-0.5">
                      {calculations.finalScaledW.toFixed(3)}
                    </p>
                    <span className="text-[10px] text-muted-foreground">{outputUnit}</span>
                  </div>

                  <div className="border rounded-xl p-3 bg-background text-center">
                    <p className="text-[11px] uppercase font-semibold text-muted-foreground">Scaled H</p>
                    <p className="text-lg font-mono font-bold text-foreground mt-0.5">
                      {calculations.finalScaledH.toFixed(3)}
                    </p>
                    <span className="text-[10px] text-muted-foreground">{outputUnit}</span>
                  </div>
                </div>

                <div className="space-y-2 border rounded-xl p-3.5 bg-background text-xs">
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Original Dimensions:</span>
                    <span className="font-mono font-medium">
                      {realLength} × {realWidth} × {realHeight} {inputUnit}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Converted Scaled Size:</span>
                    <span className="font-mono font-bold text-primary">
                      {calculations.finalScaledL.toFixed(3)} × {calculations.finalScaledW.toFixed(3)} × {calculations.finalScaledH.toFixed(3)} {outputUnit}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Linear Ratio Multiplier:</span>
                    <span className="font-mono font-semibold">×{scaleFactor.toFixed(5)}</span>
                  </div>
                </div>
              </div>

              {/* Visual Scale Canvas */}
              <div className="border rounded-2xl p-4 bg-card space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary" /> Visual Scale Comparison
                </p>
                <div className="h-44 rounded-xl border bg-muted/30 flex items-center justify-center p-4 relative overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 300 150">
                    <defs>
                      <pattern id="grid" width="15" height="15" patternUnits="userSpaceOnUse">
                        <path d="M 15 0 L 0 0 0 15" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground/20" />
                      </pattern>
                    </defs>
                    <rect width="300" height="150" fill="url(#grid)" />

                    <g transform="translate(30, 25)">
                      <rect
                        width="90"
                        height="60"
                        fill="currentColor"
                        className="text-primary/20"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <text x="45" y="35" textAnchor="middle" className="fill-foreground text-[9px] font-bold">
                        Real ({realLength}×{realWidth})
                      </text>
                    </g>

                    <g transform="translate(140, 55)">
                      <path d="M0,0 L20,0 M15,-4 L20,0 L15,4" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground" />
                      <text x="10" y="-8" textAnchor="middle" className="fill-primary text-[8px] font-mono font-bold">
                        ×{scaleFactor.toFixed(2)}
                      </text>
                    </g>

                    <g transform="translate(180, 25)">
                      <rect
                        width={Math.max(15, Math.min(85, 90 * scaleFactor))}
                        height={Math.max(10, Math.min(75, 60 * scaleFactor))}
                        fill="currentColor"
                        className="text-emerald-500/20"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <text
                        x={Math.max(15, Math.min(85, 90 * scaleFactor)) / 2}
                        y={Math.max(10, Math.min(75, 60 * scaleFactor)) / 2 + 3}
                        textAnchor="middle"
                        className="fill-emerald-600 text-[8px] font-bold"
                      >
                        Scaled
                      </text>
                    </g>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ────────────────────────────────────────────── */}
        {/* Tab 3: 2D Area & 3D Volume / Weight */}
        {/* ────────────────────────────────────────────── */}
        <TabsContent value="area-volume" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-2xl p-5 bg-card space-y-4 shadow-xs">
              <div className="flex items-center gap-2 border-b pb-3">
                <Layers className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-base">2D Surface Area Scaling</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Area scales with the <strong>square of the scale ratio (Scale²)</strong>.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="border p-3.5 rounded-xl bg-muted/40 text-center">
                  <span className="text-xs text-muted-foreground">Original Real Area</span>
                  <p className="text-xl font-bold font-mono text-foreground mt-1">
                    {calculations.realAreaM2.toFixed(3)}
                  </p>
                  <span className="text-[10px] text-muted-foreground">m² (square meters)</span>
                </div>

                <div className="border p-3.5 rounded-xl bg-primary/10 border-primary/20 text-center">
                  <span className="text-xs text-primary font-medium">Scaled Area</span>
                  <p className="text-xl font-bold font-mono text-primary mt-1">
                    {calculations.scaledAreaM2 < 0.001
                      ? calculations.scaledAreaM2.toExponential(3)
                      : calculations.scaledAreaM2.toFixed(4)}
                  </p>
                  <span className="text-[10px] text-muted-foreground">m² (square meters)</span>
                </div>
              </div>

              <div className="border rounded-xl p-3 bg-muted/20 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Area Scale Factor:</span>
                  <span className="font-mono font-semibold">{calculations.areaScaleFactor.toFixed(6)}×</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Square Feet (sq.ft):</span>
                  <span className="font-mono">{(calculations.realAreaM2 * 10.7639).toFixed(2)} sq.ft</span>
                </div>
              </div>
            </div>

            <div className="border rounded-2xl p-5 bg-card space-y-4 shadow-xs">
              <div className="flex items-center gap-2 border-b pb-3">
                <Box className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-base">3D Volume & Mass / Weight Scaling</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                3D Volume & mass scale with the <strong>cube of the scale ratio (Scale³)</strong>.
              </p>

              <div className="space-y-1.5">
                <Label className="text-xs">Original Object Weight ({weightUnit})</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    className="font-mono"
                  />
                  <Select value={weightUnit} onValueChange={setWeightUnit}>
                    <SelectTrigger className="w-24 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="g">grams</SelectItem>
                      <SelectItem value="ton">ton</SelectItem>
                      <SelectItem value="lbs">lbs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="border p-3.5 rounded-xl bg-muted/40 text-center">
                  <span className="text-xs text-muted-foreground">Original Volume</span>
                  <p className="text-xl font-bold font-mono text-foreground mt-1">
                    {calculations.realVolumeM3.toFixed(3)}
                  </p>
                  <span className="text-[10px] text-muted-foreground">m³ (cubic meters)</span>
                </div>

                <div className="border p-3.5 rounded-xl bg-emerald-500/10 border-emerald-500/20 text-center">
                  <span className="text-xs text-emerald-600 font-medium">Scaled Weight</span>
                  <p className="text-xl font-bold font-mono text-emerald-600 mt-1">
                    {calculations.scaledWeight < 0.001
                      ? calculations.scaledWeight.toExponential(3)
                      : calculations.scaledWeight.toFixed(4)}
                  </p>
                  <span className="text-[10px] text-muted-foreground">{weightUnit}</span>
                </div>
              </div>

              <div className="border rounded-xl p-3 bg-muted/20 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cubic Scale Multiplier:</span>
                  <span className="font-mono font-semibold">{calculations.volumeScaleFactor.toFixed(8)}×</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ────────────────────────────────────────────── */}
        {/* Tab 4: Batch & Production Cost Scaling */}
        {/* ────────────────────────────────────────────── */}
        <TabsContent value="production" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 border rounded-2xl p-5 bg-card space-y-4 shadow-xs">
              <div className="flex items-center gap-2 border-b pb-3">
                <DollarSign className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-base">Production Batch Scaling</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Scale unit manufacturing costs from prototype batch size to large commercial order size.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Prototype / Sample Qty</Label>
                  <Input
                    type="number"
                    min="1"
                    value={prototypeQty}
                    onChange={(e) => setPrototypeQty(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Total Prototype Cost (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={prototypeCost}
                    onChange={(e) => setPrototypeCost(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                <div className="space-y-1">
                  <Label className="text-xs">Full Production Order Qty</Label>
                  <Input
                    type="number"
                    min="1"
                    value={productionQty}
                    onChange={(e) => setProductionQty(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Bulk Efficiency Savings (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={efficiencyDiscount}
                    onChange={(e) => setEfficiencyDiscount(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 border rounded-2xl p-5 bg-card space-y-4 shadow-xs">
              <div className="flex items-center gap-2 border-b pb-3">
                <Calculator className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-base">Scaled Production Financials</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="border p-3.5 rounded-xl bg-muted/40">
                  <span className="text-xs text-muted-foreground">Sample Unit Cost:</span>
                  <p className="text-lg font-bold font-mono text-foreground mt-1">
                    {formatCurrency(costCalculations.protoUnitCost)}
                  </p>
                  <span className="text-[10px] text-muted-foreground">per unit (small batch)</span>
                </div>

                <div className="border p-3.5 rounded-xl bg-primary/10 border-primary/20">
                  <span className="text-xs text-primary font-semibold">Scaled Production Unit Cost:</span>
                  <p className="text-lg font-bold font-mono text-primary mt-1">
                    {formatCurrency(costCalculations.scaledUnitCost)}
                  </p>
                  <span className="text-[10px] text-emerald-600 font-medium">
                    {efficiencyDiscount}% economies of scale
                  </span>
                </div>
              </div>

              <div className="border rounded-xl p-4 bg-muted/20 space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Total Production Batch Cost:</span>
                  <span className="font-mono font-bold text-foreground">
                    {formatCurrency(costCalculations.totalProdCost)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Unscaled Baseline Cost:</span>
                  <span className="font-mono text-muted-foreground">
                    {formatCurrency(costCalculations.unscaledProdCost)}
                  </span>
                </div>
                <div className="flex justify-between py-1 font-semibold text-emerald-600">
                  <span>Total Scaling Efficiency Savings:</span>
                  <span className="font-mono">
                    {formatCurrency(costCalculations.totalSavings)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
