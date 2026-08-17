import { prisma } from '../../src/config/prisma';
import {
  EventStatus,
  EventType,
  ExternalSource,
  Role,
} from '../../src/generated/prisma/enums';
import { generateToken } from '../../src/services/token.service';
import { addDays, reservationExpiresAt } from '../../src/utils/datetime';
import { buildSeatMap, ROOM_CAPACITY } from '../../src/utils/seatMap';

// Fábricas em vez do seed do projeto: cada teste monta só o que precisa, com
// o mínimo de linhas, e nenhum depende do que outro deixou no banco.

let sequence = 0;
function unique(prefix: string): string {
  sequence += 1;
  return `${prefix}-${sequence}-${Date.now()}`;
}

export async function createUser(role: Role) {
  const user = await prisma.user.create({
    data: {
      name: `Usuário ${role}`,
      email: `${unique(role.toLowerCase())}@teste.com`,
      // Hash fixo: nenhum teste passa por /auth/login, e rodar bcrypt em
      // cada fábrica só somaria segundos à suíte.
      passwordHash: 'hash-irrelevante-para-estes-testes',
      role,
    },
  });

  return { ...user, token: generateToken(user.id, role) };
}

export function authHeader(token: string): [string, string] {
  return ['Authorization', `Bearer ${token}`];
}

/** Sessão de cinema com a sala de 96 lugares já gerada. */
export async function createCinemaEvent(
  organizerId: string,
  overrides: { startsAt?: Date; status?: EventStatus; basePrice?: number } = {},
) {
  const event = await prisma.event.create({
    data: {
      title: 'Sessão de teste',
      description: 'Evento criado pela suíte de testes.',
      type: EventType.CINEMA,
      category: 'Ação',
      venue: 'Sala 1',
      startsAt: overrides.startsAt ?? addDays(new Date(), 10),
      basePrice: overrides.basePrice ?? 40,
      totalCapacity: ROOM_CAPACITY,
      imageUrl: '/images/poster_action.jpg',
      externalSource: ExternalSource.TMDB,
      externalId: unique('tmdb'),
      organizerId,
      status: overrides.status ?? EventStatus.PUBLISHED,
    },
  });

  await prisma.seat.createMany({ data: buildSeatMap(event.id) });
  return event;
}

/** Show com pista, onde a disponibilidade é um contador. */
export async function createShowEvent(
  organizerId: string,
  overrides: {
    startsAt?: Date;
    status?: EventStatus;
    basePrice?: number;
    availableTickets?: number;
  } = {},
) {
  const capacity = overrides.availableTickets ?? 100;

  return prisma.event.create({
    data: {
      title: 'Show de teste',
      description: 'Evento criado pela suíte de testes.',
      type: EventType.SHOW,
      category: 'Rock',
      venue: 'Casa de show',
      startsAt: overrides.startsAt ?? addDays(new Date(), 10),
      basePrice: overrides.basePrice ?? 90,
      totalCapacity: capacity,
      availableTickets: capacity,
      imageUrl: '/images/poster_rock.jpg',
      externalSource: ExternalSource.TICKETMASTER,
      externalId: unique('tm'),
      organizerId,
      status: overrides.status ?? EventStatus.PUBLISHED,
    },
  });
}

export function firstAvailableSeat(eventId: string) {
  return prisma.seat.findFirstOrThrow({
    where: { eventId },
    orderBy: [{ row: 'asc' }, { number: 'asc' }],
  });
}

export { reservationExpiresAt };
