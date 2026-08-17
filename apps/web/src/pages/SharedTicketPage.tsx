import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';
import { TicketDetailView } from '@/components/tickets/TicketDetailView';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
      <AppShell width="narrow">
        <Skeleton className="h-96 w-full" />
      </AppShell>
    );
  }

  if (error || !ticket) {
    return (
      <AppShell width="narrow">
        <Alert>{error ?? 'Ingresso não encontrado.'}</Alert>
        <Button asChild variant="outline">
          <Link to="/eventos">Ver o catálogo</Link>
        </Button>
      </AppShell>
    );
  }

  return (
    <AppShell width="narrow">
      {/* Quem chega por link compartilhado não é o dono: vê o ingresso, não
          as ações sobre ele. */}
      <p className="label-print">Ingresso compartilhado</p>
      <TicketDetailView ticket={ticket} canShare={false} />
    </AppShell>
  );
}
