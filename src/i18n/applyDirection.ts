/** Языки с письмом справа налево. */
export const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'] as const;

export function isRtl(lang: string): boolean {
  return (RTL_LANGUAGES as readonly string[]).includes(lang.split('-')[0]);
}

/**
 * Выставляет dir/lang на <html>. Это включает автоматическое зеркалирование
 * всех логических утилит Tailwind (ms-/me-/ps-/pe-/start-/end-) и корректную
 * работу hyphens. Вызывается из src/i18n/index.ts при каждой смене языка.
 */
export function applyDirection(lang: string): void {
  const dir = isRtl(lang) ? 'rtl' : 'ltr';
  document.documentElement.setAttribute('dir', dir);
  document.documentElement.setAttribute('lang', lang.split('-')[0]);
}
