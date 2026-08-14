import { Button } from '@/components/ui/button';

export default function App() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 px-6">
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase">
          Bloco 0 — setup
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-balance">
          Plataforma de Eventos e Ingressos
        </h1>
        <p className="text-muted-foreground">
          Tema base configurado: papel off-white, tinta quase preta e um único
          acento vermelho.
        </p>
      </div>

      <div className="bg-card border-border space-y-4 border p-6">
        <div className="flex flex-wrap gap-3">
          <Button>Reservar</Button>
          <Button variant="secondary">Ver assentos</Button>
          <Button variant="outline">Detalhes</Button>
          <Button variant="destructive">Cancelar</Button>
        </div>

        <dl className="border-border grid grid-cols-3 gap-4 border-t pt-4 text-sm">
          <div>
            <dt className="text-muted-foreground text-xs">Assento</dt>
            <dd data-numeric className="font-medium">
              F12
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Preço</dt>
            <dd data-numeric className="font-medium">
              R$ 48,00
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Expira em</dt>
            <dd data-numeric className="text-primary font-medium">
              14:59
            </dd>
          </div>
        </dl>
      </div>
    </main>
  );
}
