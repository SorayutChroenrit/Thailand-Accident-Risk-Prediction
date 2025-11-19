import { useState, useEffect, useCallback } from 'react'
import en from '~/i18n/en.json'
import th from '~/i18n/th.json'

type Language = 'en' | 'th'
type Translations = typeof en

const translations: Record<Language, Translations> = {
  en,
  th,
}

export function useLanguage() {
  const [language, setLanguageState] = useState<Language>('en')

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language | null
    if (saved && (saved === 'en' || saved === 'th')) {
      setLanguageState(saved)
    }
  }, [])

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
  }, [])

  const toggleLanguage = useCallback(() => {
    const newLang = language === 'en' ? 'th' : 'en'
    setLanguage(newLang)
  }, [language, setLanguage])

  const t = useCallback(
    (key: string): string => {
      const keys = key.split('.')
      let value: unknown = translations[language]

      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = (value as Record<string, unknown>)[k]
        } else {
          return key
        }
      }

      return typeof value === 'string' ? value : key
    },
    [language]
  )

  return {
    language,
    setLanguage,
    toggleLanguage,
    t,
    isEnglish: language === 'en',
    isThai: language === 'th',
  }
}
