import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { TicketDetailView } from '@/components/tickets/TicketDetailView';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { TicketDetail } from '@/lib/api-types';

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<TicketDetail>(`/ingressos/${id}`, {
          token: token!,
        });
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
  }, [id, token]);

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

  return <TicketDetailView ticket={ticket} canShare />;
}
