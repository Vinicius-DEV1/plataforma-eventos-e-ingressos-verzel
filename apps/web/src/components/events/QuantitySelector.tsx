import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

type QuantitySelectorProps = {
  quantity: number;
  max: number;
  onChange: (quantity: number) => void;
};

export function QuantitySelector({
  quantity,
  max,
  onChange,
}: QuantitySelectorProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="border-input flex items-center border">
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          aria-label="Diminuir quantidade"
          disabled={quantity <= 1}
          onClick={() => onChange(Math.max(1, quantity - 1))}
        >
          <Minus aria-hidden />
        </Button>
        <span
          data-numeric
          aria-live="polite"
          className="display-print w-12 text-center text-xl"
        >
          {quantity}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          aria-label="Aumentar quantidade"
          disabled={quantity >= max}
          onClick={() => onChange(Math.min(max, quantity + 1))}
        >
          <Plus aria-hidden />
        </Button>
      </div>
      <span className="text-muted-foreground text-sm">
        <span data-numeric>{max}</span> disponíveis
      </span>
    </div>
  );
}
