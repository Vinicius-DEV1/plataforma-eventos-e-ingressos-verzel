import type { ReactNode } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { cn } from '@/lib/utils';

// Larguras nomeadas em vez de max-w solto em cada tela: formulário e
// ingresso pedem coluna estreita, catálogo pede a folha inteira.
const WIDTH = {
  narrow: 'max-w-md',
  regular: 'max-w-3xl',
  wide: 'max-w-6xl',
} as const;

export function AppShell({
  width = 'regular',
  className,
  children,
}: {
  width?: keyof typeof WIDTH;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <main
        className={cn(
          'animate-slide-up mx-auto flex w-full flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12 relative z-10',
          WIDTH[width],
          className,
        )}
      >
        {children}
      </main>
    </div>
  );
}
