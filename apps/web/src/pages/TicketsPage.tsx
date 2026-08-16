import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { TicketItem } from '@/lib/api-types';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

const statusLabel: Record<TicketItem['status'], string> = {
  VALID: 'Válido',
  USED: 'Utilizado',
  CANCELLED: 'Cancelado',
};

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
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-12">
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase">
          Meus Ingressos
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Ingressos</h1>
      </div>

      {loading && <p className="text-muted-foreground text-sm">Carregando…</p>}
      {error && <p className="text-destructive text-sm">{error}</p>}
      {!loading && !error && tickets.length === 0 && (
        <p className="text-muted-foreground text-sm">
          Você ainda não tem ingressos.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {tickets.map((ticket) => (
          <Link
            key={ticket.id}
            to={`/ingressos/${ticket.id}`}
            className="border-border bg-card hover:border-ring flex items-center gap-4 border p-4 transition-colors"
          >
            {ticket.event.imageUrl && (
              <img
                src={ticket.event.imageUrl}
                alt=""
                className="size-16 shrink-0 object-cover"
              />
            )}
            <div className="flex-1 space-y-1">
              <p className="font-medium">{ticket.event.title}</p>
              <p className="text-muted-foreground text-sm">
                {ticket.event.venue} ·{' '}
                {dateFormatter.format(new Date(ticket.event.startsAt))}
              </p>
            </div>
            <span className="text-muted-foreground text-xs font-medium tracking-[0.15em] uppercase">
              {statusLabel[ticket.status]}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
