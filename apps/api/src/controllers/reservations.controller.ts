import type { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import {
  EventStatus,
  EventType,
  PaymentStatus,
  ReservationStatus,
  SeatStatus,
  TicketStatus,
} from '../generated/prisma/enums';
import * as asaas from '../integrations/asaas.client';
import { expireStaleReservations } from '../services/reservationExpiration.service';
import {
  isWithinCancellationWindow,
  reservationExpiresAt,
} from '../utils/datetime';

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

export async function cancelReservation(req: Request, res: Response) {
  const id = req.params.id as string;

  try {
    const reservation = await prisma.$transaction(async (tx) => {
      const existing = await tx.reservation.findUnique({
        where: { id },
        include: { event: true, payment: true },
      });
      if (!existing) {
        throw new ReservationError(404, 'Reserva não encontrada.');
      }
      if (existing.customerId !== req.user!.id) {
        throw new ReservationError(403, 'Esta reserva não pertence a você.');
      }
      // PRD.md §3.8: cancelamento com reembolso, então só se aplica a uma
      // reserva já paga — uma reserva PENDING apenas expira sozinha em 15
      // min (SPEC.md §2.3), sem cobrança para reembolsar.
      if (existing.status !== ReservationStatus.PAID) {
        throw new ReservationError(
          409,
          'Só é possível cancelar uma reserva paga.',
        );
      }
      if (!isWithinCancellationWindow(existing.event.startsAt)) {
        throw new ReservationError(
          409,
          'Cancelamento não é mais permitido: faltam menos de 24 horas para o evento.',
        );
      }

      // Update condicional, mesmo idioma das duas rotas de criação acima:
      // garante que uma segunda requisição para a mesma reserva (duplo
      // clique) não repita a devolução de assento/estoque.
      const { count } = await tx.reservation.updateMany({
        where: { id, status: ReservationStatus.PAID },
        data: { status: ReservationStatus.CANCELLED },
      });
      if (count === 0) {
        throw new ReservationError(409, 'Esta reserva já foi cancelada.');
      }

      if (existing.seatId) {
        await tx.seat.update({
          where: { id: existing.seatId },
          data: { status: SeatStatus.AVAILABLE },
        });
      } else if (existing.quantity) {
        await tx.event.update({
          where: { id: existing.eventId },
          data: { availableTickets: { increment: existing.quantity } },
        });
      }

      // SPEC.md §4.0: todos os ingressos da reserva viram CANCELLED — sem a
      // ressalva de preservar ingressos USED que existe no cancelamento em
      // cascata do organizador (§4.1). Na prática um ticket USED implica
      // que o evento já está em curso, o que por si só já estaria fora da
      // janela de 24h checada acima.
      await tx.ticket.updateMany({
        where: { reservationId: id },
        data: { status: TicketStatus.CANCELLED },
      });

      // Reembolso total simulado (PRD.md §3.8), estornado de verdade na
      // Asaas sandbox — mesma cobrança criada no Bloco 5, não uma segunda
      // simulação isolada.
      if (existing.payment) {
        await asaas.refundPayment(existing.payment.asaasPaymentId);
        await tx.payment.update({
          where: { id: existing.payment.id },
          data: { status: PaymentStatus.REFUNDED },
        });
      }

      return tx.reservation.findUniqueOrThrow({ where: { id } });
    });

    res.json(serializeReservation(reservation));
  } catch (err) {
    if (err instanceof ReservationError) {
      res.status(err.status).json({ message: err.message });
      return;
    }
    throw err;
  }
}
