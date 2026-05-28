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
  signInWith: (provider: OAuthProvider) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithDiscord: () => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => void;
  /** @deprecated use updateProfile */
  patchProfile: (updates: Partial<Profile>) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (data) return data as Profile;

  // One retry after 700 ms in case the DB trigger is still running
  await new Promise((r) => setTimeout(r, 700));
  const { data: data2 } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return (data2 as Profile) ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let mounted = true;

    // Hydrate from existing session on mount (page refresh / direct URL)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id).then((p) => {
          if (mounted) setProfile(p);
        });
      }
    });

    // Keep state in sync with sign-in / sign-out / token-refresh events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          const p = await fetchProfile(session.user.id);
          if (mounted) {
            setProfile((current) => {
              if (current?.role && !p?.role) return current;
              return p;
            });
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user);
        }
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWith = useCallback(async (provider: OAuthProvider) => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }, []);

  const signInWithGoogle    = useCallback(() => signInWith('google'),  [signInWith]);
  const signInWithDiscord   = useCallback(() => signInWith('discord'), [signInWith]);
  const signInWithMicrosoft = useCallback(() => signInWith('azure'),   [signInWith]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  const updateProfile = useCallback((updates: Partial<Profile>) => {
    setProfile((prev) => ({ ...(prev ?? ({} as Profile)), ...updates }));
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const p = await fetchProfile(user.id);
    setProfile(p);
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      signInWith,
      signInWithGoogle,
      signInWithDiscord,
      signInWithMicrosoft,
      signOut,
      updateProfile,
      patchProfile: updateProfile,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
