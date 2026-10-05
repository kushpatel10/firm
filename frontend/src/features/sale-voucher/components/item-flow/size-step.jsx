"use client";

import { useState } from "react";
import { Check, Plus, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { placeholders } from "@/config/placeholders";

export function SizeStep({
  category,
  selectedSize,
  isCustomSize,
  customSizeText,
  setCustomSizeText,
  onSelectSize,
  onContinue,
}) {
  const presets = category?.sizePresets || [];
  const [showCustomInput, setShowCustomInput] = useState(isCustomSize);

  const handleSelectPreset = (presetName) => {
    setShowCustomInput(false);
    onSelectSize(presetName, false);
  };

  const handleToggleCustom = () => {
    setShowCustomInput(true);
    onSelectSize(customSizeText || "", true);
  };

  const handleCustomChange = (e) => {
    const val = e.target.value;
    setCustomSizeText(val);
    onSelectSize(val, true);
  };

  const canContinue = isCustomSize ? customSizeText.trim().length > 0 : Boolean(selectedSize);

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Select Size
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Choose a standard preset thickness/size or enter a custom size
          </p>
        </div>

        {/* Preset Cards */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {presets.map((preset) => {
            const isSelected = !isCustomSize && selectedSize === preset.name;
            return (
              <button
                key={preset.id || preset.name}
                type="button"
                onClick={() => handleSelectPreset(preset.name)}
                className={`p-4 rounded-2xl border text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-2 min-h-[96px] active:scale-[0.98] ${
                  isSelected
                    ? "border-primary bg-primary/10 ring-2 ring-primary/40 shadow-sm"
                    : "border-border/80 bg-card hover:bg-muted/40 hover:border-border"
                }`}
              >
                <span className="font-bold text-lg text-foreground">
                  {preset.name}
                </span>
                {isSelected ? (
                  <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground uppercase font-medium">
                    Preset
                  </span>
                )}
              </button>
            );
          })}

          {/* Custom Size Card */}
          <button
            type="button"
            onClick={handleToggleCustom}
            className={`p-4 rounded-2xl border text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-2 min-h-[96px] active:scale-[0.98] ${
              isCustomSize
                ? "border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/40 shadow-sm"
                : "border-dashed border-border hover:border-amber-500/50 bg-card hover:bg-amber-500/5"
            }`}
          >
            <div className="flex items-center gap-1 font-bold text-base text-amber-600 dark:text-amber-400">
              <Plus className="h-4 w-4" /> Custom Size
            </div>
            <span className="text-[11px] text-muted-foreground">
              Voucher specific
            </span>
          </button>
        </div>

        {/* Custom Size Input Area */}
        {showCustomInput && (
          <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <Label htmlFor="customSizeInput" className="text-xs font-semibold text-foreground">
              Enter Custom Size / Specification
            </Label>
            <Input
              id="customSizeInput"
              placeholder={placeholders.sales.customSizeInput}
              value={customSizeText}
              onChange={handleCustomChange}
              autoFocus
              className="h-11 text-sm bg-background rounded-xl border-border focus-visible:ring-amber-500"
            />
            <p className="text-[11px] text-muted-foreground">
              Applies to this sale voucher without altering permanent presets.
            </p>
          </div>
        )}
      </div>

      {/* Sticky Bottom Safe Action */}
      <div className="pt-6 pb-2">
        <Button
          type="button"
          size="lg"
          disabled={!canContinue}
          onClick={onContinue}
          className="w-full h-12 sm:h-13 text-base font-semibold rounded-2xl shadow-lg shadow-primary/20"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
