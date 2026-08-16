import { TtlCache } from '../services/cache.service';
import { UpstreamRateLimitError } from './errors';
import type { CatalogItem } from './catalog.types';

const TICKETMASTER_BASE_URL = 'https://app.ticketmaster.com/discovery/v2';
const CACHE_TTL_MS = 5 * 60_000;

const cache = new TtlCache<CatalogItem[]>(CACHE_TTL_MS);

function getApiKey(): string {
  const key = process.env.TICKETMASTER_API_KEY;
  if (!key) {
    throw new Error(
      'TICKETMASTER_API_KEY is not set. Copy apps/api/.env.example to .env.',
    );
  }
  return key;
}

type TicketmasterImage = { url: string; width: number };

type TicketmasterEvent = {
  id: string;
  name: string;
  info?: string;
  pleaseNote?: string;
  images: TicketmasterImage[];
  dates: { start: { localDate?: string } };
};

type TicketmasterSearchResponse = {
  _embedded?: { events: TicketmasterEvent[] };
};

function normalize(event: TicketmasterEvent): CatalogItem {
  const widestImage = [...event.images].sort((a, b) => b.width - a.width)[0];
  return {
    externalId: event.id,
    title: event.name,
    description: event.info ?? event.pleaseNote ?? '',
    imageUrl: widestImage?.url ?? '',
    date: event.dates.start.localDate ?? null,
  };
}

// `query` becomes a keyword search; without it, returns upcoming events in
// Brazil unfiltered (PRD §3.1 — "shows/eventos ao vivo").
export async function searchEvents(query?: string): Promise<CatalogItem[]> {
  const cacheKey = query ?? '__default__';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    apikey: getApiKey(),
    countryCode: 'BR',
    size: '20',
  });
  if (query) {
    params.set('keyword', query);
  }

  const response = await fetch(
    `${TICKETMASTER_BASE_URL}/events.json?${params.toString()}`,
  );

  if (response.status === 429) {
    throw new UpstreamRateLimitError('Ticketmaster rate limit excedido.');
  }
  if (!response.ok) {
    throw new Error(`Ticketmaster respondeu ${response.status}.`);
  }

  const data = (await response.json()) as TicketmasterSearchResponse;
  const items = (data._embedded?.events ?? []).map(normalize);
  cache.set(cacheKey, items);
  return items;
}
