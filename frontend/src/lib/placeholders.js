/**
 * Centralized Placeholders System
 * 
 * Provides quick access to all UI placeholder values configured in
 * src/config/placeholders.json.
 * 
 * Usage:
 *   import { placeholders } from "@/lib/placeholders";
 *   <Input placeholder={placeholders.sales.partySearch} />
 * 
 * Or with safe dot-path helper:
 *   import { getPlaceholder } from "@/lib/placeholders";
 *   <Input placeholder={getPlaceholder("sales.partySearch", "Search...")} />
 */

import placeholdersData from "@/config/placeholders.json";

/**
 * Access the parsed placeholders object directly
 */
export const placeholders = placeholdersData;

/**
 * Get a placeholder string by dot-notation key path with an optional fallback.
 * @param {string} path - Dot notation key, e.g. "sales.partySearch"
 * @param {string} [fallback=""] - Fallback string if key is not found
 * @returns {string}
 */
export function getPlaceholder(path, fallback = "") {
  if (!path || typeof path !== "string") return fallback;
  const parts = path.split(".");
  let current = placeholdersData;
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      return fallback;
    }
  }
  return typeof current === "string" ? current : fallback;
}

export default placeholdersData;
