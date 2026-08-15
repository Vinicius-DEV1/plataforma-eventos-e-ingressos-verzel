/**
 * Time-sensitive business rules live here so no controller has to do date
 * arithmetic of its own. Everything is computed in UTC: the process runs with
 * TZ=UTC and Prisma stores UTC, so `Date` values carry no local offset
 * (PRD §3.13).
 */

/** Minutes a reservation stays open before expiring unpaid (PRD §3.10). */
export const RESERVATION_TTL_MINUTES = 15;

/** Hours before the event after which the customer can no longer cancel (PRD §3.8). */
export const CANCELLATION_WINDOW_HOURS = 24;

export function now(): Date {
  return new Date();
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

/** Deadline for paying a reservation created at `createdAt`. */
export function reservationExpiresAt(createdAt: Date = now()): Date {
  return addMinutes(createdAt, RESERVATION_TTL_MINUTES);
}

export function hasExpired(expiresAt: Date, reference: Date = now()): boolean {
  return expiresAt.getTime() <= reference.getTime();
}

/** Whether the event is still far enough away for the customer to cancel. */
export function isWithinCancellationWindow(
  eventStartsAt: Date,
  reference: Date = now(),
): boolean {
  const hoursUntilEvent =
    (eventStartsAt.getTime() - reference.getTime()) / 3_600_000;

  return hoursUntilEvent >= CANCELLATION_WINDOW_HOURS;
}
