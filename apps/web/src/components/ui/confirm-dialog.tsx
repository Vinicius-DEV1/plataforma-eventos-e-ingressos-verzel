import { Dialog } from 'radix-ui';
import { Button } from '@/components/ui/button';

// Substitui window.confirm nas duas ações destrutivas do produto (cancelar
// reserva e cancelar evento). O diálogo nativo não aceita identidade, não
// deixa explicar a consequência e trava a aba inteira enquanto está aberto.
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  pending?: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-foreground/40 data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 z-50 backdrop-blur-[1px]" />
        <Dialog.Content className="bg-card border-border animate-slide-up fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 border p-6">
          <Dialog.Title className="display-print text-xl">{title}</Dialog.Title>
          <Dialog.Description className="text-muted-foreground mt-2 text-sm">
            {description}
          </Dialog.Description>
          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="ghost" size="lg" disabled={pending}>
                Voltar
              </Button>
            </Dialog.Close>
            <Button
              variant="destructive"
              size="lg"
              disabled={pending}
              onClick={onConfirm}
            >
              {pending ? 'Cancelando…' : confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
