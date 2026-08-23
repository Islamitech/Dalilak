/**
 * Dynamic Percentage Commission Utility:
 * Calculates representative earnings strictly as a percentage (%) of collected payments.
 */

export const DEFAULT_COMMISSION_RATE = 42.86; // Default 42.86% rate

/**
 * Returns full potential commission amount for a package based on commission percentage rate.
 */
export function getPackageCommission(packagePrice: number, rate: number = DEFAULT_COMMISSION_RATE): number {
  const price = packagePrice || 250;
  const commissionRate = rate || DEFAULT_COMMISSION_RATE;
  return Math.round((price * commissionRate) / 100);
}

/**
 * Calculates actual earned commission dynamically based on collected amount and percentage rate.
 */
export function calculateBusinessCommission(
  packagePrice: number,
  amountPaid: number,
  rate: number = DEFAULT_COMMISSION_RATE
): number {
  const paid = amountPaid || 0;
  const commissionRate = rate || DEFAULT_COMMISSION_RATE;
  return Math.round((paid * commissionRate) / 100);
}

/**
 * Calculates total earned commission for all business registrations based on percentage rate.
 */
export function calculateTotalRepCommission(
  businesses: Array<{ packagePrice: number; amountPaid: number }>,
  rate: number = DEFAULT_COMMISSION_RATE
): number {
  const commissionRate = rate || DEFAULT_COMMISSION_RATE;
  return businesses.reduce((sum, b) => {
    return sum + calculateBusinessCommission(b.packagePrice, b.amountPaid, commissionRate);
  }, 0);
}
