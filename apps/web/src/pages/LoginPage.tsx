import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';
import { BackLink } from '@/components/layout/BackLink';
import { PageHeader } from '@/components/layout/PageHeader';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/field';
import { useAuth } from '@/contexts/auth-context';
import { ApiError } from '@/lib/api-client';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      void navigate('/');
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Não foi possível entrar.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell width="narrow">
      <BackLink to="/eventos" label="Catálogo" />
      <PageHeader size="md" label="Acesso" title="Entrar" />

      <Card className="p-6">
        <form
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          className="space-y-5"
        >
          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>

          <Field label="Senha" htmlFor="password">
            <Input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>

          {error && <Alert>{error}</Alert>}

          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="w-full"
          >
            {submitting ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
      </Card>
    </AppShell>
  );
}
