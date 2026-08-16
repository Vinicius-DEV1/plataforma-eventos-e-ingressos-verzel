import { Prisma } from '../generated/prisma/client';
import { ReservationStatus, SeatStatus } from '../generated/prisma/enums';
import { now } from '../utils/datetime';

// Lazy expiration (SPEC.md §2.3): run inside the same transaction as
// whatever operation depends on availability, right before checking or
// disputing it — GET /eventos/:id/assentos, GET /eventos/:id,
// POST /reservas/assento, POST /reservas/quantidade. No cron job or worker:
// correctness only has to hold at the moment availability is read.
export async function expireStaleReservations(
  tx: Prisma.TransactionClient,
  eventId: string,
): Promise<void> {
  const stale = await tx.reservation.findMany({
    where: {
      eventId,
      status: ReservationStatus.PENDING,
      expiresAt: { lt: now() },
    },
    select: { id: true, seatId: true, quantity: true },
  });

  if (stale.length === 0) return;

  await tx.reservation.updateMany({
    where: { id: { in: stale.map((reservation) => reservation.id) } },
    data: { status: ReservationStatus.EXPIRED },
  });

  const seatIds = stale
    .map((reservation) => reservation.seatId)
    .filter((seatId): seatId is string => seatId !== null);
  if (seatIds.length > 0) {
    await tx.seat.updateMany({
      where: { id: { in: seatIds } },
      data: { status: SeatStatus.AVAILABLE },
    });
  }

  const quantityToReturn = stale.reduce(
    (sum, reservation) => sum + (reservation.quantity ?? 0),
    0,
  );
  if (quantityToReturn > 0) {
    await tx.event.update({
      where: { id: eventId },
      data: { availableTickets: { increment: quantityToReturn } },
    });
  }
}
