import { TEST_CARDS } from '@/components/checkout/test-cards';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import type { CreditCard } from '@/lib/api-types';

export function CreditCardForm({
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
  const usingDeclined = card.number === TEST_CARDS.DECLINED;

  return (
    <div className="space-y-4">
      <div className="border-border flex flex-wrap gap-2 border border-dashed p-3">
        <p className="label-print w-full">Cartões de teste do sandbox</p>
        <Button
          type="button"
          variant={usingDeclined ? 'outline' : 'secondary'}
          size="sm"
          onClick={() => onChange({ ...card, number: TEST_CARDS.APPROVED })}
        >
          Aprova
        </Button>
        <Button
          type="button"
          variant={usingDeclined ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => onChange({ ...card, number: TEST_CARDS.DECLINED })}
        >
          Recusa
        </Button>
      </div>

      <Field label="Nome no cartão" htmlFor="card-holder">
        <Input
          id="card-holder"
          value={card.holderName}
          onChange={(e) => onChange({ ...card, holderName: e.target.value })}
        />
      </Field>

      <Field label="Número" htmlFor="card-number">
        <Input
          id="card-number"
          inputMode="numeric"
          data-numeric
          value={card.number}
          onChange={(e) => onChange({ ...card, number: e.target.value })}
        />
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Mês" htmlFor="card-month">
          <Input
            id="card-month"
            inputMode="numeric"
            data-numeric
            placeholder="MM"
            value={card.expiryMonth}
            onChange={(e) => onChange({ ...card, expiryMonth: e.target.value })}
          />
        </Field>
        <Field label="Ano" htmlFor="card-year">
          <Input
            id="card-year"
            inputMode="numeric"
            data-numeric
            placeholder="AAAA"
            value={card.expiryYear}
            onChange={(e) => onChange({ ...card, expiryYear: e.target.value })}
          />
        </Field>
        <Field label="CVV" htmlFor="card-ccv">
          <Input
            id="card-ccv"
            inputMode="numeric"
            data-numeric
            value={card.ccv}
            onChange={(e) => onChange({ ...card, ccv: e.target.value })}
          />
        </Field>
      </div>

      <Button
        size="lg"
        className="w-full"
        disabled={processing || !card.holderName}
        onClick={onSubmit}
      >
        {processing ? 'Processando…' : 'Pagar com cartão'}
      </Button>
    </div>
  );
}
