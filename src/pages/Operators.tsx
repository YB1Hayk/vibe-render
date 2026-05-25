import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/GlassCard';
import { JobBoard } from '../components/JobBoard';
import { useTransactionState } from '../hooks/useTransactionState';
import { useOpenJobs, useClaimJob } from '../hooks/useJobs';
import { getArchiveUrl } from '../hooks/useJobFiles';
import { useAuth } from '../context/AuthContext';
import type { Job as DBJob } from '../types/database';

export function Operators() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const withdraw = useTransactionState();

  const { data: dbJobs, isLoading } = useOpenJobs();
  const claimJob = useClaimJob();

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
    await claimJob.mutateAsync({ jobId: job.id, rendererId: user.id });
    navigate(`/jobs/${job.id}`);
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
            342.50 <span className="text-base text-muted">USDT</span>
          </p>
          <p className="text-xs text-success nums">
            {t('operators.earned24h', { amount: '+18.20 USDT' })}
          </p>
        </div>
        <button
          type="button"
          disabled={withdraw.isBusy}
          onClick={() =>
            withdraw.run(async () => {
              // TODO: useWriteContract — вызов withdraw() контракта
            })
          }
          className="rounded-xl bg-accent px-5 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {withdraw.isBusy ? t('wallet.pending') : t('operators.withdraw')}
        </button>
      </GlassCard>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : jobs.length === 0 ? (
        <p className="text-center text-muted py-12">{t('jobs.noJobs')}</p>
      ) : (
        <JobBoard jobs={jobs} onClaim={handleClaim} onDownload={handleDownload} />
      )}
    </div>
  );
}
