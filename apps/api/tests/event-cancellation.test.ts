jest.mock('../src/integrations/asaas.client');

import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';
import * as asaasModule from '../src/integrations/asaas.client';
import {
  EventStatus,
  ReservationStatus,
  Role,
  SeatStatus,
  TicketStatus,
} from '../src/generated/prisma/enums';
import { stubAsaas } from './helpers/asaas-mock';
import {
  authHeader,
  createCinemaEvent,
  createUser,
  firstAvailableSeat,
} from './helpers/factories';

const app = createApp();
const asaas = jest.mocked(asaasModule);

beforeEach(() => {
  stubAsaas(asaas);
});

describe('cancelamento de evento pelo organizador', () => {
  it('cancela em cascata as reservas, os ingressos e libera os assentos', async () => {
    const organizer = await createUser(Role.ORGANIZER);
    const customer = await createUser(Role.CUSTOMER);
    const event = await createCinemaEvent(organizer.id);
    const seat = await firstAvailableSeat(event.id);

    const reserva = await request(app)
      .post('/reservas/assento')
      .set(...authHeader(customer.token))
      .send({ eventId: event.id, seatId: seat.id });
    expect(reserva.status).toBe(201);

    await request(app)
      .post(`/pagamentos/${reserva.body.id as string}/processar`)
      .set(...authHeader(customer.token))
      .send({
        method: 'CREDIT_CARD',
        card: {
          holderName: 'Cliente Teste',
          number: '4444444444444444',
          expiryMonth: '12',
          expiryYear: '2030',
          ccv: '123',
        },
      })
      .expect(201);

    await request(app)
      .delete(`/eventos/${event.id}`)
      .set(...authHeader(organizer.token))
      .expect(204);

    const evento = await prisma.event.findUniqueOrThrow({
      where: { id: event.id },
    });
    const reservaDepois = await prisma.reservation.findUniqueOrThrow({
      where: { id: reserva.body.id as string },
    });
    const ingressos = await prisma.ticket.findMany({
      where: { reservationId: reserva.body.id as string },
    });
    const assento = await prisma.seat.findUniqueOrThrow({
      where: { id: seat.id },
    });

    expect(evento.status).toBe(EventStatus.CANCELLED);
    expect(reservaDepois.status).toBe(ReservationStatus.CANCELLED);
    expect(ingressos.every((t) => t.status === TicketStatus.CANCELLED)).toBe(
      true,
    );
    expect(assento.status).toBe(SeatStatus.AVAILABLE);
    expect(asaas.refundPayment).toHaveBeenCalledWith('pay_teste');
  });

  it('preserva ingressos já utilizados na cascata', async () => {
    const organizer = await createUser(Role.ORGANIZER);
    const customer = await createUser(Role.CUSTOMER);
    const event = await createCinemaEvent(organizer.id);
    const seat = await firstAvailableSeat(event.id);

    const reserva = await request(app)
      .post('/reservas/assento')
      .set(...authHeader(customer.token))
      .send({ eventId: event.id, seatId: seat.id });

    await request(app)
      .post(`/pagamentos/${reserva.body.id as string}/processar`)
      .set(...authHeader(customer.token))
      .send({
        method: 'CREDIT_CARD',
        card: {
          holderName: 'Cliente Teste',
          number: '4444444444444444',
          expiryMonth: '12',
          expiryYear: '2030',
          ccv: '123',
        },
      })
      .expect(201);

    // Quem já entrou não perde o registro de ter entrado (SPEC.md §4.1).
    await prisma.ticket.updateMany({
      where: { reservationId: reserva.body.id as string },
      data: { status: TicketStatus.USED, validatedAt: new Date() },
    });

    await request(app)
      .delete(`/eventos/${event.id}`)
      .set(...authHeader(organizer.token))
      .expect(204);

    const ingressos = await prisma.ticket.findMany({
      where: { reservationId: reserva.body.id as string },
    });
    expect(ingressos.every((t) => t.status === TicketStatus.USED)).toBe(true);
  });
});
