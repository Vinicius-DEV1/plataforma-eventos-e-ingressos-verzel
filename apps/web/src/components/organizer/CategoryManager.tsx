import { useEffect, useState } from 'react';
import { Popover } from 'radix-ui';
import { Trash2 } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { CategoryWithCount } from '@/lib/api-types';

// Painel pequeno, ao lado do campo de categoria: ver o que existe e apagar
// o que foi criado por engano, sem sair da tela de cadastro do evento.
export function CategoryManager({
  onCategoriesChanged,
}: {
  // Chamado depois de uma exclusão, para o combobox de categoria (que lê a
  // lista à parte) refletir a mudança sem precisar de estado compartilhado.
  onCategoriesChanged: () => void;
}) {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [target, setTarget] = useState<CategoryWithCount | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<{ items: CategoryWithCount[] }>(
          '/categorias',
        );
        if (!cancelled) setCategories(data.items);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : 'Não foi possível carregar as categorias.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();

    return () => {
      cancelled = true;
    };
  }, [open]);

  async function handleDelete() {
    if (!target) return;
    setDeleting(true);
    try {
      await apiFetch(`/categorias/${target.id}`, {
        method: 'DELETE',
        token: token!,
      });
      setCategories((current) => current.filter((c) => c.id !== target.id));
      setTarget(null);
      onCategoriesChanged();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível apagar a categoria.',
      );
      setTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className="text-label focus-visible:ring-ring/40 rounded-sm text-xs underline underline-offset-2 outline-none focus-visible:ring-2"
          >
            Gerenciar categorias
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="end"
            sideOffset={6}
            className="bg-popover border-border animate-fade-in z-30 w-72 rounded-md border p-3 shadow-md"
          >
            <p className="label-print mb-2">Categorias existentes</p>

            {loading && (
              <div className="space-y-2">
                <Skeleton className="h-7 w-full" />
                <Skeleton className="h-7 w-full" />
                <Skeleton className="h-7 w-full" />
              </div>
            )}

            {error && <Alert className="text-xs">{error}</Alert>}

            {!loading && !error && categories.length === 0 && (
              <p className="text-muted-foreground text-sm">
                Nenhuma categoria criada ainda.
              </p>
            )}

            {!loading && categories.length > 0 && (
              <ul className="max-h-64 space-y-1 overflow-y-auto">
                {categories.map((category) => (
                  <li
                    key={category.id}
                    className="hover:bg-secondary flex items-center justify-between gap-2 rounded-sm px-2 py-1.5"
                  >
                    <span className="truncate text-sm">
                      {category.name}
                      <span className="text-muted-foreground ml-1.5 text-xs">
                        {category.eventCount}{' '}
                        {category.eventCount === 1 ? 'evento' : 'eventos'}
                      </span>
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Apagar categoria ${category.name}`}
                      onClick={() => setTarget(category)}
                    >
                      <Trash2 className="text-destructive size-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      <ConfirmDialog
        open={target !== null}
        onOpenChange={(next) => !next && setTarget(null)}
        title="Apagar esta categoria?"
        description={
          target && target.eventCount > 0
            ? `"${target.name}" está em ${target.eventCount} ${target.eventCount === 1 ? 'evento' : 'eventos'}. Eles continuam publicados, só ficam sem categoria. Não dá para desfazer.`
            : `"${target?.name}" não está em nenhum evento. Não dá para desfazer.`
        }
        confirmLabel="Apagar categoria"
        pending={deleting}
        onConfirm={() => void handleDelete()}
      />
    </>
  );
}
