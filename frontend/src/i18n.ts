import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ptBR from './locales/pt-BR.json'

export const DEFAULT_LOCALE = 'pt-BR'

void i18n.use(initReactI18next).init({
  resources: { [DEFAULT_LOCALE]: { translation: ptBR } },
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  interpolation: { escapeValue: false },
})

export default i18n
