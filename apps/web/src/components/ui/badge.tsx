import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-mono font-bold tracking-wider uppercase select-none',
  {
    variants: {
      tone: {
        neutral: 'border-border bg-secondary text-secondary-foreground',
        info: 'border-primary/30 bg-accent text-primary dark:border-primary/40 dark:bg-primary/15 dark:text-primary-foreground',
        success:
          'border-success/30 bg-success/10 text-success dark:text-success',
        warning:
          'border-warning/30 bg-warning/10 text-warning dark:text-warning',
        danger:
          'border-destructive/30 bg-destructive/10 text-destructive dark:text-destructive',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

function Badge({
  className,
  tone,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ tone }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
