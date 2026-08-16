import type { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import type { Prisma } from '../generated/prisma/client';
import {
  EventType,
  PaymentStatus,
  ReservationStatus,
  SeatStatus,
} from '../generated/prisma/enums';
import * as asaas from '../integrations/asaas.client';
import { issueTickets } from '../services/ticket.service';
import { hasExpired } from '../utils/datetime';

// Same pattern as ReservationError in reservations.controller.ts: carries
// the HTTP status so the transaction can throw from wherever the problem is
// found, and throwing rolls the transaction back.
class PaymentError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function serializePayment<T extends { amount: unknown }>(
  payment: T,
): Omit<T, 'amount'> & { amount: number } {
  return { ...payment, amount: Number(payment.amount) };
}

// Shared by the real webhook and the dev "simular-callback" endpoint: both
// end up applying the same outcome to the same three records (SPEC.md
// §4.2/§4.3), only the trigger differs.
async function resolvePayment(
  tx: Prisma.TransactionClient,
  paymentId: string,
  outcome: 'CONFIRMED' | 'DECLINED',
) {
  const payment = await tx.payment.findUnique({
    where: { id: paymentId },
    include: { reservation: true },
  });
  if (!payment) {
    throw new PaymentError(404, 'Pagamento não encontrado.');
  }
  if (payment.status !== PaymentStatus.PENDING) {
    throw new PaymentError(409, 'Pagamento já foi resolvido.');
  }

  await tx.payment.update({
    where: { id: payment.id },
    data: { status: outcome },
  });

  if (outcome === 'CONFIRMED') {
    await tx.reservation.update({
      where: { id: payment.reservationId },
      data: { status: ReservationStatus.PAID },
    });
    if (payment.reservation.seatId) {
      await tx.seat.update({
        where: { id: payment.reservation.seatId },
        data: { status: SeatStatus.SOLD },
      });
    }

    // One ticket per entry (SPEC.md §3.1, PRD.md §3.7): 1 for a CINEMA seat,
    // `quantity` for a SHOW reservation.
    const entries = payment.reservation.seatId
      ? 1
      : (payment.reservation.quantity ?? 1);
    await issueTickets(
      tx,
      payment.reservationId,
      payment.reservation.eventId,
      entries,
    );
    return;
  }

  // DECLINED: SPEC.md §4.3 — the reservation ends here, no retry, and the
  // seat/stock goes back to the market immediately.
  await tx.reservation.update({
    where: { id: payment.reservationId },
    data: { status: ReservationStatus.DECLINED },
  });
  if (payment.reservation.seatId) {
    await tx.seat.update({
      where: { id: payment.reservation.seatId },
      data: { status: SeatStatus.AVAILABLE },
    });
  } else if (payment.reservation.quantity) {
    await tx.event.update({
      where: { id: payment.reservation.eventId },
      data: { availableTickets: { increment: payment.reservation.quantity } },
    });
  }
}

type ProcessPaymentBody = {
  method?: 'PIX' | 'CREDIT_CARD';
  card?: asaas.CreditCard;
};

export async function processPayment(req: Request, res: Response) {
  const reservationId = req.params.reservationId as string;
  const { method, card } = req.body as ProcessPaymentBody;

  if (method !== 'PIX' && method !== 'CREDIT_CARD') {
    res
      .status(400)
      .json({ message: 'method precisa ser "PIX" ou "CREDIT_CARD".' });
    return;
  }
  if (
    method === 'CREDIT_CARD' &&
    (!card?.holderName ||
      !card.number ||
      !card.expiryMonth ||
      !card.expiryYear ||
      !card.ccv)
  ) {
    res.status(400).json({ message: 'Dados do cartão incompletos.' });
    return;
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id: reservationId },
        include: { customer: true, event: true, payment: true },
      });
      if (!reservation) {
        throw new PaymentError(404, 'Reserva não encontrada.');
      }
      if (reservation.customerId !== req.user!.id) {
        throw new PaymentError(403, 'Esta reserva não pertence a você.');
      }
      if (reservation.payment) {
        throw new PaymentError(
          409,
          'Esta reserva já tem um pagamento em andamento.',
        );
      }
      if (reservation.status !== ReservationStatus.PENDING) {
        throw new PaymentError(
          409,
          'Esta reserva não está mais pendente de pagamento.',
        );
      }
      if (hasExpired(reservation.expiresAt)) {
        // Not one of the endpoints listed in SPEC.md §2.3, but processing a
        // payment for a window that already closed would create a Payment
        // for a reservation about to be swept up as EXPIRED — release the
        // seat/stock now instead of leaving that inconsistent.
        await tx.reservation.update({
          where: { id: reservation.id },
          data: { status: ReservationStatus.EXPIRED },
        });
        if (reservation.seatId) {
          await tx.seat.update({
            where: { id: reservation.seatId },
            data: { status: SeatStatus.AVAILABLE },
          });
        } else if (reservation.quantity) {
          await tx.event.update({
            where: { id: reservation.eventId },
            data: { availableTickets: { increment: reservation.quantity } },
          });
        }
        throw new PaymentError(409, 'Reserva expirada.');
      }

      const entries =
        reservation.event.type === EventType.CINEMA
          ? 1
          : (reservation.quantity ?? 1);
      const { asaasPaymentId } = await asaas.createPayment(
        reservation.customer.name,
        reservation.customer.email,
        Number(reservation.totalAmount),
        `Reserva ${reservation.id} — ${entries} entrada(s)`,
        method,
      );

      const payment = await tx.payment.create({
        data: {
          reservationId: reservation.id,
          asaasPaymentId,
          status: PaymentStatus.PENDING,
          amount: reservation.totalAmount,
        },
      });

      if (method === 'PIX') {
        // PIX stays PENDING until the webhook, polling, or
        // /simular-callback resolves it (SPEC.md §5.5) — nothing here
        // confirms it synchronously.
        const pix = await asaas.getPixQrCode(asaasPaymentId);
        return { payment, pix };
      }

      // CREDIT_CARD: the sandbox resolves the charge synchronously in this
      // same call — approval/decline is deterministic from the card number
      // used (ASAAS_TEST_CARDS), no webhook involved for this path.
      let outcome: 'CONFIRMED' | 'DECLINED';
      try {
        const { status } = await asaas.payWithCreditCard(
          asaasPaymentId,
          card!,
          reservation.customer.email,
        );
        outcome =
          status === 'CONFIRMED' || status === 'RECEIVED'
            ? 'CONFIRMED'
            : 'DECLINED';
      } catch {
        outcome = 'DECLINED';
      }

      await resolvePayment(tx, payment.id, outcome);
      const resolved = await tx.payment.findUniqueOrThrow({
        where: { id: payment.id },
      });
      return { payment: resolved };
    });

    res
      .status(201)
      .json({ ...serializePayment(result.payment), pix: result.pix });
  } catch (err) {
    if (err instanceof PaymentError) {
      res.status(err.status).json({ message: err.message });
      return;
    }
    throw err;
  }
}

