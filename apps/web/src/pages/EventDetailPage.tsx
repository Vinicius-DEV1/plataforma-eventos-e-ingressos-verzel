import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { QuantitySelector } from '@/components/events/QuantitySelector';
import { SeatMap } from '@/components/events/SeatMap';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { EventDetail, ReservationItem, Seat } from '@/lib/api-types';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'full',
  timeStyle: 'short',
});
const priceFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [reserving, setReserving] = useState(false);
  const [reserveError, setReserveError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await apiFetch<EventDetail>(`/eventos/${id}`);
        setEvent(data);
      } catch (err) {
        setLoadError(
          err instanceof ApiError
            ? err.message
            : 'Não foi possível carregar o evento.',
        );
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id]);

  async function handleReserve() {
    if (!event) return;
    if (!user) {
      void navigate('/login');
      return;
    }

    setReserving(true);
    setReserveError(null);
    try {
      const path =
        event.type === 'CINEMA' ? '/reservas/assento' : '/reservas/quantidade';
      const body =
        event.type === 'CINEMA'
          ? { eventId: event.id, seatId: selectedSeat!.id }
          : { eventId: event.id, quantity };

      const reservation = await apiFetch<ReservationItem>(path, {
        method: 'POST',
        token: token!,
        body: JSON.stringify(body),
      });

      void navigate('/reservas/confirmacao', {
        state: { reservation, eventTitle: event.title },
      });
    } catch (err) {
      setReserveError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível concluir a reserva.',
      );
    } finally {
      setReserving(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6">
        <p className="text-muted-foreground text-sm">Carregando…</p>
      </main>
    );
  }

  if (loadError || !event) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6">
        <p className="text-destructive text-sm">
          {loadError ?? 'Evento não encontrado.'}
        </p>
      </main>
    );
  }

  const canReserve =
    event.status === 'PUBLISHED' &&
    (event.type === 'CINEMA' ? selectedSeat !== null : quantity > 0);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-12">
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase">
          {event.type === 'CINEMA' ? 'Cinema' : 'Show'} · {event.category}
        </p>
        <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
        <p className="text-muted-foreground text-sm">
          {event.venue} · {dateFormatter.format(new Date(event.startsAt))}
        </p>
        <p className="font-medium tabular-nums">
          {priceFormatter.format(event.basePrice)}
        </p>
      </div>

      {event.status === 'CANCELLED' && (
        <p className="border-destructive/40 bg-destructive/10 text-destructive border p-3 text-sm">
          Este evento foi cancelado pelo organizador.
        </p>
      )}

      {event.description && (
        <p className="text-muted-foreground text-sm">{event.description}</p>
      )}

      {event.status === 'PUBLISHED' && (
        <div className="bg-card border-border space-y-4 border p-6">
          {event.type === 'CINEMA' ? (
            <>
              <p className="text-sm font-medium">Escolha um assento</p>
              <SeatMap
                seats={event.seats ?? []}
                selectedSeatId={selectedSeat?.id ?? null}
                onSelect={(seat) => setSelectedSeat(seat)}
              />
            </>
          ) : (
            <>
              <p className="text-sm font-medium">Quantos ingressos?</p>
              <QuantitySelector
                quantity={quantity}
                max={Math.max(1, event.availableTickets)}
                onChange={setQuantity}
              />
            </>
          )}

          {reserveError && (
            <p className="text-destructive text-sm">{reserveError}</p>
          )}

          <Button
            disabled={!canReserve || reserving}
            onClick={() => void handleReserve()}
          >
            {reserving ? 'Reservando…' : 'Reservar'}
          </Button>
        </div>
      )}
    </main>
  );
}
