import { Link } from 'react-router';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert } from '@/components/ui/alert';
import type { EventItem } from '@/lib/api-types';
import { formatDateTime, formatPrice } from '@/lib/format';

type OrganizerEventsListProps = {
  events: EventItem[];
  loading: boolean;
  error: string | null;
  cancelingId: string | null;
  onEdit: (event: EventItem) => void;
  onCancelEvent: (event: EventItem) => void;
};

export function OrganizerEventsList({
  events,
  loading,
  error,
  cancelingId,
  onEdit,
  onCancelEvent,
}: OrganizerEventsListProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return <Alert>{error}</Alert>;
  }

  if (events.length === 0) {
    return (
      <div className="border-border text-muted-foreground border border-dashed px-6 py-16 text-center text-sm">
        Nenhum evento publicado ainda. Comece pela busca no catálogo.
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {events.map((event) => {
        const cancelled = event.status === 'CANCELLED';
        return (
          <li
            key={event.id}
            className="border-border bg-card flex flex-wrap items-center justify-between gap-4 border p-4"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <p className="label-print">
                {event.type === 'CINEMA' ? 'Cinema' : 'Show'} · {event.category}
              </p>
              <Link
                to={`/eventos/${event.id}`}
                className="display-print hover:text-primary block truncate text-lg transition-colors"
              >
                {event.title}
              </Link>
              <p className="text-muted-foreground truncate text-sm">
                {event.venue} · {formatDateTime(event.startsAt)} ·{' '}
                <span data-numeric>{formatPrice(event.basePrice)}</span>
              </p>
            </div>

            {cancelled ? (
              <Badge tone="danger">Cancelado</Badge>
            ) : (
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" onClick={() => onEdit(event)}>
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  disabled={cancelingId === event.id}
                  onClick={() => onCancelEvent(event)}
                >
                  {cancelingId === event.id ? 'Cancelando…' : 'Cancelar'}
                </Button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
