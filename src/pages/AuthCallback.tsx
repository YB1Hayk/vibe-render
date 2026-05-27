import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let done = false;

    const finish = (to: string) => {
      if (done) return;
      done = true;
      navigate(to, { replace: true });
    };

    // Listen for auth state change — catches events that fire after this effect runs
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        subscription.unsubscribe();
        clearInterval(pollId);
        clearTimeout(timeoutId);
        finish('/');
      }
    });

    // Poll getSession every 300 ms — catches the case where the SIGNED_IN event
    // fired before our listener was registered (Supabase processes hash asynchronously
    // and may emit the event before React effects run)
    const pollId = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        clearInterval(pollId);
        clearTimeout(timeoutId);
        subscription.unsubscribe();
        finish('/');
      }
    }, 300);

    const timeoutId = setTimeout(() => {
      clearInterval(pollId);
      subscription.unsubscribe();
      finish('/login');
    }, 10_000);

    return () => {
      done = true;
      subscription.unsubscribe();
      clearInterval(pollId);
      clearTimeout(timeoutId);
    };
  }, [navigate]);

  return (
    <div className="flex min-h-[80vh] items-center justify-center flex-col gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      <p className="text-sm text-muted">Входим…</p>
    </div>
  );
}
