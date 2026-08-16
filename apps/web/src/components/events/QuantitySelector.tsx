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
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={quantity <= 1}
        onClick={() => onChange(Math.max(1, quantity - 1))}
      >
        −
      </Button>
      <span className="w-10 text-center text-lg font-medium tabular-nums">
        {quantity}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={quantity >= max}
        onClick={() => onChange(Math.min(max, quantity + 1))}
      >
        +
      </Button>
      <span className="text-muted-foreground text-sm">
        de {max} disponíveis
      </span>
    </div>
  );
}
