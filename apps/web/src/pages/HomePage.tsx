import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';

export default function HomePage() {
  const { user, logout } = useAuth();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 px-6">
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase">
          Bloco 2 — autenticação
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-balance">
          Plataforma de Eventos e Ingressos
        </h1>
      </div>

      <div className="bg-card border-border space-y-4 border p-6">
        {user ? (
          <>
            <p className="text-sm">
              Logado como <span className="font-medium">{user.name}</span> —{' '}
              <span className="text-muted-foreground">{user.role}</span>
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/eventos">Ver eventos</Link>
              </Button>
              {user.role === 'ORGANIZER' && (
                <Button asChild variant="outline">
                  <Link to="/organizador">Painel do organizador</Link>
                </Button>
              )}
              <Button variant="secondary" onClick={logout}>
                Sair
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-muted-foreground text-sm">
              Você não está logado.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/eventos">Ver eventos</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/login">Entrar</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
