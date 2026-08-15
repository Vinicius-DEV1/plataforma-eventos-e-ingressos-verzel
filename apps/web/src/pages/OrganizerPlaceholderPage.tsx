import { useAuth } from '@/contexts/auth-context';

// Stand-in for the real organizer panel (Bloco 3). Exists here only so the
// PrivateRoute role guard has a route to protect and be tested against.
export default function OrganizerPlaceholderPage() {
  const { user } = useAuth();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 px-6">
      <p className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase">
        Rota protegida — só ORGANIZER
      </p>
      <h1 className="text-3xl font-bold tracking-tight">
        Painel do organizador
      </h1>
      <p className="text-muted-foreground">
        Em construção (Bloco 3). Você chegou aqui como{' '}
        <span className="font-medium">{user?.role}</span> — a rota só é
        acessível para o papel ORGANIZER.
      </p>
    </main>
  );
}
