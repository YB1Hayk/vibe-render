import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/**
 * Страница-обработчик OAuth редиректа.
 * Supabase редиректит сюда после Google/Discord авторизации.
 * Мы явно вызываем getSession(), ждём сессию и отправляем пользователя дальше.
 */
export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handle = async () => {
      // Подождём пока Supabase обработает хэш/код из URL
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Auth callback error:', error.message);
        navigate('/login', { replace: true });
        return;
      }

      if (session) {
        // Успешная сессия — идём на главную, там AuthContext определит роль
        navigate('/', { replace: true });
      } else {
        // Сессии нет — подождём onAuthStateChange
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
          subscription.unsubscribe();
          if (s) {
            navigate('/', { replace: true });
          } else {
            navigate('/login', { replace: true });
          }
        });
        // Таймаут на случай если ничего не пришло
        setTimeout(() => {
          subscription.unsubscribe();
          navigate('/login', { replace: true });
        }, 5000);
      }
    };

    handle();
  }, [navigate]);

  return (
    <div className="flex min-h-[80vh] items-center justify-center flex-col gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      <p className="text-sm text-muted">Входим…</p>
    </div>
  );
}
