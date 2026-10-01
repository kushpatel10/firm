"use client";

import dynamic from "next/dynamic";
import { useStealth } from "@/contexts/stealth-context";

// Dynamically import the Android Calculator Decoy ONLY on Android when required.
// This ensures that the web bundle and web runtime NEVER render or unnecessarily evaluate the calculator.
const AndroidCalculator = dynamic(
  () =>
    import("@/components/decoy/calculator-vault").then(
      (mod) => mod.CalculatorVault
    ),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[100dvh] w-full bg-black flex items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
      </div>
    ),
  }
);

/**
 * AndroidEntryGatekeeper (StealthDecoyGuard)
 *
 * Platform-specific gatekeeper:
 * - On Website: Returns children immediately. The calculator is completely absent from the web flow.
 * - On Android Native App: Displays the Calculator as the entry disguise until the user unlocks it.
 */
export function StealthDecoyGuard({ children }) {
  const { isAndroidNative, isStealthEnabled, isUnlocked, isInitialized } = useStealth();

  // 1. If running on Website: Always return application directly without calculator.
  if (!isAndroidNative) {
    return children;
  }

  // 2. If running on Android Native App:
  if (!isInitialized) {
    return (
      <div className="min-h-[100dvh] w-full bg-black flex items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // If Android session is stealth-enabled and locked, show the Android Calculator!
  if (isStealthEnabled && !isUnlocked) {
    return <AndroidCalculator />;
  }

  // Unlocked Android session -> proceed to main application
  return children;
}

export { StealthDecoyGuard as AndroidEntryGatekeeper };
