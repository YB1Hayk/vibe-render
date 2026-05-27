import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * OAuth callback. Supabase processes the #access_token hash automatically.
 *
 * Design decisions:
 * - useEffect with [] deps — runs ONCE, never re-runs (avoids Supabase
 *   history.replaceState causing React Router to recreate navigate reference
 *   and reset timers in a loop).
 * - window.location.replace() instead of useNavigate() — immune to React
 *   Router internal state changes.
 * - Dual detection: onAuthStateChange catches late events; setInterval polling
 *   catches the case where the event fired before this effect registered.
 * - 8-second hard fallback → /login.
 */
export function AuthCallback() {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    let done = false;

    const finish = (to: string) => {
      if (done) return;
      done = true;
      window.location.replace(to);
    };

    // Listener: catches auth events that fire AFTER this effect runs
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        clearInterval(pollId);
        clearTimeout(fallbackId);
        subscription.unsubscribe();
        finish('/');
      }
    });

    // Polling: catches the case where SIGNED_IN already fired before listener registered
    const pollId = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        clearInterval(pollId);
        clearTimeout(fallbackId);
        subscription.unsubscribe();
        finish('/');
      }
    }, 300);

    // Hard fallback — redirect to login after 8 seconds no matter what
    const fallbackId = setTimeout(() => {
      clearInterval(pollId);
      subscription.unsubscribe();
      finish('/login');
    }, 8_000);

    return () => {
      done = true;
      subscription.unsubscribe();
      clearInterval(pollId);
      clearTimeout(fallbackId);
    };
  }, []); // ← intentionally empty: this effect must NEVER re-run

  return (
    <div className="flex min-h-[80vh] items-center justify-center flex-col gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      <p className="text-sm text-muted">Входим…</p>
    </div>
  );
}
