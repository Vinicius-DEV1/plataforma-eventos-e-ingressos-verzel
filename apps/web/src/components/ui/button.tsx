import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md text-sm font-semibold whitespace-nowrap transition-colors duration-150 outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs active:opacity-95',
        outline:
          'border border-border bg-card text-foreground hover:bg-secondary hover:text-foreground shadow-xs',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-xs',
        ghost: 'hover:bg-secondary hover:text-foreground text-muted-foreground',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs',
        link: 'text-label underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 gap-2 px-4 text-sm',
        xs: 'h-7 gap-1 rounded-sm px-2 text-xs',
        sm: 'h-8 gap-1.5 rounded px-3 text-xs font-semibold',
        lg: 'h-11 gap-2.5 px-6 text-sm font-bold tracking-tight',
        icon: 'size-10',
        'icon-xs': 'size-7 rounded-sm',
        'icon-sm': 'size-8 rounded',
        'icon-lg': 'size-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
