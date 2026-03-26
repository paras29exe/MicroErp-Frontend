import { getMe, refreshSession } from '@/features/auth/auth.api'
import { useAuthStore } from '@/features/auth/auth.store'

export async function bootstrapSession() {
  const { setUser, clearSession, setBootstrapping } = useAuthStore.getState()

  try {
    try {
      const user = await getMe()
      setUser(user)
      return
    } catch {
      // access token may be expired, continue with refresh flow
    }

    try {
      await refreshSession()
      const user = await getMe()
      setUser(user)
    } catch {
      clearSession()
    }
  } catch {
    clearSession()
  } finally {
    setBootstrapping(false)
  }
}
