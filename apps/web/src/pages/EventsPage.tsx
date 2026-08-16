import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { EventItem } from '@/lib/api-types';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});
const priceFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const inputClass =
  'border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-3';

type Filters = {
  date: string;
  category: string;
  venue: string;
  minPrice: string;
  maxPrice: string;
};

const EMPTY_FILTERS: Filters = {
  date: '',
  category: '',
  venue: '',
  minPrice: '',
  maxPrice: '',
};

function buildQuery(filters: Filters): string {
  const params = new URLSearchParams();
  if (filters.date) params.set('date', filters.date);
  if (filters.category) params.set('category', filters.category);
  if (filters.venue) params.set('venue', filters.venue);
  if (filters.minPrice) params.set('minPrice', filters.minPrice);
  if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
  const query = params.toString();
  return query ? `?${query}` : '';
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const debouncedFilters = useDebouncedValue(filters, 400);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<{ items: EventItem[] }>(
          `/eventos${buildQuery(debouncedFilters)}`,
        );
        if (!cancelled) setEvents(data.items);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.message
            : 'Não foi possível carregar os eventos.',
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();

    return () => {
      cancelled = true;
    };
  }, [debouncedFilters]);

  function updateFilter(key: keyof Filters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  const hasActiveFilters = Object.values(filters).some((value) => value !== '');

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-12">
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase">
          Catálogo
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Eventos</h1>
      </div>

      <div className="border-border bg-card grid grid-cols-2 gap-3 border p-4 sm:grid-cols-3 lg:grid-cols-5">
        <input
          type="date"
          aria-label="Data"
          className={inputClass}
          value={filters.date}
          onChange={(e) => updateFilter('date', e.target.value)}
        />
        <input
          type="text"
          placeholder="Categoria"
          className={inputClass}
          value={filters.category}
          onChange={(e) => updateFilter('category', e.target.value)}
        />
        <input
          type="text"
          placeholder="Local"
          className={inputClass}
          value={filters.venue}
          onChange={(e) => updateFilter('venue', e.target.value)}
        />
        <input
          type="number"
          placeholder="Preço mín."
          className={inputClass}
          value={filters.minPrice}
          onChange={(e) => updateFilter('minPrice', e.target.value)}
        />
        <input
          type="number"
          placeholder="Preço máx."
          className={inputClass}
          value={filters.maxPrice}
          onChange={(e) => updateFilter('maxPrice', e.target.value)}
        />
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="text-muted-foreground col-span-2 text-left text-xs underline sm:col-span-3 lg:col-span-5"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {loading && <p className="text-muted-foreground text-sm">Carregando…</p>}
      {error && <p className="text-destructive text-sm">{error}</p>}
      {!loading && !error && events.length === 0 && (
        <p className="text-muted-foreground text-sm">
          {hasActiveFilters
            ? 'Nenhum evento encontrado com esses filtros.'
            : 'Nenhum evento publicado ainda.'}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <Link
            key={event.id}
            to={`/eventos/${event.id}`}
            className="border-border bg-card hover:border-ring flex flex-col overflow-hidden border transition-colors"
          >
            {event.imageUrl && (
              <img
                src={event.imageUrl}
                alt=""
                className="aspect-video w-full object-cover"
              />
            )}
            <div className="flex flex-1 flex-col gap-1 p-4">
              <p className="text-muted-foreground text-xs font-medium tracking-[0.15em] uppercase">
                {event.type === 'CINEMA' ? 'Cinema' : 'Show'} · {event.category}
              </p>
              <p className="font-medium">{event.title}</p>
              <p className="text-muted-foreground text-sm">{event.venue}</p>
              <p className="text-muted-foreground text-sm">
                {dateFormatter.format(new Date(event.startsAt))}
              </p>
              <p className="mt-auto pt-2 font-medium tabular-nums">
                {priceFormatter.format(event.basePrice)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
