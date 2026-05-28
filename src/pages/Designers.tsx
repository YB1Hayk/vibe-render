import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { useNavigate, Link } from 'react-router-dom';
import {
  UploadCloud,
  FileCheck2,
  AlertTriangle,
  Lock,
  ChevronRight,
  DollarSign,
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { usdt } from '../lib/pricing';
import { useAuth } from '../context/AuthContext';
import { useCreateJob, useMyJobs } from '../hooks/useJobs';
import { uploadArchive } from '../hooks/useJobFiles';
import type { JobStatus } from '../types/database';

const ACCEPTED_EXT = ['.blend', '.max', '.c4d', '.zip'];
const MAX_SIZE = 50 * 1024 * 1024; // 50 MB
const PROTOCOL_FEE_RATE = 0.03; // 3% комиссия платформы

const STATUS_LABELS: Record<JobStatus, string> = {
  open: '🟢',
  claimed: '🔵',
  rendering: '🔵',
  review: '🟡',
  completed: '⚪',
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value.toFixed(1)} ${units[i]}`;
}

export function Designers() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const createJob = useCreateJob();
  const { data: myJobs } = useMyJobs(user?.id);

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [resolution, setResolution] = useState<'1080p' | '4K' | '8K'>('4K');
  const [frameStart, setFrameStart] = useState(1);
  const [frameEnd, setFrameEnd] = useState(30);
  const [budgetInput, setBudgetInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const frames = Math.max(0, frameEnd - frameStart + 1);
  const budget = Math.max(0, parseFloat(budgetInput) || 0);
  const protocolFee = budget * PROTOCOL_FEE_RATE;
  const total = budget + protocolFee;

  const onDrop = useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      setFileError(null);
      if (rejected.length > 0) {
        const tooBig = rejected[0].errors.some((e) => e.code === 'file-too-large');
        setFileError(
          tooBig ? t('designers.dropzone.errorSize') : t('designers.dropzone.errorFormat'),
        );
        setFile(null);
        return;
      }
      const f = accepted[0];
      if (f && !ACCEPTED_EXT.some((ext) => f.name.toLowerCase().endsWith(ext))) {
        setFileError(t('designers.dropzone.errorFormat'));
        setFile(null);
        return;
      }
      setFile(f ?? null);
    },
    [t],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: MAX_SIZE,
    multiple: false,
  });

  const handleLockEscrow = async () => {
    if (!file || frames <= 0 || budget <= 0 || !user) return;
    setUploading(true);
    setSubmitError(null);
    try {
      // 1. Создаём задание в БД
      const jobData = await createJob.mutateAsync({
        title: file.name.replace(/\.[^.]+$/, ''),
        resolution,
        frames,
        total_usdt: total,
        archive_path: 'pending',
        designer_id: user.id,
      });
      // 2. Загружаем архив в Storage
      const archivePath = await uploadArchive(jobData.id, file);
      // 3. Обновляем archive_path
      const { supabase } = await import('../lib/supabase');
      await supabase.from('jobs').update({ archive_path: archivePath }).eq('id', jobData.id);
      // 4. Переходим на страницу задания
      navigate(`/jobs/${jobData.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSubmitError(msg);
    } finally {
      setUploading(false);
    }
  };

  const isBusy = uploading || createJob.isPending;
  const RESOLUTIONS = ['1080p', '4K', '8K'] as const;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <span className="text-sm text-accent-2">{t('designers.dashboard')}</span>
        <h1 className="h-display text-fluid-h2">{t('designers.title')}</h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* ЛЕВО — загрузка + настройки */}
        <div className="flex flex-col gap-6">
          <div
            {...getRootProps()}
            className={`flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
              isDragActive
                ? 'border-accent bg-accent/10'
                : 'border-border/15 hover:border-accent/40'
            }`}
          >
            <input {...getInputProps()} />
            {file ? (
              <>
                <FileCheck2 className="text-success" size={32} />
                <p className="font-medium break-words">{file.name}</p>
                <p className="text-xs text-muted nums">{formatBytes(file.size)}</p>
              </>
            ) : (
              <>
                <UploadCloud className="text-muted" size={32} />
                <p className="font-medium">{t('designers.dropzone.prompt')}</p>
                <p className="text-sm text-muted">{t('designers.dropzone.formats')}</p>
                <p className="text-xs text-muted">{t('designers.dropzone.limit')}</p>
              </>
            )}
          </div>
          {fileError && (
            <p className="flex items-center gap-2 text-sm text-danger">
              <AlertTriangle size={16} className="shrink-0" />
              {fileError}
            </p>
          )}

          {/* Render Settings */}
          <GlassCard className="flex flex-col gap-5 p-6">
            <h2 className="font-display text-lg font-semibold">
              {t('designers.settings.title')}
            </h2>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted">{t('designers.settings.resolution')}</span>
              <div className="flex flex-wrap gap-2">
                {RESOLUTIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setResolution(r)}
                    className={`rounded-lg px-4 py-2 text-sm transition-colors ${
                      resolution === r ? 'bg-accent text-white' : 'glass text-muted hover:text-fg'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted">{t('designers.settings.frameRange')}</span>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="number"
                  min={1}
                  value={frameStart}
                  onChange={(e) => setFrameStart(Math.max(1, Number(e.target.value) || 1))}
                  className="w-24 rounded-lg glass px-3 py-2 text-sm nums"
                  aria-label="frame start"
                />
                <span className="text-muted">—</span>
                <input
                  type="number"
                  min={frameStart}
                  value={frameEnd}
                  onChange={(e) =>
                    setFrameEnd(Math.max(frameStart, Number(e.target.value) || frameStart))
                  }
                  className="w-24 rounded-lg glass px-3 py-2 text-sm nums"
                  aria-label="frame end"
                />
                <span className="text-sm text-muted nums">= {frames}</span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* ПРАВО — бюджет + кнопка */}
        <GlassCard className="flex h-fit flex-col gap-4 p-6">
          <h2 className="font-display text-lg font-semibold">Бюджет проекта</h2>

          {/* Ввод бюджета */}
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted">Сколько вы готовы заплатить (USDT)</span>
            <div className="relative">
              <DollarSign size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="number"
                min="1"
                step="0.01"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg glass ps-9 pe-4 py-2.5 text-sm nums"
              />
            </div>
          </label>

          {/* Разбивка */}
          {budget > 0 && (
            <dl className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Ваш бюджет</dt>
                <dd className="nums">{usdt(budget)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Комиссия платформы (3%)</dt>
                <dd className="nums">{usdt(protocolFee)}</dd>
              </div>
              <div className="my-1 h-px bg-border/10" />
              <div className="flex items-center justify-between gap-4">
                <dt className="font-medium">Итого к оплате</dt>
                <dd className="nums text-lg font-bold text-accent-2">{usdt(total)}</dd>
              </div>
            </dl>
          )}

          <button
            type="button"
            disabled={!file || frames <= 0 || budget <= 0 || isBusy}
            onClick={handleLockEscrow}
            className="flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Lock size={16} />
            {isBusy ? t('auth.loading') : t('designers.lockEscrow')}
          </button>
          {submitError && (
            <p className="rounded-lg bg-danger/10 border border-danger/20 px-3 py-2 text-xs text-danger">
              {submitError}
            </p>
          )}
        </GlassCard>
      </div>

      {/* МОИ ЗАДАНИЯ */}
      {myJobs && myJobs.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="font-display text-xl font-semibold">{t('designers.myJobs')}</h2>
          <div className="flex flex-col gap-3">
            {myJobs.map((job) => (
              <GlassCard key={job.id} hover className="p-4">
                <Link
                  to={`/jobs/${job.id}`}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex flex-col gap-0.5">
                    <p className="font-medium truncate">{job.title}</p>
                    <p className="text-xs text-muted nums">
                      {job.resolution} · {job.frames} fr · {usdt(job.total_usdt)}
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
    </div>
  );
}
