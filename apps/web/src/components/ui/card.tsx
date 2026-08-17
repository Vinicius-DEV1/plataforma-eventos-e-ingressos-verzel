import * as React from 'react';
import { Slot } from 'radix-ui';
import { cn } from '@/lib/utils';

function Card({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'div'> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'div';

  return (
    <Comp
      data-slot="card"
      className={cn(
        'bg-card text-card-foreground border border-border rounded-lg shadow-xs transition-colors',
        className,
      )}
      {...props}
    />
  );
}

export { Card };
