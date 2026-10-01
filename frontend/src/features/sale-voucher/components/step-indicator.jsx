"use client";

import { Check } from "lucide-react";

export function StepIndicator({ steps = [], currentStepIndex = 0 }) {
  return (
    <div className="w-full py-2">
      <div className="flex items-center justify-between relative">
        {/* Connecting track line */}
        <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-0.5 bg-muted z-0" />
        <div
          className="absolute top-1/2 left-4 -translate-y-1/2 h-0.5 bg-primary z-0 transition-all duration-300"
          style={{
            width: `${(currentStepIndex / Math.max(1, steps.length - 1)) * 92}%`,
          }}
        />

        {steps.map((s, idx) => {
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <div key={s.id || s.label} className="relative z-10 flex flex-col items-center">
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                  isDone
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : isCurrent
                    ? "bg-background text-primary border-2 border-primary ring-4 ring-primary/20 shadow-sm"
                    : "bg-muted text-muted-foreground border border-border"
                }`}
              >
                {isDone ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : idx + 1}
              </div>

              <span
                className={`text-[10px] mt-1 font-semibold uppercase tracking-wider transition-colors hidden sm:block ${
                  isCurrent ? "text-primary" : isDone ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
