import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with clsx
 * @param  {...any} inputs - Class values to merge
 * @returns {string} Merged class string
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as currency
 * @param {number} amount
 * @param {string} currency - ISO 4217 currency code
 * @param {string} locale - BCP 47 locale string
 * @returns {string}
 */
export function formatCurrency(amount, currency = "INR", locale = "en-IN") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Format a date string
 * @param {string|Date} date
 * @param {Intl.DateTimeFormatOptions} options
 * @param {string} locale
 * @returns {string}
 */
export function formatDate(date, options = {}, locale = "en-IN") {
  const defaultOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  };
  return new Intl.DateTimeFormat(locale, defaultOptions).format(new Date(date));
}

/**
 * Format a date with time
 * @param {string|Date} date
 * @param {string} locale
 * @returns {string}
 */
export function formatDateTime(date, locale = "en-IN") {
  return formatDate(date, {
    hour: "2-digit",
    minute: "2-digit",
  }, locale);
}

/**
 * Capitalize the first letter of a string
 * @param {string} str
 * @returns {string}
 */
export function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Generate initials from a name
 * @param {string} name
 * @returns {string}
 */
export function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Debounce a function
 * @param {Function} fn
 * @param {number} delay - Milliseconds
 * @returns {Function}
 */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Truncate a string to a max length
 * @param {string} str
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(str, maxLength = 50) {
  if (!str || str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "…";
}

/**
 * Convert a number to Indian currency words
 * @param {number} num
 * @returns {string}
 */
export function numberToWords(num) {
  const n = Math.round(Number(num) || 0);
  if (n === 0) return "Zero Rupees Only";
  if (n < 0) return "Negative " + numberToWords(Math.abs(n));

  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function inWords(val) {
    if (val < 20) return a[val];
    if (val < 100) return b[Math.floor(val / 10)] + (val % 10 !== 0 ? " " + a[val % 10] : "");
    if (val < 1000) return a[Math.floor(val / 100)] + " Hundred" + (val % 100 !== 0 ? " " + inWords(val % 100) : "");
    if (val < 100000) return inWords(Math.floor(val / 1000)) + " Thousand" + (val % 1000 !== 0 ? " " + inWords(val % 1000) : "");
    if (val < 10000000) return inWords(Math.floor(val / 100000)) + " Lakh" + (val % 100000 !== 0 ? " " + inWords(val % 100000) : "");
    return inWords(Math.floor(val / 10000000)) + " Crore" + (val % 10000000 !== 0 ? " " + inWords(val % 10000000) : "");
  }

  return inWords(n) + " Rupees Only";
}
