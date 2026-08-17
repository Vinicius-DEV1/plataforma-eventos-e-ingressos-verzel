import {
  ArrowRight,
  Clapperboard,
  Music,
  QrCode,
  Ticket,
  LayoutDashboard,
} from 'lucide-react';
import { Link, Navigate } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';

const ROLE_LABEL = {
  CUSTOMER: 'Cliente',
  ORGANIZER: 'Organizador',
  GATEKEEPER: 'Portaria',
} as const;

export default function HomePage() {
  const { user } = useAuth();

  if (user?.role === 'GATEKEEPER') {
    return <Navigate to="/portaria" replace />;
  }

  return (
    <AppShell>
      <PageHeader
        label="Cinema & Shows"
        title="Bilheteria & Ingressos"
        meta="Plataforma de catálogo em tempo real, reserva com garantia de 15 minutos para pagamento e emissão instantânea com QR Code."
      />

      <div className="grid gap-6">
        {/* Painel Principal de Acesso */}
        <Card className="p-6 sm:p-7">
          <div className="space-y-6">
            {user ? (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
                  <div>
                    <span className="font-mono text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                      Sessão Ativa
                    </span>
                    <p className="text-lg font-bold text-foreground">
                      {user.name}
                    </p>
                  </div>
                  <Badge tone="info">{ROLE_LABEL[user.role]}</Badge>
                </div>

                <div className="flex flex-wrap gap-3 pt-1">
                  <Button asChild size="lg">
                    <Link to="/eventos" className="gap-2">
                      Ver catálogo completo
                      <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  </Button>
                  {user.role === 'CUSTOMER' && (
                    <Button asChild variant="outline" size="lg">
                      <Link to="/ingressos" className="gap-2">
                        <Ticket className="size-4" />
                        Meus ingressos
                      </Link>
                    </Button>
                  )}
                  {user.role === 'ORGANIZER' && (
                    <Button asChild variant="outline" size="lg">
                      <Link to="/organizador" className="gap-2">
                        <LayoutDashboard className="size-4" />
                        Painel do organizador
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <span className="font-mono text-xs font-bold text-label uppercase tracking-wider block mb-1">
                    Acesso Público
                  </span>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    O catálogo é aberto para consulta de sessões e horários.
                    Faça login para reservar assentos ou publicar novos eventos.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button asChild size="lg">
                    <Link to="/eventos" className="gap-2">
                      Ver eventos em cartaz
                      <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link to="/login">Entrar na conta</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Blocos de Estrutura do Sistema */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-foreground/30">
            <div className="size-9 rounded bg-secondary flex items-center justify-center text-foreground mb-3 font-mono font-bold text-sm">
              <Clapperboard className="size-4.5" />
            </div>
            <h3 className="font-bold text-sm text-foreground mb-1">
              Cinema & Sessões
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Seleção interativa de poltronas em mapa de sala numerado em tempo
              real.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-foreground/30">
            <div className="size-9 rounded bg-secondary flex items-center justify-center text-foreground mb-3 font-mono font-bold text-sm">
              <Music className="size-4.5" />
            </div>
            <h3 className="font-bold text-sm text-foreground mb-1">
              Shows & Concertos
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Venda por lote e capacidade controlada com concorrência segura.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-foreground/30">
            <div className="size-9 rounded bg-secondary flex items-center justify-center text-foreground mb-3 font-mono font-bold text-sm">
              <QrCode className="size-4.5" />
            </div>
            <h3 className="font-bold text-sm text-foreground mb-1">
              Validação na Portaria
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ingressos emitidos com assinatura criptográfica para checagem
              instantânea.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
