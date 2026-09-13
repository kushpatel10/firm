"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function SizeSelector({
  value = "",
  availableSizes = [],
  basePrice = 0,
  onSelectSize,
  disabled = false,
}) {
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Normalize available sizes into array of { size, price }
  const normalizedSizes = (availableSizes || []).map((s) => {
    if (typeof s === "string") return { size: s, price: null };
    return { size: s.size, price: s.price ? parseFloat(s.price) : null };
  });

  const handleSizeClick = (sizeItem) => {
    if (onSelectSize) {
      onSelectSize(sizeItem.size, sizeItem.price);
    }
  };

  // If no preset sizes exist or user entered custom mode
  if (normalizedSizes.length === 0 || isCustomMode) {
    return (
      <div className="flex items-center gap-1.5">
        <Input
          placeholder="Size / Dim (e.g. 950x1120, XL)"
          value={value}
          onChange={(e) => onSelectSize && onSelectSize(e.target.value, null)}
          disabled={disabled}
          className="h-8 text-xs font-mono"
        />
        {normalizedSizes.length > 0 && (
          <button
            type="button"
            onClick={() => setIsCustomMode(false)}
            className="text-[10px] text-primary hover:underline shrink-0"
          >
            Presets
          </button>
        )}
      </div>
    );
  }

  // If 4 or fewer sizes: show quick interactive pills
  if (normalizedSizes.length <= 4) {
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {normalizedSizes.map((s, idx) => {
          const isSelected = value === s.size;
          return (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => handleSizeClick(s)}
              className={`px-2 py-1 rounded-md text-xs font-mono font-medium transition-all cursor-pointer ${
                isSelected
                  ? "bg-primary text-primary-foreground shadow-xs font-bold ring-1 ring-primary"
                  : "bg-secondary/70 hover:bg-secondary text-foreground hover:text-primary border border-border/60"
              }`}
              title={s.price ? `₹${s.price}` : `₹${basePrice}`}
            >
              {s.size}
              {s.price && s.price !== basePrice && (
                <span className="text-[10px] opacity-80 ml-1">₹{s.price}</span>
              )}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setIsCustomMode(true)}
          className="text-[10px] text-muted-foreground hover:text-primary px-1 font-mono"
          title="Enter custom size"
        >
          +Custom
        </button>
      </div>
    );
  }

  // If more than 4 sizes: show a compact Select dropdown with size options
  return (
    <div className="flex items-center gap-1">
      <Select
        value={value || ""}
        onValueChange={(val) => {
          if (val === "__CUSTOM__") {
            setIsCustomMode(true);
            return;
          }
          const matched = normalizedSizes.find((s) => s.size === val);
          if (matched) handleSizeClick(matched);
          else if (onSelectSize) onSelectSize(val, null);
        }}
        disabled={disabled}
      >
        <SelectTrigger className="h-8 text-xs font-mono min-w-[120px]">
          <SelectValue placeholder="Select Size" />
        </SelectTrigger>
        <SelectContent>
          {normalizedSizes.map((s, idx) => (
            <SelectItem key={idx} value={s.size} className="text-xs font-mono">
              <span className="font-semibold">{s.size}</span>
              {s.price && s.price !== basePrice && (
                <span className="text-muted-foreground text-[10px] ml-1.5">(₹{s.price})</span>
              )}
            </SelectItem>
          ))}
          <SelectItem value="__CUSTOM__" className="text-xs text-primary font-medium">
            + Custom Dimension / Size…
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
