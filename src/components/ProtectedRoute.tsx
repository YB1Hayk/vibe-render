import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types/database';

interface Props {
  children: ReactNode;
  requiredRole?: Role;
}

/**
 * Охраняет роуты:
 * - loading → скелетон
 * - нет user → / (главная)
 * - requiredRole не совпадает → /
 */
export function ProtectedRoute({ children, requiredRole }: Props) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  if (requiredRole && profile?.role !== requiredRole) return <Navigate to="/" replace />;

  return <>{children}</>;
}
