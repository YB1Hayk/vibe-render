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
  /** TRUE while initial session + profile fetch is in progress. Nothing renders until this is false. */
  isInitializing: boolean;
  /** Alias for isInitializing — keeps Login.tsx compatible */
  loading: boolean;
  signInWith: (provider: OAuthProvider) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithDiscord: () => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Update profile fields in context after a DB write (no refetch needed) */
  updateProfile: (updates: Partial<Profile>) => void;
  /** @deprecated use updateProfile */
  patchProfile: (updates: Partial<Profile>) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Fetch profile, retrying once if row not yet created (DB trigger race). */
async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (data) return data as Profile;

  // Retry after 700 ms — handle_new_user trigger may still be running
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
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;

    /**
     * STRICT INITIALIZATION ORDER:
     * 1. getSession() — reads existing session from localStorage (covers page refresh
     *    and the case where AuthCallback already stored the session).
     * 2. If session.user exists → fetchProfile (waits for DB, including retry).
     * 3. ONLY AFTER both complete → setIsInitializing(false).
     *
     * Nothing in the UI renders until isInitializing is false, so there is no
     * flash, no race-condition redirect, and no stuck loading screen.
     */
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        if (session?.user) {
          const p = await fetchProfile(session.user.id);
          if (!mounted) return;
          setUser(session.user);
          setProfile(p);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch {
        // Network error — treat as logged out, don't block UI forever
      } finally {
        if (mounted) setIsInitializing(false);
      }
    };

    init();

    /**
     * Watch for auth changes that happen AFTER init (e.g. sign-out in another tab,
     * token refresh). We intentionally do NOT call setIsInitializing(false) here
     * because init() handles that. These updates happen while the app is running.
     */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          const p = await fetchProfile(session.user.id);
          if (!mounted) return;
          setUser(session.user);
          setProfile((current) => {
            // Don't overwrite an already-set role with null from DB race
            if (current?.role && !p?.role) return current;
            return p;
          });
          // In case init() hasn't resolved yet (SIGNED_IN fires during OAuth callback load)
          setIsInitializing(false);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setIsInitializing(false);
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

  const signInWithGoogle = useCallback(() => signInWith('google'), [signInWith]);
  const signInWithDiscord = useCallback(() => signInWith('discord'), [signInWith]);
  const signInWithMicrosoft = useCallback(() => signInWith('azure'), [signInWith]);

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

  const value: AuthContextValue = {
    user,
    profile,
    isInitializing,
    loading: isInitializing, // backward-compat alias
    signInWith,
    signInWithGoogle,
    signInWithDiscord,
    signInWithMicrosoft,
    signOut,
    updateProfile,
    patchProfile: updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
