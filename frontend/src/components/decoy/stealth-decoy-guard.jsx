"use client";

import { useState, useEffect } from "react";
import { useStealth } from "@/contexts/stealth-context";
import { CalculatorVault } from "@/components/decoy/calculator-vault";

/**
 * AndroidEntryGatekeeper (StealthDecoyGuard)
 *
 * Platform-specific gatekeeper:
 * - On Website: Returns children immediately. The calculator is completely absent from the web flow.
 * - On Android Native App: Displays the Calculator as a fixed, full-screen entry disguise
 *   at z-[9999] so it can never be pushed down, scrolled away, or show any loading artifacts.
 */
export function StealthDecoyGuard({ children }) {
  const [mounted, setMounted] = useState(false);
  const { isAndroidNative, isStealthEnabled, isUnlocked } = useStealth();

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. If running on Website: Always return application directly without calculator or overlays.
  if (!isAndroidNative) {
    return children;
  }

  // 2. If running on Android Native App:
  const showCalculator = mounted && isStealthEnabled && !isUnlocked;

  return (
    <>
      {children}
      {showCalculator && (
        <div
          id="android-stealth-calculator-overlay"
          className="fixed inset-0 z-[9999] h-[100dvh] w-full bg-black overflow-hidden touch-none select-none"
          style={{ overscrollBehavior: "none" }}
        >
          <CalculatorVault />
        </div>
      )}
    </>
  );
}

export { StealthDecoyGuard as AndroidEntryGatekeeper };
