// // src/i18n.js
// import i18n from 'i18next';
// import { initReactI18next } from 'react-i18next';
// import LanguageDetector from 'i18next-browser-languagedetector';
// import enTranslation from './locales/en/translation.json';
// import ptTranslation from './locales/pt/translation.json';


// const savedLanguage = localStorage.getItem('language');

// i18n
//   .use(LanguageDetector)
//   .use(initReactI18next)
//   .init({
//     resources: {
//       en: { translation: enTranslation },
//       pt: { translation: ptTranslation },
//     },
//     lng: savedLanguage || undefined, 
//     fallbackLng: 'en',
//     debug: true,
//     ns: ['translation'],
//     defaultNS: 'translation',
//     interpolation: { escapeValue: false },
//     detection: {
//       order: ['localStorage', 'navigator'], 
//       lookupLocalStorage: 'language', 
//     },
//   });

// export default i18n;

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslation from './locales/en/translation.json';
import ptTranslation from './locales/pt/translation.json';
import esTranslation from './locales/es/translation.json'; 
import idTranslation from './locales/id/translation.json'; 
import zhTranslation from './locales/zh/translation.json'; 

const savedLanguage = localStorage.getItem('language') || 'en'; 

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      pt: { translation: ptTranslation },
      es: { translation: esTranslation },
      id: { translation: idTranslation },
      zh: { translation: zhTranslation }, 
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    ns: ['translation'],
    defaultNS: 'translation',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage'],
      lookupLocalStorage: 'language',
      caches: ['localStorage'],
    },
  });

export default i18n;