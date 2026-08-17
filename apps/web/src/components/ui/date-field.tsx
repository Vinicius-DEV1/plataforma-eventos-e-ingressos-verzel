import { useRef, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

// `<input type="date">` desenha a data no idioma do navegador, não no do app:
// num Chrome em inglês, um app inteiro em português mostrava "mm/dd/yyyy".
// Aqui o texto é nosso (sempre dd/mm/aaaa) e o calendário nativo continua
// disponível pelo botão — que é o que faz diferença no celular.
function isoToBr(iso: string): string {
  if (!iso) return '';
  const [year, month, day] = iso.split('-');
  return year && month && day ? `${day}/${month}/${year}` : '';
}

function brToIso(br: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br);
  if (!match) return null;

  const [, day, month, year] = match;
  const iso = `${year}-${month}-${day}`;
  // Round-trip contra o próprio Date: barra 31/02 e 32/13, que passariam
  // numa checagem de faixa feita na mão.
  const parsed = new Date(`${iso}T00:00:00Z`);
  return parsed.toISOString().slice(0, 10) === iso ? iso : null;
}

export function DateField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (iso: string) => void;
}) {
  const [text, setText] = useState(() => isoToBr(value));
  const [syncedValue, setSyncedValue] = useState(value);
  const pickerRef = useRef<HTMLInputElement>(null);

  // Mudanças vindas de fora (limpar filtros, escolher no calendário) precisam
  // voltar para o campo. Ajuste em render em vez de efeito: o texto se corrige
  // na mesma passada, sem uma pintura intermediária com o valor velho.
  if (value !== syncedValue) {
    setSyncedValue(value);
    setText(isoToBr(value));
  }

  const complete = text.length === 10;
  const invalid = complete && brToIso(text) === null;

  function handleText(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    const masked = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)]
      .filter(Boolean)
      .join('/');
    setText(masked);

    if (digits.length === 0) {
      onChange('');
      return;
    }
    if (digits.length === 8) {
      const iso = brToIso(masked);
      if (iso) onChange(iso);
    }
  }

  function openPicker() {
    try {
      pickerRef.current?.showPicker();
    } catch {
      // Navegador sem showPicker: a digitação continua sendo o caminho.
    }
  }

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="dd/mm/aaaa"
        maxLength={10}
        aria-invalid={invalid}
        value={text}
        onChange={(event) => handleText(event.target.value)}
        className={cn(
          'border-input bg-background placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-ring/30 w-full rounded-sm border py-2 pr-9 pl-3 text-sm tabular-nums outline-none transition-colors focus-visible:ring-3',
          invalid && 'border-destructive focus-visible:ring-destructive/30',
        )}
      />

      <button
        type="button"
        onClick={openPicker}
        aria-label="Abrir calendário"
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/40 absolute inset-y-0 right-0 flex w-9 items-center justify-center rounded-sm outline-none transition-colors focus-visible:ring-2"
      >
        <CalendarDays className="size-4" aria-hidden />
      </button>

      {/* Só existe para abrir o calendário nativo; o valor visível é o de cima. */}
      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="pointer-events-none absolute right-2 bottom-0 size-px opacity-0"
      />
    </div>
  );
}
