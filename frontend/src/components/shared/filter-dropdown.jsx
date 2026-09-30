"use client";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Filter } from "lucide-react";
import { useState } from "react";

/**
 * Multi-select filter dropdown.
 * @param {Object} props
 * @param {string} props.label
 * @param {Array<{ value: string, label: string }>} props.options
 * @param {string[]} props.selected
 * @param {Function} props.onSelectionChange
 */
export function FilterDropdown({ label, options, selected = [], onSelectionChange }) {
  const [open, setOpen] = useState(false);

  const toggle = (value) => {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onSelectionChange(next);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="default" className="h-10 rounded-xl border-border/80 bg-card gap-2 text-xs sm:text-sm font-medium">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span>{label}</span>
          {selected.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs font-semibold rounded-md">
              {selected.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3 rounded-xl bg-card border-border/80" align="start">
        <div className="space-y-2">
          {options.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 text-sm cursor-pointer hover:text-foreground transition-colors"
            >
              <Checkbox
                checked={selected.includes(opt.value)}
                onCheckedChange={() => toggle(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
        {selected.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-3"
            onClick={() => onSelectionChange([])}
          >
            Clear filters
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
