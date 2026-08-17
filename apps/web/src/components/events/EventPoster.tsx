import { Clapperboard, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EventType } from '@/lib/api-types';

const TYPE_LABEL: Record<EventType, string> = {
  CINEMA: 'Cinema',
  SHOW: 'Show',
};

export function EventPoster({
  src,
  type,
  className,
}: {
  src: string;
  type: EventType;
  className?: string;
}) {
  if (src) {
    return (
      <div className={cn('relative overflow-hidden bg-muted', className)}>
        <img
          src={src}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative flex w-full items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-b border-border/40',
        className,
      )}
    >
      <div className="flex flex-col items-center gap-2 text-label/80">
        {type === 'CINEMA' ? (
          <Clapperboard className="size-8 opacity-70" />
        ) : (
          <Music className="size-8 opacity-70" />
        )}
        <span className="text-[0.7rem] font-bold uppercase tracking-widest">
          {TYPE_LABEL[type]}
        </span>
      </div>
    </div>
  );
}
