// ── Shared booking calculation utilities ──────────────────────────────────────
// Used by both checkout/page.tsx and booking/confirmation/page.tsx so that
// a change to the service-fee rate or night-diff formula applies once.

/**
 * Calculates the number of nights between two ISO date strings.
 * Returns 1 if either date is missing / invalid, or if the diff is < 1.
 */
export function calcNights(checkIn: string | undefined, checkOut: string | undefined): number {
  if (!checkIn || !checkOut) return 1;
  const diff = Math.floor(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000
  );
  return Math.max(1, diff);
}

/**
 * Calculates booking cost breakdown.
 * @param pricePerNight  Room price per night in NGN
 * @param nights         Number of nights (use calcNights())
 * @returns { subtotal, fee, total }
 */
export function calcBookingCost(
  pricePerNight: number,
  nights: number
): { subtotal: number; fee: number; total: number } {
  const subtotal = pricePerNight * nights;
  const fee = Math.round(subtotal * 0.03);
  const total = subtotal + fee;
  return { subtotal, fee, total };
}
