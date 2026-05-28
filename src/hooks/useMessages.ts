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
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Пропускаем если уже есть (могли добавить оптимистично с реальным ID)
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            // Убираем temp-заглушку того же отправителя и заменяем реальным сообщением
            const tempIdx = prev.findIndex(
              (m) => m.id.startsWith('temp-') && m.sender_id === newMsg.sender_id,
            );
            if (tempIdx !== -1) {
              const next = [...prev];
              next[tempIdx] = newMsg;
              return next;
            }
            return [...prev, newMsg];
          });
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

      // Оптимистичное добавление — сообщение появляется мгновенно
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const optimistic: Message = {
        id: tempId,
        job_id: jobId,
        sender_id: senderId,
        content: trimmed,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);

      const { error } = await supabase.from('messages').insert({
        job_id: jobId,
        sender_id: senderId,
        content: trimmed,
      });

      if (error) {
        // Откатываем при ошибке
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        throw error;
      }
      // При успехе Realtime заменит temp на реальное сообщение (см. обработчик выше)
    },
    [jobId, senderId],
  );

  return { messages, sendMessage, loading };
}
