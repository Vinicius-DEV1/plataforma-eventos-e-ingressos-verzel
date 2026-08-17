import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Ficha impressa: par rótulo/valor, em <dl> porque é exatamente o que a
// marcação descreve. Reaproveitada na ficha do evento e na do ingresso.
function DataList({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <dl className={cn('grid gap-4 sm:grid-cols-2', className)}>{children}</dl>
  );
}

function DataItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="label-print">{label}</dt>
      <dd className="mt-1 text-sm">{children}</dd>
    </div>
  );
}

export { DataItem, DataList };
