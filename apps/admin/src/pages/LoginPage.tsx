import { useState } from 'react';
import { LockKeyhole, Mail, Shield } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { useAdminSession } from '../hooks/useAdminSession';

function getErrorMessage(error: unknown, fallback: string) {
  const message = (error as { response?: { data?: { message?: string | string[] } } } | null)?.response?.data?.message;
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string' && message.length > 0) return message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoggingIn, loginError } = useAdminSession();
  const [form, setForm] = useState({ email: '', password: '' });
  const errorMessage = getErrorMessage(loginError, 'Use an administrator account to access this portal.');
  const loginReason = (location.state as { reason?: string } | null)?.reason;

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-strong px-4 py-10">
      <section className="w-full max-w-sm rounded-lg border border-border bg-background p-6 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background shadow-sm">
            <Shield className="h-5 w-5 text-foreground" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Admin login</h1>
          <p className="mt-2 text-sm text-muted">Sign in to manage users, tags, and pending events.</p>
        </div>

        {loginReason === 'session-expired' ? (
          <div className="mb-4 rounded-md border border-border bg-surface-strong px-3 py-2 text-sm text-foreground">
            Your session expired. Sign in again to continue.
          </div>
        ) : null}

        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              await login(form);
            } catch (error) {
              console.error('Admin login request failed', {
                message: getErrorMessage(error, 'Admin login failed'),
                error,
              });
              return;
            }
            const redirect = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
            navigate(redirect || '/');
          }}
        >
          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">Email</span>
            <div className="flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3 shadow-sm focus-within:ring-1 focus-within:ring-primary">
              <Mail className="h-4 w-4 text-muted" />
              <input
                type="email"
                required
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="h-full w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
                placeholder="admin@example.com"
              />
            </div>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">Password</span>
            <div className="flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3 shadow-sm focus-within:ring-1 focus-within:ring-primary">
              <LockKeyhole className="h-4 w-4 text-muted" />
              <input
                type="password"
                required
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                className="h-full w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
                placeholder="Enter your password"
              />
            </div>
          </label>

          {loginError ? (
            <div className="rounded-md border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">
              {errorMessage}
            </div>
          ) : null}

          <Button type="submit" className="w-full" disabled={isLoggingIn}>
            {isLoggingIn ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </section>
    </main>
  );
}
