/**
 * Percent formatting utilities (FA).
 *
 * Requirements:
 * - Display with **max 1 decimal** and **min 0 decimals**.
 * - Prevent showing `0٪` for tiny negative values by clamping to **-0.1٪**.
 */

const faPercentFormatter = new Intl.NumberFormat("fa-IR", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
});

/**
 * Normalize a percent value for display:
 * - Round to 1 decimal.
 * - If the real value is negative but rounds to 0 (e.g. -0.03 -> -0.0), force -0.1.
 */
export function normalizePercentForDisplay(rawPercent: number): number {
  if (!Number.isFinite(rawPercent)) return 0;

  const rounded = Math.round(rawPercent * 10) / 10;
  // NOTE: `-0` is equal to `0`, so use raw sign check.
  if (rawPercent < 0 && rounded === 0) return -0.1;
  return rounded;
}

/**
 * Compute percent (0..100, can be negative when negative marking applies)
 * from netCorrect / total.
 */
export function computePercent(netCorrect: number, total: number): number {
  const t = Number.isFinite(total) && total > 0 ? total : 0;
  const nc = Number.isFinite(netCorrect) ? netCorrect : 0;
  const raw = t ? (nc / t) * 100 : 0;
  return normalizePercentForDisplay(raw);
}

/** Format a percent number for FA locale (adds the Persian percent sign). */
export function formatPercentFa(percent: number): string {
  const v = normalizePercentForDisplay(percent);
  return `${faPercentFormatter.format(v)}٪`;
}

/** Convenience: compute and format percent from netCorrect / total. */
export function computePercentDisplay(netCorrect: number, total: number): string {
  return formatPercentFa(computePercent(netCorrect, total));
}
