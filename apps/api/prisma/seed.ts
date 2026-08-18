import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../src/config/prisma';
import { addDays, addMinutes, now } from '../src/utils/datetime';
import { buildSeatMap, ROOM_CAPACITY } from '../src/utils/seatMap';
import {
  Role,
  EventType,
  ExternalSource,
  ReservationStatus,
  TicketStatus,
  PaymentStatus,
} from '../src/generated/prisma/enums';

const SEED_PASSWORD = 'senha123';

type CinemaEventInput = {
  title: string;
  category: string;
  venue: string;
  daysFromNow: number;
  basePrice: number;
  externalId: string;
};

type ShowEventInput = {
  title: string;
  category: string;
  venue: string;
  daysFromNow: number;
  basePrice: number;
  totalCapacity: number;
  availableTickets: number;
  externalId: string;
};

// The two events PRD.md §5 requires: fixed dates and identity, since the
// pre-existing reservation/ticket state below is built on top of them.
const CINEMA_EVENT: CinemaEventInput = {
  title: 'Sessão de Cinema — Filme Teste',
  category: 'Ação',
  venue: 'Cinema Verzel — Sala 1',
  daysFromNow: 30,
  basePrice: 32.5,
  externalId: 'seed-tmdb-000001',
};

const SHOW_EVENT: ShowEventInput = {
  title: 'Show ao Vivo — Banda Teste',
  category: 'Rock',
  venue: 'Arena Verzel',
  daysFromNow: 45,
  basePrice: 120,
  totalCapacity: 200,
  availableTickets: 150,
  externalId: 'seed-ticketmaster-000001',
};

// Rest of the catalog: no reservations attached, just enough variety of
// category/date/venue/price to exercise search and filtering.
const EXTRA_CINEMA_EVENTS: CinemaEventInput[] = [
  {
    title: 'Comédia da Tarde',
    category: 'Comédia',
    venue: 'Cinema Verzel — Sala 2',
    daysFromNow: 10,
    basePrice: 28,
    externalId: 'seed-tmdb-000002',
  },
  {
    title: 'Drama de Estreia',
    category: 'Drama',
    venue: 'Cinema Verzel — Sala 1',
    daysFromNow: 20,
    basePrice: 30,
    externalId: 'seed-tmdb-000003',
  },
  {
    title: 'Ação Sem Limites',
    category: 'Ação',
    venue: 'Cinema Verzel — Sala 3',
    daysFromNow: 60,
    basePrice: 36,
    externalId: 'seed-tmdb-000004',
  },
];

const EXTRA_SHOW_EVENTS: ShowEventInput[] = [
  {
    title: 'Noite de Rock',
    category: 'Rock',
    venue: 'Arena Verzel',
    daysFromNow: 15,
    basePrice: 95,
    totalCapacity: 300,
    availableTickets: 300,
    externalId: 'seed-ticketmaster-000002',
  },
  {
    title: 'Stand-up Comedy Night',
    category: 'Stand-up',
    venue: 'Teatro Verzel',
    daysFromNow: 25,
    basePrice: 60,
    totalCapacity: 120,
    availableTickets: 80,
    externalId: 'seed-ticketmaster-000003',
  },
  {
    title: 'Festival de MPB',
    category: 'MPB',
    venue: 'Parque Verzel',
    daysFromNow: 50,
    basePrice: 150,
    totalCapacity: 500,
    availableTickets: 500,
    externalId: 'seed-ticketmaster-000004',
  },
];

function signQrCode(ticketId: string, eventId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'JWT_SECRET is not set. Copy apps/api/.env.example to .env.',
    );
  }
  return jwt.sign({ ticketId, eventId }, secret);
}

async function seedUsers() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  // Sequencial, não Promise.all: cada upsert abre a própria transação, e o
  // Postgres gratuito do Render limita conexões simultâneas o bastante para
  // que quatro de uma vez sejam recusadas — o Prisma relata isso como
  // "acesso negado" em vez de "limite de conexões" (P1010, adapter-pg). Como
  // este script roda uma vez, o custo de serializar é irrelevante.
  const organizer = await prisma.user.upsert({
    where: { email: 'organizador@teste.com' },
    update: {},
    create: {
      name: 'Organizador Teste',
      email: 'organizador@teste.com',
      passwordHash,
      role: Role.ORGANIZER,
    },
  });
  const customer1 = await prisma.user.upsert({
    where: { email: 'cliente1@teste.com' },
    update: {},
    create: {
      name: 'Cliente Um',
      email: 'cliente1@teste.com',
      passwordHash,
      role: Role.CUSTOMER,
    },
  });
  const customer2 = await prisma.user.upsert({
    where: { email: 'cliente2@teste.com' },
    update: {},
    create: {
      name: 'Cliente Dois',
      email: 'cliente2@teste.com',
      passwordHash,
      role: Role.CUSTOMER,
    },
  });
  const gatekeeper = await prisma.user.upsert({
    where: { email: 'portaria@teste.com' },
    update: {},
    create: {
      name: 'Portaria Teste',
      email: 'portaria@teste.com',
      passwordHash,
      role: Role.GATEKEEPER,
    },
  });

  return { organizer, customer1, customer2, gatekeeper };
}

// Upsert por nome: as mesmas categorias aparecem em vários eventos do seed
// (ex: "Ação" em três filmes), e cada uma deve virar uma única linha na
// tabela, exatamente como o organizador faria pelo formulário.
async function resolveCategoryId(name: string): Promise<string> {
  const category = await prisma.category.upsert({
    where: { name },
    update: {},
    create: { name },
  });
  return category.id;
}

