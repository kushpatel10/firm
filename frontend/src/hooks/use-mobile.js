"use client";

import { useState, useEffect } from "react";

/**
 * Hook to detect mobile viewport
 * @param {number} breakpoint - Mobile breakpoint in px
 * @returns {boolean}
 */
export function useMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);

  return isMobile;
}
