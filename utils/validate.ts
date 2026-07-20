export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Parse a user-entered money amount ("1,000", "$500") into a number.
 * Returns null when the input isn't a valid non-negative amount.
 */
export function parseMoney(input: string): number | null {
  const n = parseFloat(input.replace(/[$,\s]/g, ""));
  return isNaN(n) || n < 0 ? null : n;
}
