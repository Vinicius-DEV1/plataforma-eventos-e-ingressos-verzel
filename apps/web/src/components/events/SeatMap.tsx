import type { Seat } from '@/lib/api-types';

const STATUS_CLASS: Record<Seat['status'], string> = {
  AVAILABLE:
    'border-input bg-background hover:border-ring hover:bg-muted cursor-pointer',
  RESERVED:
    'border-transparent bg-muted text-muted-foreground cursor-not-allowed',
  SOLD: 'border-transparent bg-muted text-muted-foreground cursor-not-allowed',
};

type SeatMapProps = {
  seats: Seat[];
  selectedSeatId: string | null;
  onSelect: (seat: Seat) => void;
};

export function SeatMap({ seats, selectedSeatId, onSelect }: SeatMapProps) {
  const rows = [...new Set(seats.map((seat) => seat.row))].sort();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="border-input bg-background inline-block size-3 border" />
          Disponível
        </span>
        <span className="flex items-center gap-1.5">
          <span className="bg-primary inline-block size-3" />
          Selecionado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="bg-muted inline-block size-3" />
          Ocupado
        </span>
      </div>

      <div className="space-y-1.5">
        {rows.map((row) => (
          <div key={row} className="flex items-center gap-1.5">
            <span className="text-muted-foreground w-4 text-xs font-medium">
              {row}
            </span>
            <div className="flex flex-wrap gap-1.5">
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
                      title={`${seat.row}${seat.number} — ${seat.status}`}
                      className={`flex size-7 items-center justify-center border text-[0.65rem] font-medium transition-colors ${
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
          </div>
        ))}
      </div>
    </div>
  );
}
