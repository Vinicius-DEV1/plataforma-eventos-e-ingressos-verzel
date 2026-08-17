import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { TICKET_STATUS } from '@/components/tickets/ticket-status';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { TicketItem } from '@/lib/api-types';
import { formatDateTime, ticketSerial } from '@/lib/format';

export default function TicketsPage() {
  const { token } = useAuth();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<{ items: TicketItem[] }>(
          '/ingressos/meus',
          { token: token! },
        );
        setTickets(data.items);
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : 'Não foi possível carregar os ingressos.',
        );
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [token]);

  return (
    <AppShell>
      <PageHeader
        label="Minha carteira"
        title="Ingressos"
        meta={
          !loading && !error && tickets.length > 0
            ? `${tickets.length} ${tickets.length === 1 ? 'ingresso emitido' : 'ingressos emitidos'}`
            : undefined
        }
      />

      {error && <Alert>{error}</Alert>}

      {loading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      )}

      {!loading && !error && tickets.length === 0 && (
        <div className="border-border flex flex-col items-center gap-4 border border-dashed px-6 py-16 text-center">
          <p className="text-muted-foreground text-sm">
            Nenhum ingresso por aqui ainda.
          </p>
          <Button asChild>
            <Link to="/eventos">Ver o catálogo</Link>
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {tickets.map((ticket) => {
          const status = TICKET_STATUS[ticket.status];
          return (
            <Link
              key={ticket.id}
              to={`/ingressos/${ticket.id}`}
              className="border-border bg-card hover:border-primary focus-visible:ring-ring/40 ease-sharp flex items-stretch border transition-[transform,border-color] duration-200 outline-none hover:-translate-y-0.5 focus-visible:ring-3"
            >
              {ticket.event.imageUrl && (
                <img
                  src={ticket.event.imageUrl}
                  alt=""
                  loading="lazy"
                  className="w-20 shrink-0 object-cover"
                />
              )}

              <div className="min-w-0 flex-1 space-y-1 p-4">
                <p data-numeric className="label-print">
                  Nº {ticketSerial(ticket.id)}
                </p>
                <p className="display-print truncate text-lg">
                  {ticket.event.title}
                </p>
                <p className="text-muted-foreground truncate text-sm">
                  {ticket.event.venue} · {formatDateTime(ticket.event.startsAt)}
                </p>
              </div>

              {/* O canhoto: mesma divisão do ingresso, aqui só com o estado. */}
              <div className="border-border flex shrink-0 items-center border-l border-dashed px-4">
                <Badge tone={status.tone}>{status.label}</Badge>
              </div>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
