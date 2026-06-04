import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { GlassCard } from '../components/GlassCard';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import type { JobStatus } from '../types/database';

interface Stats {
  totalUsers: number;
  totalJobs: number;
  jobsByStatus: Record<JobStatus, number>;
  recentJobs: Array<{
    id: string;
    title: string;
    status: JobStatus;
    total_usdt: number;
    created_at: string;
    designer_id: string;
  }>;
  recentUsers: Array<{
    id: string;
    username: string | null;
    role: string | null;
    created_at: string;
  }>;
}

const STATUS_LABEL: Record<JobStatus, string> = {
  open: '🟢 Открыто',
  claimed: '🔵 Взято',
  rendering: '🔵 Рендерится',
  review: '🟡 На проверке',
  completed: '⚪ Завершено',
};

const STATUS_COLOR: Record<JobStatus, string> = {
  open: 'text-green-400',
  claimed: 'text-blue-400',
  rendering: 'text-blue-400',
  review: 'text-yellow-400',
  completed: 'text-muted',
};

export function Admin() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Simple guard — only logged-in users can see this page
  if (!user) return <Navigate to="/login" replace />;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    async function load() {
      try {
        const [
          { count: totalUsers },
          { count: totalJobs },
          { data: jobsByStatusRaw },
          { data: recentJobs },
          { data: recentUsers },
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('jobs').select('*', { count: 'exact', head: true }),
          supabase.from('jobs').select('status'),
          supabase
            .from('jobs')
            .select('id, title, status, total_usdt, created_at, designer_id')
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('profiles')
            .select('id, username, role, created_at')
            .order('created_at', { ascending: false })
            .limit(10),
        ]);

        if (!mounted) return;

        // Aggregate jobs by status
        const jobsByStatus = { open: 0, claimed: 0, rendering: 0, review: 0, completed: 0 } as Record<JobStatus, number>;
        (jobsByStatusRaw ?? []).forEach((j: { status: JobStatus }) => {
          if (j.status in jobsByStatus) jobsByStatus[j.status]++;
        });

        setStats({
          totalUsers: totalUsers ?? 0,
          totalJobs: totalJobs ?? 0,
          jobsByStatus,
          recentJobs: recentJobs ?? [],
          recentUsers: recentUsers ?? [],
        });
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : 'Ошибка загрузки');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [refreshKey]);

  function fmt(date: string) {
    return new Date(date).toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <span className="text-sm text-accent-2">Администрирование</span>
          <h1 className="font-display text-3xl font-bold mt-1">Метрики платформы</h1>
        </div>
        <button
          type="button"
          onClick={() => setRefreshKey(k => k + 1)}
          className="rounded-xl glass px-4 py-2 text-sm hover:border-accent/40 transition-colors"
        >
          🔄 Обновить
        </button>
      </header>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      )}

      {error && (
        <GlassCard className="p-6 border-danger/20">
          <p className="text-danger text-sm">Ошибка: {error}</p>
        </GlassCard>
      )}

      {stats && !loading && (
        <>
          {/* ── Главные цифры ── */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Пользователей', value: stats.totalUsers, icon: '👥' },
              { label: 'Заданий всего', value: stats.totalJobs, icon: '📦' },
              { label: 'Открытых', value: stats.jobsByStatus.open, icon: '🟢' },
              { label: 'Завершённых', value: stats.jobsByStatus.completed, icon: '✅' },
            ].map((s) => (
              <GlassCard key={s.label} className="p-5 flex flex-col gap-1">
                <span className="text-2xl">{s.icon}</span>
                <span className="font-display text-3xl font-bold">{s.value}</span>
                <span className="text-xs text-muted">{s.label}</span>
              </GlassCard>
            ))}
          </div>

          {/* ── Статусы заданий ── */}
          <GlassCard className="p-6">
            <h2 className="font-display text-lg font-semibold mb-4">Задания по статусам</h2>
            <div className="flex flex-wrap gap-3">
              {(Object.entries(stats.jobsByStatus) as [JobStatus, number][]).map(([status, count]) => (
                <div key={status} className="flex items-center gap-2 rounded-lg glass px-4 py-2 text-sm">
                  <span className={STATUS_COLOR[status]}>{STATUS_LABEL[status]}</span>
                  <span className="font-bold ml-1">{count}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* ── Последние задания ── */}
            <GlassCard className="p-6">
              <h2 className="font-display text-lg font-semibold mb-4">Последние задания</h2>
              {stats.recentJobs.length === 0 ? (
                <p className="text-muted text-sm">Нет заданий</p>
              ) : (
                <div className="flex flex-col divide-y divide-border/10">
                  {stats.recentJobs.map((job) => (
                    <div key={job.id} className="py-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{job.title}</p>
                        <p className="text-xs text-muted mt-0.5">{fmt(job.created_at)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        <span className={`text-xs ${STATUS_COLOR[job.status]}`}>{STATUS_LABEL[job.status]}</span>
                        <span className="text-xs text-muted">${job.total_usdt.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* ── Последние пользователи ── */}
            <GlassCard className="p-6">
              <h2 className="font-display text-lg font-semibold mb-4">Последние пользователи</h2>
              {stats.recentUsers.length === 0 ? (
                <p className="text-muted text-sm">Нет пользователей</p>
              ) : (
                <div className="flex flex-col divide-y divide-border/10">
                  {stats.recentUsers.map((u) => (
                    <div key={u.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{u.username ?? 'Без имени'}</p>
                        <p className="text-xs text-muted font-mono truncate">{u.id.slice(0, 12)}…</p>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        <span className="text-xs rounded-full bg-accent/20 text-accent px-2 py-0.5">
                          {u.role ?? 'нет роли'}
                        </span>
                        <span className="text-xs text-muted">{fmt(u.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>
        </>
      )}
    </div>
  );
}
