import type { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { TicketStatus } from '../generated/prisma/enums';
import { verifyTicketToken } from '../services/ticket.service';

type ValidateTicketBody = {
  code?: string;
  eventId?: string;
};

type ValidationResult = 'valid' | 'invalid' | 'already_used' | 'wrong_event';

export async function validateTicket(req: Request, res: Response) {
  const { code, eventId } = req.body as ValidateTicketBody;

  if (!code || !eventId) {
    res.status(400).json({ message: 'code e eventId são obrigatórios.' });
    return;
  }

  let payload;
  try {
    payload = verifyTicketToken(code);
  } catch {
    // Assinatura inválida — nem consulta o banco (SPEC.md §3.2).
    const result: ValidationResult = 'invalid';
    res.json({ result });
    return;
  }

  if (payload.eventId !== eventId) {
    const result: ValidationResult = 'wrong_event';
    res.json({ result });
    return;
  }

  const result = await prisma.$transaction(
    async (tx): Promise<ValidationResult> => {
      const ticket = await tx.ticket.findUnique({
        where: { id: payload.ticketId },
      });
      if (!ticket || ticket.status === TicketStatus.CANCELLED) {
        return 'invalid';
      }
      if (ticket.status === TicketStatus.USED) {
        return 'already_used';
      }

      // Update condicional dentro da transação: impede que duas leituras
      // simultâneas do mesmo QR marquem ambas como usadas (SPEC.md §3.2).
      const { count } = await tx.ticket.updateMany({
        where: { id: ticket.id, status: TicketStatus.VALID },
        data: {
          status: TicketStatus.USED,
          validatedAt: new Date(),
          validatedById: req.user!.id,
        },
      });
      return count === 1 ? 'valid' : 'already_used';
    },
  );

  res.json({ result });
}
