import { useEffect } from 'react';

/**
 * OAuth callback page. Supabase processes the #access_token hash automatically
 * (detectSessionInUrl: true). We wait 800 ms for the session to be stored, then
 * do a hard navigation to '/' so the fresh page load picks it up from localStorage.
 *
 * We intentionally avoid useNavigate() here — Supabase calls history.replaceState
 * while processing the hash, which changes React Router's location reference and
 * causes useNavigate-based effects to restart, resetting any timeout.
 */
export function AuthCallback() {
  useEffect(() => {
    const id = setTimeout(() => {
      window.location.replace('/');
    }, 800);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="flex min-h-[80vh] items-center justify-center flex-col gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      <p className="text-sm text-muted">Входим…</p>
    </div>
  );
}
