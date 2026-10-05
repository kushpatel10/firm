"use client";

import { Check, Sparkles, Plus, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CategoryStep({
  categories = [],
  selectedCategory,
  onSelectCategory,
  onContinue,
  onOpenCategoryManager,
  loading = false,
}) {
  return (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Select Category
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              What type of product are you selling?
            </p>
          </div>

          {onOpenCategoryManager && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenCategoryManager}
              className="gap-1.5 text-xs h-8 rounded-xl font-medium shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Category
            </Button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-muted/40 animate-pulse border border-border/50" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border-2 border-dashed border-border/80 bg-card/50 space-y-3 my-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Calculator className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">No Categories Configured Yet</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Preset categories have been cleared. Add custom categories with your own formulas, dimensions, and units.
            </p>
            {onOpenCategoryManager && (
              <Button
                type="button"
                onClick={onOpenCategoryManager}
                className="gap-2 text-xs font-semibold h-9 rounded-xl shadow-md shadow-primary/20"
              >
                <Plus className="h-4 w-4" />
                Create Custom Category
              </Button>
            )}
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
