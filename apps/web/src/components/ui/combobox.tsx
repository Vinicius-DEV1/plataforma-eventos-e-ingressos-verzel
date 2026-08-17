import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Comparação sem acento e sem caixa: quem digita "acao" precisa achar "Ação",
// porque ninguém para pra alternar o teclado no meio de um filtro.
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

type ComboboxProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
};

// Campo de escolha com digitação: abre com a lista do que existe no sistema,
// e digitar filtra essa lista em vez de buscar às cegas. O texto livre
// continua valendo como busca parcial, porque o filtro da API é `contains` —
// quem digitar algo fora da lista ainda recebe resultado se casar.
export function Combobox({
  id,
  value,
  onChange,
  options,
  placeholder,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = `${id}-listbox`;

  const matches = useMemo(() => {
    const query = normalize(value);
    if (!query) return options;
    return options.filter((option) => normalize(option).includes(query));
  }, [options, value]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  function select(option: string) {
    onChange(option);
    setOpen(false);
    setHighlighted(-1);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setHighlighted((current) => {
        const next = current + step;
        if (next < 0) return matches.length - 1;
        if (next >= matches.length) return 0;
        return next;
      });
      return;
    }

    if (event.key === 'Enter' && open && highlighted >= 0) {
      event.preventDefault();
      select(matches[highlighted]);
      return;
    }

    if (event.key === 'Escape' && open) {
      event.preventDefault();
      setOpen(false);
      setHighlighted(-1);
    }
  }

  // Sem opções carregadas (catálogo vazio ou a chamada falhou), o campo
  // continua sendo um campo de texto comum: some a lista, não a digitação.
  const hasOptions = options.length > 0;
  const showList = open && hasOptions;

  return (
    <div ref={rootRef} className="relative">
      <input
        id={id}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          highlighted >= 0 ? `${id}-option-${highlighted}` : undefined
        }
        placeholder={placeholder}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
          setHighlighted(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className={cn(
          'border-input bg-background placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-ring/30 w-full rounded-sm border py-2 pl-3 text-sm outline-none transition-colors focus-visible:ring-3',
          hasOptions ? 'pr-9' : 'pr-3',
        )}
      />

      {hasOptions && (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          onClick={() => setOpen((current) => !current)}
          className="text-muted-foreground absolute inset-y-0 right-0 flex w-9 items-center justify-center"
        >
          <ChevronDown
            className={cn('size-4 transition-transform', open && 'rotate-180')}
          />
        </button>
      )}

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="bg-popover border-border animate-fade-in absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-md border shadow-md"
        >
          {matches.length === 0 && (
            <li className="text-muted-foreground px-3 py-2 text-sm">
              Nada com esse nome no catálogo.
            </li>
          )}

          {matches.map((option, index) => {
            const selected = option === value;
            return (
              <li
                key={option}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setHighlighted(index)}
                onMouseDown={(event) => {
                  // mousedown em vez de click: o clique perderia a corrida
                  // com o blur do input e fecharia a lista antes de escolher.
                  event.preventDefault();
                  select(option);
                }}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm',
                  index === highlighted && 'bg-secondary',
                  selected && 'font-semibold',
                )}
              >
                {option}
                {selected && <Check className="text-label size-3.5" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
