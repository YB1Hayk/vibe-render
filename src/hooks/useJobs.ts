import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Job, JobStatus } from '../types/database';

// ─────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────

/** Список открытых заданий для рендереров. */
export function useOpenJobs() {
  return useQuery({
    queryKey: ['jobs', 'open'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Job[];
    },
  });
}

/** Задания, взятые рендерером (все кроме open). */
export function useRendererJobs(rendererId: string | undefined) {
  return useQuery({
    queryKey: ['jobs', 'renderer', rendererId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('renderer_id', rendererId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as Job[]) ?? [];
    },
    enabled: !!rendererId,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

/** Задания конкретного дизайнера. */
export function useMyJobs(designerId: string | undefined) {
  return useQuery({
    queryKey: ['jobs', 'mine', designerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('designer_id', designerId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Job[];
    },
    enabled: !!designerId,
  });
}

/** Одно задание по ID. */
export function useJob(jobId: string | undefined) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId!)
        .single();
      if (error) throw error;
      return data as Job;
    },
    enabled: !!jobId,
  });
}

// ─────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────

interface CreateJobInput {
  title: string;
  description?: string;
  resolution: '1080p' | '4K' | '8K';
  frames: number;
  total_usdt: number;
  archive_path: string;
  designer_id: string;
}

/** Создать новое задание (дизайнер). */
export function useCreateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateJobInput) => {
      const { data, error } = await supabase
        .from('jobs')
        .insert({ ...input, status: 'open' })
        .select()
        .single();
      if (error) throw error;
      return data as Job;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

/** Рендерер берёт задание в работу. */
export function useClaimJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ jobId, rendererId }: { jobId: string; rendererId: string }) => {
      const { data, error } = await supabase
        .from('jobs')
        .update({ status: 'claimed' as JobStatus, renderer_id: rendererId })
        .eq('id', jobId)
        .eq('status', 'open')      // защита от double-claim
        .select()
        .single();
      if (error) throw error;
      return data as Job;
    },
    onSuccess: (job) => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      qc.setQueryData(['job', job.id], job);
    },
  });
}

/** Рендерер загрузил результат — задание переходит в review. */
export function useSubmitResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ jobId, resultPath }: { jobId: string; resultPath: string }) => {
      const { data, error } = await supabase
        .from('jobs')
        .update({ status: 'review' as JobStatus, result_path: resultPath })
        .eq('id', jobId)
        .select()
        .single();
      if (error) throw error;
      return data as Job;
    },
    onSuccess: (job) => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      qc.setQueryData(['job', job.id], job);
    },
  });
}

/** Дизайнер одобряет результат — эскроу "освобождается". */
export function useApproveJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (jobId: string) => {
      const { data, error } = await supabase
        .from('jobs')
        .update({ status: 'completed' as JobStatus })
        .eq('id', jobId)
        .select()
        .single();
      if (error) throw error;
      return data as Job;
    },
    onSuccess: (job) => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      qc.setQueryData(['job', job.id], job);
    },
  });
}
