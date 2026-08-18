import type { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import type { Prisma } from '../generated/prisma/client';
import {
  EventStatus,
  EventType,
  ExternalSource,
  PaymentStatus,
  ReservationStatus,
  SeatStatus,
  TicketStatus,
} from '../generated/prisma/enums';
import * as asaas from '../integrations/asaas.client';
import { expireStaleReservations } from '../services/reservationExpiration.service';
import { buildSeatMap, ROOM_CAPACITY } from '../utils/seatMap';

// Every TMDb result becomes a CINEMA event and every Ticketmaster result
// becomes a SHOW event — the catalog source and the event type are locked
// together, so a mismatched pair (e.g. TICKETMASTER + CINEMA) is rejected
// rather than trusted from the client (PRD.md §3.1).
const SOURCE_BY_TYPE: Record<EventType, ExternalSource> = {
  [EventType.CINEMA]: ExternalSource.TMDB,
  [EventType.SHOW]: ExternalSource.TICKETMASTER,
};

// Prisma's `Decimal` doesn't serialize to JSON as a plain number on its own;
// this normalizes `basePrice` before every response.
function serializeEvent<T extends { basePrice: unknown }>(
  event: T,
): Omit<T, 'basePrice'> & { basePrice: number } {
  return { ...event, basePrice: Number(event.basePrice) };
}

type CreateEventBody = {
  title?: string;
  description?: string;
  imageUrl?: string;
  type?: EventType;
  /// Opcional: um evento pode ser publicado sem categoria, e uma categoria
  /// em uso pode ser apagada depois (Event.categoryId tem ON DELETE SET
  /// NULL) — nunca é o campo que trava a criação ou a leitura de um evento.
  categoryId?: string;
  venue?: string;
  startsAt?: string;
  basePrice?: number;
  totalCapacity?: number;
  externalSource?: ExternalSource;
  externalId?: string;
};

export async function createEvent(req: Request, res: Response) {
  const body = req.body as CreateEventBody;
  const {
    title,
    description,
    imageUrl,
    type,
    categoryId,
    venue,
    startsAt,
    basePrice,
    externalSource,
    externalId,
  } = body;

  if (
    !title ||
    !description ||
    !imageUrl ||
    !type ||
    !venue ||
    !startsAt ||
    basePrice === undefined ||
    !externalSource ||
    !externalId
  ) {
    res.status(400).json({
      message:
        'title, description, imageUrl, type, venue, startsAt, basePrice, externalSource e externalId são obrigatórios.',
    });
    return;
  }

  if (!Object.values(EventType).includes(type)) {
    res.status(400).json({ message: 'type inválido.' });
    return;
  }
  if (SOURCE_BY_TYPE[type] !== externalSource) {
    res.status(400).json({
      message: `Evento do tipo ${type} precisa vir do catálogo ${SOURCE_BY_TYPE[type]}.`,
    });
    return;
  }

  const startsAtDate = new Date(startsAt);
  if (Number.isNaN(startsAtDate.getTime())) {
    res.status(400).json({ message: 'startsAt precisa ser uma data válida.' });
    return;
  }

  if (typeof basePrice !== 'number' || basePrice <= 0) {
    res
      .status(400)
      .json({ message: 'basePrice precisa ser um número positivo.' });
    return;
  }

  let totalCapacity: number;
  if (type === EventType.SHOW) {
    if (
      typeof body.totalCapacity !== 'number' ||
      !Number.isInteger(body.totalCapacity) ||
      body.totalCapacity <= 0
    ) {
      res.status(400).json({
        message:
          'totalCapacity precisa ser um inteiro positivo para eventos SHOW.',
      });
      return;
    }
    totalCapacity = body.totalCapacity;
  } else {
    totalCapacity = ROOM_CAPACITY;
  }

  const event = await prisma.$transaction(async (tx) => {
    const created = await tx.event.create({
      data: {
        title,
        description,
        imageUrl,
        type,
        categoryId: categoryId ?? null,
        venue,
        startsAt: startsAtDate,
        basePrice,
        totalCapacity,
        availableTickets: type === EventType.SHOW ? totalCapacity : 0,
        externalSource,
        externalId,
        organizerId: req.user!.id,
      },
      include: { category: true },
    });

    if (type === EventType.CINEMA) {
      await tx.seat.createMany({ data: buildSeatMap(created.id) });
    }

    return created;
  });

  res.status(201).json(serializeEvent(event));
}

type UpdateEventBody = {
  title?: string;
  description?: string;
  imageUrl?: string;
  categoryId?: string | null;
  venue?: string;
  startsAt?: string;
  basePrice?: number;
};

export async function updateEvent(req: Request, res: Response) {
  // Express types `req.params` values as `string | string[]` to account for
  // wildcard routes; `:id` never matches more than one segment.
  const id = req.params.id as string;
  const existing = await prisma.event.findUnique({ where: { id } });

  if (!existing) {
    res.status(404).json({ message: 'Evento não encontrado.' });
    return;
  }
  if (existing.organizerId !== req.user!.id) {
    res.status(403).json({ message: 'Você não é o organizador deste evento.' });
    return;
  }
  if (existing.status === EventStatus.CANCELLED) {
    res.status(409).json({ message: 'Evento cancelado não pode ser editado.' });
    return;
  }

  const body = req.body as UpdateEventBody;
  const data: Record<string, unknown> = {};

  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description;
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl;
  if (body.categoryId !== undefined) data.categoryId = body.categoryId;
  if (body.venue !== undefined) data.venue = body.venue;
  if (body.basePrice !== undefined) {
    if (typeof body.basePrice !== 'number' || body.basePrice <= 0) {
      res
        .status(400)
        .json({ message: 'basePrice precisa ser um número positivo.' });
      return;
    }
    data.basePrice = body.basePrice;
  }
  if (body.startsAt !== undefined) {
    const startsAtDate = new Date(body.startsAt);
    if (Number.isNaN(startsAtDate.getTime())) {
      res
        .status(400)
        .json({ message: 'startsAt precisa ser uma data válida.' });
      return;
    }
    data.startsAt = startsAtDate;
  }

  const updated = await prisma.event.update({
    where: { id },
    data,
    include: { category: true },
  });
  res.json(serializeEvent(updated));
}

// Cancellation cascade per SPEC.md §4.1, including the refund of any PAID
// reservation (Asaas sandbox, see the loop below).
export async function cancelEvent(req: Request, res: Response) {
  // Express types `req.params` values as `string | string[]` to account for
  // wildcard routes; `:id` never matches more than one segment.
  const id = req.params.id as string;
  const existing = await prisma.event.findUnique({ where: { id } });

  if (!existing) {
    res.status(404).json({ message: 'Evento não encontrado.' });
    return;
  }
  if (existing.organizerId !== req.user!.id) {
    res.status(403).json({ message: 'Você não é o organizador deste evento.' });
    return;
  }
  if (existing.status === EventStatus.CANCELLED) {
    res.status(409).json({ message: 'Evento já está cancelado.' });
    return;
  }

  try {
    await cancelEventInTransaction(id);
  } catch (err) {
    if (err instanceof RefundNotAllowedError) {
      res.status(503).json({
        message:
          'O provedor de pagamento ainda não liberou o estorno de uma das cobranças deste evento. Aguarde alguns instantes e tente novamente.',
      });
      return;
    }
    throw err;
  }

  res.status(204).send();
}

// Sinaliza a única falha esperada da cascata: a janela de processamento do
// provedor entre confirmar uma cobrança e permitir estorná-la.
class RefundNotAllowedError extends Error {}

async function cancelEventInTransaction(id: string) {
  await prisma.$transaction(async (tx) => {
    // Lido antes do updateMany abaixo apagar o status PAID que identifica
    // quais reservas tinham pagamento a estornar.
    const paidReservations = await tx.reservation.findMany({
      where: { eventId: id, status: ReservationStatus.PAID },
      include: { payment: true },
    });

    await tx.event.update({
      where: { id },
      data: { status: EventStatus.CANCELLED },
    });

    await tx.reservation.updateMany({
      where: {
        eventId: id,
        status: { in: [ReservationStatus.PENDING, ReservationStatus.PAID] },
      },
      data: { status: ReservationStatus.CANCELLED },
    });

    await tx.ticket.updateMany({
      where: {
        status: TicketStatus.VALID,
        reservation: { eventId: id },
      },
      data: { status: TicketStatus.CANCELLED },
    });

    await tx.seat.updateMany({
      where: {
        eventId: id,
        status: { in: [SeatStatus.RESERVED, SeatStatus.SOLD] },
      },
      data: { status: SeatStatus.AVAILABLE },
    });

    // Reembolso total simulado (SPEC.md §4.1) — estornado na Asaas sandbox
    // para cada reserva que já estava paga; a janela de 24h não se aplica
    // aqui, o cancelamento partiu do organizador.
    for (const reservation of paidReservations) {
      if (!reservation.payment) continue;
      try {
        await asaas.refundPayment(reservation.payment.asaasPaymentId);
      } catch {
        // Uma cobrança recém-confirmada entre as reservas do evento faz a
        // Asaas recusar o estorno, e a transação toda volta atrás: o evento
        // continua publicado. Preferível a cancelar o evento deixando parte
        // dos clientes sem reembolso.
        throw new RefundNotAllowedError();
      }
      await tx.payment.update({
        where: { id: reservation.payment.id },
        data: { status: PaymentStatus.REFUNDED },
      });
    }
  });
}

// Organizer-scoped listing, including CANCELLED events — the public
// `listEvents` below only shows PUBLISHED ones, so an organizer needs this
// to see what they cancelled.
export async function listMyEvents(req: Request, res: Response) {
  const events = await prisma.event.findMany({
    where: { organizerId: req.user!.id },
    orderBy: { startsAt: 'asc' },
    include: { category: true },
  });

  res.json({ items: events.map(serializeEvent) });
}

type ListEventsQuery = {
  date?: string;
  category?: string;
  venue?: string;
  minPrice?: string;
  maxPrice?: string;
};

// SPEC.md §5.2 — os cinco query params abaixo.
export async function listEvents(req: Request, res: Response) {
  const { date, category, venue, minPrice, maxPrice } =
    req.query as ListEventsQuery;

  const where: Prisma.EventWhereInput = { status: EventStatus.PUBLISHED };

  if (date) {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      res.status(400).json({ message: 'date precisa ser uma data válida.' });
      return;
    }
    // Normaliza pra um dia inteiro em UTC (PRD.md §3.13) — cobre o evento
    // independente do horário exato, só do dia calendário.
    const isoDay = parsed.toISOString().slice(0, 10);
    where.startsAt = {
      gte: new Date(`${isoDay}T00:00:00.000Z`),
      lte: new Date(`${isoDay}T23:59:59.999Z`),
    };
  }

  if (category) {
    // Filtro público continua por nome (mesmo contrato de antes); a relação
    // é o que muda por baixo.
    where.category = { name: { contains: category, mode: 'insensitive' } };
  }

  if (venue) {
    where.venue = { contains: venue, mode: 'insensitive' };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    const min = minPrice !== undefined ? Number(minPrice) : undefined;
    const max = maxPrice !== undefined ? Number(maxPrice) : undefined;
    if (
      (min !== undefined && Number.isNaN(min)) ||
      (max !== undefined && Number.isNaN(max))
    ) {
      res
        .status(400)
        .json({ message: 'minPrice e maxPrice precisam ser números.' });
      return;
    }
    where.basePrice = {
      ...(min !== undefined ? { gte: min } : {}),
      ...(max !== undefined ? { lte: max } : {}),
    };
  }

  const events = await prisma.event.findMany({
    where,
    orderBy: { startsAt: 'asc' },
    include: { category: true },
  });

  res.json({ items: events.map(serializeEvent) });
}