export async function getPayment(req: Request, res: Response) {
  const id = req.params.id as string;

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { reservation: true },
  });
  if (!payment) {
    res.status(404).json({ message: 'Pagamento não encontrado.' });
    return;
  }
  if (payment.reservation.customerId !== req.user!.id) {
    res.status(403).json({ message: 'Este pagamento não pertence a você.' });
    return;
  }

  // The comprovante only makes sense once the charge is settled — no need
  // to call Asaas again on every poll while it's still PENDING.
  const invoiceUrl =
    payment.status === PaymentStatus.CONFIRMED
      ? await asaas.getInvoiceUrl(payment.asaasPaymentId)
      : null;

  res.json({ ...serializePayment(payment), invoiceUrl });
}

type AsaasWebhookBody = {
  event?: string;
  payment?: { id?: string };
};

// [público] — ativo em produção; o Asaas não alcança localhost (SPEC.md
// §5.5), por isso não é exercitado localmente e "simular-callback" existe
// como caminho equivalente para desenvolvimento e testes.
export async function asaasWebhook(req: Request, res: Response) {
  const body = req.body as AsaasWebhookBody;
  const asaasPaymentId = body.payment?.id;
  if (!asaasPaymentId) {
    res.status(400).json({ message: 'payment.id ausente no corpo.' });
    return;
  }

  const payment = await prisma.payment.findFirst({
    where: { asaasPaymentId },
  });
  if (!payment) {
    res.status(404).json({ message: 'Pagamento não encontrado.' });
    return;
  }

  const outcome =
    body.event === 'PAYMENT_CONFIRMED' || body.event === 'PAYMENT_RECEIVED'
      ? 'CONFIRMED'
      : body.event === 'PAYMENT_OVERDUE'
        ? 'DECLINED'
        : null;
  if (!outcome) {
    // Events we don't model (e.g. PAYMENT_CREATED) are acknowledged and
    // ignored rather than treated as an error.
    res.status(200).json({ ignored: true });
    return;
  }

  try {
    await prisma.$transaction((tx) => resolvePayment(tx, payment.id, outcome));
    res.status(200).json({ ok: true });
  } catch (err) {
    if (err instanceof PaymentError) {
      res.status(err.status).json({ message: err.message });
      return;
    }
    throw err;
  }
}

type SimulateCallbackBody = {
  outcome?: 'CONFIRMED' | 'DECLINED';
};

export async function simulateCallback(req: Request, res: Response) {
  const id = req.params.id as string;
  const { outcome } = req.body as SimulateCallbackBody;

  if (outcome !== 'CONFIRMED' && outcome !== 'DECLINED') {
    res
      .status(400)
      .json({ message: 'outcome precisa ser "CONFIRMED" ou "DECLINED".' });
    return;
  }

  try {
    const payment = await prisma.$transaction(async (tx) => {
      const existing = await tx.payment.findUnique({
        where: { id },
        include: { reservation: true },
      });
      if (!existing) {
        throw new PaymentError(404, 'Pagamento não encontrado.');
      }
      if (existing.reservation.customerId !== req.user!.id) {
        throw new PaymentError(403, 'Este pagamento não pertence a você.');
      }

      await resolvePayment(tx, id, outcome);
      return tx.payment.findUniqueOrThrow({ where: { id } });
    });

    res.json(serializePayment(payment));
  } catch (err) {
    if (err instanceof PaymentError) {
      res.status(err.status).json({ message: err.message });
      return;
    }
    throw err;
  }
}
