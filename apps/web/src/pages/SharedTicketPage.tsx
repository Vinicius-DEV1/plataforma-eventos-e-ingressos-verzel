import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { TicketDetailView } from '@/components/tickets/TicketDetailView';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { TicketDetail } from '@/lib/api-types';

// [público] — SPEC.md §5.6: quem abre o link vê o ingresso sem precisar de
// login. Não passa `token` ao apiFetch de propósito.
export default function SharedTicketPage() {
  const { shareToken } = useParams<{ shareToken: string }>();

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<TicketDetail>(
          `/ingressos/compartilhar/${shareToken}`,
        );
        setTicket(data);
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : 'Não foi possível carregar o ingresso.',
        );
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [shareToken]);

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center justify-center px-6">
        <p className="text-muted-foreground text-sm">Carregando…</p>
      </main>
    );
  }

  if (error || !ticket) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center justify-center px-6">
        <p className="text-destructive text-sm">
          {error ?? 'Ingresso não encontrado.'}
        </p>
      </main>
    );
  }

  return <TicketDetailView ticket={ticket} canShare={false} />;
}
