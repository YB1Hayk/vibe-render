import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Props {
  children: ReactNode;
}

/**
 * Shows page content when the user is authenticated.
 * While the session is still loading (user === null), shows a minimal
 * "sign in" prompt inline — no redirect, no global spinner.
 */
export function ProtectedRoute({ children }: Props) {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-muted text-sm">Для доступа к этой странице необходимо войти.</p>
        <Link
          to="/login"
          className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Войти
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
