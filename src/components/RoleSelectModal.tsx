import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Cpu, Palette } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { Role } from '../types/database';

/**
 * Полноэкранный оверлей выбора роли.
 * Показывается один раз — когда profile.role === null.
 * Закрыть нельзя: роль обязательна.
 */
export function RoleSelectModal() {
  const { t } = useTranslation();
  const { user, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);

  const choose = async (role: Role) => {
    if (!user || saving) return;
    setSaving(true);
    await supabase.from('profiles').update({ role }).eq('id', user.id);
    await refreshProfile();
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-xl px-4">
      <div className="flex w-full max-w-2xl flex-col items-center gap-8 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-3xl font-bold">{t('roleSelect.title')}</h1>
          <p className="text-muted">{t('roleSelect.subtitle')}</p>
        </div>

        <div className="grid w-full gap-4 sm:grid-cols-2">
          {/* Дизайнер */}
          <GlassCard
            as="button"
            hover
            onClick={() => choose('designer')}
            disabled={saving}
            className="flex flex-col items-center gap-4 p-8 text-center disabled:opacity-50 cursor-pointer"
          >
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-accent/15 text-accent">
              <Palette size={32} />
            </span>
            <div className="flex flex-col gap-1">
              <p className="font-display text-xl font-semibold">{t('roleSelect.designer')}</p>
              <p className="text-sm text-muted">{t('roleSelect.designerDesc')}</p>
            </div>
          </GlassCard>

          {/* Рендерер */}
          <GlassCard
            as="button"
            hover
            onClick={() => choose('renderer')}
            disabled={saving}
            className="flex flex-col items-center gap-4 p-8 text-center disabled:opacity-50 cursor-pointer"
          >
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-accent-2/15 text-accent-2">
              <Cpu size={32} />
            </span>
            <div className="flex flex-col gap-1">
              <p className="font-display text-xl font-semibold">{t('roleSelect.renderer')}</p>
              <p className="text-sm text-muted">{t('roleSelect.rendererDesc')}</p>
            </div>
          </GlassCard>
        </div>

        {saving && (
          <p className="text-sm text-muted animate-pulse">{t('auth.loading')}</p>
        )}
      </div>
    </div>
  );
}
