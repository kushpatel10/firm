"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Boxes, Plus, ChevronDown, Tag, Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function ItemCombobox({
  value = "",
  inventoryItems = [],
  onSelectItem,
  onChangeName,
  onOpenQuickAdd,
  onUseCustomItem,
  placeholder = "Search or type item name…",
  disabled = false,
  required = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState({ top: 0, bottom: "auto", left: 0, width: 320, openUpward: false });

  const containerRef = useRef(null);
  const dropdownRef = useRef(null);

  // Mark client-side mounted for portal rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync internal query with external value
  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  // Position calculation with automatic flip if near bottom of viewport
  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dropdownHeight = 280;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    const openUpward = spaceBelow < 220 && spaceAbove > spaceBelow;

    // Minimum width is trigger width or 320px, but fits on screen
    const targetWidth = Math.min(Math.max(rect.width, 320), window.innerWidth - 16);

    // Keep horizontally within viewport boundaries
    let left = rect.left;
    if (left + targetWidth > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - targetWidth - 8);
    }
    if (left < 8) left = 8;

    if (openUpward) {
      setCoords({
        top: "auto",
        bottom: window.innerHeight - rect.top + 4,
        left,
        width: targetWidth,
        openUpward: true,
      });
    } else {
      setCoords({
        top: rect.bottom + 4,
        bottom: "auto",
        left,
        width: targetWidth,
        openUpward: false,
      });
    }
  }, []);

  // Update position on open, scroll, or resize
  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleScroll = () => updatePosition();
    const handleResize = () => updatePosition();

    // Listen on window and capture all scroll events (including modals/dialogs)
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen, updatePosition]);

  // Handle outside click & Escape key
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event) {
      const inTrigger = containerRef.current && containerRef.current.contains(event.target);
      const inDropdown = dropdownRef.current && dropdownRef.current.contains(event.target);
      if (!inTrigger && !inDropdown) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Filter items based on query
  const filteredItems = useMemo(() => {
    if (!inventoryItems || inventoryItems.length === 0) return [];
    if (!query.trim()) return inventoryItems.slice(0, 20);

    const q = query.toLowerCase().trim();
    return inventoryItems
      .filter((item) => {
        const nameMatch = item.name?.toLowerCase().includes(q);
        const skuMatch = item.sku?.toLowerCase().includes(q);
        const catMatch = item.category?.toLowerCase().includes(q);
        const sizeMatch = Array.isArray(item.sizes) && item.sizes.some((s) => {
          const sText = typeof s === "string" ? s : s?.size;
          return sText?.toLowerCase().includes(q);
        });
        return nameMatch || skuMatch || catMatch || sizeMatch;
      })
      .slice(0, 20);
  }, [inventoryItems, query]);

  const handleSelect = (item) => {
    setQuery(item.name);
    setIsOpen(false);
    if (onSelectItem) onSelectItem(item);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);
    updatePosition();
    if (onChangeName) onChangeName(val);
  };

  const toggleOpen = () => {
    if (disabled) return;
    setIsOpen((prev) => {
      const next = !prev;
      if (next) updatePosition();
      return next;
    });
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative flex items-center">
        <Input
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            setIsOpen(true);
            updatePosition();
          }}
          disabled={disabled}
          required={required}
          className="pr-8 text-xs sm:text-sm font-medium"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={toggleOpen}
          className="absolute right-2 text-muted-foreground hover:text-foreground cursor-pointer p-1"
        >
          <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Floating Portal Dropdown — Renders into body to completely escape overflow/table bounds */}
      {isOpen && mounted && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: "fixed",
            top: coords.top !== "auto" ? `${coords.top}px` : "auto",
            bottom: coords.bottom !== "auto" ? `${coords.bottom}px` : "auto",
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            zIndex: 99999,
          }}
          className={`max-h-72 overflow-y-auto rounded-xl border border-border/80 bg-popover shadow-2xl p-1.5 text-popover-foreground animate-in fade-in-0 ${
            coords.openUpward ? "slide-in-from-bottom-2" : "slide-in-from-top-2"
          }`}
        >
          {/* Action Header Options */}
          {(onOpenQuickAdd || onUseCustomItem) && (
            <div className="p-1 border-b border-border/60 mb-1 space-y-1">
              {onUseCustomItem && query.trim().length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 h-8 gap-2"
                  onClick={() => {
                    setIsOpen(false);
                    onUseCustomItem(query.trim());
                  }}
                >
                  <Tag className="h-3.5 w-3.5" />
                  Use "{query.trim()}" as Custom Item
                </Button>
              )}
              {onOpenQuickAdd && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10 h-8 gap-2"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenQuickAdd(query);
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {query.trim() ? `Add "${query.trim()}" to Catalog` : "Add New Item to Catalog"}
                </Button>
              )}
            </div>
          )}

          {/* Items List */}
          {filteredItems.length > 0 ? (
            <div className="space-y-0.5">
              {filteredItems.map((item) => {
                const isSelected = item.name.toLowerCase() === (value || "").toLowerCase();
                let sizesList = [];
                if (Array.isArray(item.sizes)) {
                  sizesList = item.sizes.map((s) => (typeof s === "string" ? s : s?.size)).filter(Boolean);
                } else if (item.sizes && typeof item.sizes === "object") {
                  sizesList = Object.keys(item.sizes);
                }

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={`flex flex-col gap-1 p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                      isSelected ? "bg-primary/10 text-foreground font-medium" : "hover:bg-muted/80 text-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Boxes className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="font-semibold truncate">{item.name}</span>
                        {item.sku && (
                          <span className="text-[10px] font-mono text-muted-foreground bg-secondary px-1 py-0.2 rounded">
                            {item.sku}
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-primary shrink-0">
                        {formatCurrency(item.sellingPrice || 0)}
                        <span className="text-[10px] font-normal text-muted-foreground">/{item.unit || "pcs"}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.category && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-secondary/70 text-[10px]">
                            <Tag className="h-2.5 w-2.5" /> {item.category}
                          </span>
                        )}
                        {sizesList.length > 0 ? (
                          <span className="text-[10px] font-mono text-primary/80 font-medium">
                            Sizes: {sizesList.slice(0, 3).join(", ")}
                            {sizesList.length > 3 ? ` +${sizesList.length - 3}` : ""}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">Standard</span>
                        )}
                      </div>

                      {item.quantity !== undefined && (
                        <span className="text-[10px] font-mono">
                          Stock: {item.quantity} {item.unit || "pcs"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-3 text-center text-xs text-muted-foreground">
              No matching catalog items found.
              <div className="mt-2 flex flex-col gap-1.5">
                {onUseCustomItem && query.trim() && (
                  <Button
                    type="button"
                    size="sm"
                    className="text-xs h-8 gap-1 bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={() => {
                      setIsOpen(false);
                      onUseCustomItem(query.trim());
                    }}
                  >
                    <Tag className="h-3 w-3" /> Use "{query.trim()}" as Custom Item
                  </Button>
                )}
                {onOpenQuickAdd && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 gap-1"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenQuickAdd(query);
                    }}
                  >
                    <Plus className="h-3 w-3" /> Add to Catalog & Inventory
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
