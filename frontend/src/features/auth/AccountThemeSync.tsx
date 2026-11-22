import { useEffect, useRef } from 'react'
import { useTheme } from '../../theme/themeContext'
import { authApi } from './authApi'
import { useMe, useSetMe } from './useAuth'

/**
 * SPEC 2.1: the theme is saved on the account, with localStorage as fallback.
 * On sign-in the account's theme wins; afterwards, theme changes are saved to the account.
 */
export function AccountThemeSync() {
  const { data: user } = useMe()
  const setMe = useSetMe()
  const { theme, setTheme } = useTheme()
  const syncedForUser = useRef<number | null>(null)

  useEffect(() => {
    if (!user) return
    if (syncedForUser.current !== user.id) {
      syncedForUser.current = user.id
      if (user.preferences.theme !== theme) setTheme(user.preferences.theme)
      return
    }
    if (user.preferences.theme !== theme) {
      authApi
        .updatePreferences({ theme })
        .then(setMe)
        .catch(() => undefined) // Keeps the local choice; it will sync on the next change.
    }
  }, [user, theme, setTheme, setMe])

  return null
}
