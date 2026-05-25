import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { MessagesSquare, Lock, Zap, ChevronDown } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { CHAIN_LABEL } from '../config/chains';

interface Step {
  title: string;
  desc: string;
}

/**
 * Главная страница. Все секции построены по единым правилам:
 * GlassCard + auto-fit grid + i18n. Текст — только из t().
 */
export function Home() {
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const stats = [
    { label: t('stats.activeNodes'), value: '2,410' },
    { label: t('stats.networkPower'), value: '14.2 TFLOPS' },
    { label: t('stats.escrowLocked'), value: '$45,200' },
  ];

  const designerSteps = t('howItWorks.designers.steps', {
    returnObjects: true,
    chains: CHAIN_LABEL,
  }) as Step[];
  const operatorSteps = t('howItWorks.operators.steps', { returnObjects: true }) as Step[];

  const nodes = t('network.nodes', { returnObjects: true }) as string[];

  const features = [
    { Icon: MessagesSquare, title: t('features.aiChat.title'), desc: t('features.aiChat.desc') },
    { Icon: Lock, title: t('features.escrow.title'), desc: t('features.escrow.desc') },
    { Icon: Zap, title: t('features.cheaper.title'), desc: t('features.cheaper.desc') },
  ];

  const faq = t('faq.items', { returnObjects: true }) as Array<{ q: string; a: string }>;

  return (
    <div className="flex flex-col gap-24">
      {/* HERO */}
      <section className="flex flex-col items-center gap-6 pt-6 text-center">
        <span className="rounded-full glass px-4 py-1.5 text-xs text-muted">
          {t('hero.badge', { chains: CHAIN_LABEL })}
        </span>
        <h1 className="h-display text-fluid-hero max-w-4xl">
          {t('hero.titleLine1')}{' '}
          <span className="bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent">
            {t('hero.titleLine2')}
          </span>
        </h1>
        <p className="max-w-xl text-balance text-muted">{t('hero.subtitle')}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/designers"
            className="rounded-xl bg-accent px-6 py-3 font-medium text-white transition-opacity hover:opacity-90"
          >
            {t('hero.ctaDesigner')}
          </Link>
          <Link
            to="/operators"
            className="rounded-xl glass glass-hover px-6 py-3 font-medium"
          >
            {t('hero.ctaOperator')}
          </Link>
        </div>
      </section>

      {/* STATS */}
      <section className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))]">
        {stats.map((s) => (
          <GlassCard key={s.label} className="flex flex-col gap-1 p-6">
            <span className="font-display text-3xl font-bold nums">{s.value}</span>
            <span className="text-sm text-muted">{s.label}</span>
          </GlassCard>
        ))}
      </section>

      {/* HOW IT WORKS */}
      <section className="flex flex-col gap-8">
        <div className="flex flex-col gap-2 text-center">
          <h2 className="h-display text-fluid-h2">{t('howItWorks.title')}</h2>
          <p className="text-muted">{t('howItWorks.subtitle')}</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[
            { heading: t('howItWorks.designers.heading'), steps: designerSteps },
            { heading: t('howItWorks.operators.heading'), steps: operatorSteps },
          ].map((col) => (
            <GlassCard key={col.heading} className="flex flex-col gap-5 p-6">
              <h3 className="font-display text-lg font-semibold text-accent-2">{col.heading}</h3>
              <ol className="flex flex-col gap-4">
                {col.steps.map((step, i) => (
                  <li key={step.title} className="flex min-w-0 gap-4">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent/15 font-display text-sm font-bold text-accent-2 nums">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium break-words">{step.title}</p>
                      <p className="text-sm text-muted break-words">{step.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* NETWORK PRESENCE */}
      <section className="flex flex-col gap-6 text-center">
        <div className="flex flex-col gap-2">
          <h2 className="h-display text-fluid-h2">{t('network.title')}</h2>
          <p className="text-muted">{t('network.subtitle')}</p>
        </div>
        <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))]">
          {nodes.map((node) => (
            <GlassCard key={node} className="flex items-center gap-3 p-4">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full rounded-full bg-success animate-pulse-node" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
              </span>
              <span className="break-words text-sm">{node}</span>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))]">
        {features.map(({ Icon, title, desc }) => (
          <GlassCard key={title} hover className="flex flex-col gap-3 p-6">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent/15 text-accent-2">
              <Icon size={20} />
            </span>
            <h3 className="font-display text-lg font-semibold">{title}</h3>
            <p className="text-sm text-muted">{desc}</p>
          </GlassCard>
        ))}
      </section>

      {/* FAQ */}
      <section className="flex flex-col gap-6">
        <h2 className="h-display text-fluid-h2 text-center">{t('faq.title')}</h2>
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
          {faq.map((item, i) => {
            const open = openFaq === i;
            return (
              <GlassCard key={item.q} className="overflow-hidden">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenFaq(open ? null : i)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-start"
                >
                  <span className="flex min-w-0 gap-3">
                    <span className="font-display text-sm text-accent-2 nums">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="break-words font-medium">{item.q}</span>
                  </span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-muted transition-transform ${
                      open ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {open && (
                  <p className="break-words px-5 pb-5 text-sm text-muted">{item.a}</p>
                )}
              </GlassCard>
            );
          })}
        </div>
      </section>
    </div>
  );
}
