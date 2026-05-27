import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Cpu, Palette } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { Role } from '../types/database';

/**
 * Полноэкранный оверлей выбора роли.
 *
 * ПАТТЕРН: Optimistic update — роль ставится МГНОВЕННО локально,
 * затем сохраняется в БД в фоне. Никакого loading, никакой гонки состояний.
 */
export function RoleSelectModal() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, patchProfile, refreshProfile } = useAuth();

  const choose = (role: Role) => {
    if (!user) return;

    // 1. Мгновенно обновляем локальный стейт — пользователь сразу идёт дальше
    patchProfile({ role });
    navigate(role === 'designer' ? '/designers' : '/operators', { replace: true });

    // 2. Сохраняем в БД в фоне (fire & forget)
    // При ошибке НЕ сбрасываем локальный стейт — пользователь продолжает работу
    supabase
      .from('profiles')
      .upsert({ id: user.id, role }, { onConflict: 'id' })
      .then(({ error }) => {
        if (error) {
          console.error('[RoleSelectModal] DB save failed:', error.message);
          // Не вызываем refreshProfile — не сбрасываем роль в null
        }
      });
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
            className="flex flex-col items-center gap-4 p-8 text-center cursor-pointer"
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
            className="flex flex-col items-center gap-4 p-8 text-center cursor-pointer"
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
      </div>
    </div>
  );
}
