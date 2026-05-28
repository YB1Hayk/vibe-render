import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDropzone } from 'react-dropzone';
import {
  Download,
  UploadCloud,
  CheckCircle,
  MessageSquare,
  Send,
  ArrowLeft,
  FileCheck2,
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { useAuth } from '../context/AuthContext';
import { useJob, useClaimJob, useApproveJob, useSubmitResult } from '../hooks/useJobs';
import { useMessages } from '../hooks/useMessages';
import { getArchiveUrl, getResultUrl, uploadResult } from '../hooks/useJobFiles';
import { usdt } from '../lib/pricing';
import type { JobStatus } from '../types/database';

const STATUS_COLORS: Record<JobStatus, string> = {
  open: 'bg-success/15 text-success',
  claimed: 'bg-accent/15 text-accent',
  rendering: 'bg-accent/15 text-accent',
  review: 'bg-yellow-500/15 text-yellow-400',
  completed: 'bg-border/15 text-muted',
};

export function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, profile } = useAuth();

  const { data: job, isLoading } = useJob(id);
  const claimJob = useClaimJob();
  const approveJob = useApproveJob();
  const submitResult = useSubmitResult();
  const { messages, sendMessage, loading: chatLoading } = useMessages(id ?? '', user?.id ?? '');

  const [msgInput, setMsgInput] = useState('');
  const [resultFile, setResultFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Автоскролл чата вниз
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const onDropResult = useCallback((files: File[]) => {
    setResultFile(files[0] ?? null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropResult,
    maxSize: 50 * 1024 * 1024, // 50 MB
    multiple: false,
  });

  const handleDownloadArchive = async () => {
    if (!job?.archive_path || job.archive_path === 'pending') {
      setDownloadError('Файл ещё не загружен дизайнером. Попробуйте позже.');
      return;
    }
    setDownloadError(null);
    try {
      const url = await getArchiveUrl(job.archive_path);
      window.open(url, '_blank');
    } catch (e: unknown) {
      setDownloadError(e instanceof Error ? e.message : 'Не удалось получить ссылку на файл');
    }
  };

  const handleDownloadResult = async () => {
    if (!job?.result_path) return;
    const url = await getResultUrl(job.result_path);
    window.open(url, '_blank');
  };

  const handleSubmitResult = async () => {
    if (!resultFile || !job) return;
    setUploading(true);
    try {
      const path = await uploadResult(job.id, resultFile);
      await submitResult.mutateAsync({ jobId: job.id, resultPath: path });
      setResultFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleApprove = async () => {
    if (!job) return;
    await approveJob.mutateAsync(job.id);
  };

  const handleSend = async () => {
    if (!msgInput.trim()) return;
    await sendMessage(msgInput);
    setMsgInput('');
  };

  const isDesigner = profile?.role === 'designer';
  const isRenderer = profile?.role === 'renderer';

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-muted">{t('jobs.notFound')}</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sm text-accent hover:underline"
        >
          ← {t('jobs.back')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Хлебные крошки */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 self-start text-sm text-muted hover:text-fg transition-colors"
      >
        <ArrowLeft size={16} />
        {t('jobs.back')}
      </button>

      {/* Заголовок */}
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-bold break-words">{job.title}</h1>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[job.status]}`}>
            {t(`jobs.status.${job.status}`)}
          </span>
        </div>
        <p className="text-sm text-muted">
          {job.resolution} · {job.frames} {t('jobs.frames')} · {usdt(job.total_usdt)}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* ЛЕВО — действия */}
        <div className="flex flex-col gap-4">

          {/* Блок РЕНДЕРЕРА */}
          {isRenderer && (
            <GlassCard className="flex flex-col gap-4 p-6">
              <h2 className="font-display text-lg font-semibold">{t('jobs.rendererActions')}</h2>

              {downloadError && (
                <p className="rounded-xl border border-danger/20 bg-danger/10 px-3 py-2 text-xs text-danger">
                  {downloadError}
                </p>
              )}

              {/* Скачать архив */}
              {(job.status === 'claimed' || job.status === 'rendering' || job.status === 'review') && (
                <button
                  type="button"
                  onClick={handleDownloadArchive}
                  className="flex items-center gap-2 rounded-xl border border-border/15 px-5 py-3 text-sm transition-colors hover:border-accent/40"
                >
                  <Download size={16} />
                  {t('jobs.download')}
                </button>
              )}

              {/* Взять задание (только для open) */}
              {job.status === 'open' && (
                <button
                  type="button"
                  disabled={claimJob.isPending}
                  onClick={() =>
                    claimJob.mutateAsync({ jobId: job.id, rendererId: user!.id })
                  }
                  className="flex items-center gap-2 rounded-xl bg-accent px-5 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {claimJob.isPending ? t('auth.loading') : t('jobs.claim')}
                </button>
              )}

              {/* Загрузить результат */}
              {(job.status === 'claimed' || job.status === 'rendering') &&
                job.renderer_id === user?.id && (
                  <div className="flex flex-col gap-3">
                    <div
                      {...getRootProps()}
                      className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
                        isDragActive ? 'border-accent bg-accent/10' : 'border-border/15 hover:border-accent/40'
                      }`}
                    >
                      <input {...getInputProps()} />
                      {resultFile ? (
                        <>
                          <FileCheck2 className="text-success" size={24} />
                          <p className="text-sm font-medium break-words">{resultFile.name}</p>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="text-muted" size={24} />
                          <p className="text-sm text-muted">{t('jobs.uploadResult')}</p>
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={!resultFile || uploading}
                      onClick={handleSubmitResult}
                      className="rounded-xl bg-accent px-5 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {uploading ? t('auth.loading') : t('jobs.submitResult')}
                    </button>
                  </div>
                )}
            </GlassCard>
          )}

          {/* Блок ДИЗАЙНЕРА */}
          {isDesigner && job.designer_id === user?.id && (
            <GlassCard className="flex flex-col gap-4 p-6">
              <h2 className="font-display text-lg font-semibold">{t('jobs.designerActions')}</h2>

              {/* Статус заказа */}
              <p className="text-sm text-muted">
                {t('jobs.currentStatus')}: <span className="text-fg font-medium">{t(`jobs.status.${job.status}`)}</span>
              </p>

              {/* Скачать результат */}
              {job.result_path && (
                <button
                  type="button"
                  onClick={handleDownloadResult}
                  className="flex items-center gap-2 rounded-xl border border-border/15 px-5 py-3 text-sm transition-colors hover:border-accent/40"
                >
                  <Download size={16} />
                  {t('jobs.downloadResult')}
                </button>
              )}

              {/* Апрув */}
              {job.status === 'review' && (
                <button
                  type="button"
                  disabled={approveJob.isPending}
                  onClick={handleApprove}
                  className="flex items-center gap-2 rounded-xl bg-success/80 px-5 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  <CheckCircle size={16} />
                  {approveJob.isPending ? t('auth.loading') : t('jobs.approve')}
                </button>
              )}

              {job.status === 'completed' && (
                <p className="flex items-center gap-2 text-sm text-success">
                  <CheckCircle size={16} />
                  {t('jobs.completed')}
                </p>
              )}
            </GlassCard>
          )}
        </div>

        {/* ПРАВО — чат */}
        <GlassCard className="flex flex-col p-0 overflow-hidden" style={{ minHeight: '420px' }}>
          {/* Заголовок чата */}
          <div className="flex items-center gap-2 border-b border-border/10 px-4 py-3">
            <MessageSquare size={16} className="text-accent" />
            <span className="font-medium text-sm">{t('jobs.chat')}</span>
          </div>

          {/* Сообщения */}
          <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4" style={{ maxHeight: '340px' }}>
            {chatLoading ? (
              <p className="text-center text-xs text-muted">{t('auth.loading')}</p>
            ) : messages.length === 0 ? (
              <p className="text-center text-xs text-muted">{t('jobs.chatEmpty')}</p>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.sender_id === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm break-words ${
                        isOwn
                          ? 'bg-accent text-white rounded-ee-none'
                          : 'glass rounded-es-none'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Инпут */}
          <div className="border-t border-border/10 flex items-center gap-2 p-3">
            <textarea
              dir="auto"
              rows={1}
              value={msgInput}
              onChange={(e) => setMsgInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              placeholder={t('jobs.sendMessage')}
              className="flex-1 resize-none rounded-xl glass px-3 py-2 text-sm focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSend}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-white transition-opacity hover:opacity-90"
            >
              <Send size={15} />
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
