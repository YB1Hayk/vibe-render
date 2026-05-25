/** TypeScript-типы для таблиц Supabase. Синхронизировать со схемой БД. */

export type Role = 'designer' | 'renderer';
export type JobStatus = 'open' | 'claimed' | 'rendering' | 'review' | 'completed';

export interface Profile {
  id: string;
  wallet_address: string | null;
  role: Role | null;
  username: string | null;
  created_at: string;
}

export interface Job {
  id: string;
  designer_id: string;
  title: string;
  description: string | null;
  resolution: '1080p' | '4K' | '8K';
  frames: number;
  total_usdt: number;
  status: JobStatus;
  renderer_id: string | null;
  archive_path: string;
  result_path: string | null;
  tx_hash: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  job_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

/** Минимальная обёртка для createClient<Database>. */
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      jobs: { Row: Job; Insert: Omit<Job, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Job> };
      messages: { Row: Message; Insert: Omit<Message, 'id' | 'created_at'>; Update: Partial<Message> };
    };
  };
}
