"use client";

import { useAuth } from "@/contexts/auth-context";

/**
 * Check if the current user has a specific permission
 * @param {string} code - Permission code (e.g., "Sales.View")
 * @returns {boolean}
 */
export function usePermission(code) {
  const { hasPermission } = useAuth();
  return hasPermission(code);
}

/**
 * Check multiple permissions at once
 * @param {string[]} codes - Array of permission codes
 * @returns {Record<string, boolean>}
 */
export function usePermissions(codes) {
  const { hasPermission } = useAuth();
  const result = {};
  codes.forEach((code) => {
    result[code] = hasPermission(code);
  });
  return result;
}
