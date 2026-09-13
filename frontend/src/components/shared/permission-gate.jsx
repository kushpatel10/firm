"use client";

import { useAuth } from "@/contexts/auth-context";

/**
 * Permission gate — only renders children if user has the required permission.
 * @param {Object} props
 * @param {string} [props.permission] - Single permission code
 * @param {string[]} [props.permissions] - Multiple permission codes (any match)
 * @param {React.ReactNode} [props.fallback] - Rendered if no permission
 * @param {React.ReactNode} props.children
 */
export function PermissionGate({ permission, permissions, fallback = null, children }) {
  const { hasPermission, hasAnyPermission } = useAuth();

  if (permission && !hasPermission(permission)) {
    return fallback;
  }

  if (permissions && !hasAnyPermission(permissions)) {
    return fallback;
  }

  return children;
}
