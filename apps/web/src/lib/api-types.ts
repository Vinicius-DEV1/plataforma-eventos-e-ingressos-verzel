// Mirrors the shapes returned by apps/api (catalog.types.ts and the events
// controller). Kept minimal: only the fields the UI actually renders or
// sends.
export type CatalogItem = {
  externalId: string;
  title: string;
  description: string;
  imageUrl: string;
  date: string | null;
};

export type EventType = 'CINEMA' | 'SHOW';
export type EventStatus = 'PUBLISHED' | 'CANCELLED';
export type ExternalSource = 'TMDB' | 'TICKETMASTER';

export type EventItem = {
  id: string;
  title: string;
  description: string;
  type: EventType;
  category: string;
  venue: string;
  startsAt: string;
  basePrice: number;
  totalCapacity: number;
  availableTickets: number;
  imageUrl: string;
  externalSource: ExternalSource;
  externalId: string;
  organizerId: string;
  status: EventStatus;
  createdAt: string;
};
