import * as React from 'react';
import { cn } from '@/lib/utils';

// Um único lugar define a aparência de campo. Antes esta string estava
// copiada em quatro telas.
const controlClass =
  'border-input bg-background placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-ring/30 rounded-sm border px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-3 disabled:opacity-50';

function Input({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      data-slot="input"
      className={cn(controlClass, 'w-full', className)}
      {...props}
    />
  );
}

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(controlClass, 'w-full resize-y', className)}
      {...props}
    />
  );
}

// O rótulo é sempre visível, nunca só o placeholder: quem volta a um
// formulário preenchido precisa saber o que cada valor significa.
function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="label-print block">
        {label}
      </label>
      {children}
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  );
}

export { Field, Input, Textarea };
