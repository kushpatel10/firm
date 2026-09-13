"use client";

import { createContext, useContext, useState, useCallback } from "react";

const FirmContext = createContext(null);

export function FirmProvider({ children, initialFirm = null, initialBranches = [] }) {
  const [currentFirm, setCurrentFirm] = useState(initialFirm);
  const [currentBranch, setCurrentBranch] = useState(null);
  const [branches, setBranches] = useState(initialBranches);

  const switchBranch = useCallback((branch) => {
    setCurrentBranch(branch);
  }, []);

  const value = {
    currentFirm,
    setCurrentFirm,
    currentBranch,
    switchBranch,
    branches,
    setBranches,
  };

  return <FirmContext.Provider value={value}>{children}</FirmContext.Provider>;
}

/**
 * @returns {{
 *   currentFirm: import('@/types/firm.types').Firm | null,
 *   setCurrentFirm: Function,
 *   currentBranch: import('@/types/firm.types').Branch | null,
 *   switchBranch: (branch: import('@/types/firm.types').Branch) => void,
 *   branches: import('@/types/firm.types').Branch[],
 *   setBranches: Function,
 * }}
 */
export function useFirm() {
  const context = useContext(FirmContext);
  if (!context) {
    throw new Error("useFirm must be used within a FirmProvider");
  }
  return context;
}
