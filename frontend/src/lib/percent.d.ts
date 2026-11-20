/**
 * Percent formatting utilities (FA).
 *
 * Requirements:
 * - Display with **max 1 decimal** and **min 0 decimals**.
 * - Prevent showing `0٪` for tiny negative values by clamping to **-0.1٪**.
 */
/**
 * Normalize a percent value for display:
 * - Round to 1 decimal.
 * - If the real value is negative but rounds to 0 (e.g. -0.03 -> -0.0), force -0.1.
 */
export declare function normalizePercentForDisplay(rawPercent: number): number;
/**
 * Compute percent (0..100, can be negative when negative marking applies)
 * from netCorrect / total.
 */
export declare function computePercent(netCorrect: number, total: number): number;
/** Format a percent number for FA locale (adds the Persian percent sign). */
export declare function formatPercentFa(percent: number): string;
/** Convenience: compute and format percent from netCorrect / total. */
export declare function computePercentDisplay(netCorrect: number, total: number): string;
