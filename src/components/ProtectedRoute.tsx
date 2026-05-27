import { useEffect, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types/database';

interface Props {
  children: ReactNode;
  requiredRole?: Role;
}

export function ProtectedRoute({ children, requiredRole }: Props) {
  const { user, profile, loading } = useAuth();
  // Максимум 4 секунды на загрузку — потом считаем что не залогинен
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setTimedOut(true), 4000);
    return () => clearTimeout(t);
  }, [loading]);

  if (loading && !timedOut) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (requiredRole && profile?.role && profile.role !== requiredRole) {
    // Залогинен, роль установлена, но неправильная — отправляем на главную
    // Роль null/undefined НЕ редиректим — RoleSelectModal откроется поверх и разберётся
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
