"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export function SubtypeStep({ category, selectedSubtype, onSelectSubtype, onContinue }) {
  const subtypes = category?.subtypes || [];

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Select Type
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Choose the type or grade of {category?.name || "product"}
          </p>
        </div>

        <div className="space-y-2.5 pt-1">
          {subtypes.map((st) => {
            const isSelected = selectedSubtype === st.name;
            return (
              <button
                key={st.id || st.name}
                type="button"
                onClick={() => onSelectSubtype(st.name)}
                className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between gap-4 active:scale-[0.99] ${
                  isSelected
                    ? "border-primary bg-primary/10 ring-2 ring-primary/40 shadow-sm"
                    : "border-border/80 bg-card hover:bg-muted/40 hover:border-border"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-base text-foreground">
                      {st.name}
                    </h3>
                  </div>
                  {st.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {st.description}
                    </p>
                  )}
                  {st.defaultRate != null && st.defaultRate > 0 && (
                    <p className="text-xs font-mono font-medium text-primary mt-1.5">
                      Base: {formatCurrency(st.defaultRate)} / {category?.unit || "unit"}
                    </p>
                  )}
                </div>

                <div className="shrink-0">
                  {isSelected ? (
                    <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </span>
                  ) : (
                    <span className="h-6 w-6 rounded-full border border-border/80" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sticky Bottom Safe Action */}
      <div className="pt-6 pb-2">
        <Button
          type="button"
          size="lg"
          disabled={!selectedSubtype}
          onClick={onContinue}
          className="w-full h-12 sm:h-13 text-base font-semibold rounded-2xl shadow-lg shadow-primary/20"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
