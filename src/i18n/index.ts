import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import ru from './locales/ru.json';
import ar from './locales/ar.json';
import { applyDirection } from './applyDirection';

/** Список языков для переключателя в навбаре. */
export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'ru', label: 'RU', flag: '🇷🇺' },
  { code: 'ar', label: 'AR', flag: '🇸🇦' },
] as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ru: { translation: ru },
      ar: { translation: ar },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'ru', 'ar'],
    interpolation: { escapeValue: false },
    detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] },
  });

/* Синхронизируем dir <html> на старте и при каждой смене языка. */
applyDirection(i18n.language);
i18n.on('languageChanged', applyDirection);

export default i18n;
