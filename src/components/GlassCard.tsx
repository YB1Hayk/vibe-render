import type { ElementType, HTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface GlassCardProps extends HTMLAttributes<HTMLElement> {
  /** Тег рендера — div по умолчанию; можно li/section/article. */
  as?: ElementType;
  /** Включить hover-lift (для кликабельных карточек). */
  hover?: boolean;
}

/**
 * ЕДИНСТВЕННЫЙ способ рисовать карточку в проекте.
 *
 * Аудит выявил: glassmorphism в текущем MVP непоследователен — часть карточек
 * стеклянные, часть падает на дефолтный непрозрачный фон. Правило проекта:
 * любая карточка — это <GlassCard/>. Сырой <Card> из shadcn или непрозрачный
 * div с фоном использовать запрещено.
 */
export function GlassCard({
  as: Tag = 'div',
  hover = false,
  className,
  ...props
}: GlassCardProps) {
  return (
    <Tag className={clsx('glass', hover && 'glass-hover', className)} {...props} />
  );
}
