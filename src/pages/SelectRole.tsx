import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Cpu, Palette } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { Role } from '../types/database';

export function SelectRole() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, patchProfile } = useAuth();

  const choose = (role: Role) => {
    if (!user) return;
    patchProfile({ role });
    navigate(role === 'designer' ? '/designers' : '/operators', { replace: true });
    supabase
      .from('profiles')
      .upsert({ id: user.id, role }, { onConflict: 'id' })
      .then(({ error }) => {
        if (error) console.error('[SelectRole] DB save failed:', error.message);
      });
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="flex w-full max-w-2xl flex-col items-center gap-8 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-3xl font-bold">{t('roleSelect.title')}</h1>
          <p className="text-muted">{t('roleSelect.subtitle')}</p>
        </div>

        <div className="grid w-full gap-4 sm:grid-cols-2">
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
