import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Props {
  children: ReactNode;
}

/**
 * Redirects to /login when there is no authenticated user.
 *
 * NOTE: AppShell guarantees this component only ever renders when
 * isInitializing === false, so no local loading state is needed here.
 */
export function ProtectedRoute({ children }: Props) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