// Opções reais de filtro, lidas do catálogo publicado. Existe como endpoint
// próprio (e não derivado da listagem já filtrada) porque a lista precisa
// continuar completa enquanto o cliente filtra — do contrário, escolher uma
// categoria apagaria as outras opções da lista.
export async function listEventFilterOptions(_req: Request, res: Response) {
  const events = await prisma.event.findMany({
    where: { status: EventStatus.PUBLISHED },
    select: { venue: true, category: { select: { name: true } } },
  });

  const byLabel = (a: string, b: string) => a.localeCompare(b, 'pt-BR');
  const unique = (values: (string | undefined)[]) =>
    [
      ...new Set(values.filter((value): value is string => Boolean(value))),
    ].sort(byLabel);

  res.json({
    categories: unique(events.map((event) => event.category?.name)),
    venues: unique(events.map((event) => event.venue)),
  });
}

export async function getEvent(req: Request, res: Response) {
  // Express types `req.params` values as `string | string[]` to account for
  // wildcard routes; `:id` never matches more than one segment.
  const id = req.params.id as string;

  const event = await prisma.$transaction(async (tx) => {
    const exists = await tx.event.findUnique({
      where: { id },
      select: { type: true },
    });
    if (!exists) return null;

    // Lazy expiration (SPEC.md §2.3): this endpoint is one of the four
    // listed as needing it, since it's how the reservation screens read
    // seat/stock availability before disputing it. Runs before the real
    // read below so a SHOW's `availableTickets` reflects any stock just
    // returned by an expired reservation.
    await expireStaleReservations(tx, id);

    const found = await tx.event.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!found) return null;

    if (found.type !== EventType.CINEMA) return { ...found, seats: [] };

    const seats = await tx.seat.findMany({
      where: { eventId: id },
      orderBy: [{ row: 'asc' }, { number: 'asc' }],
    });
    return { ...found, seats };
  });

  if (!event) {
    res.status(404).json({ message: 'Evento não encontrado.' });
    return;
  }

  const { seats, ...rest } = event;
  res.json({
    ...serializeEvent(rest),
    seats: rest.type === EventType.CINEMA ? seats : undefined,
  });
}

export async function getEventSeats(req: Request, res: Response) {
  const id = req.params.id as string;

  const result = await prisma.$transaction(async (tx) => {
    const event = await tx.event.findUnique({ where: { id } });
    if (!event) return { kind: 'not-found' as const };
    if (event.type !== EventType.CINEMA) {
      return { kind: 'wrong-type' as const };
    }

    await expireStaleReservations(tx, id);

    const seats = await tx.seat.findMany({
      where: { eventId: id },
      orderBy: [{ row: 'asc' }, { number: 'asc' }],
    });
    return { kind: 'ok' as const, seats };
  });

  if (result.kind === 'not-found') {
    res.status(404).json({ message: 'Evento não encontrado.' });
    return;
  }
  if (result.kind === 'wrong-type') {
    res.status(400).json({ message: 'Este evento não usa mapa de assentos.' });
    return;
  }

  res.json({ items: result.seats });
}
