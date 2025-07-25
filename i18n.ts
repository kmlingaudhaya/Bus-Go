import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from './locales/en.json';
import ta from './locales/ta.json';

// Get device language safely
const getDeviceLanguage = () => {
  // Expo SDK 49+ uses getLocales(), fallback to 'en' if not available
  const locales = Localization.getLocales ? Localization.getLocales() : [];
  return locales.length > 0 ? locales[0].languageCode : 'en';
};

i18n
  .use(initReactI18next)
  .init({
    lng: getDeviceLanguage(),
    fallbackLng: 'en',
    resources: {
      en: { translation: en },
      ta: { translation: ta },
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;