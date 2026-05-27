import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface Review {
  id: string;
  user_id: string;
  username: string | null;
  content: string;
  rating: number;
  created_at: string;
}

export function useReviews() {
  const { user, profile } = useAuth();
  const qc = useQueryClient();

  const { data: reviews } = useQuery({
    queryKey: ['reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as Review[];
    },
    // Если таблица не существует — возвращаем пустой массив
    retry: false,
    staleTime: 60_000,
  });

  const { mutateAsync: addReview, isPending: isAdding } = useMutation({
    mutationFn: async ({ content, rating }: { content: string; rating: number }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('reviews').insert({
        user_id: user.id,
        username: profile?.username ?? user.email?.split('@')[0] ?? 'Аноним',
        content,
        rating,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews'] }),
  });

  return {
    reviews: reviews ?? [],
    addReview,
    isAdding,
  };
}
