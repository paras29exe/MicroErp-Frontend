import { getMe, getMyEffectivePermissions, refreshSession } from '@/features/auth/auth.api'
import { useAuthStore } from '@/features/auth/auth.store'

export async function bootstrapSession() {
  const { setUser, clearSession, setBootstrapping } = useAuthStore.getState()

  async function loadSessionUser() {
    const [user, permissionData] = await Promise.all([
      getMe(),
      getMyEffectivePermissions().catch(() => null),
    ])

    const effectivePermissions = permissionData?.effectivePermissions || []
    setUser({ ...user, effectivePermissions })
  }

  try {
    try {
      await loadSessionUser()
      return
    } catch {
      // access token may be expired, continue with refresh flow
    }

    try {
      await refreshSession()
      await loadSessionUser()
    } catch {
      clearSession()
    }
  } catch {
    clearSession()
  } finally {
    setBootstrapping(false)
  }
}
