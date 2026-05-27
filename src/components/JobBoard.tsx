import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from './GlassCard';
import { usdt } from '../lib/pricing';
import type { JobStatus } from '../types/database';

export interface Job {
  id: string;
  title: string;
  meta: string;
  gpu: string;
  reward: number;
  status?: JobStatus;
  archive_path?: string;
}

interface JobBoardProps {
  jobs: Job[];
  onClaim?: (job: Job) => void;
  onDownload?: (job: Job) => void;
}

const STATUS_BADGE: Record<JobStatus, { cls: string; dotCls: string }> = {
  open:      { cls: 'bg-success/15 text-success',   dotCls: 'bg-success' },
  claimed:   { cls: 'bg-accent/15 text-accent',     dotCls: 'bg-accent' },
  rendering: { cls: 'bg-accent/15 text-accent',     dotCls: 'bg-accent' },
  review:    { cls: 'bg-yellow-500/15 text-yellow-400', dotCls: 'bg-yellow-400' },
  completed: { cls: 'bg-border/15 text-muted',      dotCls: 'bg-muted' },
};

const COLS = 'md:grid-cols-[2fr_1fr_1fr_1fr_auto]';

export function JobBoard({ jobs, onClaim, onDownload }: JobBoardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div role="table" aria-label={t('operators.title')} className="flex flex-col gap-3">
      {/* Заголовок — только desktop */}
      <div role="row" className={`hidden md:grid ${COLS} gap-4 px-5 text-xs text-muted`}>
        <span role="columnheader" className="text-start">{t('operators.table.project')}</span>
        <span role="columnheader" className="text-start">{t('operators.table.hardware')}</span>
        <span role="columnheader" className="text-end">{t('operators.table.reward')}</span>
        <span role="columnheader" className="text-start">{t('operators.table.status')}</span>
        <span role="columnheader" className="text-end">{t('operators.table.action')}</span>
      </div>

      {jobs.map((job) => {
        const status = job.status ?? 'open';
        const badge = STATUS_BADGE[status];
        const statusLabel = t(`operators.status.${status}`, {
          defaultValue: t('operators.status.available'),
        });

        return (
          <GlassCard
            key={job.id}
            role="row"
            className={`grid grid-cols-1 ${COLS} md:items-center gap-3 md:gap-4 p-4 md:px-5`}
          >
            {/* Project */}
            <div role="cell" className="min-w-0">
              <p className="font-medium break-words">{job.title}</p>
              <p className="text-xs text-muted">{job.meta}</p>
            </div>

            {/* Hardware */}
            <div role="cell" className="text-sm text-muted">
              <span className="md:hidden text-xs me-2">{t('operators.table.hardware')}:</span>
              {job.gpu}
            </div>

            {/* Reward */}
            <div role="cell" className="md:text-end">
              <span className="md:hidden text-xs text-muted me-2">{t('operators.table.reward')}:</span>
              <span className="nums font-semibold text-accent-2">{usdt(job.reward)}</span>
            </div>

            {/* Status */}
            <div role="cell">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${badge.cls}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${badge.dotCls}`} />
                {statusLabel}
              </span>
            </div>

            {/* Actions */}
            <div role="cell" className="flex gap-2 md:justify-end">
              {status === 'open' ? (
                /* Только кнопка "Взять задачу" для открытых заданий */
                <button
                  type="button"
                  onClick={() => onClaim?.(job)}
                  className="flex-1 md:flex-none rounded-lg bg-accent px-3 py-2 md:py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                >
                  {t('operators.claim')}
                </button>
              ) : (
                /* Для взятых/рендерящихся/на проверке/завершённых — кнопка перехода к заданию */
                <button
                  type="button"
                  onClick={() => navigate(`/jobs/${job.id}`)}
                  className="flex-1 md:flex-none rounded-lg border border-border/15 px-3 py-2 md:py-1.5 text-sm transition-colors hover:border-accent/40"
                >
                  {t('jobs.viewJob')}
                </button>
              )}
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}
