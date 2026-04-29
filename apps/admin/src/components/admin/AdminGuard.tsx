import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAdminSession } from '../../hooks/useAdminSession';

export function AdminGuard({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAdminSession();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-5 py-4 shadow-sm">
          <Shield className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-foreground">Validating administrator session</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location, reason: 'session-expired' }} replace />;
  }

  return <>{children}</>;
}
