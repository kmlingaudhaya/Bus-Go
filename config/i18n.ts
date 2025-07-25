import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translations with type assertion
const en = require('../locales/en.json');
const ta = require('../locales/ta.json');

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: {
      translation: typeof en;
    };
  }
}

const LANG_KEY = '@user_language';

// Language detector
const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      // Try to get saved language from AsyncStorage
      const savedLang = await AsyncStorage.getItem(LANG_KEY);
      if (savedLang) {
        return callback(savedLang);
      }
      
      // If no saved language, use device locale
      const deviceLang = Localization.getLocales()[0]?.languageCode || 'en';
      const supportedLangs = ['en', 'ta'];
      const langToUse = supportedLangs.includes(deviceLang) ? deviceLang : 'en';
      await AsyncStorage.setItem(LANG_KEY, langToUse);
      return callback(langToUse);
    } catch (error) {
      console.log('Error detecting language', error);
      return callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem(LANG_KEY, lng);
    } catch (error) {
      console.log('Error saving language', error);
    }
  }
};

// Initialize i18n
i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'ta'],
    resources: {
      en: { translation: en },
      ta: { translation: ta },
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  } as any); // Type assertion to fix compatibilityJSON issue

export const changeLanguage = async (lng: string) => {
  try {
    await i18n.changeLanguage(lng);
    await AsyncStorage.setItem(LANG_KEY, lng);
  } catch (error) {
    console.log('Error changing language', error);
  }
};

export default i18n;
