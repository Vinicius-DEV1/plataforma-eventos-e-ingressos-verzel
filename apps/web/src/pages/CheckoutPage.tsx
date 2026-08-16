import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { useCountdown } from '@/hooks/useCountdown';
import { apiFetch, ApiError } from '@/lib/api-client';
import type {
  CreditCard,
  PaymentItem,
  PaymentMethod,
  PixInfo,
  ReservationItem,
} from '@/lib/api-types';

const priceFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const inputClass =
  'border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-3';

// Documented sandbox-only numbers (docs.asaas.com/docs/testando-pagamento-com-cartao-de-credito).
// Prefilled so whoever is evaluating the project can submit a working charge without
// needing a real card.
const TEST_CARDS = {
  APPROVED: '4444444444444444',
  DECLINED: '5184019740373151',
};

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

export default function CheckoutPage() {
  const location = useLocation();
  const state: unknown = location.state;

  if (!isLocationState(state)) {
    // Nothing in state (direct navigation, page refresh) — there's no
    // GET /reservas/:id to recover it from, so send the customer back to
    // the catalog instead of showing a broken checkout.
    return <Navigate to="/eventos" replace />;
  }

  return (
    <CheckoutContent
      reservation={state.reservation}
      eventTitle={state.eventTitle}
    />
  );
}

