"use client";

import { useEffect } from "react";
import { ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useItemFlow, ITEM_STEPS } from "../../hooks/use-item-flow";
import { CategoryStep } from "./category-step";
import { SubtypeStep } from "./subtype-step";
import { SizeStep } from "./size-step";
import { DimensionsStep } from "./dimensions-step";
import { PricingStep } from "./pricing-step";
import { ItemReviewStep } from "./item-review-step";

export function ItemFlowModal({
  isOpen,
  onClose,
  categories = [],
  initialItem = null,
  onAddItem,
  onOpenCategoryManager,
  loading = false,
}) {
  const {
    steps,
    stepIndex,
    currentStep,
    isFirstStep,
    selectedCategory,
    selectedSubtype,
    selectedSize,
    isCustomSize,
    customSizeText,
    setCustomSizeText,
    dimensionValues,
    rate,
    setRate,
    quantity,
    setQuantity,
    calculationResult,
    handleSelectCategory,
    handleSelectSubtype,
    handleSelectSize,
    handleUpdateDimension,
    goNext,
    goBack,
    jumpToStep,
    handleFinish,
  } = useItemFlow({
    categories,
    initialItem,
    onComplete: (item) => {
      onAddItem(item);
      onClose();
    },
    onCancel: onClose,
  });

  // Lock background scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const totalSteps = steps.length;
  const currentStepNum = stepIndex + 1;
  const progressPercent = ((stepIndex + 1) / totalSteps) * 100;

  return (
    <div className="fixed inset-0 z-[120] bg-background flex flex-col justify-between animate-in fade-in duration-200">
      {/* Centered container: full-screen on mobile, centered sleek frame on desktop */}
      <div className="w-full max-w-xl mx-auto flex flex-col h-full bg-background shadow-2xl relative">
        
        {/* Sticky Top Header */}
        <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-border/80 px-4 py-3 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goBack}
              className="h-10 w-10 -ml-2 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 active:scale-95 transition-all cursor-pointer"
              title="Go Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="text-center min-w-0 flex-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                Add Item from Catalog
              </span>
              <h1 className="text-sm sm:text-base font-bold text-foreground truncate">
                Step {currentStepNum} of {totalSteps}
              </h1>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="h-10 w-10 -mr-2 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 active:scale-95 transition-all cursor-pointer"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Micro Progress Line */}
          <div className="w-full bg-muted/60 h-1 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </header>

        {/* Scrollable Content Body */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          {currentStep === ITEM_STEPS.CATEGORY && (
            <CategoryStep
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategory}
              onContinue={goNext}
              onOpenCategoryManager={onOpenCategoryManager}
              loading={loading}
            />
          )}

          {currentStep === ITEM_STEPS.SUBTYPE && (
            <SubtypeStep
              category={selectedCategory}
              selectedSubtype={selectedSubtype}
              onSelectSubtype={handleSelectSubtype}
              onContinue={goNext}
            />
          )}

          {currentStep === ITEM_STEPS.SIZE && (
            <SizeStep
              category={selectedCategory}
              selectedSize={selectedSize}
              isCustomSize={isCustomSize}
              customSizeText={customSizeText}
              setCustomSizeText={setCustomSizeText}
              onSelectSize={handleSelectSize}
              onContinue={goNext}
            />
          )}

          {currentStep === ITEM_STEPS.DIMENSIONS && (
            <DimensionsStep
              category={selectedCategory}
              dimensionValues={dimensionValues}
              onUpdateDimension={handleUpdateDimension}
              calculationResult={calculationResult}
              onContinue={goNext}
            />
          )}

          {currentStep === ITEM_STEPS.PRICING && (
            <PricingStep
              category={selectedCategory}
              rate={rate}
              setRate={setRate}
              quantity={quantity}
              setQuantity={setQuantity}
              calculationResult={calculationResult}
              onContinue={goNext}
            />
          )}

          {currentStep === ITEM_STEPS.REVIEW && (
            <ItemReviewStep
              category={selectedCategory}
              selectedSubtype={selectedSubtype}
              selectedSize={selectedSize}
              isCustomSize={isCustomSize}
              customSizeText={customSizeText}
              dimensionValues={dimensionValues}
              calculationResult={calculationResult}
              onEdit={() => jumpToStep(ITEM_STEPS.DIMENSIONS)}
              onAddItem={handleFinish}
            />
          )}
        </main>
      </div>
    </div>
  );
}
