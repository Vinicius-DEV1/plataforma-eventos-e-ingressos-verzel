import type { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import {
  EventStatus,
  EventType,
  ReservationStatus,
  SeatStatus,
} from '../generated/prisma/enums';
import { expireStaleReservations } from '../services/reservationExpiration.service';
import { reservationExpiresAt } from '../utils/datetime';

// Carries the HTTP status the failure should map to, so the transaction can
// throw from wherever the problem is found and the controller maps it to a
// response in one place — throwing also rolls back the transaction, which
// is exactly what an aborted reservation attempt needs (SPEC.md §2.1).
class ReservationError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function serializeReservation<T extends { totalAmount: unknown }>(
  reservation: T,
): Omit<T, 'totalAmount'> & { totalAmount: number } {
  return { ...reservation, totalAmount: Number(reservation.totalAmount) };
}

type CreateSeatReservationBody = {
  eventId?: string;
  seatId?: string;
};

export async function createSeatReservation(req: Request, res: Response) {
  const { eventId, seatId } = req.body as CreateSeatReservationBody;

  if (!eventId || !seatId) {
    res.status(400).json({ message: 'eventId e seatId são obrigatórios.' });
    return;
  }

  try {
    const reservation = await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event) {
        throw new ReservationError(404, 'Evento não encontrado.');
      }
      if (event.status !== EventStatus.PUBLISHED) {
        throw new ReservationError(409, 'Este evento foi cancelado.');
      }
      if (event.type !== EventType.CINEMA) {
        throw new ReservationError(
          400,
          'Este evento não usa reserva por assento.',
        );
      }

      await expireStaleReservations(tx, eventId);

      const seat = await tx.seat.findUnique({ where: { id: seatId } });
      if (!seat || seat.eventId !== eventId) {
        throw new ReservationError(404, 'Assento não encontrado neste evento.');
      }

      // The conditional update is what actually resolves the race: only one
      // of two concurrent requests for the same seat affects a row here.
      const { count } = await tx.seat.updateMany({
        where: { id: seatId, status: SeatStatus.AVAILABLE },
        data: { status: SeatStatus.RESERVED },
      });
      if (count === 0) {
        throw new ReservationError(
          409,
          'Assento já está reservado ou vendido.',
        );
      }

      return tx.reservation.create({
        data: {
          eventId,
          customerId: req.user!.id,
          seatId,
          status: ReservationStatus.PENDING,
          totalAmount: event.basePrice,
          expiresAt: reservationExpiresAt(),
        },
      });
    });

    res.status(201).json(serializeReservation(reservation));
  } catch (err) {
    if (err instanceof ReservationError) {
      res.status(err.status).json({ message: err.message });
      return;
    }
    throw err;
  }
}

type CreateQuantityReservationBody = {
  eventId?: string;
  quantity?: number;
};

export async function createQuantityReservation(req: Request, res: Response) {
  const { eventId, quantity } = req.body as CreateQuantityReservationBody;

  if (
    !eventId ||
    typeof quantity !== 'number' ||
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {
    res.status(400).json({
      message:
        'eventId é obrigatório e quantity precisa ser um inteiro positivo.',
    });
    return;
  }

  try {
    const reservation = await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event) {
        throw new ReservationError(404, 'Evento não encontrado.');
      }
      if (event.status !== EventStatus.PUBLISHED) {
        throw new ReservationError(409, 'Este evento foi cancelado.');
      }
      if (event.type !== EventType.SHOW) {
        throw new ReservationError(
          400,
          'Este evento não usa reserva por quantidade.',
        );
      }

      await expireStaleReservations(tx, eventId);

      // Same strategy as the seat's conditional update (SPEC.md §2.1):
      // folding the availability check into the WHERE clause of the write
      // makes the check-and-decrement atomic, so concurrent requests can't
      // oversell (SPEC.md §2.2).
      const { count } = await tx.event.updateMany({
        where: { id: eventId, availableTickets: { gte: quantity } },
        data: { availableTickets: { decrement: quantity } },
      });
      if (count === 0) {
        throw new ReservationError(409, 'Ingressos insuficientes disponíveis.');
      }

      return tx.reservation.create({
        data: {
          eventId,
          customerId: req.user!.id,
          quantity,
          status: ReservationStatus.PENDING,
          totalAmount: Number(event.basePrice) * quantity,
          expiresAt: reservationExpiresAt(),
        },
      });
    });

    res.status(201).json(serializeReservation(reservation));
  } catch (err) {
    if (err instanceof ReservationError) {
      res.status(err.status).json({ message: err.message });
      return;
    }
    throw err;
  }
}

export async function listMyReservations(req: Request, res: Response) {
  const reservations = await prisma.reservation.findMany({
    where: { customerId: req.user!.id },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ items: reservations.map(serializeReservation) });
}
