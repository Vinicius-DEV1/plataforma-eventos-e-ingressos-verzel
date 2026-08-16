import type { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { renderQrCode } from '../services/ticket.service';

type TicketWithReservationEvent = {
  id: string;
  status: string;
  validatedAt: Date | null;
  shareToken: string;
  createdAt: Date;
  reservation: {
    id: string;
    totalAmount: unknown;
    event: {
      id: string;
      title: string;
      venue: string;
      startsAt: Date;
      imageUrl: string;
    };
  };
};

function serializeTicketSummary(ticket: TicketWithReservationEvent) {
  return {
    id: ticket.id,
    status: ticket.status,
    validatedAt: ticket.validatedAt,
    createdAt: ticket.createdAt,
    shareToken: ticket.shareToken,
    reservation: {
      id: ticket.reservation.id,
      totalAmount: Number(ticket.reservation.totalAmount),
    },
    event: ticket.reservation.event,
  };
}

export async function listMyTickets(req: Request, res: Response) {
  const tickets = await prisma.ticket.findMany({
    where: { reservation: { customerId: req.user!.id } },
    include: { reservation: { include: { event: true } } },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ items: tickets.map(serializeTicketSummary) });
}

export async function getTicket(req: Request, res: Response) {
  const id = req.params.id as string;

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: { reservation: { include: { event: true } } },
  });
  if (!ticket) {
    res.status(404).json({ message: 'Ingresso não encontrado.' });
    return;
  }
  if (ticket.reservation.customerId !== req.user!.id) {
    res.status(403).json({ message: 'Este ingresso não pertence a você.' });
    return;
  }

  res.json({
    ...serializeTicketSummary(ticket),
    qrImage: await renderQrCode(ticket.qrCode),
  });
}

// [público] — SPEC.md §5.6: quem acessa o link vê o ingresso completo, sem
// precisar estar logado. Não transfere titularidade (PRD.md §3.7): a
// checagem de dono acima só se aplica à rota autenticada.
export async function getSharedTicket(req: Request, res: Response) {
  const shareToken = req.params.shareToken as string;

  const ticket = await prisma.ticket.findUnique({
    where: { shareToken },
    include: { reservation: { include: { event: true } } },
  });
  if (!ticket) {
    res.status(404).json({ message: 'Ingresso não encontrado.' });
    return;
  }

  res.json({
    ...serializeTicketSummary(ticket),
    qrImage: await renderQrCode(ticket.qrCode),
  });
}
