import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Логируем в консоль при старте чтобы видеть проблему
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] Missing env vars:', {
    VITE_SUPABASE_URL: supabaseUrl ? 'OK' : 'MISSING',
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? 'OK' : 'MISSING',
  });
}

export const supabase = createClient<Database>(
  supabaseUrl ?? 'https://cepttkuzuudzlssveiac.supabase.co',
  supabaseAnonKey ?? '',
  {
    auth: {
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);
