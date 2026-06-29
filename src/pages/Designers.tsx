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
  ExternalLink,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useWriteContract, useChainId, useAccount } from 'wagmi';
import { waitForTransactionReceipt } from '@wagmi/core';
import { parseEther } from 'viem';
import { GlassCard } from '../components/GlassCard';
import { usdt } from '../lib/pricing';
import { useAuth } from '../context/AuthContext';
import { useCreateJob, useMyJobs } from '../hooks/useJobs';
import { uploadArchive } from '../hooks/useJobFiles';
import { supabase } from '../lib/supabase';
import { wagmiConfig } from '../web3/wagmi';
import {
  RENDER_ESCROW_ABI,
  RENDER_ESCROW_ADDRESS,
  isContractDeployed,
  getExplorerTxUrl,
  getExplorerName,
} from '../config/contracts';
import type { JobStatus } from '../types/database';

const ACCEPTED_EXT = ['.blend', '.max', '.c4d', '.zip'];
const MAX_SIZE = 50 * 1024 * 1024; // 50 MB
const PROTOCOL_FEE_RATE = 0.03;

// Symbolic ETH amount locked on testnet (represents the USDT budget)
const TESTNET_ESCROW_ETH = '0.001';

const STATUS_LABELS: Record<JobStatus, string> = {
  open: '🟢',
  claimed: '🔵',
  rendering: '🔵',
  review: '🟡',
  completed: '⚪',
};

type EscrowStep =
  | 'idle'
  | 'uploading'     // uploading file to Supabase Storage
  | 'wallet'        // waiting for user to confirm tx in wallet
  | 'confirming'    // tx submitted, waiting for block confirmation
  | 'done';         // tx confirmed

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

const STEP_LABEL: Record<EscrowStep, string> = {
  idle:        '',
  uploading:   'Загрузка файла…',
  wallet:      'Подтвердите в кошельке…',
  confirming:  'Транзакция отправлена…',
  done:        'Готово',
};

