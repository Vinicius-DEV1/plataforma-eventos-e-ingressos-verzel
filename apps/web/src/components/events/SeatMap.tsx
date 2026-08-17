import type { Seat } from '@/lib/api-types';

const STATUS_CLASS: Record<Seat['status'], string> = {
  AVAILABLE:
    'border-input bg-card hover:border-primary hover:bg-accent cursor-pointer',
  RESERVED: 'border-transparent bg-muted text-muted-foreground/60',
  SOLD: 'border-transparent bg-muted text-muted-foreground/60',
};

const STATUS_TITLE: Record<Seat['status'], string> = {
  AVAILABLE: 'disponível',
  RESERVED: 'reservado',
  SOLD: 'vendido',
};

type SeatMapProps = {
  seats: Seat[];
  selectedSeatId: string | null;
  onSelect: (seat: Seat) => void;
};

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
      <span className={`inline-block size-3 border ${swatch}`} />
      {label}
    </span>
  );
}

export function SeatMap({ seats, selectedSeatId, onSelect }: SeatMapProps) {
  const rows = [...new Set(seats.map((seat) => seat.row))].sort();

  return (
    <div className="space-y-5">
      {/* A tela ancora a leitura do mapa: sem ela, "fila A" pode ser tanto a
          da frente quanto a do fundo. */}
      <div className="space-y-1.5">
        <div className="bg-foreground/85 h-1.5 w-full [clip-path:polygon(4%_0,96%_0,100%_100%,0_100%)]" />
        <p className="label-print text-center">Tela</p>
      </div>

      <div className="-mx-1 overflow-x-auto px-1">
        <div className="inline-flex min-w-full flex-col gap-1.5">
          {rows.map((row) => (
            <div key={row} className="flex items-center gap-2">
              <span className="label-print w-4 shrink-0">{row}</span>
              <div className="flex gap-1.5">
                {seats
                  .filter((seat) => seat.row === row)
                  .sort((a, b) => a.number - b.number)
                  .map((seat) => {
                    const isSelected = seat.id === selectedSeatId;
                    return (
                      <button
                        key={seat.id}
                        type="button"
                        disabled={seat.status !== 'AVAILABLE'}
                        onClick={() => onSelect(seat)}
                        aria-pressed={isSelected}
                        title={`Assento ${seat.row}${seat.number} — ${STATUS_TITLE[seat.status]}`}
                        className={`ease-sharp flex size-8 shrink-0 items-center justify-center border text-[0.7rem] font-medium tabular-nums transition-colors duration-150 disabled:cursor-not-allowed ${
                          isSelected
                            ? 'bg-primary text-primary-foreground border-transparent'
                            : STATUS_CLASS[seat.status]
                        }`}
                      >
                        {seat.number}
                      </button>
                    );
                  })}
              </div>
              <span className="label-print w-4 shrink-0 text-right">{row}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <Legend swatch="border-input bg-card" label="Disponível" />
        <Legend swatch="border-transparent bg-primary" label="Selecionado" />
        <Legend swatch="border-transparent bg-muted" label="Ocupado" />
      </div>
    </div>
  );
}
