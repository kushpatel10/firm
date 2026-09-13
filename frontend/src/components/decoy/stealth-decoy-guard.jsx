"use client";

import { useStealth } from "@/contexts/stealth-context";
import { CalculatorVault } from "@/components/decoy/calculator-vault";

export function StealthDecoyGuard({ children }) {
  const { isStealthEnabled, isUnlocked, isInitialized } = useStealth();

  // If running inside Android native app and session is not unlocked, show Calculator!
  if (isInitialized && isStealthEnabled && !isUnlocked) {
    return <CalculatorVault />;
  }

  return children;
}
