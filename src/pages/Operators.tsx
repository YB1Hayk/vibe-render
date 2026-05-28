import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { JobBoard } from '../components/JobBoard';
import { useTransactionState } from '../hooks/useTransactionState';
import { useOpenJobs, useClaimJob, useRendererJobs } from '../hooks/useJobs';
import { getArchiveUrl } from '../hooks/useJobFiles';
import { useAuth } from '../context/AuthContext';
import { usdt } from '../lib/pricing';
import type { Job as DBJob, JobStatus } from '../types/database';

export function Operators() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const withdraw = useTransactionState();

  const { data: dbJobs, isLoading, isError, error } = useOpenJobs();
  const { data: myJobs } = useRendererJobs(user?.id);
  const claimJob = useClaimJob();
  const [claimError, setClaimError] = useState<string | null>(null);

  const STATUS_LABELS: Record<JobStatus, string> = {
    open: '🟢',
    claimed: '🔵',
    rendering: '🔵',
    review: '🟡',
    completed: '⚪',
  };

  // Маппинг Supabase Job → формат JobBoard
  const jobs = (dbJobs ?? []).map((j: DBJob) => ({
    id: j.id,
    title: j.title,
    meta: `${j.frames} ${t('jobs.frames')} · ${j.resolution}`,
    gpu: j.resolution,
    reward: j.total_usdt,
    status: j.status,
    archive_path: j.archive_path,
  }));

  const handleClaim = async (job: (typeof jobs)[0]) => {
    if (!user) return;
    setClaimError(null);
    try {
      await claimJob.mutateAsync({ jobId: job.id, rendererId: user.id });
      navigate(`/jobs/${job.id}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ошибка при взятии задачи';
      setClaimError(msg);
    }
  };

  const handleDownload = async (job: (typeof jobs)[0]) => {
    if (!job.archive_path || job.archive_path === 'pending') return;
    const url = await getArchiveUrl(job.archive_path);
    window.open(url, '_blank');
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <span className="text-sm text-accent-2">{t('operators.role')}</span>
        <h1 className="h-display text-fluid-h2">{t('operators.title')}</h1>
      </header>

      {/* Карточка баланса */}
      <GlassCard className="flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="min-w-0">
          <p className="text-xs text-muted">{t('operators.balance')}</p>
          <p className="font-display text-3xl font-bold nums">
            0.00 <span className="text-base text-muted">USDT</span>
          </p>
          <p className="text-xs text-muted">Баланс обновляется после выполнения заданий</p>
        </div>
        <button
          type="button"
          disabled
          className="rounded-xl bg-accent/40 px-5 py-3 font-medium text-white/50 cursor-not-allowed"
        >
          {t('operators.withdraw')}
        </button>
      </GlassCard>

      {/* МОИ ЗАДАНИЯ (рендерер видит что взял) */}
      {myJobs && myJobs.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="font-display text-xl font-semibold">{t('operators.myJobs')}</h2>
          <div className="flex flex-col gap-3">
            {myJobs.map((job) => (
              <GlassCard key={job.id} hover className="p-4">
                <Link to={`/jobs/${job.id}`} className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex flex-col gap-0.5">
                    <p className="font-medium truncate">{job.title}</p>
                    <p className="text-xs text-muted nums">
                      {job.resolution} · {job.frames} {t('jobs.frames')} · {usdt(job.total_usdt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm">{STATUS_LABELS[job.status]}</span>
                    <span className="text-xs text-muted">{t(`jobs.status.${job.status}`)}</span>
                    <ChevronRight size={16} className="text-muted" />
                  </div>
                </Link>
              </GlassCard>
            ))}
          </div>
        </section>
      )}

      <h2 className="font-display text-xl font-semibold">{t('operators.availableJobs')}</h2>

      {claimError && (
        <div className="rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
          {claimError}
          {claimError.includes('row-level security') && (
            <p className="mt-1 text-xs text-danger/70">
              Необходимо обновить политику RLS в Supabase. Запустите SQL из инструкции.
            </p>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
          <p className="font-medium">Ошибка загрузки заданий</p>
          <p className="mt-1 text-xs text-danger/70">
            {(error as Error)?.message ?? 'Проверьте настройки Supabase (RLS / таблица jobs)'}
          </p>
        </div>
      ) : jobs.length === 0 ? (
        <p className="text-center text-muted py-12">{t('jobs.noJobs')}</p>
      ) : (
        <JobBoard jobs={jobs} onClaim={handleClaim} onDownload={handleDownload} />
      )}
    </div>
  );
}
