import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  ?? 'https://cepttkuzuudzlssveiac.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

/**
 * Supabase client.
 * flowType: 'implicit' — токен передаётся напрямую в хэше URL (#access_token=...),
 * не требует обмена кодом. Надёжнее для SPA с OAuth.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'implicit',
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'vibe-render-auth',
  },
});
