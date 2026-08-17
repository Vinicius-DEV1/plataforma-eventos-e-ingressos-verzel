import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Aviso no lugar onde a ação falhou, em vez de alert() do navegador: o
// usuário continua vendo o que estava fazendo.
const alertVariants = cva('border px-3 py-2 text-sm', {
  variants: {
    tone: {
      info: 'border-primary/30 bg-primary/8 text-foreground',
      warning: 'border-warning/40 bg-warning/10 text-foreground',
      danger: 'border-destructive/40 bg-destructive/10 text-destructive',
    },
  },
  defaultVariants: { tone: 'danger' },
});

function Alert({
  className,
  tone,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return (
    <div
      role="alert"
      data-slot="alert"
      className={cn(alertVariants({ tone }), className)}
      {...props}
    />
  );
}

export { Alert };
