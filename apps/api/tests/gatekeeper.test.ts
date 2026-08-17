import jwt from 'jsonwebtoken';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';
import { Role, TicketStatus } from '../src/generated/prisma/enums';
import { generateTicketToken } from '../src/services/ticket.service';
import { reservationExpiresAt } from '../src/utils/datetime';
import {
  authHeader,
  createCinemaEvent,
  createUser,
  firstAvailableSeat,
} from './helpers/factories';

const app = createApp();

async function issueValidTicket() {
  const organizer = await createUser(Role.ORGANIZER);
  const customer = await createUser(Role.CUSTOMER);
  const event = await createCinemaEvent(organizer.id);
  const seat = await firstAvailableSeat(event.id);

  const reservation = await prisma.reservation.create({
    data: {
      eventId: event.id,
      customerId: customer.id,
      seatId: seat.id,
      status: 'PAID',
      totalAmount: 40,
      expiresAt: reservationExpiresAt(),
    },
  });

  const ticket = await prisma.ticket.create({
    data: { reservationId: reservation.id, qrCode: '' },
  });
  const qrCode = generateTicketToken(ticket.id, event.id);
  await prisma.ticket.update({ where: { id: ticket.id }, data: { qrCode } });

  return { event, ticket, qrCode };
}

describe('validação na portaria', () => {
  it('aceita um QR com assinatura válida e marca o ingresso como utilizado', async () => {
    const gatekeeper = await createUser(Role.GATEKEEPER);
    const { event, ticket, qrCode } = await issueValidTicket();

    const response = await request(app)
      .post('/portaria/validar')
      .set(...authHeader(gatekeeper.token))
      .send({ code: qrCode, eventId: event.id });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ result: 'valid' });

    const depois = await prisma.ticket.findUniqueOrThrow({
      where: { id: ticket.id },
    });
    expect(depois.status).toBe(TicketStatus.USED);
    expect(depois.validatedAt).not.toBeNull();
    expect(depois.validatedById).toBe(gatekeeper.id);
  });

  it('recusa um QR assinado com outra chave', async () => {
    const gatekeeper = await createUser(Role.GATEKEEPER);
    const { event, ticket } = await issueValidTicket();

    // Mesmo payload, chave errada: é exatamente o que alguém tentando
    // forjar um ingresso conseguiria montar sem o segredo do servidor.
    const forjado = jwt.sign(
      { ticketId: ticket.id, eventId: event.id },
      'chave-de-quem-esta-forjando',
    );

    const response = await request(app)
      .post('/portaria/validar')
      .set(...authHeader(gatekeeper.token))
      .send({ code: forjado, eventId: event.id });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ result: 'invalid' });

    const depois = await prisma.ticket.findUniqueOrThrow({
      where: { id: ticket.id },
    });
    expect(depois.status).toBe(TicketStatus.VALID);
  });

  it('recusa um ingresso já utilizado e um ingresso de outro evento', async () => {
    const gatekeeper = await createUser(Role.GATEKEEPER);
    const { event, qrCode } = await issueValidTicket();

    await request(app)
      .post('/portaria/validar')
      .set(...authHeader(gatekeeper.token))
      .send({ code: qrCode, eventId: event.id });

    const segunda = await request(app)
      .post('/portaria/validar')
      .set(...authHeader(gatekeeper.token))
      .send({ code: qrCode, eventId: event.id });
    expect(segunda.body).toEqual({ result: 'already_used' });

    const outroOrganizador = await createUser(Role.ORGANIZER);
    const outroEvento = await createCinemaEvent(outroOrganizador.id);
    const emOutraPorta = await request(app)
      .post('/portaria/validar')
      .set(...authHeader(gatekeeper.token))
      .send({ code: qrCode, eventId: outroEvento.id });
    expect(emOutraPorta.body).toEqual({ result: 'wrong_event' });
  });
});
