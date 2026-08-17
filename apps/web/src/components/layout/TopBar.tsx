import { LogOut, Ticket } from 'lucide-react';
import { Link, NavLink } from 'react-router';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/button';
import { useAuth, type Role } from '@/contexts/auth-context';

const NAV_BY_ROLE: Record<Role, { to: string; label: string }[]> = {
  CUSTOMER: [
    { to: '/eventos', label: 'Eventos' },
    { to: '/ingressos', label: 'Meus ingressos' },
  ],
  ORGANIZER: [
    { to: '/eventos', label: 'Eventos' },
    { to: '/organizador', label: 'Painel' },
  ],
  GATEKEEPER: [{ to: '/portaria', label: 'Portaria' }],
};

const GUEST_NAV = [{ to: '/eventos', label: 'Eventos' }];

function BrandLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-7.5 items-center justify-center rounded bg-primary text-primary-foreground font-bold shadow-xs">
        <Ticket className="size-4" />
      </div>
      <span className="text-base sm:text-lg font-extrabold tracking-tight text-foreground whitespace-nowrap">
        Bilheteria & Ingressos
      </span>
    </div>
  );
}

export function TopBar() {
  const { user, logout } = useAuth();
  const links = user ? NAV_BY_ROLE[user.role] : GUEST_NAV;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          to="/"
          className="focus-visible:ring-ring/40 rounded outline-none focus-visible:ring-2"
        >
          <BrandLogo />
        </Link>

        <nav className="flex min-w-0 items-center gap-1 overflow-x-auto">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-xs sm:text-sm font-semibold tracking-tight rounded-md px-3 py-1.5 whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isActive
                    ? 'bg-secondary text-foreground font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          {user ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="gap-1.5"
            >
              <LogOut className="size-3.5" aria-hidden />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link to="/login">Entrar</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
