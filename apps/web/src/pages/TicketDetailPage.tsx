import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';
import { BackLink } from '@/components/layout/BackLink';
import { TicketDetailView } from '@/components/tickets/TicketDetailView';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { ReservationItem, TicketDetail } from '@/lib/api-types';

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
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
      setConfirming(false);
    } catch (err) {
      setCancelError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível cancelar a reserva.',
      );
      setConfirming(false);
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <AppShell width="narrow">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-96 w-full" />
      </AppShell>
    );
  }

  if (error || !ticket) {
    return (
      <AppShell width="narrow">
        <BackLink to="/ingressos" label="Meus ingressos" />
        <Alert>{error ?? 'Ingresso não encontrado.'}</Alert>
      </AppShell>
    );
  }

  return (
    <AppShell width="narrow">
      <BackLink to="/ingressos" label="Meus ingressos" />

      <TicketDetailView ticket={ticket} canShare>
        {ticket.status === 'VALID' && (
          <Button variant="destructive" onClick={() => setConfirming(true)}>
            Cancelar reserva
          </Button>
        )}
      </TicketDetailView>

      {cancelError && <Alert>{cancelError}</Alert>}

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Cancelar esta reserva?"
        description="O reembolso é integral e todos os ingressos desta reserva deixam de valer. Não dá para desfazer."
        confirmLabel="Cancelar reserva"
        pending={cancelling}
        onConfirm={() => void handleCancel()}
      />
    </AppShell>
  );
}
