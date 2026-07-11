import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import es from './locales/es.json';
import en from './locales/en.json';

/**
 * i18n setup — ES (primary) and EN.
 *
 * Decision rule: navigator.language (es-* / ca-* → ES, everything else → EN).
 * The choice is persisted in localStorage so the user's preference sticks
 * across visits. Detection runs on every load so first-time visitors land
 * in their language without a click.
 */
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
    },
    fallbackLng: 'es',
    supportedLngs: ['es', 'en'],
    nonExplicitSupportedLngs: true,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'hotel-erp.lang',
    },
  });

export default i18n;