function CheckoutContent({
  reservation,
  eventTitle,
}: {
  reservation: ReservationItem;
  eventTitle: string;
}) {
  const { token } = useAuth();
  const { minutes, seconds, expired } = useCountdown(reservation.expiresAt);

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null,
  );
  const [payment, setPayment] = useState<PaymentItem | null>(null);
  const [pix, setPix] = useState<PixInfo | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [card, setCard] = useState<CreditCard>({
    holderName: 'Cliente Teste',
    number: TEST_CARDS.APPROVED,
    expiryMonth: '12',
    expiryYear: '2030',
    ccv: '123',
  });

  const refreshPayment = useCallback(
    async (paymentId: string) => {
      const updated = await apiFetch<PaymentItem>(`/pagamentos/${paymentId}`, {
        token: token!,
      });
      setPayment(updated);
    },
    [token],
  );

  // While a PIX charge is PENDING, the webhook (production) or another tab
  // calling /simular-callback could resolve it — polling is how this screen
  // finds out (SPEC.md §5.5).
  useEffect(() => {
    if (!payment || payment.status !== 'PENDING' || !token) return;
    const interval = setInterval(() => {
      void refreshPayment(payment.id);
    }, 3000);
    return () => clearInterval(interval);
  }, [payment, token, refreshPayment]);

  async function handleProcess(method: PaymentMethod) {
    setProcessing(true);
    setError(null);
    try {
      const body = method === 'PIX' ? { method } : { method, card };
      const result = await apiFetch<PaymentItem>(
        `/pagamentos/${reservation.id}/processar`,
        { method: 'POST', token: token!, body: JSON.stringify(body) },
      );
      setPayment(result);
      if (result.pix) setPix(result.pix);
      // The card path resolves synchronously (CONFIRMED/DECLINED already),
      // but that response doesn't carry invoiceUrl — only GET /pagamentos/:id
      // does, and only once the charge is settled.
      if (result.status !== 'PENDING') {
        await refreshPayment(result.id);
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível processar o pagamento.',
      );
    } finally {
      setProcessing(false);
    }
  }

  async function handleSimulate(outcome: 'CONFIRMED' | 'DECLINED') {
    if (!payment) return;
    setProcessing(true);
    setError(null);
    try {
      await apiFetch(`/pagamentos/${payment.id}/simular-callback`, {
        method: 'POST',
        token: token!,
        body: JSON.stringify({ outcome }),
      });
      await refreshPayment(payment.id);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível simular o retorno do pagamento.',
      );
    } finally {
      setProcessing(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-12">
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase">
          Checkout
        </p>
        <h1 className="text-2xl font-bold tracking-tight">{eventTitle}</h1>
        <p className="font-medium tabular-nums">
          {priceFormatter.format(reservation.totalAmount)}
        </p>
      </div>

      {!payment && !expired && (
        <div className="border-border bg-card space-y-3 border p-6 text-sm">
          <p>
            Confirme o pagamento em{' '}
            <span className="font-mono text-base font-medium tabular-nums">
              {String(minutes).padStart(2, '0')}:
              {String(seconds).padStart(2, '0')}
            </span>
          </p>
        </div>
      )}

      {expired && !payment && (
        <p className="border-destructive/40 bg-destructive/10 text-destructive border p-3 text-sm">
          Tempo esgotado — a reserva expirou e o lugar/estoque foi devolvido.
        </p>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}

      {!payment && !expired && !selectedMethod && (
        <div className="flex gap-3">
          <Button onClick={() => setSelectedMethod('PIX')}>
            Pagar com PIX
          </Button>
          <Button
            variant="outline"
            onClick={() => setSelectedMethod('CREDIT_CARD')}
          >
            Pagar com cartão
          </Button>
        </div>
      )}

      {!payment && !expired && selectedMethod === 'PIX' && (
        <div className="space-y-3">
          <Button
            disabled={processing}
            onClick={() => void handleProcess('PIX')}
          >
            {processing ? 'Gerando cobrança…' : 'Gerar cobrança PIX'}
          </Button>
          <button
            type="button"
            className="text-muted-foreground block text-xs underline"
            onClick={() => setSelectedMethod(null)}
          >
            Escolher outra forma de pagamento
          </button>
        </div>
      )}

      {!payment && !expired && selectedMethod === 'CREDIT_CARD' && (
        <div className="space-y-3">
          <CreditCardForm
            card={card}
            onChange={setCard}
            processing={processing}
            onSubmit={() => void handleProcess('CREDIT_CARD')}
          />
          <button
            type="button"
            className="text-muted-foreground block text-xs underline"
            onClick={() => setSelectedMethod(null)}
          >
            Escolher outra forma de pagamento
          </button>
        </div>
      )}

      {payment && payment.status === 'PENDING' && pix && (
        <div className="border-border bg-card space-y-4 border p-6">
          <p className="text-sm font-medium">Escaneie o QR Code PIX</p>
          <img
            src={`data:image/png;base64,${pix.encodedImage}`}
            alt="QR Code PIX"
            className="mx-auto size-48"
          />
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Copia e cola</p>
            <p className="bg-muted overflow-x-auto p-2 font-mono text-xs break-all">
              {pix.payload}
            </p>
          </div>
          <p className="text-muted-foreground text-xs">
            O webhook do Asaas não alcança este ambiente local. Use os botões
            abaixo para simular o retorno da cobrança.
          </p>
          <div className="flex gap-3">
            <Button
              disabled={processing}
              onClick={() => void handleSimulate('CONFIRMED')}
            >
              Confirmar pagamento
            </Button>
            <Button
              variant="outline"
              disabled={processing}
              onClick={() => void handleSimulate('DECLINED')}
            >
              Simular recusa
            </Button>
          </div>
        </div>
      )}

      {payment && payment.status === 'CONFIRMED' && (
        <div className="border-border bg-card space-y-3 border p-6">
          <p className="text-sm font-medium">Pagamento confirmado.</p>
          {payment.invoiceUrl && (
            <a
              href={payment.invoiceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary text-sm underline"
            >
              Ver comprovante
            </a>
          )}
          <Button asChild>
            <Link to="/ingressos">Ver meus ingressos</Link>
          </Button>
        </div>
      )}

      {payment && payment.status === 'DECLINED' && (
        <div className="border-destructive/40 bg-destructive/10 space-y-2 border p-6">
          <p className="text-destructive text-sm font-medium">
            Pagamento recusado.
          </p>
          <p className="text-muted-foreground text-sm">
            Esta reserva foi encerrada e o lugar/estoque já foi devolvido. Não
            há nova tentativa sobre a mesma reserva.
          </p>
        </div>
      )}

      <Button asChild variant="outline">
        <Link to="/eventos">Voltar para os eventos</Link>
      </Button>
    </main>
  );
}

function CreditCardForm({
  card,
  onChange,
  processing,
  onSubmit,
}: {
  card: CreditCard;
  onChange: (card: CreditCard) => void;
  processing: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="border-border bg-card space-y-3 border p-6">
      <p className="text-sm font-medium">Dados do cartão (sandbox)</p>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onChange({ ...card, number: TEST_CARDS.APPROVED })}
        >
          Usar cartão que aprova
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => onChange({ ...card, number: TEST_CARDS.DECLINED })}
        >
          Usar cartão que recusa
        </Button>
      </div>

      <input
        className={inputClass}
        placeholder="Nome no cartão"
        value={card.holderName}
        onChange={(e) => onChange({ ...card, holderName: e.target.value })}
      />
      <input
        className={inputClass}
        placeholder="Número do cartão"
        value={card.number}
        onChange={(e) => onChange({ ...card, number: e.target.value })}
      />
      <div className="flex gap-2">
        <input
          className={inputClass}
          placeholder="Mês (MM)"
          value={card.expiryMonth}
          onChange={(e) => onChange({ ...card, expiryMonth: e.target.value })}
        />
        <input
          className={inputClass}
          placeholder="Ano (AAAA)"
          value={card.expiryYear}
          onChange={(e) => onChange({ ...card, expiryYear: e.target.value })}
        />
        <input
          className={inputClass}
          placeholder="CVV"
          value={card.ccv}
          onChange={(e) => onChange({ ...card, ccv: e.target.value })}
        />
      </div>

      <Button disabled={processing || !card.holderName} onClick={onSubmit}>
        {processing ? 'Processando…' : 'Pagar com cartão'}
      </Button>
    </div>
  );
}
