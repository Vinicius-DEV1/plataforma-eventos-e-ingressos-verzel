import { useEffect, useState } from 'react';
import { Link } from 'react-router';
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

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<{ items: EventItem[] }>('/eventos');
        setEvents(data.items);
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : 'Não foi possível carregar os eventos.',
        );
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-12">
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase">
          Catálogo
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Eventos</h1>
      </div>

      {loading && <p className="text-muted-foreground text-sm">Carregando…</p>}
      {error && <p className="text-destructive text-sm">{error}</p>}
      {!loading && !error && events.length === 0 && (
        <p className="text-muted-foreground text-sm">
          Nenhum evento publicado ainda.
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
