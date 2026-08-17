import { Link } from 'react-router';
import { EventPoster } from '@/components/events/EventPoster';
import { Badge } from '@/components/ui/badge';
import type { EventItem } from '@/lib/api-types';
import { formatDateTime, formatPrice } from '@/lib/format';

const TYPE_LABEL = { CINEMA: 'Cinema', SHOW: 'Show' } as const;

export function EventCard({ event }: { event: EventItem }) {
  const soldOut = event.availableTickets <= 0;

  return (
    <Link
      to={`/eventos/${event.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-all duration-200 hover:border-foreground/40 hover:shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <EventPoster
        src={event.imageUrl}
        type={event.type}
        className="aspect-[4/5]"
      />

      <div className="flex flex-1 flex-col gap-2.5 p-4.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[11px] font-bold tracking-wider text-label uppercase">
            {TYPE_LABEL[event.type]} · {event.category}
          </span>
        </div>

        <h2 className="font-bold text-base tracking-tight text-foreground transition-colors group-hover:text-label leading-snug">
          {event.title}
        </h2>

        <div className="text-muted-foreground text-xs font-medium space-y-0.5">
          <p className="truncate">{event.venue}</p>
          <p className="font-mono text-[11px]">
            {formatDateTime(event.startsAt)}
          </p>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-3.5 border-t border-border">
          {soldOut ? (
            <Badge tone="warning">Esgotado</Badge>
          ) : (
            <span className="font-mono text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              A partir de
            </span>
          )}
          <span
            data-numeric
            className="font-mono font-bold text-base text-foreground"
          >
            {formatPrice(event.basePrice)}
          </span>
        </div>
      </div>
    </Link>
  );
}
