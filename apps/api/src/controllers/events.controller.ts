import type { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import {
  EventStatus,
  EventType,
  ExternalSource,
  ReservationStatus,
  SeatStatus,
  TicketStatus,
} from '../generated/prisma/enums';
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
  category?: string;
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
    category,
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
    !category ||
    !venue ||
    !startsAt ||
    basePrice === undefined ||
    !externalSource ||
    !externalId
  ) {
    res.status(400).json({
      message:
        'title, description, imageUrl, type, category, venue, startsAt, basePrice, externalSource e externalId são obrigatórios.',
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
        category,
        venue,
        startsAt: startsAtDate,
        basePrice,
        totalCapacity,
        availableTickets: type === EventType.SHOW ? totalCapacity : 0,
        externalSource,
        externalId,
        organizerId: req.user!.id,
      },
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
  category?: string;
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
  if (body.category !== undefined) data.category = body.category;
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

  const updated = await prisma.event.update({ where: { id }, data });
  res.json(serializeEvent(updated));
}

// Cancellation cascade per SPEC.md §4.1. Refunding a PAID reservation is
// noted but not triggered here: there is no payment integration yet
// (Bloco 5) for a real or simulated refund call to hook into.
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

  await prisma.$transaction(async (tx) => {
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
  });

  res.status(204).send();
}

// Organizer-scoped listing, including CANCELLED events — the public
// `listEvents` below only shows PUBLISHED ones, so an organizer needs this
// to see what they cancelled.
export async function listMyEvents(req: Request, res: Response) {
  const events = await prisma.event.findMany({
    where: { organizerId: req.user!.id },
    orderBy: { startsAt: 'asc' },
  });

  res.json({ items: events.map(serializeEvent) });
}

export async function listEvents(_req: Request, res: Response) {
  const events = await prisma.event.findMany({
    where: { status: EventStatus.PUBLISHED },
    orderBy: { startsAt: 'asc' },
  });

  res.json({ items: events.map(serializeEvent) });
}

export async function getEvent(req: Request, res: Response) {
  // Express types `req.params` values as `string | string[]` to account for
  // wildcard routes; `:id` never matches more than one segment.
  const id = req.params.id as string;
  const event = await prisma.event.findUnique({
    where: { id },
    include: { seats: { orderBy: [{ row: 'asc' }, { number: 'asc' }] } },
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
