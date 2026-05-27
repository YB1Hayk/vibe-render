/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WC_PROJECT_ID: string;
  readonly VITE_ESCROW_CONTRACT_BASE: string;
  readonly VITE_ESCROW_CONTRACT_ARBITRUM: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
