import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';

type OAuthProvider = 'google' | 'discord' | 'azure';

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithDiscord: () => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
  signInWith: (provider: OAuthProvider) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Загружает профиль из таблицы profiles по user.id. Ретраит 1 раз через 600 мс
 *  на случай race condition между auth.users insert и триггером handle_new_user. */
async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (data) return data as Profile;
  // Ретрай: триггер мог не успеть создать строку
  await new Promise((r) => setTimeout(r, 600));
  const { data: data2 } = await supabase.from('profiles').select('*').eq('id', userId).single();
  return (data2 as Profile) ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const p = await fetchProfile(user.id);
    setProfile(p);
  }, [user]);

  useEffect(() => {
    // Читаем текущую сессию при монтировании (нужно после OAuth redirect)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const p = await fetchProfile(session.user.id);
        setProfile(p);
      }
      setLoading(false);
    }).catch(() => {
      // Supabase недоступен — всё равно убираем лоадер
      setLoading(false);
    });

    // Фолбэк: если через 3 секунды loading ещё true — сбрасываем
    const fallback = setTimeout(() => setLoading(false), 3000);

    // Подписка на изменения сессии (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const p = await fetchProfile(session.user.id);
        setProfile(p);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => { subscription.unsubscribe(); clearTimeout(fallback); };
  }, []);

  const signInWith = useCallback(async (provider: OAuthProvider) => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
  }, []);

  const signInWithGoogle = useCallback(() => signInWith('google'), [signInWith]);
  const signInWithDiscord = useCallback(() => signInWith('discord'), [signInWith]);
  const signInWithMicrosoft = useCallback(() => signInWith('azure'), [signInWith]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, signInWithDiscord, signInWithMicrosoft, signInWith, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Хук для доступа к контексту авторизации. Бросает ошибку вне AuthProvider. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
