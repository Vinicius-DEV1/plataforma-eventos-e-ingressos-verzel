import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { TicketDetailView } from '@/components/tickets/TicketDetailView';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { ReservationItem, TicketDetail } from '@/lib/api-types';

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

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

  async function handleCancel() {
    if (!ticket) return;
    const confirmed = window.confirm(
      'Cancelar esta reserva? O reembolso é total (simulado) e todos os ingressos dela deixam de valer.',
    );
    if (!confirmed) return;

    setCancelling(true);
    setCancelError(null);
    try {
      await apiFetch<ReservationItem>(
        `/reservas/${ticket.reservation.id}/cancelar`,
        { method: 'POST', token: token! },
      );
      // O back-end cancela todos os ingressos da reserva (SPEC.md §4.0),
      // incluindo este — atualiza local em vez de recarregar.
      setTicket({ ...ticket, status: 'CANCELLED' });
    } catch (err) {
      setCancelError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível cancelar a reserva.',
      );
    } finally {
      setCancelling(false);
    }
  }

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

  return (
    <TicketDetailView ticket={ticket} canShare>
      {ticket.status === 'VALID' && (
        <Button
          variant="destructive"
          disabled={cancelling}
          onClick={() => void handleCancel()}
        >
          {cancelling ? 'Cancelando…' : 'Cancelar reserva'}
        </Button>
      )}
      {cancelError && <p className="text-destructive text-sm">{cancelError}</p>}
    </TicketDetailView>
  );
}
