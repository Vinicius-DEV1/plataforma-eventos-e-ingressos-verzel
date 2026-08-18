import { Dialog } from 'radix-ui';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { EventItem } from '@/lib/api-types';

// Depois de publicar, o organizador tem duas continuações naturais:
// cadastrar outro evento (o caso comum, quando ele vem de um lote) ou
// conferir como o que acabou de criar ficou publicado. Sem isto, o
// comportamento antigo (voltar direto pra lista) obrigava um clique a mais
// nos dois casos.
export function EventCreatedDialog({
  event,
  onCreateAnother,
  onViewEvent,
}: {
  event: EventItem | null;
  onCreateAnother: () => void;
  onViewEvent: (event: EventItem) => void;
}) {
  return (
    <Dialog.Root open={event !== null}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-foreground/40 data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 z-50 backdrop-blur-[1px]" />
        <Dialog.Content className="bg-card border-border animate-slide-up fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 border p-6">
          <div className="text-success mb-3 flex items-center gap-2">
            <CheckCircle2 className="size-5" aria-hidden />
            <Dialog.Title className="display-print text-xl">
              Evento publicado
            </Dialog.Title>
          </div>
          <Dialog.Description className="text-muted-foreground text-sm">
            {event ? `"${event.title}" já está no catálogo.` : ''}
          </Dialog.Description>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
            <Button
              size="lg"
              className="flex-1"
              onClick={() => event && onViewEvent(event)}
            >
              Ver evento publicado
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={onCreateAnother}
            >
              Cadastrar outro evento
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
