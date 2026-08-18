import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { EventPoster } from '@/components/events/EventPoster';
import { Badge } from '@/components/ui/badge';
import type { EventItem } from '@/lib/api-types';
import { formatFullDateTime, formatPrice, isEventSoldOut } from '@/lib/format';

const TYPE_LABEL = { CINEMA: 'Cinema', SHOW: 'Show' } as const;

export function FeaturedEventCard({ event }: { event: EventItem }) {
  const soldOut = isEventSoldOut(event);

  return (
    <Link
      to={`/eventos/${event.id}`}
      className="group col-span-full grid overflow-hidden rounded-lg border border-border bg-card transition-all duration-200 hover:border-foreground/40 hover:shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
    >
      <EventPoster
        src={event.imageUrl}
        type={event.type}
        className="h-full max-h-[26rem] min-h-56 object-cover"
      />

      <div className="flex flex-col">
        <div className="bg-foreground text-background font-mono text-[11px] font-bold uppercase tracking-widest px-5 py-2.5 flex items-center justify-between">
          <span>EM DESTAQUE</span>
          <span>{TYPE_LABEL[event.type]}</span>
        </div>

        <div className="flex flex-1 flex-col gap-4 p-5 sm:p-7">
          <div className="space-y-2">
            {event.category && (
              <span className="font-mono text-xs font-bold text-label tracking-wider uppercase">
                {event.category.name}
              </span>
            )}
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground text-balance transition-colors group-hover:text-primary">
              {event.title}
            </h2>
          </div>

          <div className="text-muted-foreground text-xs sm:text-sm font-medium space-y-1">
            <p>{event.venue}</p>
            <p className="font-mono">{formatFullDateTime(event.startsAt)}</p>
          </div>

          {event.description && (
            <p className="text-muted-foreground line-clamp-3 hidden text-xs sm:text-sm leading-relaxed sm:block">
              {event.description}
            </p>
          )}

          <div className="mt-auto flex items-end justify-between gap-3 pt-5 border-t border-border">
            <div>
              {soldOut ? (
                <Badge tone="warning">Esgotado</Badge>
              ) : (
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-0.5">
                  A partir de
                </span>
              )}
              <span
                data-numeric
                className="font-mono font-bold text-2xl text-foreground"
              >
                {formatPrice(event.basePrice)}
              </span>
            </div>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-label flex items-center gap-1.5 group-hover:underline">
              Ver sessão
              <ArrowRight
                className="size-3.5 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
