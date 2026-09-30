"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState, useCallback } from "react";
import { debounce } from "@/lib/utils";

/**
 * Debounced search input.
 * @param {Object} props
 * @param {string} [props.placeholder]
 * @param {Function} [props.onSearch]
 * @param {string} [props.className]
 */
export function SearchInput({ placeholder = "Search…", onSearch, className }) {
  const [value, setValue] = useState("");

  const debouncedSearch = useCallback(
    debounce((val) => onSearch?.(val), 300),
    [onSearch]
  );

  const handleChange = (e) => {
    setValue(e.target.value);
    debouncedSearch(e.target.value);
  };

  return (
    <div className={`relative ${className || ""}`}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className="pl-10 h-10 rounded-xl bg-card border-border/80 text-sm focus-visible:border-border"
      />
    </div>
  );
}
