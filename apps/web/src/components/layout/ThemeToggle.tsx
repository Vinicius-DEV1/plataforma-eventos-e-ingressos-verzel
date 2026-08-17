import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/theme-context';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const nextLabel = theme === 'dark' ? 'Tema claro' : 'Tema escuro';

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggleTheme}
      title={nextLabel}
      aria-label={nextLabel}
    >
      {theme === 'dark' ? <Sun /> : <Moon />}
    </Button>
  );
}