async function seedCinemaEvent(organizerId: string, input: CinemaEventInput) {
  const categoryId = await resolveCategoryId(input.category);

  const event = await prisma.event.create({
    data: {
      title: input.title,
      description: `Evento semeado para testes: ${input.title}.`,
      type: EventType.CINEMA,
      categoryId,
      venue: input.venue,
      startsAt: addDays(now(), input.daysFromNow),
      basePrice: input.basePrice,
      totalCapacity: ROOM_CAPACITY,
      imageUrl:
        input.category === 'Comédia' || input.category === 'Drama'
          ? '/images/poster_festival.jpg'
          : '/images/poster_action.jpg',
      externalSource: ExternalSource.TMDB,
      externalId: input.externalId,
      organizerId,
    },
  });

  await prisma.seat.createMany({ data: buildSeatMap(event.id) });

  const seats = await prisma.seat.findMany({
    where: { eventId: event.id },
    orderBy: [{ row: 'asc' }, { number: 'asc' }],
  });

  return { event, seats };
}

async function seedShowEvent(organizerId: string, input: ShowEventInput) {
  const categoryId = await resolveCategoryId(input.category);

  return prisma.event.create({
    data: {
      title: input.title,
      description: `Evento semeado para testes: ${input.title}.`,
      type: EventType.SHOW,
      categoryId,
      venue: input.venue,
      startsAt: addDays(now(), input.daysFromNow),
      basePrice: input.basePrice,
      totalCapacity: input.totalCapacity,
      availableTickets: input.availableTickets,
      imageUrl:
        input.category === 'Stand-up'
          ? '/images/poster_standup.jpg'
          : input.category === 'MPB'
            ? '/images/poster_festival.jpg'
            : '/images/poster_rock.jpg',
      externalSource: ExternalSource.TICKETMASTER,
      externalId: input.externalId,
      organizerId,
    },
  });
}

async function seedPaidReservationWithValidTicket(params: {
  eventId: string;
  customerId: string;
  seatId: string;
  amount: number;
}) {
  const createdAt = now();

  const reservation = await prisma.reservation.create({
    data: {
      eventId: params.eventId,
      customerId: params.customerId,
      seatId: params.seatId,
      status: ReservationStatus.PAID,
      totalAmount: params.amount,
      expiresAt: addMinutes(createdAt, 15),
      createdAt,
    },
  });

  await prisma.seat.update({
    where: { id: params.seatId },
    data: { status: 'SOLD' },
  });

  await prisma.payment.create({
    data: {
      reservationId: reservation.id,
      asaasPaymentId: `seed-asaas-${reservation.id}`,
      status: PaymentStatus.CONFIRMED,
      amount: params.amount,
    },
  });

  const ticket = await prisma.ticket.create({
    data: {
      reservationId: reservation.id,
      qrCode: 'pending',
      status: TicketStatus.VALID,
    },
  });

  return prisma.ticket.update({
    where: { id: ticket.id },
    data: { qrCode: signQrCode(ticket.id, params.eventId) },
  });
}

async function seedUsedTicket(params: {
  eventId: string;
  customerId: string;
  seatId: string;
  amount: number;
  validatedById: string;
}) {
  const createdAt = now();

  const reservation = await prisma.reservation.create({
    data: {
      eventId: params.eventId,
      customerId: params.customerId,
      seatId: params.seatId,
      status: ReservationStatus.PAID,
      totalAmount: params.amount,
      expiresAt: addMinutes(createdAt, 15),
      createdAt,
    },
  });

  await prisma.seat.update({
    where: { id: params.seatId },
    data: { status: 'SOLD' },
  });

  await prisma.payment.create({
    data: {
      reservationId: reservation.id,
      asaasPaymentId: `seed-asaas-${reservation.id}`,
      status: PaymentStatus.CONFIRMED,
      amount: params.amount,
    },
  });

  const ticket = await prisma.ticket.create({
    data: {
      reservationId: reservation.id,
      qrCode: 'pending',
      status: TicketStatus.USED,
      validatedAt: now(),
      validatedById: params.validatedById,
    },
  });

  return prisma.ticket.update({
    where: { id: ticket.id },
    data: { qrCode: signQrCode(ticket.id, params.eventId) },
  });
}

async function main() {
  const { organizer, customer1, customer2, gatekeeper } = await seedUsers();

  const { event: cinemaEvent, seats } = await seedCinemaEvent(
    organizer.id,
    CINEMA_EVENT,
  );
  await seedShowEvent(organizer.id, SHOW_EVENT);

  for (const extra of EXTRA_CINEMA_EVENTS) {
    await seedCinemaEvent(organizer.id, extra);
  }
  for (const extra of EXTRA_SHOW_EVENTS) {
    await seedShowEvent(organizer.id, extra);
  }

  const amount = cinemaEvent.basePrice as unknown as number;

  await seedPaidReservationWithValidTicket({
    eventId: cinemaEvent.id,
    customerId: customer1.id,
    seatId: seats[0].id,
    amount,
  });

  await seedUsedTicket({
    eventId: cinemaEvent.id,
    customerId: customer2.id,
    seatId: seats[1].id,
    amount,
    validatedById: gatekeeper.id,
  });

  console.log('Seed concluído.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
