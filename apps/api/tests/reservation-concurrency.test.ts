import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';
import { Role, SeatStatus } from '../src/generated/prisma/enums';
import {
  authHeader,
  createCinemaEvent,
  createShowEvent,
  createUser,
  firstAvailableSeat,
} from './helpers/factories';

// O núcleo do desafio: duas requisições simultâneas disputando o mesmo
// recurso. É o que mock de ORM não consegue provar, e por isso a suíte roda
// contra PostgreSQL de verdade (SPEC.md §6).
const app = createApp();

describe('concorrência na reserva', () => {
  it('dá o assento a exatamente um de dois clientes simultâneos', async () => {
    const organizer = await createUser(Role.ORGANIZER);
    const cliente1 = await createUser(Role.CUSTOMER);
    const cliente2 = await createUser(Role.CUSTOMER);
    const event = await createCinemaEvent(organizer.id);
    const seat = await firstAvailableSeat(event.id);

    const body = { eventId: event.id, seatId: seat.id };
    const [primeira, segunda] = await Promise.all([
      request(app)
        .post('/reservas/assento')
        .set(...authHeader(cliente1.token))
        .send(body),
      request(app)
        .post('/reservas/assento')
        .set(...authHeader(cliente2.token))
        .send(body),
    ]);

    expect([primeira.status, segunda.status].sort()).toEqual([201, 409]);

    const reservations = await prisma.reservation.findMany({
      where: { seatId: seat.id },
    });
    expect(reservations).toHaveLength(1);

    const seatDepois = await prisma.seat.findUniqueOrThrow({
      where: { id: seat.id },
    });
    expect(seatDepois.status).toBe(SeatStatus.RESERVED);
  });

  it('não vende além da capacidade quando as reservas somam mais que o estoque', async () => {
    const organizer = await createUser(Role.ORGANIZER);
    const event = await createShowEvent(organizer.id, { availableTickets: 10 });

    // Seis clientes pedindo 3 ingressos cada: 18 pedidos para 10 lugares.
    const clientes = [];
    for (let i = 0; i < 6; i++) {
      clientes.push(await createUser(Role.CUSTOMER));
    }

    const respostas = await Promise.all(
      clientes.map((cliente) =>
        request(app)
          .post('/reservas/quantidade')
          .set(...authHeader(cliente.token))
          .send({ eventId: event.id, quantity: 3 }),
      ),
    );

    const aceitas = respostas.filter((r) => r.status === 201);
    const recusadas = respostas.filter((r) => r.status === 409);

    expect(aceitas.length + recusadas.length).toBe(6);
    // Três aceitas consomem 9 dos 10 lugares; a quarta não cabe.
    expect(aceitas).toHaveLength(3);

    const depois = await prisma.event.findUniqueOrThrow({
      where: { id: event.id },
    });
    expect(depois.availableTickets).toBe(1);
    expect(depois.availableTickets).toBeGreaterThanOrEqual(0);
  });
});
