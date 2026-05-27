import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Cpu, Palette } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { Role } from '../types/database';

/**
 * Полноэкранный оверлей выбора роли.
 * Показывается один раз — когда profile.role === null.
 *
 * Логика:
 * 1. UPSERT профиля (а не UPDATE) — работает даже если строки ещё нет
 * 2. Мгновенный patchProfile — не ждём повторного DB-запроса
 * 3. Таймаут 7 секунд — нет вечной загрузки
 * 4. После сохранения — авто-редирект на нужную страницу
 */
export function RoleSelectModal() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, patchProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const choose = async (role: Role) => {
    if (!user || saving) return;
    setSaving(true);
    setError('');

    try {
      // Таймаут — не даём зависнуть навсегда
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Сервер не отвечает. Попробуй ещё раз.')), 7000)
      );

      const save = async () => {
        // UPSERT — создаёт строку если её нет, обновляет если есть
        const { error: dbErr } = await supabase
          .from('profiles')
          .upsert({ id: user.id, role }, { onConflict: 'id' });
        if (dbErr) throw dbErr;
      };

      await Promise.race([save(), timeout]);

      // Мгновенно обновляем локальный стейт — не ждём ещё одного DB-запроса
      patchProfile({ role });

      // Редиректим на нужную страницу
      navigate(role === 'designer' ? '/designers' : '/operators', { replace: true });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ошибка сохранения';
      setError(msg);
      setSaving(false);
    }
    // Нет finally — если успех, компонент размонтируется после navigate
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
        {error && (
          <p className="rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
