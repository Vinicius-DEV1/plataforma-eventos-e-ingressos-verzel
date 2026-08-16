import { Button } from '@/components/ui/button';
import type { EventItem } from '@/lib/api-types';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});
const priceFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

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
    return <p className="text-muted-foreground text-sm">Carregando…</p>;
  }
  if (error) {
    return <p className="text-destructive text-sm">{error}</p>;
  }
  if (events.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Você ainda não publicou nenhum evento.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {events.map((event) => (
        <li
          key={event.id}
          className="border-border bg-card flex items-center justify-between gap-4 border p-4"
        >
          <div className="min-w-0 space-y-1">
            <p className="truncate font-medium">
              {event.title}{' '}
              <span className="text-muted-foreground text-xs font-normal">
                ({event.type})
              </span>
            </p>
            <p className="text-muted-foreground truncate text-sm">
              {event.venue} · {dateFormatter.format(new Date(event.startsAt))} ·{' '}
              {priceFormatter.format(event.basePrice)}
            </p>
            {event.status === 'CANCELLED' && (
              <p className="text-destructive text-xs font-medium uppercase">
                Cancelado
              </p>
            )}
          </div>

          {event.status === 'PUBLISHED' && (
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(event)}>
                Editar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={cancelingId === event.id}
                onClick={() => onCancelEvent(event)}
              >
                {cancelingId === event.id ? 'Cancelando…' : 'Cancelar'}
              </Button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
