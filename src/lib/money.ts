/**
 * Money and rounding helpers.
 *
 * The project's rule is that every answer is displayed and marked at 2 decimal
 * places. Two consequences:
 *
 *   1. Money is often carried as integer minor units ("cents") in generators,
 *      so that a value is exactly representable and no rounding decision is ever
 *      made twice. This is what makes the parity game's "exact to the penny"
 *      requirement easy to satisfy.
 *   2. Rounding is half-away-from-zero, implemented on scaled integers, so it
 *      does not inherit the binary-representation surprises of naive
 *      Math.round(x * 100) / 100 (which mis-rounds values such as 1.005).
 */

/** Round half-up (away from zero) to a given number of decimals. */
export function roundTo(value: number, decimals: number): number {
  if (!Number.isFinite(value)) return value;
  const factor = 10 ** decimals;
  const scaled = value * factor;
  // Nudge only to correct representation error in the multiply, never enough to
  // move a value that is genuinely near a boundary.
  const nudged = scaled + Math.sign(scaled) * 1e-9;
  return Math.round(nudged) / factor;
}

export function round2(value: number): number {
  return roundTo(value, 2);
}

/** Money in minor units (cents). */
export function toCents(value: number): number {
  return Math.round((value + Math.sign(value) * 1e-9) * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

/**
 * Exact multiply-and-divide on integers, so a value derived as a/b never drifts.
 * Throws rather than silently losing precision if the product leaves the safe
 * integer range, since that would break reproducibility.
 */
export function mulDiv(value: number, numerator: number, denominator: number): number {
  if (!Number.isInteger(value) || !Number.isInteger(numerator) || !Number.isInteger(denominator)) {
    throw new Error('mulDiv requires integer arguments');
  }
  if (denominator === 0) throw new Error('mulDiv division by zero');
  const product = value * numerator;
  if (!Number.isSafeInteger(product)) {
    throw new Error(`mulDiv overflow: ${value} * ${numerator}`);
  }
  return Math.round(product / denominator);
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: 'US$',
  SGD: 'S$',
  HKD: 'HK$',
  JPY: '¥',
  AUD: 'A$',
  CHF: 'CHF ',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  CNY: 'CNY ',
  CNH: 'CNH ',
};

export function currencySymbol(code?: string): string {
  if (!code) return '';
  return CURRENCY_SYMBOLS[code] ?? `${code} `;
}

/**
 * Money for display. Grouped with commas and always shown to 2dp, because the
 * drills are about the number, not about formatting.
 */
export function formatMoney(value: number, currency?: string, decimals = 2): string {
  const sign = value < 0 ? '−' : '';
  const abs = Math.abs(value);
  const grouped = abs.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${sign}${currencySymbol(currency)}${grouped}`;
}

/**
 * A plain number for display, grouped. Intentionally ASCII-safe: this is a
 * numeric-answer drill, so thousands separators matter and localised digits
 * would be a liability.
 */
export function formatNumber(value: number, decimals = 2): string {
  return formatMoney(value, undefined, decimals);
}

/**
 * Whether a value is exactly representable at the given number of decimals.
 *
 * Used to assert that generated answers never sit on a half-penny boundary.
 * That matters because transcendental functions may differ in the last bit
 * across engines; if an answer is not exactly representable, two engines could
 * round it to different values and mark the same answer differently.
 */
export function isExactAt(value: number, decimals: number): boolean {
  const factor = 10 ** decimals;
  const scaled = value * factor;
  return Math.abs(scaled - Math.round(scaled)) < 1e-6;
}
