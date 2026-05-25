import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Message } from '../types/database';

interface UseMessagesResult {
  messages: Message[];
  sendMessage: (content: string) => Promise<void>;
  loading: boolean;
}

/**
 * Realtime-чат для задания.
 * Загружает историю при монтировании и подписывается на новые сообщения.
 * Канал закрывается при размонтировании компонента.
 */
export function useMessages(jobId: string, senderId: string): UseMessagesResult {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!jobId) return;

    // Загрузить историю
    supabase
      .from('messages')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMessages((data as Message[]) ?? []);
        setLoading(false);
      });

    // Realtime подписка
    const channel = supabase
      .channel(`messages-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `job_id=eq.${jobId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [jobId]);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;
      const { error } = await supabase.from('messages').insert({
        job_id: jobId,
        sender_id: senderId,
        content: trimmed,
      });
      if (error) throw error;
    },
    [jobId, senderId],
  );

  return { messages, sendMessage, loading };
}
