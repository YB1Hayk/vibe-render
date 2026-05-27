import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/**
 * Страница-обработчик OAuth редиректа.
 * После авторизации Supabase отправляет сюда с токеном в хэше URL.
 * Мы ждём сессию и отправляем пользователя дальше.
 */
export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let done = false;

    const redirect = () => {
      if (done) return;
      done = true;
      navigate('/', { replace: true });
    };

    // Подписываемся на изменение сессии — это самый надёжный способ
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        subscription.unsubscribe();
        redirect();
      }
    });

    // Проверяем текущую сессию — может уже есть
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        subscription.unsubscribe();
        redirect();
      }
    });

    // Таймаут: если через 8 сек ничего — отправляем на логин
    const timer = setTimeout(() => {
      subscription.unsubscribe();
      if (!done) {
        done = true;
        navigate('/login', { replace: true });
      }
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [navigate]);

  return (
    <div className="flex min-h-[80vh] items-center justify-center flex-col gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      <p className="text-sm text-muted">Входим…</p>
    </div>
  );
}
