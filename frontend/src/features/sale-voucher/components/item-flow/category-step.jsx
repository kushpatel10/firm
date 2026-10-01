"use client";

import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CategoryStep({ categories = [], selectedCategory, onSelectCategory, onContinue, loading = false }) {
  return (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Select Category
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            What type of product are you selling?
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-muted/40 animate-pulse border border-border/50" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-border/80 bg-card/50">
            <p className="text-sm text-muted-foreground">No product categories found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {categories.map((cat) => {
              const isSelected = selectedCategory?.id === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(cat)}
                  className={`relative p-4.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-start gap-4 active:scale-[0.98] ${
                    isSelected
                      ? "border-primary bg-primary/10 ring-2 ring-primary/40 shadow-md shadow-primary/5"
                      : "border-border/80 bg-card hover:bg-muted/40 hover:border-border"
                  }`}
                >
                  <div className="text-3xl shrink-0 p-2.5 rounded-xl bg-background/80 border border-border/60 shadow-xs flex items-center justify-center">
                    {cat.icon || "📦"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-base text-foreground truncate">
                        {cat.name}
                      </h3>
                      {isSelected && (
                        <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    {cat.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {cat.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                        {cat.calculationLabel || "Calculation"} • {cat.unit || "unit"}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky Bottom Safe Action */}
      <div className="pt-6 pb-2">
        <Button
          type="button"
          size="lg"
          disabled={!selectedCategory}
          onClick={onContinue}
          className="w-full h-12 sm:h-13 text-base font-semibold rounded-2xl shadow-lg shadow-primary/20"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
