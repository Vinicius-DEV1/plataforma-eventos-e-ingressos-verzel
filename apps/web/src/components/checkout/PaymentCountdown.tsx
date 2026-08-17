import { cn } from '@/lib/utils';

// O prazo é a informação mais urgente do checkout: antes vinha como frase
// dentro de um parágrafo. Aqui ele ocupa uma faixa própria, e muda de tom
// nos dois últimos minutos em vez de piscar.
export function PaymentCountdown({
  minutes,
  seconds,
  expired,
}: {
  minutes: number;
  seconds: number;
  expired: boolean;
}) {
  const running = minutes * 60 + seconds;
  const urgent = !expired && running <= 120;

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 border px-4 py-3',
        expired && 'border-destructive/40 bg-destructive/10',
        urgent && 'border-warning/50 bg-warning/10',
        !expired && !urgent && 'border-border bg-card',
      )}
    >
      <p className="label-print">
        {expired ? 'Reserva expirada' : 'Tempo para pagar'}
      </p>
      <p
        data-numeric
        aria-live={urgent ? 'polite' : 'off'}
        className={cn(
          'display-print text-2xl tracking-tight',
          expired && 'text-destructive',
          urgent && 'text-warning',
        )}
      >
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </p>
    </div>
  );
}
