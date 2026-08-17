import { cn } from '@/lib/utils';

// Ocupa a mesma caixa do conteúdo que vai chegar, para a página não pular
// quando os dados carregam.
function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('bg-muted animate-pulse rounded-sm', className)}
    />
  );
}

export { Skeleton };
