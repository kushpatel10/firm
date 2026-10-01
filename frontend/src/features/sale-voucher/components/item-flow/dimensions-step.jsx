"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator } from "lucide-react";

export function DimensionsStep({
  category,
  dimensionValues = {},
  onUpdateDimension,
  calculationResult,
  onContinue,
}) {
  const dimensions = category?.dimensions || [];

  // Validate that all required dimensions have a value > 0
  const isValid = dimensions.every((dim) => {
    if (!dim.required) return true;
    const val = dimensionValues[dim.key];
    return val !== undefined && val !== "" && parseFloat(val) > 0;
  });

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Enter Dimensions
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Specify measurements for {category?.name || "item"}
          </p>
        </div>

        {/* Dynamic Dimensions Input List */}
        <div className="space-y-3.5 pt-1">
          {dimensions.map((dim) => {
            const val = dimensionValues[dim.key] !== undefined ? dimensionValues[dim.key] : "";
            return (
              <div
                key={dim.id || dim.key}
                className="p-3.5 rounded-2xl border border-border/80 bg-card space-y-1.5 focus-within:border-primary/80 focus-within:ring-1 focus-within:ring-primary/40 transition-all"
              >
                <div className="flex items-center justify-between">
                  <Label htmlFor={`dim_${dim.key}`} className="text-xs font-semibold text-foreground">
                    {dim.label} {dim.required && <span className="text-destructive">*</span>}
                  </Label>
                  {dim.unit && (
                    <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground uppercase">
                      {dim.unit}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <Input
                    id={`dim_${dim.key}`}
                    type="number"
                    step="any"
                    min="0"
                    placeholder={dim.placeholder || `Enter ${dim.label.toLowerCase()}`}
                    value={val}
                    onChange={(e) => onUpdateDimension(dim.key, e.target.value)}
                    required={dim.required}
                    className="h-12 text-base font-semibold bg-background/50 border-border/60 rounded-xl pr-14"
                  />
                  {dim.unit && (
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground pointer-events-none">
                      {dim.unit}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Calculation Preview Banner */}
        {calculationResult && calculationResult.calculatedMeasure > 0 && (
          <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary shrink-0" />
              <div className="text-xs text-foreground">
                <span className="text-muted-foreground font-medium">Calculated {calculationResult.calculationLabel}: </span>
                <span className="font-mono font-bold text-primary">
                  {calculationResult.calculatedMeasure} {calculationResult.unit}
                </span>
                <span className="text-muted-foreground text-[11px] ml-1">/ piece</span>
              </div>
            </div>
            {calculationResult.formulaDisplay && (
              <span className="text-[10px] font-mono text-muted-foreground bg-background/80 px-2 py-1 rounded-md border border-border/50">
                {calculationResult.formulaDisplay}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Sticky Bottom Safe Action */}
      <div className="pt-6 pb-2">
        <Button
          type="button"
          size="lg"
          disabled={!isValid}
          onClick={onContinue}
          className="w-full h-12 sm:h-13 text-base font-semibold rounded-2xl shadow-lg shadow-primary/20"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
