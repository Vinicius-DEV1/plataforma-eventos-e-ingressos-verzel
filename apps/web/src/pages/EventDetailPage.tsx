import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { EventPoster } from '@/components/events/EventPoster';
import { QuantitySelector } from '@/components/events/QuantitySelector';
import { SeatMap } from '@/components/events/SeatMap';
import { AppShell } from '@/components/layout/AppShell';
import { BackLink } from '@/components/layout/BackLink';
import { PageHeader } from '@/components/layout/PageHeader';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DataItem, DataList } from '@/components/ui/data-list';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { EventDetail, ReservationItem, Seat } from '@/lib/api-types';
import {
  eventTypeCategoryLabel,
  formatFullDateTime,
  formatPrice,
} from '@/lib/format';

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
    if (user.role !== 'CUSTOMER') return;

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

      void navigate('/reservas/checkout', {
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
      <AppShell>
        <Skeleton className="aspect-[16/7] w-full" />
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-32 w-full" />
      </AppShell>
    );
  }

  if (loadError || !event) {
    return (
      <AppShell>
        <BackLink to="/eventos" label="Catálogo" />
        <Alert>{loadError ?? 'Evento não encontrado.'}</Alert>
      </AppShell>
    );
  }

  const isCinema = event.type === 'CINEMA';
  const isNonCustomer = user !== null && user.role !== 'CUSTOMER';
  const canReserve =
    event.status === 'PUBLISHED' &&
    (isCinema ? selectedSeat !== null : quantity > 0);
  const total = isCinema ? event.basePrice : event.basePrice * quantity;

  return (
    <AppShell>
      <BackLink to="/eventos" label="Catálogo" />

      <EventPoster
        src={event.imageUrl}
        type={event.type}
        className="aspect-[16/7] rounded-3xl overflow-hidden shadow-xl"
      />

      <PageHeader label={eventTypeCategoryLabel(event)} title={event.title} />

      {event.status === 'CANCELLED' && (
        <Alert>Este evento foi cancelado pelo organizador.</Alert>
      )}

      <Card className="p-6">
        <DataList>
          <DataItem label="Local">{event.venue}</DataItem>
          <DataItem label="Quando">
            {formatFullDateTime(event.startsAt)}
          </DataItem>
          <DataItem label="Preço unitário">
            <span data-numeric className="font-semibold">
              {formatPrice(event.basePrice)}
            </span>
          </DataItem>
          <DataItem label={isCinema ? 'Assentos livres' : 'Ingressos livres'}>
            <span data-numeric>{event.availableTickets}</span> de{' '}
            <span data-numeric>{event.totalCapacity}</span>
          </DataItem>
        </DataList>

        {event.description && (
          <p className="text-muted-foreground border-border/50 mt-6 border-t pt-6 text-sm sm:text-base leading-relaxed">
            {event.description}
          </p>
        )}
      </Card>

      {event.status === 'PUBLISHED' && isNonCustomer && (
        <Card className="p-6">
          <Alert>
            Ingressos são reservados por contas de cliente. Entre com uma conta
            de cliente para comprar.
          </Alert>
        </Card>
      )}

      {event.status === 'PUBLISHED' && !isNonCustomer && (
        <Card className="space-y-5 p-6">
          <h2 className="display-print text-xl">
            {isCinema ? 'Escolha o assento' : 'Quantos ingressos?'}
          </h2>

          {isCinema ? (
            <SeatMap
              seats={event.seats ?? []}
              selectedSeatId={selectedSeat?.id ?? null}
              onSelect={(seat) => setSelectedSeat(seat)}
            />
          ) : (
            <QuantitySelector
              quantity={quantity}
              max={Math.max(1, event.availableTickets)}
              onChange={setQuantity}
            />
          )}

          {reserveError && <Alert>{reserveError}</Alert>}

          {/* O resumo fica colado no botão: o total é a última coisa lida
              antes de reservar. */}
          <div className="border-border/50 flex flex-wrap items-center justify-between gap-4 border-t pt-5">
            <div>
              <p className="label-print">
                {isCinema
                  ? selectedSeat
                    ? `Assento ${selectedSeat.row}${selectedSeat.number}`
                    : 'Nenhum assento escolhido'
                  : 'Total'}
              </p>
              <p data-numeric className="display-print text-2xl">
                {formatPrice(total)}
              </p>
            </div>
            <Button
              size="lg"
              disabled={!canReserve || reserving}
              onClick={() => void handleReserve()}
            >
              {reserving ? 'Reservando…' : 'Reservar'}
            </Button>
          </div>

          <p className="text-muted-foreground text-xs">
            A reserva segura o lugar por 15 minutos. Sem pagamento nesse prazo,
            ele volta para o catálogo.
          </p>
        </Card>
      )}
    </AppShell>
  );
}
