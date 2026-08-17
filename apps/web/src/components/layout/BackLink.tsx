import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';

// Retorno contextual: aponta para a tela de onde se chega àquela página, e
// fica sempre no mesmo lugar (acima do título). Não é history.back(), porque
// quem abre um link direto também precisa de uma saída coerente.
export function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="label-print hover:text-foreground focus-visible:ring-ring/40 -mx-1 inline-flex w-fit items-center gap-1.5 rounded-sm px-1 py-0.5 transition-colors outline-none focus-visible:ring-3"
    >
      <ArrowLeft className="size-3.5" aria-hidden />
      {label}
    </Link>
  );
}