export function Designers() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const chainId = useChainId();
  const { isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const createJob = useCreateJob();
  const { data: myJobs } = useMyJobs(user?.id);

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [resolution, setResolution] = useState<'1080p' | '4K' | '8K'>('4K');
  const [frameStart, setFrameStart] = useState(1);
  const [frameEnd, setFrameEnd] = useState(30);
  const [budgetInput, setBudgetInput] = useState('');
  const [step, setStep] = useState<EscrowStep>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const frames = Math.max(0, frameEnd - frameStart + 1);
  const budget = Math.max(0, parseFloat(budgetInput) || 0);
  const protocolFee = budget * PROTOCOL_FEE_RATE;
  const total = budget + protocolFee;

  const contractReady = isContractDeployed(chainId);
  const contractAddress = RENDER_ESCROW_ADDRESS[chainId];

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
    setSubmitError(null);
    setTxHash(null);

    try {
      // ── 1. Create job record in DB ──────────────────────────────────────
      setStep('uploading');
      const jobData = await createJob.mutateAsync({
        title: file.name.replace(/\.[^.]+$/, ''),
        resolution,
        frames,
        total_usdt: total,
        archive_path: 'pending',
        designer_id: user.id,
      });

      // ── 2. Upload archive to Storage ────────────────────────────────────
      const archivePath = await uploadArchive(jobData.id, file);
      await supabase
        .from('jobs')
        .update({ archive_path: archivePath })
        .eq('id', jobData.id);

      // ── 3. On-chain escrow (if contract is deployed on current network) ─
      if (contractReady && contractAddress && isConnected) {
        // 3a. Ask wallet to sign the createJob() call
        setStep('wallet');
        const hash = await writeContractAsync({
          address: contractAddress,
          abi: RENDER_ESCROW_ABI,
          functionName: 'createJob',
          value: parseEther(TESTNET_ESCROW_ETH), // symbolic testnet amount
        });

        // 3b. Wait for 1 block confirmation
        setStep('confirming');
        setTxHash(hash);
        await waitForTransactionReceipt(wagmiConfig, { hash, confirmations: 1 });

        // 3c. Persist txHash in Supabase
        await supabase
          .from('jobs')
          .update({ tx_hash: hash })
          .eq('id', jobData.id);

        setStep('done');

        // Auto-navigate after showing success toast
        setTimeout(() => navigate(`/jobs/${jobData.id}`), 2500);
      } else {
        // Contract not yet deployed on this network — proceed without on-chain tx
        setStep('done');
        setTimeout(() => navigate(`/jobs/${jobData.id}`), 800);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSubmitError(msg);
      setStep('idle');
    }
  };

  const isBusy = step !== 'idle' && step !== 'done';
  const RESOLUTIONS = ['1080p', '4K', '8K'] as const;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <span className="text-sm text-accent-2">{t('designers.dashboard')}</span>
        <h1 className="h-display text-fluid-h2">{t('designers.title')}</h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* LEFT — dropzone + settings */}
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

        {/* RIGHT — budget + escrow */}
        <GlassCard className="flex h-fit flex-col gap-4 p-6">
          <h2 className="font-display text-lg font-semibold">Бюджет проекта</h2>

          {/* Network badge */}
          {isConnected && (
            <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
              contractReady
                ? 'bg-success/10 text-success border border-success/20'
                : 'bg-accent/10 text-accent-2 border border-accent/20'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${contractReady ? 'bg-success' : 'bg-accent-2'}`} />
              {contractReady
                ? `Эскроу активен · ${getExplorerName(chainId)}`
                : 'Контракт скоро: переключитесь на Base Sepolia'}
            </div>
          )}

          {/* Budget input */}
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

          {/* Breakdown */}
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
              {contractReady && (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted">Эскроу (testnet ETH)</dt>
                  <dd className="nums text-accent-2">{TESTNET_ESCROW_ETH} ETH</dd>
                </div>
              )}
              <div className="my-1 h-px bg-border/10" />
              <div className="flex items-center justify-between gap-4">
                <dt className="font-medium">Итого к оплате</dt>
                <dd className="nums text-lg font-bold text-accent-2">{usdt(total)}</dd>
              </div>
            </dl>
          )}

          {/* Lock button */}
          <button
            type="button"
            disabled={!file || frames <= 0 || budget <= 0 || isBusy}
            onClick={handleLockEscrow}
            className="flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isBusy ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {STEP_LABEL[step]}
              </>
            ) : (
              <>
                <Lock size={16} />
                {t('designers.lockEscrow')}
              </>
            )}
          </button>

          {/* Step progress pills */}
          {isBusy && (
            <div className="flex items-center gap-1.5 text-xs text-muted">
              {(['uploading', 'wallet', 'confirming'] as const).map((s, i) => (
                <span key={s} className="flex items-center gap-1.5">
                  {i > 0 && <span className="h-px w-3 bg-border/30" />}
                  <span className={`rounded-full px-2 py-0.5 ${
                    step === s
                      ? 'bg-accent/20 text-accent-2'
                      : ['uploading', 'wallet', 'confirming'].indexOf(step) > i
                        ? 'bg-success/20 text-success'
                        : 'bg-border/10 text-muted/50'
                  }`}>
                    {i + 1}
                  </span>
                </span>
              ))}
            </div>
          )}

          {/* Success toast */}
          {step === 'done' && txHash && (
            <div className="flex flex-col gap-2 rounded-xl border border-success/25 bg-success/10 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium text-success">
                <CheckCircle2 size={16} />
                Эскроу заблокирован на блокчейне
              </div>
              <a
                href={getExplorerTxUrl(chainId, txHash)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-accent-2 underline-offset-2 hover:underline"
              >
                Открыть транзакцию в {getExplorerName(chainId)}
                <ExternalLink size={12} />
              </a>
              <p className="text-xs text-muted font-mono truncate">{txHash}</p>
            </div>
          )}

          {/* Success toast (no on-chain tx) */}
          {step === 'done' && !txHash && (
            <div className="flex items-center gap-2 rounded-xl border border-success/25 bg-success/10 px-4 py-3 text-sm font-medium text-success">
              <CheckCircle2 size={16} />
              Проект создан — переходим к заданию…
            </div>
          )}

          {/* Error */}
          {submitError && (
            <p className="rounded-lg bg-danger/10 border border-danger/20 px-3 py-2 text-xs text-danger break-words">
              {submitError}
            </p>
          )}
        </GlassCard>
      </div>

      {/* MY JOBS */}
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
                    {job.tx_hash && (
                      <p className="text-[10px] text-accent-2 font-mono truncate">
                        tx: {job.tx_hash.slice(0, 18)}…
                      </p>
                    )}
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
