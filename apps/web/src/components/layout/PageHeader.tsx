import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const TITLE_SIZE = {
  lg: 'text-3xl sm:text-4xl md:text-5xl tracking-tight font-extrabold',
  md: 'text-2xl sm:text-3xl tracking-tight font-bold',
} as const;

export function PageHeader({
  label,
  title,
  meta,
  actions,
  size = 'lg',
}: {
  label: string;
  title: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  size?: keyof typeof TITLE_SIZE;
}) {
  return (
    <header className="flex flex-col gap-3 pb-2">
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs font-bold tracking-widest uppercase text-label">
          [ {label} ]
        </span>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <h1 className={cn('text-balance text-foreground', TITLE_SIZE[size])}>
            {title}
          </h1>
          {meta && (
            <div className="text-muted-foreground max-w-2xl text-sm sm:text-base leading-relaxed">
              {meta}
            </div>
          )}
        </div>
        {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
      </div>

      <div className="mt-3 border-b border-border" />
    </header>
  );
}
