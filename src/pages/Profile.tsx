import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { ShieldCheck, Link as LinkIcon } from 'lucide-react';
import { useAccount } from 'wagmi';
import { GlassCard } from '../components/GlassCard';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const ACTIVITY = [
  { month: 'Dec', earnings: 280, spendings: 190 },
  { month: 'Jan', earnings: 340, spendings: 220 },
  { month: 'Feb', earnings: 300, spendings: 260 },
  { month: 'Mar', earnings: 420, spendings: 240 },
  { month: 'Apr', earnings: 390, spendings: 310 },
  { month: 'May', earnings: 480, spendings: 280 },
];

function Toggle({ label, defaultOn = false }: { label: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => setOn((v) => !v)}
      className="flex items-center justify-between gap-4 rounded-lg glass px-4 py-3 text-sm"
    >
      <span className="text-start">{label}</span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? 'bg-accent' : 'bg-border/15'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? 'start-[1.375rem]' : 'start-0.5'}`} />
      </span>
    </button>
  );
}

export function Profile() {
  const { t } = useTranslation();
  const { user, profile, refreshProfile } = useAuth();
  const { address, isConnected } = useAccount();

  const displayName = profile?.username ?? user?.email?.split('@')[0] ?? '?';
  const initials = displayName.slice(0, 2).toUpperCase();
  const roleLabel =
    profile?.role === 'designer'
      ? t('profile.roleDesigner')
      : profile?.role === 'renderer'
        ? t('profile.roleRenderer')
        : t('profile.role');

  const [username, setUsername] = useState(displayName);
  const [saving, setSaving] = useState(false);
  const [linkingWallet, setLinkingWallet] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').update({ username }).eq('id', user.id);
    await refreshProfile();
    setSaving(false);
  };

  const handleLinkWallet = async () => {
    if (!user || !address) return;
    setLinkingWallet(true);
    await supabase.from('profiles').update({ wallet_address: address }).eq('id', user.id);
    await refreshProfile();
    setLinkingWallet(false);
  };

  const stats = [
    { label: t('profile.stats.transacted'), value: '$1,250.00', delta: '+12.4%' },
    { label: t('profile.stats.successRate'), value: '99.4%', delta: '+0.6%' },
    { label: t('profile.stats.activeContracts'), value: '2', delta: t('profile.stats.live') },
  ];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <span className="text-sm text-accent-2">{t('profile.account')}</span>
        <h1 className="h-display text-fluid-h2">{t('profile.title')}</h1>
      </header>

      {/* Шапка профиля */}
      <GlassCard className="flex flex-wrap items-center gap-5 p-6">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-accent to-accent-2 font-display text-xl font-bold text-white">
          {initials}
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="font-display text-lg font-semibold">{displayName}</p>
          <p className="text-sm text-muted">{roleLabel}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted">{t('profile.wallet')}:</span>
            {profile?.wallet_address ? (
              <code className="rounded-md glass px-2 py-0.5 nums">
                {profile.wallet_address.slice(0, 6)}…{profile.wallet_address.slice(-4)}
              </code>
            ) : isConnected && address ? (
              <button
                type="button"
                disabled={linkingWallet}
                onClick={handleLinkWallet}
                className="flex items-center gap-1 rounded-md glass px-2 py-0.5 text-accent hover:opacity-80 disabled:opacity-50"
              >
                <LinkIcon size={10} />
                {linkingWallet ? t('auth.loading') : t('profile.linkWallet')}
              </button>
            ) : (
              <span className="text-muted">—</span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-accent-2">
              <ShieldCheck size={12} /> {t('profile.network')}
            </span>
          </div>
        </div>
      </GlassCard>

      {/* Метрики */}
      <section className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))]">
        {stats.map((s) => (
          <GlassCard key={s.label} className="flex flex-col gap-1 p-6">
            <span className="font-display text-2xl font-bold nums">{s.value}</span>
            <span className="text-sm text-muted">{s.label}</span>
            <span className="text-xs text-success">{s.delta}</span>
          </GlassCard>
        ))}
      </section>

      {/* График активности */}
      <GlassCard className="flex flex-col gap-4 p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-semibold">{t('profile.activity.title')}</h2>
          <span className="text-xs text-success">{t('profile.activity.trend', { value: '+24%' })}</span>
        </div>
        <p className="text-sm text-muted">{t('profile.activity.subtitle')}</p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ACTIVITY}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.06)" />
              <XAxis dataKey="month" stroke="hsl(240 6% 72%)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(240 6% 72%)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: 'hsl(0 0% 100% / 0.04)' }}
                contentStyle={{ background: 'hsl(240 12% 10%)', border: '1px solid hsl(0 0% 100% / 0.1)', borderRadius: 12, color: 'hsl(0 0% 98%)' }}
              />
              <Bar dataKey="earnings" fill="hsl(262 83% 64%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="spendings" fill="hsl(190 95% 55%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Настройки */}
      <GlassCard className="flex flex-col gap-5 p-6">
        <h2 className="font-display text-lg font-semibold">{t('profile.settings.title')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted">{t('profile.settings.username')}</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="rounded-lg glass px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted">{t('profile.settings.email')}</span>
            <input
              type="email"
              defaultValue={user?.email ?? ''}
              readOnly
              className="rounded-lg glass px-3 py-2 opacity-60 cursor-not-allowed"
            />
          </label>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm text-muted">{t('profile.settings.security')}</span>
          <Toggle label={t('profile.settings.twoFa')} defaultOn />
          <Toggle label={t('profile.settings.hardwareWallet')} />
          <Toggle label={t('profile.settings.emailAlerts')} defaultOn />
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="self-start rounded-xl bg-accent px-5 py-2.5 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? t('auth.loading') : t('profile.settings.save')}
        </button>
      </GlassCard>
    </div>
  );
}
