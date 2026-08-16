import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
import type { Prisma } from '../generated/prisma/client';

export type TicketTokenPayload = {
  ticketId: string;
  eventId: string;
};

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'JWT_SECRET is not set. Copy apps/api/.env.example to .env.',
    );
  }
  return secret;
}

// No expiresIn: unlike the session token (token.service.ts), a ticket's
// validity is driven entirely by Ticket.status in the database (SPEC.md
// §3.2), not by the token's own lifetime — it must still verify on the
// event date, whenever that is.
export function generateTicketToken(ticketId: string, eventId: string): string {
  const payload: TicketTokenPayload = { ticketId, eventId };
  return jwt.sign(payload, getSecret());
}

export function verifyTicketToken(token: string): TicketTokenPayload {
  return jwt.verify(token, getSecret()) as TicketTokenPayload;
}

// The JWT text itself is what gets encoded, and it's also what's stored in
// Ticket.qrCode (SPEC.md §3.1) — the image is a rendering, not the source
// of truth.
export function renderQrCode(token: string): Promise<string> {
  return QRCode.toDataURL(token);
}

// Called from payments.controller.ts's resolvePayment when a payment is
// CONFIRMED. The ticket row is created first (id assigned by the database)
// so the JWT payload can carry that id — a placeholder qrCode is
// overwritten by the update right after, both inside the same transaction
// as the rest of the payment resolution.
export async function issueTickets(
  tx: Prisma.TransactionClient,
  reservationId: string,
  eventId: string,
  count: number,
) {
  const tickets = [];
  for (let i = 0; i < count; i++) {
    const ticket = await tx.ticket.create({
      data: { reservationId, qrCode: '' },
    });
    const qrCode = generateTicketToken(ticket.id, eventId);
    tickets.push(
      await tx.ticket.update({ where: { id: ticket.id }, data: { qrCode } }),
    );
  }
  return tickets;
}
