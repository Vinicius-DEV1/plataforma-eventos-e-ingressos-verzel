import { useCallback, useEffect, useState } from 'react';
import { Check, Copy, CreditCard as CardIcon, QrCode } from 'lucide-react';
import { Link, Navigate, useLocation } from 'react-router';
import { CreditCardForm } from '@/components/checkout/CreditCardForm';
import { TEST_CARDS } from '@/components/checkout/test-cards';
import { PaymentCountdown } from '@/components/checkout/PaymentCountdown';
import { AppShell } from '@/components/layout/AppShell';
import { BackLink } from '@/components/layout/BackLink';
import { PageHeader } from '@/components/layout/PageHeader';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { formatPrice } from '@/lib/format';

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
  const [copied, setCopied] = useState(false);
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

  async function handleCopyPix() {
    if (!pix) return;
    await navigator.clipboard.writeText(pix.payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const awaitingPayment = !payment && !expired;

  return (
    <AppShell width="narrow">
      <BackLink to={`/eventos/${reservation.eventId}`} label="Evento" />

      <PageHeader
        size="md"
        label="Pagamento"
        title={eventTitle}
        meta={
          <span
            data-numeric
            className="text-foreground text-base font-semibold"
          >
            {formatPrice(reservation.totalAmount)}
          </span>
        }
      />

      {!payment && (
        <PaymentCountdown
          minutes={minutes}
          seconds={seconds}
          expired={expired}
        />
      )}

      {expired && !payment && (
        <Alert>
          O prazo acabou e a reserva expirou. O lugar voltou para o catálogo, e
          é preciso reservar de novo.
        </Alert>
      )}

      {error && <Alert>{error}</Alert>}

      {awaitingPayment && !selectedMethod && (
        <div className="grid grid-cols-2 gap-3">
          <Button
            size="lg"
            className="h-auto flex-col gap-2 py-5"
            onClick={() => setSelectedMethod('PIX')}
          >
            <QrCode className="size-5" aria-hidden />
            PIX
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-auto flex-col gap-2 py-5"
            onClick={() => setSelectedMethod('CREDIT_CARD')}
          >
            <CardIcon className="size-5" aria-hidden />
            Cartão
          </Button>
        </div>
      )}

      {awaitingPayment && selectedMethod && (
        <Card className="space-y-4 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="display-print text-lg">
              {selectedMethod === 'PIX' ? 'Cobrança PIX' : 'Dados do cartão'}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedMethod(null)}
            >
              Trocar forma
            </Button>
          </div>

          {selectedMethod === 'PIX' ? (
            <Button
              size="lg"
              className="w-full"
              disabled={processing}
              onClick={() => void handleProcess('PIX')}
            >
              {processing ? 'Gerando cobrança…' : 'Gerar cobrança PIX'}
            </Button>
          ) : (
            <CreditCardForm
              card={card}
              onChange={setCard}
              processing={processing}
              onSubmit={() => void handleProcess('CREDIT_CARD')}
            />
          )}
        </Card>
      )}

      {payment?.status === 'PENDING' && pix && (
        <Card className="space-y-5 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="display-print text-lg">Escaneie para pagar</h2>
            <Badge tone="info">Aguardando</Badge>
          </div>

          <img
            src={`data:image/png;base64,${pix.encodedImage}`}
            alt="QR Code da cobrança PIX"
            className="border-border mx-auto size-48 border bg-white p-2"
          />

          <div className="space-y-2">
            <p className="label-print">Copia e cola</p>
            <p className="bg-muted max-h-24 overflow-y-auto p-2 font-mono text-xs break-all">
              {pix.payload}
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => void handleCopyPix()}
            >
              {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
              {copied ? 'Código copiado' : 'Copiar código'}
            </Button>
          </div>

          <div className="border-border space-y-3 border-t border-dashed pt-4">
            <p className="text-muted-foreground text-xs">
              O webhook do Asaas não alcança este ambiente local. Os botões
              abaixo simulam o retorno da cobrança.
            </p>
            <div className="flex gap-2">
              <Button
                disabled={processing}
                onClick={() => void handleSimulate('CONFIRMED')}
              >
                Simular pagamento
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
        </Card>
      )}

      {payment?.status === 'CONFIRMED' && (
        <Card className="space-y-4 p-6">
          <Badge tone="success">Pagamento confirmado</Badge>
          <p className="text-muted-foreground text-sm">
            Os ingressos já estão emitidos, cada um com o seu QR Code.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link to="/ingressos">Ver meus ingressos</Link>
            </Button>
            {payment.invoiceUrl && (
              <a
                href={payment.invoiceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-label text-sm underline underline-offset-4"
              >
                Ver comprovante
              </a>
            )}
          </div>
        </Card>
      )}

      {payment?.status === 'DECLINED' && (
        <Card className="border-destructive/40 space-y-4 p-6">
          <Badge tone="danger">Pagamento recusado</Badge>
          <p className="text-muted-foreground text-sm">
            Esta reserva foi encerrada e o lugar já voltou ao catálogo. Não há
            nova tentativa sobre a mesma reserva.
          </p>
          <Button asChild variant="outline">
            <Link to={`/eventos/${reservation.eventId}`}>Voltar ao evento</Link>
          </Button>
        </Card>
      )}
    </AppShell>
  );
}
