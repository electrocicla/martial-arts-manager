import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import es from './locales/es.json';
import pt from './locales/pt.json';

const resources = {
  en: {
    translation: en
  },
  es: {
    translation: es
  },
  pt: {
    translation: pt
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    // Default UI language is Spanish; the LanguageDetector below promotes
    // a previously persisted choice or the user's browser/device language
    // (en-US -> en, pt-BR -> pt) when supported.
    fallbackLng: 'es',
    supportedLngs: ['en', 'es', 'pt'],
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    debug: import.meta.env.DEV,

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },

    react: {
      useSuspense: false,
    },
  });

// Keep <html lang> in sync with the active language for SEO and a11y.
if (typeof document !== 'undefined') {
  const sync = (lng: string) => {
    document.documentElement.setAttribute('lang', (lng || 'es').split('-')[0]);
  };
  sync(i18n.language);
  i18n.on('languageChanged', sync);
}

export default i18n;