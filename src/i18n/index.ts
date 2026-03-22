import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import zhCN from './locales/zh-cn.json'
import en from './locales/en.json'

const savedLang = localStorage.getItem('language')
const browserLang = navigator.language.toLowerCase()
const detectedLang = browserLang.startsWith('zh') ? 'zh-CN' : 'en'

i18n.use(initReactI18next).init({
  resources: {
    'zh-CN': { translation: zhCN },
    en: { translation: en },
  },
  lng: savedLang === 'zh-cn' ? 'zh-CN' : savedLang || detectedLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
