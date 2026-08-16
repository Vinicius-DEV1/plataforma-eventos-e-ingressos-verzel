import { Link, Navigate, useLocation } from 'react-router';
import { Button } from '@/components/ui/button';
import { useCountdown } from '@/hooks/useCountdown';
import type { ReservationItem } from '@/lib/api-types';

const priceFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

type LocationState = {
  reservation: ReservationItem;
  eventTitle: string;
};

function isLocationState(value: unknown): value is LocationState {
  return (
    typeof value === 'object' &&
    value !== null &&
    'reservation' in value &&
    'eventTitle' in value
  );
}

export default function ReservationConfirmationPage() {
  const location = useLocation();
  const state: unknown = location.state;

  if (!isLocationState(state)) {
    // No reservation in state (e.g. direct navigation or page refresh) —
    // there's no GET /reservas/:id yet to recover it from, so send the
    // customer back to the catalog instead of showing a broken page.
    return <Navigate to="/eventos" replace />;
  }

  const { reservation, eventTitle } = state;

  return (
    <ConfirmationContent reservation={reservation} eventTitle={eventTitle} />
  );
}

function ConfirmationContent({
  reservation,
  eventTitle,
}: {
  reservation: ReservationItem;
  eventTitle: string;
}) {
  const { minutes, seconds, expired } = useCountdown(reservation.expiresAt);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6">
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase">
          Reserva confirmada
        </p>
        <h1 className="text-2xl font-bold tracking-tight">{eventTitle}</h1>
      </div>

      <div className="bg-card border-border space-y-3 border p-6">
        <p className="text-sm">
          {reservation.seatId
            ? 'Assento reservado.'
            : `${reservation.quantity} ingresso(s) reservado(s).`}
        </p>
        <p className="font-medium tabular-nums">
          {priceFormatter.format(reservation.totalAmount)}
        </p>

        <div className="border-border border-t pt-3">
          {expired ? (
            <p className="text-destructive text-sm font-medium">
              Tempo esgotado — a reserva expirou e o lugar/estoque foi
              devolvido.
            </p>
          ) : (
            <p className="text-sm">
              Complete o pagamento em{' '}
              <span className="font-mono text-base font-medium tabular-nums">
                {String(minutes).padStart(2, '0')}:
                {String(seconds).padStart(2, '0')}
              </span>
            </p>
          )}
        </div>
      </div>

      <Button asChild variant="outline">
        <Link to="/eventos">Voltar para os eventos</Link>
      </Button>
    </main>
  );
}
