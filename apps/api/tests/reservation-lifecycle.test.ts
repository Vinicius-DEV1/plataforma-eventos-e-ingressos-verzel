jest.mock('../src/integrations/asaas.client');

import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';
import * as asaasModule from '../src/integrations/asaas.client';
import {
  PaymentStatus,
  ReservationStatus,
  Role,
  SeatStatus,
  TicketStatus,
} from '../src/generated/prisma/enums';
import { addDays, addMinutes } from '../src/utils/datetime';
import { stubAsaas } from './helpers/asaas-mock';
import {
  authHeader,
  createCinemaEvent,
  createShowEvent,
  createUser,
  firstAvailableSeat,
} from './helpers/factories';

const app = createApp();
const asaas = jest.mocked(asaasModule);

beforeEach(() => {
  stubAsaas(asaas);
});

const CARD = {
  holderName: 'Cliente Teste',
  number: '4444444444444444',
  expiryMonth: '12',
  expiryYear: '2030',
  ccv: '123',
};

describe('ciclo de vida da reserva', () => {
  it('devolve o assento ao estoque quando a reserva expira sem pagamento', async () => {
    const organizer = await createUser(Role.ORGANIZER);
    const customer = await createUser(Role.CUSTOMER);
    const event = await createCinemaEvent(organizer.id);
    const seat = await firstAvailableSeat(event.id);

    const criada = await request(app)
      .post('/reservas/assento')
      .set(...authHeader(customer.token))
      .send({ eventId: event.id, seatId: seat.id });
    expect(criada.status).toBe(201);

    // Envelhece a reserva em vez de esperar 15 minutos reais. O prazo em si
    // é do relógio; o que este teste prova é a devolução do lugar.
    await prisma.reservation.update({
      where: { id: criada.body.id as string },
      data: { expiresAt: addMinutes(new Date(), -1) },
    });

    // A expiração é lazy (SPEC.md §2.3): acontece na próxima leitura de
    // disponibilidade, não num worker.
    await request(app).get(`/eventos/${event.id}/assentos`).expect(200);

    const reserva = await prisma.reservation.findUniqueOrThrow({
      where: { id: criada.body.id as string },
    });
    const assento = await prisma.seat.findUniqueOrThrow({
      where: { id: seat.id },
    });
    expect(reserva.status).toBe(ReservationStatus.EXPIRED);
    expect(assento.status).toBe(SeatStatus.AVAILABLE);
  });

  it('emite N ingressos para uma reserva de quantidade N', async () => {
    const organizer = await createUser(Role.ORGANIZER);
    const customer = await createUser(Role.CUSTOMER);
    const event = await createShowEvent(organizer.id);

    const reserva = await request(app)
      .post('/reservas/quantidade')
      .set(...authHeader(customer.token))
      .send({ eventId: event.id, quantity: 4 });
    expect(reserva.status).toBe(201);

    await request(app)
      .post(`/pagamentos/${reserva.body.id as string}/processar`)
      .set(...authHeader(customer.token))
      .send({ method: 'CREDIT_CARD', card: CARD })
      .expect(201);

    const ingressos = await prisma.ticket.findMany({
      where: { reservationId: reserva.body.id as string },
    });
    expect(ingressos).toHaveLength(4);
    expect(ingressos.every((ticket) => ticket.qrCode.length > 0)).toBe(true);
  });

  it('encerra a reserva e devolve o estoque quando o pagamento é recusado', async () => {
    asaas.payWithCreditCard.mockResolvedValue({ status: 'DECLINED' });

    const organizer = await createUser(Role.ORGANIZER);
    const customer = await createUser(Role.CUSTOMER);
    const event = await createShowEvent(organizer.id, { availableTickets: 10 });

    const reserva = await request(app)
      .post('/reservas/quantidade')
      .set(...authHeader(customer.token))
      .send({ eventId: event.id, quantity: 2 });
    expect(reserva.status).toBe(201);

    await request(app)
      .post(`/pagamentos/${reserva.body.id as string}/processar`)
      .set(...authHeader(customer.token))
      .send({ method: 'CREDIT_CARD', card: CARD })
      .expect(201);

    const depois = await prisma.reservation.findUniqueOrThrow({
      where: { id: reserva.body.id as string },
    });
    const evento = await prisma.event.findUniqueOrThrow({
      where: { id: event.id },
    });
    const ingressos = await prisma.ticket.findMany({
      where: { reservationId: reserva.body.id as string },
    });

    expect(depois.status).toBe(ReservationStatus.DECLINED);
    expect(evento.availableTickets).toBe(10);
    expect(ingressos).toHaveLength(0);
  });

  it('cancela dentro do prazo, estorna e invalida os ingressos', async () => {
    const organizer = await createUser(Role.ORGANIZER);
    const customer = await createUser(Role.CUSTOMER);
    const event = await createShowEvent(organizer.id, {
      startsAt: addDays(new Date(), 5),
      availableTickets: 10,
    });

    const reserva = await request(app)
      .post('/reservas/quantidade')
      .set(...authHeader(customer.token))
      .send({ eventId: event.id, quantity: 2 });

    await request(app)
      .post(`/pagamentos/${reserva.body.id as string}/processar`)
      .set(...authHeader(customer.token))
      .send({ method: 'CREDIT_CARD', card: CARD })
      .expect(201);

    const cancelamento = await request(app)
      .post(`/reservas/${reserva.body.id as string}/cancelar`)
      .set(...authHeader(customer.token));
    expect(cancelamento.status).toBe(200);

    // O estorno é uma chamada de verdade à Asaas em produção; aqui só se
    // verifica que ele foi disparado com a cobrança certa.
    expect(asaas.refundPayment).toHaveBeenCalledWith('pay_teste');

    const depois = await prisma.reservation.findUniqueOrThrow({
      where: { id: reserva.body.id as string },
    });
    const evento = await prisma.event.findUniqueOrThrow({
      where: { id: event.id },
    });
    const ingressos = await prisma.ticket.findMany({
      where: { reservationId: reserva.body.id as string },
    });
    const pagamento = await prisma.payment.findFirstOrThrow({
      where: { reservationId: reserva.body.id as string },
    });

    expect(depois.status).toBe(ReservationStatus.CANCELLED);
    expect(evento.availableTickets).toBe(10);
    expect(ingressos.every((t) => t.status === TicketStatus.CANCELLED)).toBe(
      true,
    );
    expect(pagamento.status).toBe(PaymentStatus.REFUNDED);
  });

  it('recusa o cancelamento a menos de 24 horas do evento', async () => {
    const organizer = await createUser(Role.ORGANIZER);
    const customer = await createUser(Role.CUSTOMER);
    // Doze horas à frente: dentro do prazo de reserva, fora do de cancelamento.
    const event = await createShowEvent(organizer.id, {
      startsAt: addMinutes(new Date(), 12 * 60),
      availableTickets: 10,
    });

    const reserva = await request(app)
      .post('/reservas/quantidade')
      .set(...authHeader(customer.token))
      .send({ eventId: event.id, quantity: 1 });

    await request(app)
      .post(`/pagamentos/${reserva.body.id as string}/processar`)
      .set(...authHeader(customer.token))
      .send({ method: 'CREDIT_CARD', card: CARD })
      .expect(201);

    const cancelamento = await request(app)
      .post(`/reservas/${reserva.body.id as string}/cancelar`)
      .set(...authHeader(customer.token));

    expect(cancelamento.status).toBe(409);
    expect(asaas.refundPayment).not.toHaveBeenCalled();

    const depois = await prisma.reservation.findUniqueOrThrow({
      where: { id: reserva.body.id as string },
    });
    expect(depois.status).toBe(ReservationStatus.PAID);
  });
});
